import * as ts from "typescript";
import type { BlockAnalyzer, BlockInfo } from "./analyzer";
import {
    createMemoizedBlockCall,
    createPropsObject,
    createStaticElementCall,
    generateBlockId,
    generateStaticElementId,
    generateStaticInstanceFactoryId,
    generateStaticPropsId,
    createDependenciesArray,
} from "./codegen";
import { robloxStaticDetector } from "./roblox-bridge";
import type {
    DisabledOptimizationOptions,
    OptimizationContext,
    PropInfo,
    ResolvedDisabledOptimizationOptions,
    StaticElementInfo,
    TransformResult,
    PatchInstruction,
} from "./types";
import { isResolvedDisabledOptimizations, resolveDisabledOptimizations } from "./types";

/**
 * Creates the appropriate tag reference for React.createElement
 * - Lowercase tags (frame, textlabel) become string literals
 * - PascalCase tags (Counter, MyComponent) become identifiers
 */
function createTagReference(tagName: string): ts.Expression {
    // Check if tag name starts with uppercase (PascalCase component)
    if (tagName[0] && tagName[0] === tagName[0].toUpperCase()) {
        // React component - use identifier
        return ts.factory.createIdentifier(tagName);
    } else {
        // HTML-like element - use string literal
        return ts.factory.createStringLiteral(tagName);
    }
}

function sanitizeDependencyType(
    dep: string,
    typeNode: ts.TypeNode | undefined,
    context?: OptimizationContext,
): ts.TypeNode | undefined {
    if (!typeNode) {
        return undefined;
    }

    if (ts.isTypeQueryNode(typeNode) && ts.isIdentifier(typeNode.exprName) && typeNode.exprName.text === dep) {
        return ts.factory.createTypeQueryNode(
            ts.factory.createQualifiedName(ts.factory.createIdentifier("globalThis"), ts.factory.createIdentifier(dep)),
        );
    }

    if (ts.isTypeReferenceNode(typeNode)) {
        const typeName = typeNode.typeName;

        if (ts.isIdentifier(typeName)) {
            const referencedName = typeName.text;

            if (referencedName === dep) {
                return ts.factory.createTypeQueryNode(
                    ts.factory.createQualifiedName(
                        ts.factory.createIdentifier("globalThis"),
                        ts.factory.createIdentifier(dep),
                    ),
                );
            }

            if (context && referencedName === "VirtualListResult") {
                context.requiredTypeImports.add("VirtualListResult");
            }
        } else if (ts.isQualifiedName(typeName)) {
            const referencedName = typeName.right.text;

            if (context && referencedName === "VirtualListResult") {
                context.requiredTypeImports.add("VirtualListResult");

                const updatedArgs = typeNode.typeArguments?.map(
                    (arg) => sanitizeDependencyType(dep, arg, context) ?? arg,
                );

                return ts.factory.createTypeReferenceNode(ts.factory.createIdentifier(referencedName), updatedArgs);
            }
        }

        if (typeNode.typeArguments?.length) {
            const updatedArgs = typeNode.typeArguments.map((arg) => sanitizeDependencyType(dep, arg, context) ?? arg);
            if (updatedArgs.some((arg, index) => arg !== typeNode.typeArguments![index])) {
                return ts.factory.createTypeReferenceNode(typeNode.typeName, updatedArgs);
            }
        }

        return typeNode;
    }

    if (ts.isUnionTypeNode(typeNode)) {
        const updatedTypes = typeNode.types.map((t) => sanitizeDependencyType(dep, t, context) ?? t);
        if (updatedTypes.some((t, index) => t !== typeNode.types[index])) {
            return ts.factory.createUnionTypeNode(updatedTypes);
        }
        return typeNode;
    }

    if (ts.isParenthesizedTypeNode(typeNode)) {
        const inner = sanitizeDependencyType(dep, typeNode.type, context);
        if (inner && inner !== typeNode.type) {
            return ts.factory.createParenthesizedType(inner);
        }
        return typeNode;
    }

    if (ts.isArrayTypeNode(typeNode)) {
        const elementType = sanitizeDependencyType(dep, typeNode.elementType, context);
        if (elementType && elementType !== typeNode.elementType) {
            return ts.factory.createArrayTypeNode(elementType);
        }
        return typeNode;
    }

    if (ts.isTupleTypeNode(typeNode)) {
        const updatedElements = typeNode.elements.map((el) => sanitizeDependencyType(dep, el, context) ?? el);
        if (updatedElements.some((el, index) => el !== typeNode.elements[index])) {
            return ts.factory.createTupleTypeNode(updatedElements);
        }
        return typeNode;
    }

    if (ts.isTypeOperatorNode(typeNode)) {
        const target = sanitizeDependencyType(dep, typeNode.type, context);
        if (target && target !== typeNode.type) {
            return ts.factory.createTypeOperatorNode(typeNode.operator, target);
        }
        return typeNode;
    }

    if (ts.isIndexedAccessTypeNode(typeNode)) {
        const objectType = sanitizeDependencyType(dep, typeNode.objectType, context) ?? typeNode.objectType;
        const indexType = sanitizeDependencyType(dep, typeNode.indexType, context) ?? typeNode.indexType;
        if (objectType !== typeNode.objectType || indexType !== typeNode.indexType) {
            return ts.factory.createIndexedAccessTypeNode(objectType, indexType);
        }
        return typeNode;
    }

    if (ts.isTypeLiteralNode(typeNode)) {
        const updatedMembers = typeNode.members.map((member) => {
            if (ts.isPropertySignature(member) && member.type) {
                const newType = sanitizeDependencyType(dep, member.type, context);
                if (newType && newType !== member.type) {
                    return ts.factory.updatePropertySignature(
                        member,
                        member.modifiers,
                        member.name,
                        member.questionToken,
                        newType,
                    );
                }
            }
            return member;
        });

        if (updatedMembers.some((member, index) => member !== typeNode.members[index])) {
            return ts.factory.updateTypeLiteralNode(typeNode, ts.factory.createNodeArray(updatedMembers));
        }

        return typeNode;
    }

    if (ts.isFunctionTypeNode(typeNode)) {
        const updatedParameters = typeNode.parameters.map((param) => {
            if (param.type) {
                const newType = sanitizeDependencyType(dep, param.type, context);
                if (newType && newType !== param.type) {
                    return ts.factory.updateParameterDeclaration(
                        param,
                        param.modifiers,
                        param.dotDotDotToken,
                        param.name,
                        param.questionToken,
                        newType,
                        param.initializer,
                    );
                }
            }
            return param;
        });

        const updatedReturnType = typeNode.type
            ? (sanitizeDependencyType(dep, typeNode.type, context) ?? typeNode.type)
            : undefined;

        if (
            updatedParameters.some((param, index) => param !== typeNode.parameters[index]) ||
            (updatedReturnType && typeNode.type && updatedReturnType !== typeNode.type)
        ) {
            return ts.factory.updateFunctionTypeNode(
                typeNode,
                typeNode.typeParameters,
                ts.factory.createNodeArray(updatedParameters),
                updatedReturnType ?? typeNode.type,
            );
        }

        return typeNode;
    }

    return typeNode;
}

