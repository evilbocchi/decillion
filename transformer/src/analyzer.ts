import * as ts from "typescript";
import { robloxStaticDetector } from "./roblox-bridge";
import type { DependencyInfo, PropEdit, ChildEdit, PatchInstruction, FinePatchBlockInfo } from "./types";
import { EditType } from "./types";

export interface BlockInfo {
    id: string;
    staticProps: string[];
    dynamicProps: string[];
    hasDynamicChildren: boolean;
    isStatic: boolean;
    dependencies: string[];
    dependencyTypes?: Map<string, DependencyInfo>; // Enhanced dependency tracking with types
}

/**
 * Analyzes JSX elements to determine optimization opportunities
 * Identifies static vs dynamic content for block memoization
 */
export class BlockAnalyzer {
    private blockCounter = 0;
    private blocks = new Map<ts.Node, BlockInfo>();

    constructor(
        private typeChecker: ts.TypeChecker,
        private context: ts.TransformationContext,
        private program?: ts.Program,
        private debug = false,
    ) {
        // Initialize the Roblox static detector
        if (program) {
            robloxStaticDetector.initialize(program, debug);
        }
    }

    /**
     * Analyzes a JSX element and determines if it can be optimized
     */
    analyzeJsxElement(node: ts.JsxElement | ts.JsxSelfClosingElement): BlockInfo {
        if (this.blocks.has(node)) {
            return this.blocks.get(node)!;
        }

        const blockId = `block_${this.blockCounter++}`;
        const tagName = this.getJsxTagName(node);

        const blockInfo: BlockInfo = {
            id: blockId,
            staticProps: [],
            dynamicProps: [],
            hasDynamicChildren: false,
            isStatic: true,
            dependencies: [],
            dependencyTypes: new Map(),
        };

        // React components (PascalCase) should never be treated as static
        // because they can have internal state, effects, hooks, etc.
        if (tagName[0] && tagName[0] === tagName[0].toUpperCase()) {
            blockInfo.isStatic = false;
            // Add the component itself as a dependency if it's an identifier
            blockInfo.dependencies.push(tagName);
        }

        // Analyze attributes/props
        const attributes = this.getJsxAttributes(node);
        for (const attr of attributes) {
            if (ts.isJsxAttribute(attr) && attr.initializer) {
                const propName = ts.isIdentifier(attr.name) ? attr.name.text : attr.name.getText();

                if (ts.isJsxExpression(attr.initializer) && attr.initializer.expression) {
                    // Dynamic prop - contains expressions
                    if (this.isDynamicExpression(attr.initializer.expression)) {
                        blockInfo.dynamicProps.push(propName);
                        blockInfo.isStatic = false;
                        this.extractDependencies(
                            attr.initializer.expression,
                            blockInfo.dependencies,
                            blockInfo.dependencyTypes,
                        );
                    } else {
                        blockInfo.staticProps.push(propName);
                    }
                } else if (ts.isStringLiteral(attr.initializer)) {
                    // Static string prop
                    blockInfo.staticProps.push(propName);
                } else {
                    // Default to dynamic for safety
                    blockInfo.dynamicProps.push(propName);
                    blockInfo.isStatic = false;
                }
            }
        }

        // Analyze children
        if (ts.isJsxElement(node)) {
            for (const child of node.children) {
                if (ts.isJsxElement(child) || ts.isJsxSelfClosingElement(child)) {
                    const childBlock = this.analyzeJsxElement(child);
                    if (!childBlock.isStatic) {
                        blockInfo.hasDynamicChildren = true;
                        blockInfo.isStatic = false;

                        // Merge dependencies and their types from child blocks
                        for (const dep of childBlock.dependencies) {
                            if (!blockInfo.dependencies.includes(dep)) {
                                blockInfo.dependencies.push(dep);

                                // Also merge the dependency type information
                                if (childBlock.dependencyTypes?.has(dep) && blockInfo.dependencyTypes) {
                                    blockInfo.dependencyTypes.set(dep, childBlock.dependencyTypes.get(dep)!);
                                }
                            }
                        }
                    }
                } else if (ts.isJsxExpression(child) && child.expression) {
                    if (this.isDynamicExpression(child.expression)) {
                        blockInfo.hasDynamicChildren = true;
                        blockInfo.isStatic = false;
                        this.extractDependencies(child.expression, blockInfo.dependencies, blockInfo.dependencyTypes);
                    }
                }
            }
        }

        // Remove duplicates from dependencies while preserving order and types
        const uniqueDeps: string[] = [];
        const uniqueDepTypes = new Map<string, DependencyInfo>();

        for (const dep of blockInfo.dependencies) {
            if (!uniqueDeps.includes(dep)) {
                uniqueDeps.push(dep);
                // Preserve the type information for unique dependencies
                if (blockInfo.dependencyTypes?.has(dep)) {
                    uniqueDepTypes.set(dep, blockInfo.dependencyTypes.get(dep)!);
                }
            }
        }

        blockInfo.dependencies = uniqueDeps;
        blockInfo.dependencyTypes = uniqueDepTypes;

        this.blocks.set(node, blockInfo);
        return blockInfo;
    }

