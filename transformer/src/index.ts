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
                    (expr.kind === ts.SyntaxKind.TrueKeyword || expr.kind === ts.SyntaxKind.FalseKeyword) || 
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
                    console.log(`Analyzing file for optimization opportunities...`);
                }

                // Get the source text for string-based analysis
                const sourceText = sourceFile.getFullText();

                // Check if this file contains Roblox UI elements that we can optimize
                const hasRobloxUI = sourceText.includes('<frame') ||
                    sourceText.includes('<textlabel') ||
                    sourceText.includes('<textbutton');

                if (!hasRobloxUI) {
                    if (debug) {
                        console.log(`No Roblox UI elements found`);
                    }
                    return sourceFile;
                }

                if (debug) {
                    console.log(`Found Roblox UI elements, applying string-based optimizations`);
                }

                // Apply string-based transformation as a proof of concept
                let optimizedText = sourceText;

                // Add the runtime import at the top of the file (after existing imports)
                const importRegex = /(import.*from.*["'].*["'];?\s*\n)/g;
                const imports = optimizedText.match(importRegex) || [];

                if (imports.length > 0) {
                    // Find the last import
                    let lastImportIndex = 0;
                    let match;
                    const regex = /(import.*from.*["'].*["'];?\s*\n)/g;
                    while ((match = regex.exec(optimizedText)) !== null) {
                        lastImportIndex = match.index + match[0].length;
                    }

                    const runtimeImport = `import { createStaticElement, useMemoizedBlock } from "@rbxts/decillion-runtime";\n`;
                    optimizedText = optimizedText.slice(0, lastImportIndex) +
                        runtimeImport +
                        optimizedText.slice(lastImportIndex);

                    if (debug) {
                        console.log(`Added runtime import after existing imports`);
                    }
                }

                // Simple transformation: replace some static JSX with createStaticElement calls
                // This is a proof of concept - in reality we'd need proper parsing

                // Transform static textlabel elements
                const staticTextLabelRegex = /<textlabel\s+([^>]*Text=["']([^"']*)["'][^>]*\/?)>/g;
                optimizedText = optimizedText.replace(staticTextLabelRegex, (match, attributes, text) => {
                    if (debug) {
                        console.log(`Transforming static textlabel: ${text}`);
                    }
                    return `{createStaticElement("textlabel", { Text: "${text}", ${extractStaticAttributes(attributes)} })}`;
                });

                // Add a signature comment to show the file was processed
                optimizedText = `// Optimized by Decillion - static elements converted to createStaticElement calls\n${optimizedText}`;

                if (debug) {
                    console.log(`Applied string-based transformation with JSX replacement`);
                    console.log(`Optimized text preview: ${optimizedText.substring(0, 200)}...`);
                }

                // Create a new source file with the modified text
                const newSourceFile = ts.createSourceFile(
                    sourceFile.fileName,
                    optimizedText,
                    sourceFile.languageVersion,
                    true,
                    ts.ScriptKind.TSX
                );

                return newSourceFile;
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