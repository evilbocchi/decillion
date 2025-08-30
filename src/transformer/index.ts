import * as ts from "typescript";
import { BlockAnalyzer } from "./block-analyzer";
import { BlockTransformer } from "./block-transformer";
import { RuntimeHelper } from "./runtime-helper";

/**
 * Million.js-inspired TypeScript transformer for Roblox-TS
 * Transforms JSX into highly optimized, block-memoized UI code
 */
function millionTransformer(program: ts.Program): ts.TransformerFactory<ts.SourceFile> {
    return (context: ts.TransformationContext) => {
        return (sourceFile: ts.SourceFile) => {
            const typeChecker = program.getTypeChecker();

            // Initialize our transformation components
            const analyzer = new BlockAnalyzer(typeChecker, context);
            const blockTransformer = new BlockTransformer(
                typeChecker,
                context,
                analyzer
            );
            const runtimeHelper = new RuntimeHelper(context);

            function visitNode(node: ts.Node): ts.Node {
                // Check if this is a JSX element that we can optimize
                if (ts.isJsxElement(node) || ts.isJsxSelfClosingElement(node)) {
                    return blockTransformer.transformJsxElement(node);
                }

                // Check if this is a function component we can optimize
                if (
                    ts.isFunctionDeclaration(node) ||
                    ts.isArrowFunction(node) ||
                    ts.isFunctionExpression(node)
                ) {
                    const optimized = blockTransformer.transformComponent(node);
                    if (optimized) {
                        return optimized;
                    }
                }

                return ts.visitEachChild(node, visitNode, context);
            }

            // Add runtime helpers to the top of the file if needed
            const transformedSourceFile = ts.visitNode(
                sourceFile,
                visitNode
            ) as ts.SourceFile;

            if (blockTransformer.hasGeneratedBlocks()) {
                return runtimeHelper.addRuntimeImports(transformedSourceFile);
            }

            return transformedSourceFile;
        };
    };
}

// Export the transformer for use in tsconfig
export { millionTransformer };

// Default export for ttypescript plugin usage
export default millionTransformer;