    /**
     * Determines if an expression contains dynamic content
     */
    private isDynamicExpression(expr: ts.Expression): boolean {
        // Check for identifiers (variables)
        if (ts.isIdentifier(expr)) {
            return true;
        }

        // Check for property access (obj.prop)
        if (ts.isPropertyAccessExpression(expr)) {
            // Check if this is a static Roblox property first
            if (robloxStaticDetector.isStaticRobloxProperty(expr)) {
                return false;
            }
            return true;
        }

        // Check for element access (obj[key])
        if (ts.isElementAccessExpression(expr)) {
            return true;
        }

        // Check for call expressions (func())
        if (ts.isCallExpression(expr)) {
            // Use the Roblox static detector for more comprehensive detection
            if (robloxStaticDetector.isStaticRobloxCall(expr)) {
                // Check if all arguments are static (don't contain variables)
                return expr.arguments.some((arg) => this.isDynamicExpression(arg as ts.Expression));
            }

            return true;
        }

        // Handle new expressions (new Color3(), new Vector2(), etc.)
        if (ts.isNewExpression(expr)) {
            // Use the Roblox static detector
            if (robloxStaticDetector.isStaticRobloxNew(expr)) {
                return expr.arguments
                    ? expr.arguments.some((arg) => this.isDynamicExpression(arg as ts.Expression))
                    : false;
            }
            return true;
        }

        // Check for template literals with expressions
        if (ts.isTemplateExpression(expr)) {
            return expr.templateSpans.some((span) => this.isDynamicExpression(span.expression));
        }

        // Check for binary expressions
        if (ts.isBinaryExpression(expr)) {
            return this.isDynamicExpression(expr.left) || this.isDynamicExpression(expr.right);
        }

        // Check for conditional expressions
        if (ts.isConditionalExpression(expr)) {
            return true;
        }

        // Check for array/object literals with dynamic content
        if (ts.isArrayLiteralExpression(expr)) {
            return expr.elements.some((el) => ts.isExpression(el) && this.isDynamicExpression(el));
        }

        if (ts.isObjectLiteralExpression(expr)) {
            return expr.properties.some((prop) => {
                if (ts.isPropertyAssignment(prop)) {
                    return this.isDynamicExpression(prop.initializer);
                } else if (ts.isShorthandPropertyAssignment(prop)) {
                    return true; // Shorthand props are dynamic by definition
                } else if (ts.isMethodDeclaration(prop)) {
                    return true; // Methods are dynamic
                }
                return false;
            });
        }

        // Static by default (literals, etc.)
        return false;
    }