/**
 * Utility function to fetch parameter types for a memoized block
 * This can be used externally to get type information for dependencies
 */
export function getBlockParameterTypes(
    blockInfo: BlockInfo,
    context: OptimizationContext,
): Array<{ name: string; type: ts.TypeNode | undefined; sourceNode?: ts.Node }> {
    const parameterTypes: Array<{ name: string; type: ts.TypeNode | undefined; sourceNode?: ts.Node }> = [];

    for (const dep of blockInfo.dependencies) {
        let typeNode: ts.TypeNode | undefined;
        let sourceNode: ts.Node | undefined;

        // Try to get type information from the dependency types map
        if (blockInfo.dependencyTypes?.has(dep)) {
            const depInfo = blockInfo.dependencyTypes.get(dep)!;
            typeNode = sanitizeDependencyType(dep, depInfo.type, context);
            sourceNode = depInfo.sourceNode;
        }

        // If we couldn't get a specific type, try to infer it from context
        if (!typeNode && context.typeChecker) {
            // Try to find the identifier in the current scope and get its type
            // This is a fallback for when the dependency analysis didn't capture the type
            const symbol = context.typeChecker.getSymbolAtLocation(ts.factory.createIdentifier(dep));
            if (symbol) {
                const declarationNode = symbol.valueDeclaration || symbol.declarations?.[0];
                if (declarationNode) {
                    const type = context.typeChecker.getTypeOfSymbolAtLocation(symbol, declarationNode);
                    typeNode = sanitizeDependencyType(
                        dep,
                        context.typeChecker.typeToTypeNode(type, declarationNode, ts.NodeBuilderFlags.InTypeAlias),
                        context,
                    );
                }
            }
        }

        parameterTypes.push({
            name: dep,
            type: typeNode,
            sourceNode,
        });
    }

    return parameterTypes;
}

