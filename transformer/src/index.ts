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
export default function (program: ts.Program, options: DecillionTransformerOptions = {}) {
    const { addSignature = true, signatureMessage, debug = true } = options;

    return (context: ts.TransformationContext): ((file: ts.SourceFile) => ts.Node) => {
        return (file: ts.SourceFile) => {
            // Only process SourceFile nodes that contain JSX
            if (!ts.isSourceFile(file)) {
                return file;
            }

            const sourceFile = file;

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

            // Track if we need to add runtime imports
            let transformationTracker = { needsRuntimeImport: false };

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

            // Helper function to transform JSX elements
            const transformJsxElement = (node: ts.JsxElement | ts.JsxSelfClosingElement): ts.Expression => {
                if (debug) {
                    console.log(`Transforming JSX element`);
                }

                let tagName: string;
                let attributes: ts.JsxAttributes;
                let children: ts.JsxChild[] = [];

                if (ts.isJsxElement(node)) {
                    const elementName = node.openingElement.tagName;
                    if (!ts.isIdentifier(elementName)) return node;
                    tagName = elementName.text;
                    attributes = node.openingElement.attributes;
                    children = node.children ? Array.from(node.children) : [];
                } else {
                    const elementName = node.tagName;
                    if (!ts.isIdentifier(elementName)) return node;
                    tagName = elementName.text;
                    attributes = node.attributes;
                }

                // Check if this is a static element
                const isStatic = isStaticJsxElement(attributes, children);

                if (isStatic) {
                    if (debug) {
                        console.log(`Creating static JSX element for ${tagName}`);
                    }
                    
                    // Convert JSX attributes to object literal
                    const propsObject = createPropsObjectFromJsxAttributes(attributes);
                    
                    // Convert children, filtering out empty/null ones
                    const transformedChildren = children
                        .map(child => transformJsxChild(child))
                        .filter((child): child is ts.Expression => child !== null);
                    
                    // Use createStaticElement for static content
                    const staticElementCall = ts.factory.createCallExpression(
                        ts.factory.createIdentifier("createStaticElement"),
                        undefined,
                        [
                            ts.factory.createStringLiteral(tagName),
                            propsObject || ts.factory.createIdentifier("undefined"),
                            ...transformedChildren
                        ]
                    );
                    
                    // Return the call expression wrapped in a JSX expression when in JSX context
                    return ts.factory.createJsxExpression(undefined, staticElementCall);
                } else {
                    if (debug) {
                        console.log(`JSX element ${tagName} is dynamic, keeping as-is for now`);
                    }
                    // For now, just return the original element - can add memoization later
                    return node;
                }
            };

            // Helper function to check if JSX element is static
            const isStaticJsxElement = (attributes: ts.JsxAttributes, children: ts.JsxChild[]): boolean => {
                if (debug) {
                    console.log(`Checking static status for element with ${attributes.properties.length} attributes and ${children.length} children`);
                }
                
                // Check if all attributes are static
                for (const prop of attributes.properties) {
                    if (ts.isJsxAttribute(prop)) {
                        if (prop.initializer) {
                            if (ts.isJsxExpression(prop.initializer)) {
                                if (prop.initializer.expression && !isStaticExpression(prop.initializer.expression)) {
                                    if (debug) {
                                        const propName = ts.isIdentifier(prop.name) ? prop.name.text : "unknown";
                                        console.log(`Attribute ${propName} has dynamic expression, marking as dynamic`);
                                    }
                                    return false;
                                }
                            }
                        }
                    } else {
                        // JsxSpreadAttribute - dynamic
                        if (debug) {
                            console.log(`Found spread attribute, marking as dynamic`);
                        }
                        return false;
                    }
                }

                // Check if all children are static
                for (const child of children) {
                    if (ts.isJsxExpression(child)) {
                        if (child.expression && !isStaticExpression(child.expression)) {
                            if (debug) {
                                console.log(`Found dynamic JSX expression child, marking as dynamic`);
                            }
                            return false;
                        }
                    } else if (ts.isJsxElement(child) || ts.isJsxSelfClosingElement(child)) {
                        // Recursively check child elements
                        let childTagName: string;
                        let childAttributes: ts.JsxAttributes;
                        let childChildren: ts.JsxChild[] = [];

                        if (ts.isJsxElement(child)) {
                            const elementName = child.openingElement.tagName;
                            if (!ts.isIdentifier(elementName)) return false;
                            childTagName = elementName.text;
                            childAttributes = child.openingElement.attributes;
                            childChildren = child.children ? Array.from(child.children) : [];
                        } else {
                            const elementName = child.tagName;
                            if (!ts.isIdentifier(elementName)) return false;
                            childTagName = elementName.text;
                            childAttributes = child.attributes;
                        }

                        if (debug) {
                            console.log(`Recursively checking child element: ${childTagName}`);
                        }

                        // Recursively check if child element is static
                        if (!isStaticJsxElement(childAttributes, childChildren)) {
                            if (debug) {
                                console.log(`Child element ${childTagName} is dynamic, marking parent as dynamic`);
                            }
                            return false;
                        }
                    }
                    // JsxText and JsxFragment are static
                }

                if (debug) {
                    console.log(`Element is static`);
                }
                return true;
            };

            // Helper function to convert JSX attributes to object literal
            const createPropsObjectFromJsxAttributes = (attributes: ts.JsxAttributes): ts.ObjectLiteralExpression | null => {
                if (attributes.properties.length === 0) {
                    return null;
                }

                const properties: ts.ObjectLiteralElementLike[] = [];

                for (const prop of attributes.properties) {
                    if (ts.isJsxAttribute(prop)) {
                        let name: string;
                        if (ts.isIdentifier(prop.name)) {
                            name = prop.name.text;
                        } else if (ts.isJsxNamespacedName(prop.name)) {
                            name = `${prop.name.namespace.text}:${prop.name.name.text}`;
                        } else {
                            // This shouldn't happen, but fallback
                            name = "unknown";
                        }
                        let value: ts.Expression;

                        if (prop.initializer) {
                            if (ts.isStringLiteral(prop.initializer)) {
                                value = prop.initializer;
                            } else if (ts.isJsxExpression(prop.initializer) && prop.initializer.expression) {
                                value = prop.initializer.expression;
                            } else {
                                value = ts.factory.createTrue(); // Boolean attribute
                            }
                        } else {
                            value = ts.factory.createTrue(); // Boolean attribute
                        }

                        properties.push(ts.factory.createPropertyAssignment(
                            ts.factory.createStringLiteral(name),
                            value
                        ));
                    }
                    // Skip spread attributes for now
                }

                return ts.factory.createObjectLiteralExpression(properties);
            };

            // Helper function to transform JSX children
            const transformJsxChild = (child: ts.JsxChild): ts.Expression | null => {
                if (ts.isJsxText(child)) {
                    const text = child.text.trim();
                    return text ? ts.factory.createStringLiteral(text) : null;
                } else if (ts.isJsxExpression(child) && child.expression) {
                    return child.expression;
                } else if (ts.isJsxElement(child) || ts.isJsxSelfClosingElement(child)) {
                    return transformJsxElement(child);
                }
                // For other cases, return null (will be filtered out)
                return null;
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
                        [node.arguments[0], props && props.kind !== ts.SyntaxKind.NullKeyword ? props : ts.factory.createIdentifier("undefined"), ...children]
                    );
                } else {
                    if (debug) {
                        console.log(`Creating optimized element for ${elementType}`);
                    }
                    // For now, just return the original call - can add memoization later
                    return node;
                }
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
                    ts.isBooleanLiteral(expr) || expr.kind === ts.SyntaxKind.NullKeyword) {
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

                if (ts.isNewExpression(expr)) {
                    // Handle new expressions like new UDim2(1, 0, 1, 0)
                    if (ts.isIdentifier(expr.expression)) {
                        const typeName = expr.expression.text;
                        
                        if (typeName === "UDim2" || typeName === "Color3" || typeName === "Vector3" || 
                            typeName === "Vector2" || typeName === "CFrame" || typeName === "UDim") {
                            // Check if all arguments are static
                            return expr.arguments ? expr.arguments.every(arg => isStaticExpression(arg as ts.Expression)) : true;
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

            // Main visitor function to transform JSX elements and React.createElement calls
            const visitNode = (node: ts.Node): ts.Node => {
                // Handle JSX elements  
                if (ts.isJsxElement(node) || ts.isJsxSelfClosingElement(node)) {
                    const elementName = ts.isJsxElement(node) 
                        ? node.openingElement.tagName 
                        : node.tagName;
                    
                    if (ts.isIdentifier(elementName)) {
                        const tagName = elementName.text;
                        if (tagName === "frame" || tagName === "textlabel" || tagName === "textbutton") {
                            if (debug) {
                                console.log(`Found JSX element: ${tagName}`);
                            }
                            
                            // Transform JSX to optimized call
                            const transformedElement = transformJsxElement(node);
                            
                            // Check if transformation created a JSX expression with createStaticElement call
                            if (ts.isJsxExpression(transformedElement) && 
                                transformedElement.expression &&
                                ts.isCallExpression(transformedElement.expression) &&
                                ts.isIdentifier(transformedElement.expression.expression) &&
                                transformedElement.expression.expression.text === "createStaticElement") {
                                transformationTracker.needsRuntimeImport = true;
                                if (debug) {
                                    console.log(`Transformed ${tagName} JSX element to use createStaticElement - setting needsRuntimeImport=true`);
                                }
                            } else {
                                if (debug) {
                                    console.log(`JSX element ${tagName} was not transformed (not a createStaticElement JSX expression)`);
                                }
                            }
                            return ts.visitEachChild(transformedElement, visitNode, context);
                        }
                    }
                }
                
                // Handle React.createElement calls
                if (ts.isCallExpression(node)) {
                    const expr = node.expression;
                    if (ts.isPropertyAccessExpression(expr) &&
                        ts.isIdentifier(expr.expression) &&
                        expr.expression.text === "React" &&
                        ts.isIdentifier(expr.name) &&
                        expr.name.text === "createElement") {
                        
                        if (debug) {
                            console.log(`Found React.createElement call`);
                        }

                        if (node.arguments.length > 0 && ts.isStringLiteral(node.arguments[0])) {
                            const elementType = node.arguments[0].text;
                            
                            if (debug) {
                                console.log(`Element type: ${elementType}`);
                            }

                            // Check if this is a Roblox UI element
                            if (elementType === "frame" || elementType === "textlabel" || elementType === "textbutton") {
                                if (debug) {
                                    console.log(`Found Roblox UI element: ${elementType}`);
                                }
                                
                                const transformedCall = transformReactCreateElement(node);
                                
                                // Check if transformation actually changed the node
                                if (transformedCall !== node) {
                                    transformationTracker.needsRuntimeImport = true;
                                    if (debug) {
                                        console.log(`Transformed ${elementType} element to use createStaticElement`);
                                    }
                                }
                                
                                return ts.visitEachChild(transformedCall, visitNode, context);
                            }
                        }
                    }
                }

                // Continue visiting children
                return ts.visitEachChild(node, visitNode, context);
            };

            try {
                if (debug) {
                    console.log(`Analyzing file for optimization opportunities...`);
                }

                // First check if this file contains JSX elements OR React.createElement calls
                let hasRobloxElements = false;
                ts.forEachChild(sourceFile, function visit(node: ts.Node) {
                    // Check for JSX elements
                    if (ts.isJsxElement(node) || ts.isJsxSelfClosingElement(node)) {
                        const elementName = ts.isJsxElement(node) 
                            ? node.openingElement.tagName 
                            : node.tagName;
                        
                        if (ts.isIdentifier(elementName)) {
                            const tagName = elementName.text;
                            if (tagName === "frame" || tagName === "textlabel" || tagName === "textbutton") {
                                hasRobloxElements = true;
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
                                    hasRobloxElements = true;
                                }
                            }
                        }
                    }
                    ts.forEachChild(node, visit);
                });

                if (!hasRobloxElements) {
                    if (debug) {
                        console.log(`No Roblox UI elements found`);
                    }
                    return sourceFile;
                }

                if (debug) {
                    console.log(`Found Roblox UI elements, applying AST-based optimizations`);
                }

                // Track if we need to add runtime imports
                let needsRuntimeImport = false;

                // Transform the AST while preserving existing transformations
                const transformedSourceFile = ts.visitNode(sourceFile, visitNode) as ts.SourceFile;

                // Check if we made any transformations that require runtime import
                if (transformationTracker.needsRuntimeImport) {
                    if (debug) {
                        console.log(`Adding runtime import because transformations were made (needsRuntimeImport=${transformationTracker.needsRuntimeImport})`);
                    }
                    // Add runtime import to the transformed source file
                    const runtimeImportDeclaration = ts.factory.createImportDeclaration(
                        undefined,
                        ts.factory.createImportClause(
                            false,
                            undefined,
                            ts.factory.createNamedImports([
                                ts.factory.createImportSpecifier(false, undefined, ts.factory.createIdentifier("createStaticElement")),
                                ts.factory.createImportSpecifier(false, undefined, ts.factory.createIdentifier("useMemoizedBlock"))
                            ])
                        ),
                        ts.factory.createStringLiteral("@rbxts/decillion-runtime")
                    );

                    // Insert the import after existing imports
                    const statements = transformedSourceFile.statements;
                    let insertIndex = 0;
                    
                    // Find the last import statement
                    for (let i = 0; i < statements.length; i++) {
                        if (ts.isImportDeclaration(statements[i])) {
                            insertIndex = i + 1;
                        }
                    }

                    const newStatements = [
                        ...statements.slice(0, insertIndex),
                        runtimeImportDeclaration,
                        ...statements.slice(insertIndex)
                    ];

                    const finalSourceFile = ts.factory.updateSourceFile(
                        transformedSourceFile,
                        newStatements,
                        transformedSourceFile.isDeclarationFile,
                        transformedSourceFile.referencedFiles,
                        transformedSourceFile.typeReferenceDirectives,
                        transformedSourceFile.hasNoDefaultLib,
                        transformedSourceFile.libReferenceDirectives
                    );

                    if (debug) {
                        console.log(`Added runtime import via AST transformation`);
                    }

                    return runtimeHelper.addTransformerSignature(finalSourceFile, `Optimized by Decillion - static elements converted to createStaticElement calls`);
                }

                if (debug) {
                    console.log(`No runtime import needed, returning transformed source file (needsRuntimeImport=${transformationTracker.needsRuntimeImport})`);
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
};