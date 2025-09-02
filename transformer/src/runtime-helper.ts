import * as ts from "typescript";

/**
 * Manages runtime helper imports and utilities for optimized blocks
 */
class RuntimeHelper {
    constructor() {}

    /**
     * Adds a signature comment to indicate the file was transformed by Decillion
     */
    addTransformerSignature(sourceFile: ts.SourceFile, customMessage?: string): ts.SourceFile {
        const signature = customMessage ?? `// optimized by decillion`;

        const commentNode = ts.addSyntheticLeadingComment(
            sourceFile,
            ts.SyntaxKind.SingleLineCommentTrivia,
            ` ${signature}`,
            true,
        );

        return commentNode;
    }

    /**
     * Adds runtime imports to the source file
     */
    addRuntimeImports(file: ts.SourceFile): ts.SourceFile {
        const runtimeImportDeclaration = ts.factory.createImportDeclaration(
            undefined,
            ts.factory.createImportClause(
                false,
                undefined,
                ts.factory.createNamedImports([
                    ts.factory.createImportSpecifier(
                        false,
                        undefined,
                        ts.factory.createIdentifier("createStaticElement"),
                    ),
                    ts.factory.createImportSpecifier(false, undefined, ts.factory.createIdentifier("createBlock")),
                    ts.factory.createImportSpecifier(false, undefined, ts.factory.createIdentifier("useMemoizedBlock")),
                    ts.factory.createImportSpecifier(
                        false,
                        undefined,
                        ts.factory.createIdentifier("shouldUpdateBlock"),
                    ),
                    ts.factory.createImportSpecifier(
                        false,
                        undefined,
                        ts.factory.createIdentifier("useFinePatchBlock"),
                    ),
                ]),
            ),
            ts.factory.createStringLiteral("@decillion/runtime"),
        );

        const statements = [runtimeImportDeclaration, ...file.statements];

        return ts.factory.updateSourceFile(
            file,
            statements,
            file.isDeclarationFile,
            file.referencedFiles,
            file.typeReferenceDirectives,
            file.hasNoDefaultLib,
            file.libReferenceDirectives,
        );
    }
}

export const runtimeHelper = new RuntimeHelper();