/**
 * Utility function to get a human-readable string representation of parameter types
 */
export function getParameterTypesString(blockInfo: BlockInfo, context: OptimizationContext): string {
    const paramTypes = getBlockParameterTypes(blockInfo, context);

    return paramTypes
        .map((param) => {
            if (param.type) {
                const printer = ts.createPrinter();
                // Create a temporary source file for printing
                const tempSourceFile = ts.createSourceFile("temp.ts", "", ts.ScriptTarget.Latest);
                const typeString = printer.printNode(ts.EmitHint.Unspecified, param.type, tempSourceFile);
                return `${param.name}: ${typeString}`;
            } else {
                return `${param.name}: any`;
            }
        })
        .join(", ");
}

/**
 * Core block transformation logic
 * Following Million.js pattern using the existing BlockAnalyzer
 */

/**
 * Main transformer class that consolidates all transformation logic
 */
export class DecillionTransformer {
    private context: OptimizationContext;

    constructor(
        typeChecker: ts.TypeChecker,
        transformationContext: ts.TransformationContext,
        blockAnalyzer?: BlockAnalyzer,
        disabledOptimizations?: DisabledOptimizationOptions | ResolvedDisabledOptimizationOptions,
    ) {
        const resolvedDisabledOptimizations = isResolvedDisabledOptimizations(disabledOptimizations)
            ? disabledOptimizations
            : resolveDisabledOptimizations(disabledOptimizations);

        this.context = {
            typeChecker,
            context: transformationContext,
            blockCounter: 0,
            generatedBlocks: new Set<string>(),
            blockFunctions: new Map<string, ts.FunctionDeclaration>(),
            staticPropsTables: new Map<string, PropInfo[]>(),
            staticElements: new Map<string, StaticElementInfo>(),
            blockAnalyzer,
            skipTransformFunctions: new Set<string>(),
            functionContextStack: [],
            forceBasicTransformFunctions: new Set<string>(),
            tagToInstanceNameMap: robloxStaticDetector.getTagToInstanceNameMap(),
            requiredTypeImports: new Set<string>(),
            disabledOptimizations: resolvedDisabledOptimizations,
        };
    }

    /**
     * Analyzes a JSX element using the existing BlockAnalyzer
     */
    analyzeJsxElement(node: ts.JsxElement | ts.JsxSelfClosingElement): BlockInfo {
        // Use the existing BlockAnalyzer for analysis
        if (!this.context.blockAnalyzer) {
            throw new Error("BlockAnalyzer not provided in context");
        }

        return this.context.blockAnalyzer.analyzeJsxElement(node);
    }

    /**
     * Gets the optimization context for external access
     */
    getContext(): OptimizationContext {
        return this.context;
    }
}

/**
 * Transforms a JSX element into optimized code using BlockAnalyzer with fine-grained patching
 */
export function transformJsxElementWithFinePatch(
    node: ts.JsxElement | ts.JsxSelfClosingElement,
    context: OptimizationContext,
): TransformResult {
    const tagName = context.blockAnalyzer!.getJsxTagName(node);

    if (shouldUseBasicTransform(context)) {
        return generateOptimizedElement(node, tagName, context);
    }

    const blockInfo = context.blockAnalyzer!.analyzeJsxElement(node);

    if (blockInfo.hasNonOptimizableProps) {
        return generateOptimizedElement(node, tagName, context);
    }

    if (blockInfo.isStatic) {
        return generateStaticElement(node, tagName, context);
    }

    if (context.blockAnalyzer!.shouldMemoizeBlock(blockInfo)) {
        // Use fine-grained patching for complex blocks
        return generateFinePatchBlock(node, blockInfo, tagName, context);
    }

    return generateOptimizedElement(node, tagName, context);
}

/**
 * Generates a fine-grained patch block
 */