    /**
     * Extracts variable dependencies from an expression with type information
     */
    private extractDependencies(expr: ts.Expression, deps: string[], depTypes?: Map<string, DependencyInfo>): void {
        if (ts.isIdentifier(expr)) {
            if (this.isIdentifierPartOfJsxIntrinsicTag(expr)) {
                return;
            }
            // Only add if not already present
            if (!deps.includes(expr.text)) {
                deps.push(expr.text);
            }

            if (depTypes && !depTypes.has(expr.text)) {
                // Try to get the type of this identifier
                const type = this.typeChecker.getTypeAtLocation(expr);
                const typeNode = this.typeChecker.typeToTypeNode(
                    type,
                    expr,
                    ts.NodeBuilderFlags.InTypeAlias | ts.NodeBuilderFlags.UseAliasDefinedOutsideCurrentScope,
                );
                depTypes.set(expr.text, {
                    name: expr.text,
                    type: typeNode,
                    sourceNode: expr,
                });
            }
            return;
        }

        if (ts.isPropertyAccessExpression(expr)) {
            // Check if this is a static Roblox property first
            if (robloxStaticDetector.isStaticRobloxProperty(expr)) {
                // Don't extract dependencies from static Roblox properties
                return;
            }
            this.extractDependencies(expr.expression, deps, depTypes);
            return;
        }

        if (ts.isElementAccessExpression(expr)) {
            this.extractDependencies(expr.expression, deps, depTypes);
            if (ts.isExpression(expr.argumentExpression)) {
                this.extractDependencies(expr.argumentExpression, deps, depTypes);
            }
            return;
        }

        // Handle call expressions (func())
        if (ts.isCallExpression(expr)) {
            // Use the Roblox static detector for more comprehensive detection
            if (robloxStaticDetector.isStaticRobloxCall(expr)) {
                // Only extract dependencies from arguments, not the constructor itself
                expr.arguments.forEach((arg) => {
                    if (ts.isExpression(arg)) {
                        this.extractDependencies(arg, deps, depTypes);
                    }
                });
                return;
            }

            // For other call expressions, extract from both the function and arguments
            this.extractDependencies(expr.expression, deps, depTypes);
            expr.arguments.forEach((arg) => {
                if (ts.isExpression(arg)) {
                    this.extractDependencies(arg, deps, depTypes);
                }
            });
            return;
        }

        // Handle new expressions (new Color3(), new Vector2(), etc.)
        if (ts.isNewExpression(expr)) {
            // Use the Roblox static detector
            if (robloxStaticDetector.isStaticRobloxNew(expr)) {
                // Only extract dependencies from arguments, not the constructor itself
                if (expr.arguments) {
                    expr.arguments.forEach((arg) => {
                        if (ts.isExpression(arg)) {
                            this.extractDependencies(arg, deps, depTypes);
                        }
                    });
                }
                return;
            }
            // For other new expressions, extract dependencies normally
            this.extractDependencies(expr.expression, deps, depTypes);
            if (expr.arguments) {
                expr.arguments.forEach((arg) => {
                    if (ts.isExpression(arg)) {
                        this.extractDependencies(arg, deps, depTypes);
                    }
                });
            }
            return;
        }

        if (ts.isTemplateExpression(expr)) {
            expr.templateSpans.forEach((span) => this.extractDependencies(span.expression, deps, depTypes));
            return;
        }

        if (ts.isBinaryExpression(expr)) {
            this.extractDependencies(expr.left, deps, depTypes);
            this.extractDependencies(expr.right, deps, depTypes);
            return;
        }

        if (ts.isConditionalExpression(expr)) {
            this.extractDependencies(expr.condition, deps, depTypes);
            this.extractDependencies(expr.whenTrue, deps, depTypes);
            this.extractDependencies(expr.whenFalse, deps, depTypes);
            return;
        }

        if (ts.isObjectLiteralExpression(expr)) {
            expr.properties.forEach((prop) => {
                if (ts.isPropertyAssignment(prop)) {
                    this.extractDependencies(prop.initializer, deps, depTypes);
                } else if (ts.isShorthandPropertyAssignment(prop)) {
                    // For shorthand properties like { increment }, the identifier is the value
                    if (!deps.includes(prop.name.text)) {
                        deps.push(prop.name.text);
                    }

                    if (depTypes && !depTypes.has(prop.name.text)) {
                        const type = this.typeChecker.getTypeAtLocation(prop.name);
                        const typeNode = this.typeChecker.typeToTypeNode(
                            type,
                            prop.name,
                            ts.NodeBuilderFlags.InTypeAlias | ts.NodeBuilderFlags.UseAliasDefinedOutsideCurrentScope,
                        );
                        depTypes.set(prop.name.text, {
                            name: prop.name.text,
                            type: typeNode,
                            sourceNode: prop.name,
                        });
                    }
                } else if (ts.isMethodDeclaration(prop)) {
                    // Method declarations might contain dependencies in their body
                    ts.forEachChild(prop, (child) => {
                        if (ts.isExpression(child)) {
                            this.extractDependencies(child, deps, depTypes);
                        }
                    });
                }
            });
            return;
        }

        if (ts.isArrayLiteralExpression(expr)) {
            expr.elements.forEach((el) => {
                if (ts.isExpression(el)) {
                    this.extractDependencies(el, deps, depTypes);
                }
            });
            return;
        }

        // Handle other expression types as needed
        ts.forEachChild(expr, (child) => {
            if (ts.isExpression(child)) {
                this.extractDependencies(child, deps, depTypes);
            }
        });
    }

