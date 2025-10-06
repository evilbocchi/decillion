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
    addRuntimeImports(file: ts.SourceFile, typeImports: Iterable<string> = []): ts.SourceFile {
        const runtimeModule = "@decillion/runtime";
        const requiredValueImports = new Set([
            "createStaticElement",
            "createStaticInstanceFactory",
            "createBlock",
            "useMemoizedBlock",
            "shouldUpdateBlock",
            "useFinePatchBlock",
        ]);
        const requiredTypeImports = new Set(Array.from(typeImports));

        const existingStatements: ts.Statement[] = [];

        for (const statement of file.statements) {
            if (
                ts.isImportDeclaration(statement) &&
                ts.isStringLiteral(statement.moduleSpecifier) &&
                statement.moduleSpecifier.text === runtimeModule &&
                statement.importClause
            ) {
                const { importClause } = statement;
                const namedBindings = importClause.namedBindings;

                if (namedBindings && ts.isNamedImports(namedBindings)) {
                    for (const element of namedBindings.elements) {
                        const importedName = element.name.text;
                        if (importClause.isTypeOnly) {
                            requiredTypeImports.delete(importedName);
                        } else {
                            requiredValueImports.delete(importedName);
                        }
                    }
                }

                existingStatements.push(statement);
                continue;
            }

            existingStatements.push(statement);
        }

        const newStatements: ts.Statement[] = [];

        if (requiredValueImports.size > 0) {
            const valueSpecifiers = Array.from(requiredValueImports)
                .sort()
                .map((name) =>
                    ts.factory.createImportSpecifier(false, undefined, ts.factory.createIdentifier(name)),
                );

            newStatements.push(
                ts.factory.createImportDeclaration(
                    undefined,
                    ts.factory.createImportClause(false, undefined, ts.factory.createNamedImports(valueSpecifiers)),
                    ts.factory.createStringLiteral(runtimeModule),
                ),
            );
        }

        if (requiredTypeImports.size > 0) {
            const typeSpecifiers = Array.from(requiredTypeImports)
                .sort()
                .map((name) =>
                    ts.factory.createImportSpecifier(false, undefined, ts.factory.createIdentifier(name)),
                );

            newStatements.push(
                ts.factory.createImportDeclaration(
                    undefined,
                    ts.factory.createImportClause(true, undefined, ts.factory.createNamedImports(typeSpecifiers)),
                    ts.factory.createStringLiteral(runtimeModule),
                ),
            );
        }

        const statements = [...newStatements, ...existingStatements];

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