function generateFinePatchBlock(
    node: ts.JsxElement | ts.JsxSelfClosingElement,
    blockInfo: BlockInfo,
    tagName: string,
    context: OptimizationContext,
): TransformResult {
    const blockId = generateBlockId(tagName);
    const allProps = extractPropsFromJsx(node);
    const children = extractOptimizedChildren(node, context);

    // Generate patch instructions
    const finePatchInfo = context.blockAnalyzer!.generatePatchInstructions(node);

    // Create the React.createElement call inside the arrow function
    const createElementCall = ts.factory.createCallExpression(
        ts.factory.createPropertyAccessExpression(
            ts.factory.createIdentifier("React"),
            ts.factory.createIdentifier("createElement"),
        ),
        undefined,
        [
            createTagReference(tagName),
            allProps.length > 0 ? createPropsObject(allProps) : ts.factory.createIdentifier("undefined"),
            ...children,
        ],
    );

    const parameters = new Array<ts.ParameterDeclaration>();
    const dependencyTypeNodes: ts.TypeNode[] = [];
    const orderedDependencies: string[] = [];
    const processedDependencies = new Set<string>();

    // Create parameters for dependencies
    for (const dep of blockInfo.dependencies) {
        if (processedDependencies.has(dep)) {
            continue;
        }

        processedDependencies.add(dep);
        orderedDependencies.push(dep);

        let typeNode: ts.TypeNode | undefined;
        if (blockInfo.dependencyTypes?.has(dep)) {
            const depInfo = blockInfo.dependencyTypes.get(dep)!;
            typeNode = sanitizeDependencyType(dep, depInfo.type, context);
        }

        dependencyTypeNodes.push(typeNode ?? ts.factory.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword));

        parameters.push(
            ts.factory.createParameterDeclaration(
                undefined,
                undefined,
                ts.factory.createIdentifier(dep),
                undefined,
                typeNode,
                undefined,
            ),
        );
    }

    const arrowFunction = ts.factory.createArrowFunction(
        undefined,
        undefined,
        parameters,
        undefined,
        ts.factory.createToken(ts.SyntaxKind.EqualsGreaterThanToken),
        createElementCall,
    );

    // Create patch instructions array literal
    const patchInstructionsArray = createPatchInstructionsLiteral(finePatchInfo.patchInstructions);

    // Use fine-grained patch function
    const finalDependencies = orderedDependencies;
    const genericArguments = dependencyTypeNodes.length
        ? [ts.factory.createTupleTypeNode(dependencyTypeNodes)]
        : undefined;

    return {
        element: ts.factory.createCallExpression(ts.factory.createIdentifier("useFinePatchBlock"), genericArguments, [
            arrowFunction,
            createDependenciesArray(finalDependencies),
            patchInstructionsArray,
            ts.factory.createStringLiteral(blockId),
        ]),
        needsRuntimeImport: true,
    };
}

/**
 * Creates a literal array of patch instructions
 */
function createPatchInstructionsLiteral(patchInstructions: PatchInstruction[]): ts.ArrayLiteralExpression {
    const instructionLiterals = patchInstructions.map((instruction) => {
        const editsArray = ts.factory.createArrayLiteralExpression(
            instruction.edits.map((edit) => {
                const editProperties = [
                    ts.factory.createPropertyAssignment("type", ts.factory.createNumericLiteral(edit.type.toString())),
                    ts.factory.createPropertyAssignment(
                        "dependencyKey",
                        ts.factory.createStringLiteral(edit.dependencyKey),
                    ),
                ];

                if ("propName" in edit) {
                    editProperties.push(
                        ts.factory.createPropertyAssignment("propName", ts.factory.createStringLiteral(edit.propName)),
                    );
                }

                if ("index" in edit) {
                    editProperties.push(
                        ts.factory.createPropertyAssignment(
                            "index",
                            ts.factory.createNumericLiteral(edit.index.toString()),
                        ),
                    );
                }

                if (edit.path) {
                    editProperties.push(
                        ts.factory.createPropertyAssignment(
                            "path",
                            ts.factory.createArrayLiteralExpression(
                                edit.path.map((p) => ts.factory.createNumericLiteral(p.toString())),
                            ),
                        ),
                    );
                }

                return ts.factory.createObjectLiteralExpression(editProperties);
            }),
        );

        return ts.factory.createObjectLiteralExpression([
            ts.factory.createPropertyAssignment(
                "elementPath",
                ts.factory.createArrayLiteralExpression(
                    instruction.elementPath.map((p) => ts.factory.createNumericLiteral(p.toString())),
                ),
            ),
            ts.factory.createPropertyAssignment("edits", editsArray),
        ]);
    });

    return ts.factory.createArrayLiteralExpression(instructionLiterals);
}

