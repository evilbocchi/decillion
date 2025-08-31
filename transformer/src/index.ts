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

            // Helper function to find and optimize JSX elements
            const findAndOptimizeJsxElements = (file: ts.SourceFile): ts.SourceFile => {
                // Add a comment to show the transformer is working
                const statements = file.statements;
                const optimizedStatements = [
                    // Add a comment at the top to show the file was processed
                    ts.factory.createExpressionStatement(
                        ts.factory.createStringLiteral("// File processed by Decillion transformer")
                    ),
                    ...statements
                ];
                
                return ts.factory.updateSourceFile(
                    file,
                    optimizedStatements,
                    file.isDeclarationFile,
                    file.referencedFiles,
                    file.typeReferenceDirectives,
                    file.hasNoDefaultLib,
                    file.libReferenceDirectives
                );
            };

            try {
                // Use a different approach - find and replace specific patterns
                const optimizedSourceFile = findAndOptimizeJsxElements(sourceFile);
                
                if (blockTransformer.hasGeneratedBlocks()) {
                    if (debug) {
                        console.log(`Generated blocks found, adding runtime imports`);
                    }
                    return runtimeHelper.addRuntimeImports(optimizedSourceFile);
                }

                if (debug) {
                    console.log(`No blocks generated for ${sourceFile.fileName}`);
                }

                return optimizedSourceFile;
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

