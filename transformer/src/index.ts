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
            if (!sourceText.includes('<') && !sourceText.includes('React.createElement')) {
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

            let needsRuntimeImport = false;

            // Main visitor function to transform JSX and React.createElement calls
            const visitNode = (node: ts.Node): ts.Node => {
                // Transform JSX elements directly
                if (ts.isJsxElement(node) || ts.isJsxSelfClosingElement(node)) {
                    if (debug) {
                        const tagName = analyzer.getJsxTagName(node);
                        console.log(`Found JSX element: ${tagName}`);
                    }
                    
                    needsRuntimeImport = true;
                    return blockTransformer.transformJsxElement(node) as ts.Node;
                }

                // Transform React.createElement calls
                if (ts.isCallExpression(node)) {
                    const expr = node.expression;
                    if (ts.isPropertyAccessExpression(expr) &&
                        ts.isIdentifier(expr.expression) &&
                        expr.expression.text === "React" &&
                        ts.isIdentifier(expr.name) &&
                        expr.name.text === "createElement") {
                        
                        if (node.arguments.length > 0 && ts.isStringLiteral(node.arguments[0])) {
                            const elementType = node.arguments[0].text;
                            
                            if (debug) {
                                console.log(`Found React.createElement call for: ${elementType}`);
                            }

                            // Check if this is a Roblox UI element
                            const robloxUIElements = ['frame', 'textlabel', 'textbutton', 'scrollingframe', 'imagelabel', 'imagebutton'];
                            if (robloxUIElements.includes(elementType.toLowerCase())) {
                                needsRuntimeImport = true;
                                return transformReactCreateElement(node);
                            }
                        }
                    }
                }

                // Transform function components
                if (ts.isFunctionDeclaration(node) || ts.isArrowFunction(node) || ts.isFunctionExpression(node)) {
                    const transformedComponent = blockTransformer.transformComponent(node);
                    if (transformedComponent) {
                        return transformedComponent;
                    }
                }

                // Continue visiting children
                return ts.visitEachChild(node, visitNode, context);
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
                    // Convert null/undefined props to undefined for better type compatibility
                    const propsArg = props.kind === ts.SyntaxKind.NullKeyword ? 
                        ts.factory.createIdentifier("undefined") : props;
                    
                    return ts.factory.createCallExpression(
                        ts.factory.createIdentifier("createStaticElement"),
                        undefined,
                        [node.arguments[0], propsArg, ...children]
                    );
                } else {
                    if (debug) {
                        console.log(`Creating optimized element for ${elementType}`);
                    }
                    // Return optimized createElement call
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

            try {
                if (debug) {
                    console.log(`Starting AST-based transformation...`);
                }

                // Apply AST-based transformation
                let transformedFile = ts.visitNode(sourceFile, visitNode) as ts.SourceFile;

                // Add runtime import if needed
                if (needsRuntimeImport) {
                    transformedFile = addRuntimeImport(transformedFile);
                }

                // Add generated block functions if any were created
                if (blockTransformer.hasGeneratedBlocks()) {
                    transformedFile = addBlockFunctions(transformedFile, blockTransformer.getBlockFunctions());
                }

                // Add signature comment if requested
                if (addSignature) {
                    const signature = signatureMessage || "Optimized by Decillion - Million.js-style block memoization for Roblox-TS";
                    transformedFile = addSignatureComment(transformedFile, signature);
                }

                if (debug) {
                    console.log(`AST-based transformation completed successfully`);
                }

                return transformedFile;
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

            // Helper function to add runtime import
            function addRuntimeImport(file: ts.SourceFile): ts.SourceFile {
                const runtimeImportDeclaration = ts.factory.createImportDeclaration(
                    undefined,
                    ts.factory.createImportClause(
                        false,
                        undefined,
                        ts.factory.createNamedImports([
                            ts.factory.createImportSpecifier(
                                false,
                                undefined,
                                ts.factory.createIdentifier("createStaticElement")
                            ),
                            ts.factory.createImportSpecifier(
                                false,
                                undefined,
                                ts.factory.createIdentifier("useMemoizedBlock")
                            )
                        ])
                    ),
                    ts.factory.createStringLiteral("@rbxts/decillion-runtime")
                );

                const statements = [runtimeImportDeclaration, ...file.statements];
                
                return ts.factory.updateSourceFile(
                    file,
                    statements,
                    file.isDeclarationFile,
                    file.referencedFiles,
                    file.typeReferenceDirectives,
                    file.hasNoDefaultLib,
                    file.libReferenceDirectives
                );
            }

            // Helper function to add generated block functions
            function addBlockFunctions(file: ts.SourceFile, blockFunctions: Map<string, ts.FunctionDeclaration>): ts.SourceFile {
                const blockFunctionStatements = Array.from(blockFunctions.values());
                const statements = [...file.statements, ...blockFunctionStatements];
                
                return ts.factory.updateSourceFile(
                    file,
                    statements,
                    file.isDeclarationFile,
                    file.referencedFiles,
                    file.typeReferenceDirectives,
                    file.hasNoDefaultLib,
                    file.libReferenceDirectives
                );
            }

            // Helper function to add signature comment
            function addSignatureComment(file: ts.SourceFile, signature: string): ts.SourceFile {
                const commentNode = ts.addSyntheticLeadingComment(
                    file,
                    ts.SyntaxKind.SingleLineCommentTrivia,
                    ` ${signature}`,
                    true
                );
                
                return commentNode;
            }
        };
    };
};