/**
 * Transforms a JSX element into optimized code using BlockAnalyzer
 * @deprecated Use transformJsxElementWithFinePatch
 */
export function transformJsxElement(
    node: ts.JsxElement | ts.JsxSelfClosingElement,
    context: OptimizationContext,
): TransformResult {
    const tagName = context.blockAnalyzer!.getJsxTagName(node);

    if (shouldUseBasicTransform(context)) {
        return generateOptimizedElement(node, tagName, context);
    }

    const blockInfo = context.blockAnalyzer!.analyzeJsxElement(node);

    if (blockInfo.isStatic) {
        return generateStaticElement(node, tagName, context);
    }

    if (context.blockAnalyzer!.shouldMemoizeBlock(blockInfo)) {
        return generateMemoizedBlock(node, blockInfo, tagName, context);
    }

    return generateOptimizedElement(node, tagName, context);
}

/**
 * Generates a static element with extracted props table and optional full element extraction
 */
function generateStaticElement(
    node: ts.JsxElement | ts.JsxSelfClosingElement,
    tagName: string,
    context: OptimizationContext,
    extractFullElement = true,
): TransformResult {
    const staticProps = extractPropsFromJsx(node, true);
    const children = extractStaticChildren(node, context);

    let propsArg: ts.Expression;
    let staticPropsTable: { id: string; props: PropInfo[] } | undefined;

    if (staticProps.length > 0) {
        const propsId = generateStaticPropsId(tagName);
        staticPropsTable = { id: propsId, props: staticProps };
        context.staticPropsTables.set(propsId, staticProps);
        propsArg = ts.factory.createIdentifier(propsId);
    } else {
        propsArg = ts.factory.createIdentifier("undefined");
    }

    const elementCall = createStaticElementCall(tagName, propsArg, children, context.tagToInstanceNameMap);

    // Check if we should extract the full static element to module level
    if (extractFullElement && isCompletelyStatic(node, context)) {
        const elementId = generateStaticElementId(tagName);
        const instanceFactoryId = generateStaticInstanceFactoryId(tagName);
        const staticElementInfo: StaticElementInfo = {
            id: elementId,
            tagName,
            propsTableId: staticPropsTable?.id || "",
            children,
            element: elementCall,
            instanceFactoryId,
        };

        context.staticElements.set(elementId, staticElementInfo);

        // Return a reference to the static element instead of the full call
        return {
            element: ts.factory.createIdentifier(elementId),
            needsRuntimeImport: true,
            staticPropsTable,
            staticElement: staticElementInfo,
            staticInstanceFactoryId: instanceFactoryId,
        };
    }

    return {
        element: elementCall,
        needsRuntimeImport: true,
        staticPropsTable,
    };
}

/**
 * Checks if an element and all its children are completely static
 */
function isCompletelyStatic(node: ts.JsxElement | ts.JsxSelfClosingElement, context: OptimizationContext): boolean {
    // Check if the element itself is static
    const blockInfo = context.blockAnalyzer?.analyzeJsxElement(node);
    if (!blockInfo?.isStatic) {
        return false;
    }

    // Check if all children are static (already checked in blockInfo.isStatic, but let's be explicit)
    if (ts.isJsxElement(node)) {
        for (const child of node.children) {
            if (ts.isJsxElement(child) || ts.isJsxSelfClosingElement(child)) {
                if (!isCompletelyStatic(child, context)) {
                    return false;
                }
            } else if (ts.isJsxExpression(child) && child.expression) {
                // Any JSX expression makes it dynamic
                if (!isStaticExpression(child.expression)) {
                    return false;
                }
            }
        }
    }

    return true;
}

/**
 * Generates a memoized block
 */
