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
        // Create a detailed signature matching the README format
        const signature = customMessage ?? `*
 * This file was optimized by Decillion - Million.js-inspired Roblox-TS transformer
 * Generated on: ${new Date().toISOString()}
 * Transformer version: 1.0.0
 * 
 * Original source: ${sourceFile.fileName}
 * Optimizations applied: Block memoization, static extraction, efficient diffing
 * 
 * @see https://github.com/evilbocchi/decillion
 * @generated Automatically generated - do not edit directly
 `;

        // Get the full text and add the signature at the beginning
        const originalText = sourceFile.getFullText();
        const signatureComment = `/**${signature}*/\n`;
        const newText = signatureComment + originalText;

        // Create a new source file with the signature
        return ts.createSourceFile(
            sourceFile.fileName,
            newText,
            sourceFile.languageVersion,
            true, // setParentNodes
            sourceFile.scriptKind
        );
    }

    /**
     * Adds runtime imports to the source file for block memoization
     */
    addRuntimeImports(sourceFile: ts.SourceFile): ts.SourceFile {
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
            ts.factory.createStringLiteral("decillion/runtime")
        );

        // Add the import to the beginning of the file
        const statements = [runtimeImport, ...sourceFile.statements];

        return ts.factory.updateSourceFile(
            sourceFile,
            statements,
            sourceFile.isDeclarationFile,
            sourceFile.referencedFiles,
            sourceFile.typeReferenceDirectives,
            sourceFile.hasNoDefaultLib,
            sourceFile.libReferenceDirectives
        );
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
