import * as ts from "typescript";
import { BlockAnalyzer } from "./block-analyzer";
import { DecillionTransformer, transformJsxElement } from "./transformer";
import type { OptimizationContext, PropInfo } from "./types";

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

            if (debug) {
                console.log(`Decillion transformer processing: ${file.fileName}`);
            }

            // Early exit checks
            if (shouldSkipFile(file, debug)) {
                return file;
            }

            // Initialize transformation context with the new architecture
            const blockAnalyzer = new BlockAnalyzer(program.getTypeChecker(), context);
            const transformer = new DecillionTransformer(
                program.getTypeChecker(),
                context,
                blockAnalyzer
            );
            const optimizationContext = transformer.getContext();

            let needsRuntimeImport = false;

            // Main visitor function
            const visitNode = (node: ts.Node): ts.Node => {
                // Transform JSX elements using the new modular system
                if (ts.isJsxElement(node) || ts.isJsxSelfClosingElement(node)) {
                    if (debug) {
                        console.log(`Found JSX element: ${getTagName(node)}`);
                    }

                    needsRuntimeImport = true;
                    const result = transformJsxElement(node, optimizationContext);

                    if (debug) {
                        console.log(`JSX element transformed successfully`);
                    }

                    return result.element;
                }

                // Continue visiting children
                return ts.visitEachChild(node, visitNode, context);
            };

            try {
                if (debug) {
                    console.log(`Starting AST-based transformation...`);
                }

                // Apply transformation
                let transformedFile = ts.visitNode(file, visitNode) as ts.SourceFile;

                // Add runtime imports and static props tables
                transformedFile = applyPostTransformations(
                    transformedFile,
                    needsRuntimeImport,
                    optimizationContext,
                    addSignature,
                    signatureMessage
                );

                if (debug) {
                    console.log(`AST-based transformation completed successfully`);
                }

                return transformedFile;
            } catch (error) {
                if (debug) {
                    console.warn(`Transformation failed for ${file.fileName}: ${error}`);
                    if (error instanceof Error) {
                        console.warn(`Error stack: ${error.stack}`);
                    }
                }
                return file;
            }
        };
    };
}

/**
 * Determines if a file should be skipped from transformation
 */
function shouldSkipFile(file: ts.SourceFile, debug: boolean): boolean {
    const sourceText = file.getFullText();

    // Check for //undecillion comment
    const lines = sourceText.split('\n');
    const firstNonEmptyLine = lines.find(line => line.trim().length > 0);
    if (firstNonEmptyLine && firstNonEmptyLine.trim().startsWith('//undecillion')) {
        if (debug) {
            console.log(`Skipping transformation for ${file.fileName} due to //undecillion comment`);
        }
        return true;
    }

    // Quick check: if the file doesn't contain JSX, don't transform it
    if (!sourceText.includes('<') && !sourceText.includes('React.createElement')) {
        return true;
    }

    return false;
}

/**
 * Gets the tag name from a JSX element
 */
function getTagName(node: ts.JsxElement | ts.JsxSelfClosingElement): string {
    const tagName = ts.isJsxElement(node)
        ? node.openingElement.tagName
        : node.tagName;

    if (ts.isIdentifier(tagName)) {
        return tagName.text;
    }

    return "UnknownTag";
}

/**
 * Applies post-transformation modifications (imports, static props, signatures)
 */
function applyPostTransformations(
    file: ts.SourceFile,
    needsRuntimeImport: boolean,
    context: OptimizationContext,
    addSignature: boolean,
    signatureMessage?: string
): ts.SourceFile {
    let transformedFile = file;

    // Add runtime import if needed
    if (needsRuntimeImport) {
        transformedFile = addRuntimeImport(transformedFile);
    }

    // Add static props tables if any were created
    if (context.staticPropsTables.size > 0) {
        transformedFile = addStaticPropsTables(transformedFile, context.staticPropsTables);
    }

    // Add signature comment if requested
    if (addSignature) {
        const signature = signatureMessage || "Optimized by Decillion - Million.js-style block memoization for Roblox-TS";
        transformedFile = addSignatureComment(transformedFile, signature);
    }

    return transformedFile;
}

/**
 * Adds runtime import to the file
 */
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
        ts.factory.createStringLiteral("@decillion/runtime")
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

/**
 * Adds static props tables to the file
 */
function addStaticPropsTables(
    file: ts.SourceFile,
    staticPropsTables: Map<string, PropInfo[]>
): ts.SourceFile {
    const propsTableStatements: ts.Statement[] = [];

    for (const [id, props] of staticPropsTables) {
        // Create const STATIC_PROPS_XXX = { ... };
        const properties = props.map(prop =>
            ts.factory.createPropertyAssignment(
                ts.factory.createIdentifier(prop.name),
                prop.value
            )
        );

        const propsObject = ts.factory.createObjectLiteralExpression(properties, true);

        const constDeclaration = ts.factory.createVariableStatement(
            undefined,
            ts.factory.createVariableDeclarationList(
                [ts.factory.createVariableDeclaration(
                    ts.factory.createIdentifier(id),
                    undefined,
                    undefined,
                    propsObject
                )],
                ts.NodeFlags.Const
            )
        );

        propsTableStatements.push(constDeclaration);
    }

    // Insert static props tables after imports but before other statements
    const importStatements: ts.Statement[] = [];
    const otherStatements: ts.Statement[] = [];

    for (const stmt of file.statements) {
        if (ts.isImportDeclaration(stmt)) {
            importStatements.push(stmt);
        } else {
            otherStatements.push(stmt);
        }
    }

    const statements = [...importStatements, ...propsTableStatements, ...otherStatements];

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

/**
 * Adds signature comment to the file
 */
function addSignatureComment(file: ts.SourceFile, signature: string): ts.SourceFile {
    const commentNode = ts.addSyntheticLeadingComment(
        file,
        ts.SyntaxKind.SingleLineCommentTrivia,
        ` ${signature}`,
        true
    );

    return commentNode;
}