function generateMemoizedBlock(
    node: ts.JsxElement | ts.JsxSelfClosingElement,
    blockInfo: BlockInfo,
    tagName: string,
    context: OptimizationContext,
): TransformResult {
    const blockId = generateBlockId(tagName);
    const allProps = extractPropsFromJsx(node);
    const children = extractOptimizedChildren(node, context);

    // Create the React.createElement call inside the arrow function
    const createElementCall = ts.factory.createCallExpression(
        ts.factory.createPropertyAccessExpression(
            ts.factory.createIdentifier("React"),
            ts.factory.createIdentifier("createElement"),
        ),
        undefined,
        [
            createTagReference(tagName),
            allProps.length > 0 ? createPropsObject(allProps) : ts.factory.createIdentifier("undefined"),
            ...children,
        ],
    );

    const parameters = new Array<ts.ParameterDeclaration>();

    // Create a map to track which dependencies we've already processed
    const processedDependencies = new Set<string>();

    for (const dep of blockInfo.dependencies) {
        // Skip if we've already processed this dependency (avoid duplicates)
        if (processedDependencies.has(dep)) {
            continue;
        }
        processedDependencies.add(dep);

        let typeNode: ts.TypeNode | undefined;

        // Try to get type information from the dependency types map first
        if (blockInfo.dependencyTypes?.has(dep)) {
            const depInfo = blockInfo.dependencyTypes.get(dep)!;
            typeNode = sanitizeDependencyType(dep, depInfo.type, context);

            // If we have a source node, try to get the type from there for better accuracy
            if (!typeNode && depInfo.sourceNode && context.typeChecker) {
                const type = context.typeChecker.getTypeAtLocation(depInfo.sourceNode);
                typeNode = sanitizeDependencyType(
                    dep,
                    context.typeChecker.typeToTypeNode(
                        type,
                        depInfo.sourceNode,
                        ts.NodeBuilderFlags.InTypeAlias | ts.NodeBuilderFlags.UseAliasDefinedOutsideCurrentScope,
                    ),
                    context,
                );
            }
        }

        // If we still don't have a type, try to find it in the current scope context
        if (!typeNode && context.typeChecker) {
            // Create a temporary identifier to look up the symbol
            const tempIdentifier = ts.factory.createIdentifier(dep);

            // Try to find the symbol at the node's location for better context
            let searchContext: ts.Node = node;

            // Walk up the tree to find a better context for symbol lookup
            while (searchContext.parent && !ts.isSourceFile(searchContext.parent)) {
                searchContext = searchContext.parent;

                // If we find a function declaration/expression, use that as context
                if (
                    ts.isFunctionDeclaration(searchContext) ||
                    ts.isFunctionExpression(searchContext) ||
                    ts.isArrowFunction(searchContext)
                ) {
                    break;
                }
            }

            const symbol = context.typeChecker.getSymbolAtLocation(tempIdentifier);
            if (symbol && symbol.valueDeclaration) {
                const type = context.typeChecker.getTypeOfSymbolAtLocation(symbol, symbol.valueDeclaration);
                typeNode = sanitizeDependencyType(
                    dep,
                    context.typeChecker.typeToTypeNode(
                        type,
                        symbol.valueDeclaration,
                        ts.NodeBuilderFlags.InTypeAlias | ts.NodeBuilderFlags.UseAliasDefinedOutsideCurrentScope,
                    ),
                    context,
                );
            }
        }

        parameters.push(
            ts.factory.createParameterDeclaration(
                undefined,
                undefined,
                ts.factory.createIdentifier(dep),
                undefined,
                typeNode,
                undefined,
            ),
        );
    }

    const arrowFunction = ts.factory.createArrowFunction(
        undefined,
        undefined,
        parameters,
        undefined,
        ts.factory.createToken(ts.SyntaxKind.EqualsGreaterThanToken),
        createElementCall,
    );

    // Use the deduplicated dependencies for the dependencies array
    const finalDependencies = Array.from(processedDependencies);

    return {
        element: createMemoizedBlockCall(arrowFunction, finalDependencies, blockId),
        needsRuntimeImport: true,
    };
}

/**
 * Generates an optimized element without full memoization
 */
function generateOptimizedElement(
    node: ts.JsxElement | ts.JsxSelfClosingElement,
    tagName: string,
    context: OptimizationContext,
): TransformResult {
    const allProps = extractPropsFromJsx(node);
    const children = extractOptimizedChildren(node, context);

    const propsArg = allProps.length > 0 ? createPropsObject(allProps) : ts.factory.createIdentifier("undefined");

    const element = ts.factory.createCallExpression(
        ts.factory.createPropertyAccessExpression(
            ts.factory.createIdentifier("React"),
            ts.factory.createIdentifier("createElement"),
        ),
        undefined,
        [createTagReference(tagName), propsArg, ...children],
    );

    return {
        element,
        needsRuntimeImport: false,
    };
}