    private isIdentifierPartOfJsxIntrinsicTag(identifier: ts.Identifier): boolean {
        let current: ts.Node | undefined = identifier;

        while (current) {
            const parent: ts.Node | undefined = current.parent;
            if (!parent) {
                break;
            }

            if (
                (ts.isJsxOpeningElement(parent) ||
                    ts.isJsxSelfClosingElement(parent) ||
                    ts.isJsxClosingElement(parent)) &&
                parent.tagName === current
            ) {
                const tagText = current.getText();
                if (!tagText) {
                    return false;
                }

                const firstChar = tagText[0];
                return firstChar === firstChar.toLowerCase();
            }

            if (ts.isPropertyAccessExpression(parent) || ts.isQualifiedName(parent)) {
                current = parent;
                continue;
            }

            current = parent;
        }

        return false;
    }

    /**
     * Gets JSX attributes from either JsxElement or JsxSelfClosingElement
     */
    private getJsxAttributes(node: ts.JsxElement | ts.JsxSelfClosingElement): ts.NodeArray<ts.JsxAttributeLike> {
        if (ts.isJsxElement(node)) {
            return node.openingElement.attributes.properties;
        }
        return node.attributes.properties;
    }

    /**
     * Gets the tag name from a JSX element
     */
    getJsxTagName(node: ts.JsxElement | ts.JsxSelfClosingElement): string {
        const tagName = ts.isJsxElement(node) ? node.openingElement.tagName : node.tagName;

        if (ts.isIdentifier(tagName)) {
            return tagName.text;
        }

        return "UnknownTag";
    }

    /**
     * Checks if a block should be memoized based on analysis
     */
    shouldMemoizeBlock(blockInfo: BlockInfo): boolean {
        // Don't memoize purely static blocks (they don't change)
        if (blockInfo.isStatic) {
            return false;
        }

        // Only memoize if there are at least 2 dependencies or if it has complex children
        // This avoids over-memoizing simple elements with just one dynamic prop
        if (blockInfo.dependencies.length < 2 && !blockInfo.hasDynamicChildren) {
            return false;
        }

        // Only memoize blocks that have multiple dynamic props or complex expressions
        const complexityScore = blockInfo.dynamicProps.length + (blockInfo.hasDynamicChildren ? 2 : 0);

        // Require a minimum complexity threshold to justify memoization overhead
        // Changed from 3 to 2 to allow memoization for components with 2 dependencies
        if (complexityScore < 2) {
            return false;
        }

        // Memoize if it has dynamic props or children and has dependencies
        if ((blockInfo.dynamicProps.length > 0 || blockInfo.hasDynamicChildren) && blockInfo.dependencies.length > 0) {
            return true;
        }

        return false;
    }

    getBlockInfo(node: ts.Node): BlockInfo | undefined {
        return this.blocks.get(node);
    }

    getAllBlocks(): Map<ts.Node, BlockInfo> {
        return this.blocks;
    }

    /**
     * Generates fine-grained patch instructions for a block
     * This enables updating individual properties instead of re-rendering entire components
     */
    generatePatchInstructions(node: ts.JsxElement | ts.JsxSelfClosingElement): FinePatchBlockInfo {
        const blockInfo = this.analyzeJsxElement(node);
        const patchInstructions: PatchInstruction[] = [];
        const elementPaths = new Map<ts.Node, number[]>();

        // Generate path for current element
        this.assignElementPaths(node, [], elementPaths);

        // Generate patch instructions for this element's props
        const elementInstruction = this.generateElementPatchInstruction(node, [], elementPaths);
        if (elementInstruction.edits.length > 0) {
            patchInstructions.push(elementInstruction);
        }

        // Generate patch instructions for children
        if (ts.isJsxElement(node)) {
            this.generateChildPatchInstructions(node, [0], elementPaths, patchInstructions);
        }

        return {
            ...blockInfo,
            patchInstructions,
            elementPaths,
        };
    }

