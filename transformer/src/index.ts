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
    const { addSignature = true, signatureMessage, debug = false } = options;

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

            // Use a more defensive visitor approach
            function visit(node: ts.Node): ts.Node {
                // Only transform specific node types we care about
                if (ts.isJsxElement(node) || ts.isJsxSelfClosingElement(node)) {
                    try {
                        return blockTransformer.transformJsxElement(node);
                    } catch (error) {
                        if (debug) {
                            console.warn(`Failed to transform JSX element: ${error}`);
                        }
                        return node; // Return original node if transformation fails
                    }
                }

                if (
                    ts.isFunctionDeclaration(node) ||
                    ts.isArrowFunction(node) ||
                    ts.isFunctionExpression(node)
                ) {
                    try {
                        const optimized = blockTransformer.transformComponent(node);
                        if (optimized) {
                            return optimized;
                        }
                    } catch (error) {
                        if (debug) {
                            console.warn(`Failed to transform component: ${error}`);
                        }
                    }
                }

                // For all other nodes, recursively visit children
                return ts.visitEachChild(node, visit, context);
            }

            try {
                // Transform the source file
                const transformedSourceFile = ts.visitNode(sourceFile, visit) as ts.SourceFile;

                // Add signature to indicate this file was transformed (if enabled)
                let signedSourceFile = transformedSourceFile;
                if (addSignature) {
                    signedSourceFile = runtimeHelper.addTransformerSignature(
                        transformedSourceFile,
                        signatureMessage
                    );
                }

                if (blockTransformer.hasGeneratedBlocks()) {
                    return runtimeHelper.addRuntimeImports(signedSourceFile);
                }

                return signedSourceFile;
            } catch (error) {
                if (debug) {
                    console.warn(`Transformation failed for ${sourceFile.fileName}: ${error}`);
                }
                // Even if transformation fails, still add signature if requested
                if (addSignature) {
                    try {
                        return runtimeHelper.addTransformerSignature(sourceFile, signatureMessage);
                    } catch (signatureError) {
                        if (debug) {
                            console.warn(`Signature addition also failed: ${signatureError}`);
                        }
                    }
                }
                // Return original file if everything fails
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

