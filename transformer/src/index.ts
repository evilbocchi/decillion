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
                    console.log(`Analyzing file for optimization opportunities...`);
                    
                    // Debug: check if source contains JSX that has already been transformed
                    const sourceText = sourceFile.getFullText();
                    console.log(`Source file name: ${sourceFile.fileName}`);
                    console.log(`Source file text length: ${sourceText.length}`);
                    console.log(`Source contains JSX syntax: ${sourceText.includes('<frame') || sourceText.includes('<textlabel')}`);
                    console.log(`Source contains React.createElement: ${sourceText.includes('React.createElement')}`);
                    console.log(`First 500 characters:\n${sourceText.substring(0, 500)}`);
                    
                    // Debug: Walk the tree to see what nodes we have
                    const nodeTypes = new Set<string>();
                    const callExpressions: string[] = [];
                    const collectNodeTypes = (node: ts.Node) => {
                        nodeTypes.add(ts.SyntaxKind[node.kind]);
                        
                        if (ts.isCallExpression(node)) {
                            const expr = node.expression;
                            if (ts.isPropertyAccessExpression(expr)) {
                                const text = `${expr.expression.getText()}.${expr.name.text}`;
                                callExpressions.push(text);
                            } else if (ts.isIdentifier(expr)) {
                                callExpressions.push(expr.text);
                            }
                        }
                        
                        ts.forEachChild(node, collectNodeTypes);
                    };
                    collectNodeTypes(sourceFile);
                    console.log(`Node types in file: ${Array.from(nodeTypes).join(', ')}`);
                    console.log(`Call expressions found: ${callExpressions.join(', ')}`);
                }

                // Transform the entire source file using the visitor
                let transformedSourceFile = ts.visitNode(sourceFile, visitNode) as ts.SourceFile;
                
                // Add any generated block functions to the source file
                const blockFunctions = blockTransformer.getBlockFunctions();
                if (blockFunctions.size > 0) {
                    const blockFunctionArray = Array.from(blockFunctions.values());
                    const allStatements = [...transformedSourceFile.statements, ...blockFunctionArray];
                    
                    transformedSourceFile = ts.factory.updateSourceFile(
                        transformedSourceFile,
                        allStatements,
                        transformedSourceFile.isDeclarationFile,
                        transformedSourceFile.referencedFiles,
                        transformedSourceFile.typeReferenceDirectives,
                        transformedSourceFile.hasNoDefaultLib,
                        transformedSourceFile.libReferenceDirectives
                    );
                }
                
                // Check if any transformations were made
                const hasTransformations = blockTransformer.hasGeneratedBlocks() || 
                                         transformedSourceFile !== sourceFile;

                if (debug) {
                    console.log(`Generated blocks: ${blockTransformer.hasGeneratedBlocks()}`);
                    console.log(`Source file changed: ${transformedSourceFile !== sourceFile}`);
                    console.log(`Has transformations: ${hasTransformations}`);
                }

                if (hasTransformations) {
                    if (debug) {
                        console.log(`Found JSX elements, adding runtime imports`);
                    }

                    // Add runtime imports when we have transformations
                    transformedSourceFile = runtimeHelper.addRuntimeImports(transformedSourceFile);

                    // Add signature comment
                    if (addSignature) {
                        transformedSourceFile = runtimeHelper.addTransformerSignature(
                            transformedSourceFile, 
                            signatureMessage
                        );
                    }

                    if (debug) {
                        console.log(`Transformation completed successfully`);
                        console.log(`Generated ${blockTransformer.hasGeneratedBlocks() ? 'memoized blocks' : 'optimized elements'}`);
                    }

                    return transformedSourceFile;
                }

                if (debug) {
                    console.log(`No JSX transformations needed for ${sourceFile.fileName}`);
                }

                return sourceFile;
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

// Default export for ttypescript plugin usage
export default millionTransformer;