    /**
     * Assigns element paths for navigation during patching
     */
    private assignElementPaths(
        node: ts.JsxElement | ts.JsxSelfClosingElement,
        currentPath: number[],
        elementPaths: Map<ts.Node, number[]>,
    ): void {
        elementPaths.set(node, [...currentPath]);

        if (ts.isJsxElement(node)) {
            let childIndex = 0;
            for (const child of node.children) {
                if (ts.isJsxElement(child) || ts.isJsxSelfClosingElement(child)) {
                    this.assignElementPaths(child, [...currentPath, childIndex], elementPaths);
                    childIndex++;
                } else if (ts.isJsxExpression(child) && child.expression) {
                    // JSX expressions also count as children
                    childIndex++;
                }
            }
        }
    }

    /**
     * Generates patch instructions for a single element's properties
     */
    private generateElementPatchInstruction(
        node: ts.JsxElement | ts.JsxSelfClosingElement,
        elementPath: number[],
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        _elementPaths: Map<ts.Node, number[]>,
    ): PatchInstruction {
        const edits: (PropEdit | ChildEdit)[] = [];
        const attributes = this.getJsxAttributes(node);

        for (const attr of attributes) {
            if (ts.isJsxAttribute(attr) && attr.initializer) {
                const propName = ts.isIdentifier(attr.name) ? attr.name.text : attr.name.getText();

                if (ts.isJsxExpression(attr.initializer) && attr.initializer.expression) {
                    if (this.isDynamicExpression(attr.initializer.expression)) {
                        // Find which dependency this prop depends on
                        const dependencies: string[] = [];
                        this.extractDependencies(attr.initializer.expression, dependencies);

                        // For now, we'll use the first dependency as the key
                        // In a more sophisticated system, you might want to track multiple dependencies per edit
                        if (dependencies.length > 0) {
                            const editType = this.getEditTypeForProp(propName);
                            edits.push({
                                type: editType,
                                propName,
                                dependencyKey: dependencies[0],
                                path: elementPath,
                            } as PropEdit);
                        }
                    }
                }
            }
        }

        return {
            elementPath,
            edits,
        };
    }

    /**
     * Generates patch instructions for children
     */
    private generateChildPatchInstructions(
        node: ts.JsxElement,
        basePath: number[],
        elementPaths: Map<ts.Node, number[]>,
        patchInstructions: PatchInstruction[],
    ): void {
        let childIndex = 0;

        for (const child of node.children) {
            if (ts.isJsxElement(child) || ts.isJsxSelfClosingElement(child)) {
                const childPath = [...basePath, childIndex];

                // Generate patch instructions for this child element
                const childInstruction = this.generateElementPatchInstruction(child, childPath, elementPaths);
                if (childInstruction.edits.length > 0) {
                    patchInstructions.push(childInstruction);
                }

                // Recursively process nested children
                if (ts.isJsxElement(child)) {
                    this.generateChildPatchInstructions(child, childPath, elementPaths, patchInstructions);
                }

                childIndex++;
            } else if (ts.isJsxExpression(child) && child.expression) {
                // Dynamic child content
                if (this.isDynamicExpression(child.expression)) {
                    const dependencies: string[] = [];
                    this.extractDependencies(child.expression, dependencies);

                    if (dependencies.length > 0) {
                        const childPath = [...basePath, childIndex];
                        patchInstructions.push({
                            elementPath: basePath, // Parent element path
                            edits: [
                                {
                                    type: EditType.Child,
                                    index: childIndex,
                                    dependencyKey: dependencies[0],
                                    path: childPath,
                                } as ChildEdit,
                            ],
                        });
                    }
                }
                childIndex++;
            }
        }
    }

    /**
     * Determines the edit type for a given property name
     */
    private getEditTypeForProp(propName: string): EditType {
        // Categorize props by their update type
        if (propName.toLowerCase().includes("style") || propName === "BackgroundColor3" || propName === "TextColor3") {
            return EditType.Style;
        } else if (
            propName.startsWith("on") ||
            propName.includes("Event") ||
            propName.includes("Click") ||
            propName.includes("Changed") ||
            propName.includes("Activated") ||
            propName.startsWith("Mouse") ||
            propName.startsWith("Touch") ||
            propName.includes("Input")
        ) {
            return EditType.Event;
        } else {
            return EditType.Attribute;
        }
    }
}
