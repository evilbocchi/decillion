import * as ts from "typescript";
import { BlockAnalyzer } from "./analyzer";
import { DecillionTransformer, transformJsxElement, hasUndecillionDecorator, getFunctionName, shouldSkipTransformation } from "./transformer";
import type { OptimizationContext, PropInfo, StaticElementInfo } from "./types";

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
            const blockAnalyzer = new BlockAnalyzer(program.getTypeChecker(), context, program, debug);
            const transformer = new DecillionTransformer(
                program.getTypeChecker(),
                context,
                blockAnalyzer
            );
            const optimizationContext = transformer.getContext();

            let needsRuntimeImport = false;

            // First pass: scan for functions with @undecillion decorator
            const scanVisitor = (node: ts.Node): void => {
                if (ts.isFunctionDeclaration(node) || 
                    ts.isFunctionExpression(node) || 
                    ts.isArrowFunction(node) || 
                    ts.isMethodDeclaration(node)) {
                    
                    if (hasUndecillionDecorator(node)) {
                        const functionName = getFunctionName(node);
                        if (functionName) {
                            optimizationContext.skipTransformFunctions.add(functionName);
                            if (debug) {
                                console.log(`Found @undecillion decorator on function: ${functionName}`);
                            }
                        }
                    }
                }
                
                ts.forEachChild(node, scanVisitor);
            };

            // Scan the file first
            scanVisitor(file);

            // Main visitor function
            const visitNode = (node: ts.Node): ts.Node => {
                // Track function context for @undecillion detection
                if (ts.isFunctionDeclaration(node) || 
                    ts.isFunctionExpression(node) || 
                    ts.isArrowFunction(node) || 
                    ts.isMethodDeclaration(node)) {
                    
                    const functionName = getFunctionName(node);
                    
                    // Push function context
                    if (functionName) {
                        optimizationContext.functionContextStack.push(functionName);
                    }
                    
                    // Visit children with updated context
                    const result = ts.visitEachChild(node, visitNode, context);
                    
                    // Pop function context
                    if (functionName) {
                        optimizationContext.functionContextStack.pop();
                    }
                    
                    return result;
                }

                // Transform JSX elements using the new modular system
                if (ts.isJsxElement(node) || ts.isJsxSelfClosingElement(node)) {
                    // Check if we should skip transformation for this JSX element
                    if (shouldSkipTransformation(optimizationContext)) {
                        if (debug) {
                            console.log(`Skipping JSX transformation due to @undecillion decorator: ${getTagName(node)}`);
                        }
                        // Return the original JSX node without transformation
                        return ts.visitEachChild(node, visitNode, context);
                    }

                    if (debug) {
                        console.log(`Found JSX element: ${getTagName(node)}`);
                    }

                    needsRuntimeImport = true;
                    const result = transformJsxElement(node, optimizationContext);

                    // Store any static elements that were generated
                    if (result.staticElement) {
                        optimizationContext.staticElements.set(
                            result.staticElement.id,
                            result.staticElement
                        );
                    }

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

    // Add static props tables and static elements if any were created
    if (context.staticPropsTables.size > 0 || context.staticElements.size > 0) {
        transformedFile = addStaticDeclarations(transformedFile, context);
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
 * Adds static props tables and static elements to the file at module level
 */
function addStaticDeclarations(
    file: ts.SourceFile,
    context: OptimizationContext
): ts.SourceFile {
    const moduleStatements: ts.Statement[] = [];

    // Group static props by tag name for better organization
    const propsByTag = new Map<string, Array<{ id: string; props: PropInfo[] }>>();
    
    for (const [id, props] of context.staticPropsTables) {
        // Extract tag name from the ID (e.g., STATIC_PROPS_TEXTLABEL_mrs9jq -> textlabel)
        const tagMatch = id.match(/STATIC_PROPS_([A-Z]+)_/);
        const tagName = tagMatch ? tagMatch[1].toLowerCase() : 'unknown';
        
        if (!propsByTag.has(tagName)) {
            propsByTag.set(tagName, []);
        }
        propsByTag.get(tagName)!.push({ id, props });
    }

    // Sort static elements by dependency order to avoid "used before declaration" errors
    const sortedElements = topologicalSortElements(context.staticElements);

    // Add comment separator for static declarations
    if (context.staticPropsTables.size > 0 || context.staticElements.size > 0) {
        const commentText = " Static declarations - extracted from render functions for optimal performance";
        const separatorComment = ts.factory.createEmptyStatement();
        ts.addSyntheticLeadingComment(
            separatorComment,
            ts.SyntaxKind.SingleLineCommentTrivia,
            commentText,
            true
        );
        moduleStatements.push(separatorComment);
    }

    // First add all static props tables (since elements depend on them)
    for (const [tagName, propsEntries] of propsByTag) {
        for (const { id, props } of propsEntries) {
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

            moduleStatements.push(constDeclaration);
        }
    }

    // Then add static elements in dependency order
    for (const { id, info } of sortedElements) {
        // Create const STATIC_ELEMENT_XXX = createStaticElement(...);
        const elementDeclaration = ts.factory.createVariableStatement(
            undefined,
            ts.factory.createVariableDeclarationList(
                [ts.factory.createVariableDeclaration(
                    ts.factory.createIdentifier(id),
                    undefined,
                    undefined,
                    info.element
                )],
                ts.NodeFlags.Const
            )
        );

        moduleStatements.push(elementDeclaration);
    }

    // Insert static declarations after imports but before other statements
    const importStatements: ts.Statement[] = [];
    const otherStatements: ts.Statement[] = [];

    for (const stmt of file.statements) {
        if (ts.isImportDeclaration(stmt)) {
            importStatements.push(stmt);
        } else {
            otherStatements.push(stmt);
        }
    }

    const statements = [...importStatements, ...moduleStatements, ...otherStatements];

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
 * Performs topological sort on static elements to ensure dependencies are declared first
 */
function topologicalSortElements(
    staticElements: Map<string, StaticElementInfo>
): Array<{ id: string; info: StaticElementInfo }> {
    const result: Array<{ id: string; info: StaticElementInfo }> = [];
    const visited = new Set<string>();
    const visiting = new Set<string>();

    // Extract dependencies from a call expression (children that reference other static elements)
    function extractDependencies(expr: ts.CallExpression): string[] {
        const deps: string[] = [];
        
        // Recursively walk the expression tree to find all identifiers
        function walkExpression(node: ts.Node): void {
            if (ts.isIdentifier(node) && node.text.startsWith('STATIC_ELEMENT_')) {
                deps.push(node.text);
            }
            
            ts.forEachChild(node, walkExpression);
        }
        
        walkExpression(expr);
        return deps;
    }

    function visit(elementId: string): void {
        if (visited.has(elementId)) {
            return;
        }
        
        if (visiting.has(elementId)) {
            // Circular dependency detected - for now, just continue
            // In a more robust implementation, we might want to handle this better
            return;
        }

        const elementInfo = staticElements.get(elementId);
        if (!elementInfo) {
            return;
        }

        visiting.add(elementId);

        // Visit dependencies first
        const dependencies = extractDependencies(elementInfo.element);
        for (const dep of dependencies) {
            if (staticElements.has(dep)) {
                visit(dep);
            }
        }

        visiting.delete(elementId);
        visited.add(elementId);
        result.push({ id: elementId, info: elementInfo });
    }

    // Visit all elements
    for (const elementId of staticElements.keys()) {
        visit(elementId);
    }

    return result;
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