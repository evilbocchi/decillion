import * as ts from "typescript";

/**
 * Manages runtime helper imports and utilities for optimized blocks
 */
export class RuntimeHelper {
    constructor(private context: ts.TransformationContext) { }

    /**
     * Adds a signature comment to indicate the file was transformed by Decillion
     */
    addTransformerSignature(sourceFile: ts.SourceFile, customMessage?: string): ts.SourceFile {
        const signature = customMessage ?? `// optimized by decillion`;

        // Create a leading comment for the first statement or add to file start
        const statements = sourceFile.statements;
        if (statements.length > 0) {
            const firstStatement = statements[0];
            const newFirstStatement = ts.addSyntheticLeadingComment(
                firstStatement,
                ts.SyntaxKind.MultiLineCommentTrivia,
                signature,
                true // Add newline after comment
            );

            return ts.factory.updateSourceFile(
                sourceFile,
                [newFirstStatement, ...statements.slice(1)],
                sourceFile.isDeclarationFile,
                sourceFile.referencedFiles,
                sourceFile.typeReferenceDirectives,
                sourceFile.hasNoDefaultLib,
                sourceFile.libReferenceDirectives
            );
        }

        return sourceFile;
    }

    /**
     * Adds runtime imports to the source file for block memoization
     */
    addRuntimeImports(sourceFile: ts.SourceFile): ts.SourceFile {
        console.log(`[RuntimeHelper] Adding runtime imports to ${sourceFile.fileName}`);
        
        // Create import for our runtime helpers
        const runtimeImport = ts.factory.createImportDeclaration(
            undefined,
            ts.factory.createImportClause(
                false,
                undefined,
                ts.factory.createNamedImports([
                    ts.factory.createImportSpecifier(
                        false,
                        undefined,
                        ts.factory.createIdentifier("useMemoizedBlock")
                    ),
                    ts.factory.createImportSpecifier(
                        false,
                        undefined,
                        ts.factory.createIdentifier("createBlock")
                    ),
                    ts.factory.createImportSpecifier(
                        false,
                        undefined,
                        ts.factory.createIdentifier("shouldUpdateBlock")
                    )
                ])
            ),
            ts.factory.createStringLiteral("@rbxts/decillion-runtime")
        );

        // Add the import to the beginning of the file
        const statements = [runtimeImport, ...sourceFile.statements];
        console.log(`[RuntimeHelper] Created ${statements.length} statements (was ${sourceFile.statements.length})`);

        const result = ts.factory.updateSourceFile(
            sourceFile,
            statements,
            sourceFile.isDeclarationFile,
            sourceFile.referencedFiles,
            sourceFile.typeReferenceDirectives,
            sourceFile.hasNoDefaultLib,
            sourceFile.libReferenceDirectives
        );
        
        console.log(`[RuntimeHelper] Returning updated source file`);
        return result;
    }

    /**
     * Creates a block memoization helper call
     */
    createMemoizedBlockCall(
        blockFunction: ts.Expression,
        dependencies: ts.ArrayLiteralExpression,
        blockId: string
    ): ts.CallExpression {
        return ts.factory.createCallExpression(
            ts.factory.createIdentifier("useMemoizedBlock"),
            undefined,
            [
                blockFunction,
                dependencies,
                ts.factory.createStringLiteral(blockId)
            ]
        );
    }

    /**
     * Creates a shouldUpdate check
     */
    createShouldUpdateCheck(
        prevDeps: ts.Expression,
        nextDeps: ts.Expression
    ): ts.CallExpression {
        return ts.factory.createCallExpression(
            ts.factory.createIdentifier("shouldUpdateBlock"),
            undefined,
            [prevDeps, nextDeps]
        );
    }

    /**
     * Creates an optimized block creator
     */
    createBlockCreator(
        renderFunction: ts.Expression,
        staticProps?: ts.ObjectLiteralExpression
    ): ts.CallExpression {
        const args: ts.Expression[] = [renderFunction];

        if (staticProps) {
            args.push(staticProps);
        }

        return ts.factory.createCallExpression(
            ts.factory.createIdentifier("createBlock"),
            undefined,
            args
        );
    }
}