/**
 * Extracts static children from JSX element
 */
function extractStaticChildren(
    node: ts.JsxElement | ts.JsxSelfClosingElement,
    context: OptimizationContext,
): ts.Expression[] {
    if (!ts.isJsxElement(node)) {
        return [];
    }

    const children: ts.Expression[] = [];

    for (const child of node.children) {
        if (ts.isJsxText(child)) {
            const text = child.text.trim();
            if (text) {
                children.push(ts.factory.createStringLiteral(text));
            }
        } else if (ts.isJsxElement(child) || ts.isJsxSelfClosingElement(child)) {
            const childResult = transformJsxElementWithFinePatch(child, context);
            if (childResult.staticPropsTable) {
                // Store static props table for child
                context.staticPropsTables.set(childResult.staticPropsTable.id, childResult.staticPropsTable.props);
            }
            if (childResult.staticElement) {
                // Store static element for child
                context.staticElements.set(childResult.staticElement.id, childResult.staticElement);
            }
            children.push(childResult.element);
        }
    }

    return children;
}

/**
 * Extracts and optimizes children from JSX element
 */
function extractOptimizedChildren(
    node: ts.JsxElement | ts.JsxSelfClosingElement,
    context: OptimizationContext,
): ts.Expression[] {
    if (!ts.isJsxElement(node)) {
        return [];
    }

    const children: ts.Expression[] = [];

    for (const child of node.children) {
        if (ts.isJsxText(child)) {
            const text = child.text.trim();
            if (text) {
                children.push(ts.factory.createStringLiteral(text));
            }
        } else if (ts.isJsxElement(child) || ts.isJsxSelfClosingElement(child)) {
            const childResult = transformJsxElementWithFinePatch(child, context);
            if (childResult.staticPropsTable) {
                context.staticPropsTables.set(childResult.staticPropsTable.id, childResult.staticPropsTable.props);
            }
            if (childResult.staticElement) {
                context.staticElements.set(childResult.staticElement.id, childResult.staticElement);
            }
            children.push(childResult.element);
        } else if (ts.isJsxExpression(child) && child.expression) {
            children.push(child.expression);
        }
    }

    return children;
}

/**
 * Extracts props from JSX element, categorizing them as static or dynamic
 */
function extractPropsFromJsx(node: ts.JsxElement | ts.JsxSelfClosingElement, onlyStatic = false): PropInfo[] {
    const props: PropInfo[] = [];
    const attributes = getJsxAttributes(node);

    for (const attr of attributes) {
        if (ts.isJsxAttribute(attr) && attr.initializer) {
            const propName = ts.isIdentifier(attr.name) ? attr.name.text : attr.name.getText();

            if (ts.isStringLiteral(attr.initializer)) {
                // String literal props are static
                props.push({
                    name: propName,
                    value: attr.initializer,
                    isStatic: true,
                });
            } else if (ts.isJsxExpression(attr.initializer) && attr.initializer.expression) {
                // Check if the JSX expression contains a static value
                const isStatic = isStaticExpression(attr.initializer.expression);
                if (!onlyStatic || isStatic) {
                    props.push({
                        name: propName,
                        value: attr.initializer.expression,
                        isStatic,
                    });
                }
            }
        }
    }

    return props;
}

/**
 * Gets JSX attributes from either JsxElement or JsxSelfClosingElement
 */
function getJsxAttributes(node: ts.JsxElement | ts.JsxSelfClosingElement): ts.NodeArray<ts.JsxAttributeLike> {
    if (ts.isJsxElement(node)) {
        return node.openingElement.attributes.properties;
    }
    return node.attributes.properties;
}

/**
 * Determines if an expression contains only static values
 */
