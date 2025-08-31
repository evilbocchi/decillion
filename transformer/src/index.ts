import * as ts from "typescript";
import { BlockAnalyzer } from "./block-analyzer";
import { BlockTransformer } from "./block-transformer";
import { RuntimeHelper } from "./runtime-helper";

/**
 * Configuration options for the Decillion transformer
 */
export interface DecillionTransformerOptions {
    /** Whether to add signature comments to transformed files */
    addSignature?: boolean;
    /** Custom signature message (if addSignature is true) */
    signatureMessage?: string;
    /** Enable debug logging */
    debug?: boolean;
}

/**
 * Million.js-inspired TypeScript transformer for Roblox-TS
 * Transforms JSX into highly optimized, block-memoized UI code
 */
function millionTransformer(
    program: ts.Program,
    options: DecillionTransformerOptions = {}
): ts.TransformerFactory<ts.SourceFile> {
    const { addSignature = true, signatureMessage, debug = true } = options;

    return (context: ts.TransformationContext) => {
        return (sourceFile: ts.SourceFile) => {
            if (debug) {
                console.log(`Decillion transformer processing: ${sourceFile.fileName}`);
            }

            // Quick check: if the file doesn't contain JSX, don't transform it
            const sourceText = sourceFile.getFullText();
            if (!sourceText.includes('<')) {
                return sourceFile;
            }

            const typeChecker = program.getTypeChecker();

            // Initialize our transformation components
            const analyzer = new BlockAnalyzer(typeChecker, context);
            const blockTransformer = new BlockTransformer(
                typeChecker,
                context,
                analyzer
            );
            const runtimeHelper = new RuntimeHelper(context);

            // Helper function to extract static attributes from JSX
            const extractStaticAttributes = (attributeString: string): string => {
                // Simple attribute extraction - would need more sophisticated parsing for production
                const attrs = attributeString.match(/(\w+)=\{([^}]+)\}/g) || [];
                return attrs.map(attr => {
                    const [, name, value] = attr.match(/(\w+)=\{([^}]+)\}/) || [];
                    if (name && value && name !== 'Text') {
                        return `${name}: ${value}`;
                    }
                    return '';
                }).filter(Boolean).join(', ');
            };

            // Helper function to transform React.createElement calls
            const transformReactCreateElement = (node: ts.CallExpression): ts.Expression => {
                if (debug) {
                    console.log(`Transforming React.createElement call`);
                }

                // Analyze the createElement call to determine optimization strategy
                if (node.arguments.length < 1 || !ts.isStringLiteral(node.arguments[0])) {
                    return node; // Can't optimize non-string element types
                }

                const elementType = node.arguments[0].text;
                const props = node.arguments[1] || ts.factory.createNull();
                const children = node.arguments.slice(2);

                // Analyze if this is static or dynamic
                const isStatic = isStaticCreateElementCall(props, children);
                
                if (isStatic) {
                    if (debug) {
                        console.log(`Creating static element for ${elementType}`);
                    }
                    // Use createStaticElement for static content
                    return ts.factory.createCallExpression(
                        ts.factory.createIdentifier("createStaticElement"),
                        undefined,
                        [node.arguments[0], props, ...children]
                    );
                } else {
                    if (debug) {
                        console.log(`Creating optimized element for ${elementType}`);
                    }
                    // For now, just return the original call - can add memoization later
                    return node;
                }
            };

            // Helper function to check if a JSX element is static
            const isStaticJSXElement = (attributes: ts.JsxAttributes, children: readonly ts.JsxChild[]): boolean => {
                // Check if all attributes are static
                for (const prop of attributes.properties) {
                    if (ts.isJsxAttribute(prop)) {
                        if (prop.initializer) {
                            if (ts.isJsxExpression(prop.initializer)) {
                                if (prop.initializer.expression && !isStaticExpression(prop.initializer.expression)) {
                                    return false;
                                }
                            }
                        }
                    }
                }

                // Check if all children are static
                for (const child of children) {
                    if (ts.isJsxElement(child) || ts.isJsxSelfClosingElement(child)) {
                        const childElementName = ts.isJsxElement(child) 
                            ? child.openingElement.tagName 
                            : child.tagName;
                        const childAttributes = ts.isJsxElement(child) 
                            ? child.openingElement.attributes 
                            : child.attributes;
                        const childChildren = ts.isJsxElement(child) ? child.children : [];
                        
                        if (!isStaticJSXElement(childAttributes, childChildren)) {
                            return false;
                        }
                    } else if (ts.isJsxExpression(child)) {
                        if (child.expression && !isStaticExpression(child.expression)) {
                            return false;
                        }
                    } else if (ts.isJsxText(child)) {
                        // JSX text is always static
                        continue;
                    }
                }

                return true;
            };

            // Helper function to convert JSX attributes to an object literal
            const createPropsObjectFromJSXAttributes = (attributes: ts.JsxAttributes): ts.Expression => {
                if (attributes.properties.length === 0) {
                    return ts.factory.createObjectLiteralExpression([]);
                }

                const props: ts.PropertyAssignment[] = [];
                
                for (const prop of attributes.properties) {
                    if (ts.isJsxAttribute(prop) && ts.isIdentifier(prop.name)) {
                        const key = prop.name.text;
                        let value: ts.Expression;
                        
                        if (prop.initializer) {
                            if (ts.isStringLiteral(prop.initializer)) {
                                value = prop.initializer;
                            } else if (ts.isJsxExpression(prop.initializer) && prop.initializer.expression) {
                                value = prop.initializer.expression;
                            } else {
                                value = ts.factory.createTrue(); // Default for boolean attributes
                            }
                        } else {
                            value = ts.factory.createTrue(); // Boolean attribute with no value
                        }
                        
                        props.push(ts.factory.createPropertyAssignment(key, value));
                    }
                }
                
                return ts.factory.createObjectLiteralExpression(props);
            };

            // Helper function to check if a createElement call is static
            const isStaticCreateElementCall = (props: ts.Expression, children: ts.Expression[]): boolean => {
                // Check if props are static
                if (props && props.kind !== ts.SyntaxKind.NullKeyword && props.kind !== ts.SyntaxKind.UndefinedKeyword) {
                    if (ts.isObjectLiteralExpression(props)) {
                        // Check if all properties are static
                        for (const prop of props.properties) {
                            if (ts.isPropertyAssignment(prop)) {
                                if (!isStaticExpression(prop.initializer)) {
                                    return false;
                                }
                            }
                        }
                    } else if (!isStaticExpression(props)) {
                        return false;
                    }
                }

                // Check if children are static
                for (const child of children) {
                    if (!isStaticExpression(child)) {
                        return false;
                    }
                }

                return true;
            };

            // Helper function to check if an expression is static
            const isStaticExpression = (expr: ts.Expression): boolean => {
                if (ts.isStringLiteral(expr) || ts.isNumericLiteral(expr) || 
                    expr.kind === ts.SyntaxKind.TrueKeyword || expr.kind === ts.SyntaxKind.FalseKeyword ||
                    expr.kind === ts.SyntaxKind.NullKeyword) {
                    return true;
                }

                if (ts.isCallExpression(expr)) {
                    const callExpr = expr.expression;
                    // Allow certain known static calls (like Color3.fromRGB, UDim2.new)
                    if (ts.isPropertyAccessExpression(callExpr)) {
                        const objName = ts.isIdentifier(callExpr.expression) ? callExpr.expression.text : "";
                        const methodName = ts.isIdentifier(callExpr.name) ? callExpr.name.text : "";
                        
                        if ((objName === "Color3" && methodName === "fromRGB") ||
                            (objName === "UDim2" && methodName === "new")) {
                            // Check if all arguments are static
                            return expr.arguments.every(arg => isStaticExpression(arg as ts.Expression));
                        }
                    }
                    return false;
                }

                if (ts.isTemplateExpression(expr)) {
                    // Template expressions with variables are dynamic
                    return false;
                }

                if (ts.isIdentifier(expr) || ts.isPropertyAccessExpression(expr)) {
                    // Variable references are dynamic
                    return false;
                }

                return false;
            };

            // Main visitor function to transform React.createElement calls (transformed JSX)
            const visitNode = (node: ts.Node): ts.Node => {
                if (debug && ts.isCallExpression(node)) {
                    const expr = node.expression;
                    if (ts.isPropertyAccessExpression(expr) &&
                        ts.isIdentifier(expr.expression) &&
                        expr.expression.text === "React" &&
                        ts.isIdentifier(expr.name) &&
                        expr.name.text === "createElement") {
                        console.log(`Found React.createElement call`);
                        
                        if (node.arguments.length > 0 && ts.isStringLiteral(node.arguments[0])) {
                            const elementType = node.arguments[0].text;
                            console.log(`Element type: ${elementType}`);
                            
                            // Check if this is a Roblox UI element
                            if (elementType === "frame" || elementType === "textlabel" || elementType === "textbutton") {
                                console.log(`Found Roblox UI element: ${elementType}`);
                                return transformReactCreateElement(node);
                            }
                        }
                    }
                }

                // Continue visiting children for nodes that typically have them
                if (ts.isSourceFile(node) || 
                    ts.isModuleDeclaration(node) ||
                    ts.isClassDeclaration(node) ||
                    ts.isInterfaceDeclaration(node) ||
                    ts.isBlock(node) ||
                    ts.isReturnStatement(node) ||
                    ts.isExpressionStatement(node) ||
                    ts.isCallExpression(node) ||
                    ts.isPropertyAccessExpression(node) ||
                    ts.isParenthesizedExpression(node) ||
                    ts.isArrowFunction(node) ||
                    ts.isFunctionExpression(node) ||
                    ts.isFunctionDeclaration(node) ||
                    ts.isVariableStatement(node) ||
                    ts.isVariableDeclarationList(node) ||
                    ts.isVariableDeclaration(node)) {
                    return ts.visitEachChild(node, visitNode, context);
                }

                // For other nodes, return as-is
                return node;
            };

            try {
                if (debug) {
                    console.log(`Analyzing file for AST-based optimization opportunities...`);
                    console.log(`Source file kind: ${sourceFile.kind}`);
                    console.log(`Source text preview: ${sourceFile.getFullText().substring(0, 300)}...`);
                }

                let hasOptimizations = false;

                // Debug: log all node types to understand the AST structure
                if (debug) {
                    console.log(`Debugging AST structure...`);
                    let nodeCount = 0;
                    const logNodeTypes = (node: ts.Node, depth = 0): void => {
                        nodeCount++;
                        if (nodeCount > 20) return; // Limit total nodes to avoid spam
                        
                        const indent = "  ".repeat(depth);
                        const nodeKindName = ts.SyntaxKind[node.kind];
                        console.log(`${indent}${nodeKindName} (${nodeCount})`);
                        
                        if (ts.isIdentifier(node)) {
                            console.log(`${indent}  - text: "${node.text}"`);
                        }
                        
                        ts.forEachChild(node, child => logNodeTypes(child, depth + 1));
                    };
                    logNodeTypes(sourceFile);
                }
                const checkForOptimizableElements = (node: ts.Node): boolean => {
                    if (debug) {
                        // Log all node types we encounter to understand the AST structure
                        const nodeKindName = ts.SyntaxKind[node.kind];
                        if (nodeKindName.includes("Jsx") || nodeKindName.includes("Call")) {
                            console.log(`Found node type: ${nodeKindName}`);
                        }
                        
                        if (ts.isJsxElement(node)) {
                            console.log(`Found JSX element: ${node.openingElement.tagName.getText()}`);
                        } else if (ts.isJsxSelfClosingElement(node)) {
                            console.log(`Found self-closing JSX element: ${node.tagName.getText()}`);
                        } else if (ts.isCallExpression(node)) {
                            const expr = node.expression;
                            if (ts.isPropertyAccessExpression(expr)) {
                                console.log(`Found call expression: ${expr.expression.getText()}.${expr.name.getText()}`);
                                if (ts.isIdentifier(expr.expression) &&
                                    expr.expression.text === "React" &&
                                    ts.isIdentifier(expr.name) &&
                                    expr.name.text === "createElement") {
                                    console.log(`Found React.createElement call`);
                                }
                            }
                        }
                    }
                    
                    // Check for JSX elements
                    if (ts.isJsxElement(node) || ts.isJsxSelfClosingElement(node)) {
                        const elementName = ts.isJsxElement(node) 
                            ? node.openingElement.tagName 
                            : node.tagName;
                        
                        if (ts.isIdentifier(elementName)) {
                            const name = elementName.text;
                            if (name === "frame" || name === "textlabel" || name === "textbutton") {
                                return true;
                            }
                        }
                    }
                    
                    // Check for React.createElement calls
                    if (ts.isCallExpression(node)) {
                        const expr = node.expression;
                        if (ts.isPropertyAccessExpression(expr) &&
                            ts.isIdentifier(expr.expression) &&
                            expr.expression.text === "React" &&
                            ts.isIdentifier(expr.name) &&
                            expr.name.text === "createElement") {
                            
                            if (node.arguments.length > 0 && ts.isStringLiteral(node.arguments[0])) {
                                const elementType = node.arguments[0].text;
                                if (elementType === "frame" || elementType === "textlabel" || elementType === "textbutton") {
                                    return true;
                                }
                            }
                        }
                    }
                    
                    return ts.forEachChild(node, checkForOptimizableElements) || false;
                };

                const needsOptimization = checkForOptimizableElements(sourceFile);
                
                if (!needsOptimization) {
                    if (debug) {
                        console.log(`No Roblox UI JSX elements or React.createElement calls found`);
                    }
                    return sourceFile;
                }

                if (debug) {
                    console.log(`Found Roblox UI elements, applying AST-based optimizations`);
                }

                // Track if we need to add the runtime import
                let needsRuntimeImport = false;

                // Updated visitor function to transform JSX elements
                const transformVisitor = (node: ts.Node): ts.Node => {
                    // Handle JSX elements
                    if (ts.isJsxElement(node) || ts.isJsxSelfClosingElement(node)) {
                        const elementName = ts.isJsxElement(node) 
                            ? node.openingElement.tagName 
                            : node.tagName;
                        
                        if (ts.isIdentifier(elementName)) {
                            const name = elementName.text;
                            
                            // Check if this is a Roblox UI element
                            if (name === "frame" || name === "textlabel" || name === "textbutton") {
                                const attributes = ts.isJsxElement(node) 
                                    ? node.openingElement.attributes 
                                    : node.attributes;
                                const children = ts.isJsxElement(node) ? node.children : [];
                                
                                // Check if this element is static
                                const isStatic = isStaticJSXElement(attributes, children);
                                
                                if (isStatic) {
                                    if (debug) {
                                        console.log(`Transforming static JSX ${name} to createStaticElement`);
                                    }
                                    needsRuntimeImport = true;
                                    hasOptimizations = true;
                                    
                                    // Convert JSX attributes to object literal
                                    const props = createPropsObjectFromJSXAttributes(attributes);
                                    const childrenArgs: ts.Expression[] = children.length > 0 ? 
                                        children.map(child => ts.visitNode(child, transformVisitor) as ts.Expression).filter(Boolean) : [];
                                    
                                    // Create a call to createStaticElement
                                    return ts.factory.createCallExpression(
                                        ts.factory.createIdentifier("createStaticElement"),
                                        undefined,
                                        [
                                            ts.factory.createStringLiteral(name),
                                            props,
                                            ...childrenArgs
                                        ]
                                    );
                                } else {
                                    if (debug) {
                                        console.log(`JSX ${name} is dynamic, keeping as JSX`);
                                    }
                                }
                            }
                        }
                    }

                    // Handle React.createElement calls as fallback (shouldn't be needed at JSX stage)
                    if (ts.isCallExpression(node)) {
                        const expr = node.expression;
                        if (ts.isPropertyAccessExpression(expr) &&
                            ts.isIdentifier(expr.expression) &&
                            expr.expression.text === "React" &&
                            ts.isIdentifier(expr.name) &&
                            expr.name.text === "createElement") {
                            
                            if (node.arguments.length > 0 && ts.isStringLiteral(node.arguments[0])) {
                                const elementType = node.arguments[0].text;
                                
                                // Check if this is a Roblox UI element
                                if (elementType === "frame" || elementType === "textlabel" || elementType === "textbutton") {
                                    const props = node.arguments[1] || ts.factory.createNull();
                                    const children = node.arguments.slice(2);
                                    
                                    // Check if this is static
                                    const isStatic = isStaticCreateElementCall(props, children);
                                    
                                    if (isStatic) {
                                        if (debug) {
                                            console.log(`Transforming static ${elementType} to createStaticElement`);
                                        }
                                        needsRuntimeImport = true;
                                        hasOptimizations = true;
                                        
                                        // Transform to createStaticElement call
                                        return ts.factory.createCallExpression(
                                            ts.factory.createIdentifier("createStaticElement"),
                                            undefined,
                                            [node.arguments[0], props, ...children]
                                        );
                                    } else {
                                        if (debug) {
                                            console.log(`${elementType} is dynamic, keeping React.createElement`);
                                        }
                                    }
                                }
                            }
                        }
                    }

                    return ts.visitEachChild(node, transformVisitor, context);
                };

                // Transform the AST
                let transformedSourceFile = ts.visitNode(sourceFile, transformVisitor) as ts.SourceFile;

                // Add runtime import if needed
                if (needsRuntimeImport) {
                    if (debug) {
                        console.log(`Adding runtime import for createStaticElement`);
                    }
                    
                    // Create the import statement
                    const runtimeImport = ts.factory.createImportDeclaration(
                        undefined,
                        ts.factory.createImportClause(
                            false,
                            undefined,
                            ts.factory.createNamedImports([
                                ts.factory.createImportSpecifier(
                                    false,
                                    undefined,
                                    ts.factory.createIdentifier("createStaticElement")
                                )
                            ])
                        ),
                        ts.factory.createStringLiteral("@rbxts/decillion-runtime")
                    );

                    // Add signature comment as well
                    const signatureComment = "// Optimized by Decillion - static elements converted to createStaticElement calls";
                    
                    // Create new statements array with the import added after existing imports
                    const statements = [...transformedSourceFile.statements];
                    let insertIndex = 0;
                    
                    // Find where to insert the import (after existing imports)
                    for (let i = 0; i < statements.length; i++) {
                        if (ts.isImportDeclaration(statements[i])) {
                            insertIndex = i + 1;
                        } else {
                            break;
                        }
                    }
                    
                    statements.splice(insertIndex, 0, runtimeImport);
                    
                    transformedSourceFile = ts.factory.updateSourceFile(
                        transformedSourceFile,
                        statements
                    );

                    // Add the signature comment by creating a new source file with the comment
                    const sourceText = transformedSourceFile.getFullText();
                    const commentedText = `${signatureComment}\n${sourceText}`;
                    
                    transformedSourceFile = ts.createSourceFile(
                        sourceFile.fileName,
                        commentedText,
                        sourceFile.languageVersion,
                        true
                    );
                }

                if (hasOptimizations && debug) {
                    console.log(`Applied ${hasOptimizations ? 'optimizations' : 'no optimizations'} to ${sourceFile.fileName}`);
                }

                return transformedSourceFile;
            } catch (error) {
                if (debug) {
                    console.warn(`Transformation failed for ${sourceFile.fileName}: ${error}`);
                    if (error instanceof Error) {
                        console.warn(`Error stack: ${error.stack}`);
                    }
                }
                // Return original file if transformation completely fails
                return sourceFile;
            }
        };
    };
}

// Export the transformer for use in tsconfig
export { millionTransformer };

// Create a helper function for default usage
export function createDecillionTransformer(options?: DecillionTransformerOptions) {
    return (program: ts.Program) => millionTransformer(program, options);
}

// Import working transformer
import workingDecillionTransformer from "./working-transformer";

// Default export for ttypescript plugin usage - use working transformer
export default workingDecillionTransformer;