function isStaticExpression(expr: ts.Expression): boolean {
    if (
        ts.isStringLiteral(expr) ||
        ts.isNumericLiteral(expr) ||
        ts.isBooleanLiteral(expr) ||
        expr.kind === ts.SyntaxKind.NullKeyword
    ) {
        return true;
    }

    if (ts.isCallExpression(expr)) {
        // Use the Roblox static detector for more comprehensive detection
        if (robloxStaticDetector.isStaticRobloxCall(expr)) {
            // Check if all arguments are static
            return expr.arguments.every((arg) => isStaticExpression(arg as ts.Expression));
        }

        return false;
    }

    // Handle new expressions (new Color3(), new Vector2(), etc.)
    if (ts.isNewExpression(expr)) {
        // Use the Roblox static detector
        if (robloxStaticDetector.isStaticRobloxNew(expr)) {
            return expr.arguments ? expr.arguments.every((arg) => isStaticExpression(arg as ts.Expression)) : true;
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
}

/**
 * Utility functions for @undecillion decorator detection
 */

/**
 * Checks if a function has the @undecillion decorator or comment
 */
export function hasUndecillionDecorator(
    node: ts.FunctionDeclaration | ts.FunctionExpression | ts.ArrowFunction | ts.MethodDeclaration,
    sourceFile?: ts.SourceFile,
): boolean {
    // Get the source file and text
    const file = sourceFile || node.getSourceFile();
    if (!file) {
        return false;
    }

    const fullText = file.getFullText();

    // For arrow functions, we need to find the top-level statement that contains the comment
    let checkNode: ts.Node = node;
    if (ts.isArrowFunction(node)) {
        // Navigate up to find the VariableStatement which contains the leading comments
        let parent = node.parent;
        if (parent && ts.isVariableDeclaration(parent)) {
            parent = parent.parent; // VariableDeclarationList
            if (parent && ts.isVariableDeclarationList(parent)) {
                parent = parent.parent; // VariableStatement
                if (parent && ts.isVariableStatement(parent)) {
                    checkNode = parent;
                }
            }
        }
    }

    // Get the start position of the node (including leading trivia like comments)
    const nodeStart = checkNode.getFullStart();
    const nodePos = checkNode.getStart(file);

    // Look for @undecillion in the text before the actual node start
    const textBeforeNode = fullText.substring(nodeStart, nodePos);

    // Also check a reasonable amount of text before the full start
    const contextStart = Math.max(0, nodeStart - 500); // Look back up to 500 characters
    const contextText = fullText.substring(contextStart, nodePos);

    // Check if @undecillion appears in comments before the function
    const hasUndecillionMarker = contextText.includes("@undecillion") || textBeforeNode.includes("@undecillion");

    if (hasUndecillionMarker) {
        // Ensure it's in a comment context, not just random text
        const lines = contextText.split("\n");

        for (let i = lines.length - 1; i >= 0; i--) {
            const line = lines[i].trim();

            // Check if this line contains @undecillion in a comment context
            if (line.includes("@undecillion")) {
                // Verify it's in a comment (starts with //, /*, or is part of JSDoc)
                if (
                    line.startsWith("//") ||
                    line.startsWith("/*") ||
                    line.startsWith("*") ||
                    line.includes("* @undecillion") ||
                    line.match(/^\s*@undecillion/)
                ) {
                    return true;
                }
            }

            // Stop searching if we hit actual code (non-comment, non-whitespace)
            if (
                line &&
                !line.startsWith("//") &&
                !line.startsWith("/*") &&
                !line.startsWith("*") &&
                !line.startsWith("@") &&
                !line.match(/^\s*$/)
            ) {
                break;
            }
        }
    }

    return false;
}

/**
 * Gets the function name for tracking purposes
 */
export function getFunctionName(
    node: ts.FunctionDeclaration | ts.FunctionExpression | ts.ArrowFunction | ts.MethodDeclaration,
): string | undefined {
    if (ts.isFunctionDeclaration(node) && node.name) {
        return node.name.text;
    }

    if (ts.isMethodDeclaration(node) && ts.isIdentifier(node.name)) {
        return node.name.text;
    }

    // For function expressions and arrow functions, try to get name from variable declaration
    if (!node.parent) {
        return undefined;
    }

    const parent = node.parent;
    if (ts.isVariableDeclaration(parent) && ts.isIdentifier(parent.name)) {
        return parent.name.text;
    }

    if (ts.isPropertyAssignment(parent) && ts.isIdentifier(parent.name)) {
        return parent.name.text;
    }

    return undefined;
}

/**
 * Checks if we're currently inside a function that should skip transformation
 */
export function shouldSkipTransformation(context: OptimizationContext): boolean {
    return context.functionContextStack.some((functionName) => context.skipTransformFunctions.has(functionName));
}

export function shouldUseBasicTransform(context: OptimizationContext): boolean {
    return context.functionContextStack.some((functionName) =>
        context.forceBasicTransformFunctions.has(functionName),
    );
}
