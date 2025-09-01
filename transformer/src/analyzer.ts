import * as ts from "typescript";
import { robloxStaticDetector } from "./roblox-static-detector";

export interface BlockInfo {
    id: string;
    staticProps: string[];
    dynamicProps: string[];
    hasDynamicChildren: boolean;
    isStatic: boolean;
    dependencies: string[];
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
        private program?: ts.Program
    ) {
        // Initialize the Roblox static detector
        if (program) {
            robloxStaticDetector.initialize(program);
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
            dependencies: []
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
                        this.extractDependencies(attr.initializer.expression, blockInfo.dependencies);
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
                        blockInfo.dependencies.push(...childBlock.dependencies);
                    }
                } else if (ts.isJsxExpression(child) && child.expression) {
                    if (this.isDynamicExpression(child.expression)) {
                        blockInfo.hasDynamicChildren = true;
                        blockInfo.isStatic = false;
                        this.extractDependencies(child.expression, blockInfo.dependencies);
                    }
                }
            }
        }

        // Remove duplicates from dependencies
        blockInfo.dependencies = [...new Set(blockInfo.dependencies)];

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
                return expr.arguments.some(arg => this.isDynamicExpression(arg as ts.Expression));
            }

            return true;
        }

        // Handle new expressions (new Color3(), new Vector2(), etc.)
        if (ts.isNewExpression(expr)) {
            // Use the Roblox static detector
            if (robloxStaticDetector.isStaticRobloxNew(expr)) {
                return expr.arguments ? expr.arguments.some(arg => this.isDynamicExpression(arg as ts.Expression)) : false;
            }
            return true;
        }

        // Check for template literals with expressions
        if (ts.isTemplateExpression(expr)) {
            return expr.templateSpans.some(span =>
                this.isDynamicExpression(span.expression)
            );
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
            return expr.elements.some(el =>
                ts.isExpression(el) && this.isDynamicExpression(el)
            );
        }

        if (ts.isObjectLiteralExpression(expr)) {
            return expr.properties.some(prop => {
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
     * Extracts variable dependencies from an expression
     */
    private extractDependencies(expr: ts.Expression, deps: string[]): void {
        if (ts.isIdentifier(expr)) {
            deps.push(expr.text);
            return;
        }

        if (ts.isPropertyAccessExpression(expr)) {
            this.extractDependencies(expr.expression, deps);
            return;
        }

        if (ts.isElementAccessExpression(expr)) {
            this.extractDependencies(expr.expression, deps);
            if (ts.isExpression(expr.argumentExpression)) {
                this.extractDependencies(expr.argumentExpression, deps);
            }
            return;
        }

        if (ts.isCallExpression(expr)) {
            // Use the Roblox static detector for more comprehensive detection
            if (robloxStaticDetector.isStaticRobloxCall(expr)) {
                // Only extract dependencies from arguments, not the constructor itself
                expr.arguments.forEach(arg => {
                    if (ts.isExpression(arg)) {
                        this.extractDependencies(arg, deps);
                    }
                });
                return;
            }

            // For other call expressions, extract from both the function and arguments
            this.extractDependencies(expr.expression, deps);
            expr.arguments.forEach(arg => {
                if (ts.isExpression(arg)) {
                    this.extractDependencies(arg, deps);
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
                    expr.arguments.forEach(arg => {
                        if (ts.isExpression(arg)) {
                            this.extractDependencies(arg, deps);
                        }
                    });
                }
                return;
            }
            // For other new expressions, extract dependencies normally
            this.extractDependencies(expr.expression, deps);
            if (expr.arguments) {
                expr.arguments.forEach(arg => {
                    if (ts.isExpression(arg)) {
                        this.extractDependencies(arg, deps);
                    }
                });
            }
            return;
        }

        if (ts.isTemplateExpression(expr)) {
            expr.templateSpans.forEach(span =>
                this.extractDependencies(span.expression, deps)
            );
            return;
        }

        if (ts.isBinaryExpression(expr)) {
            this.extractDependencies(expr.left, deps);
            this.extractDependencies(expr.right, deps);
            return;
        }

        if (ts.isConditionalExpression(expr)) {
            this.extractDependencies(expr.condition, deps);
            this.extractDependencies(expr.whenTrue, deps);
            this.extractDependencies(expr.whenFalse, deps);
            return;
        }

        if (ts.isObjectLiteralExpression(expr)) {
            expr.properties.forEach(prop => {
                if (ts.isPropertyAssignment(prop)) {
                    this.extractDependencies(prop.initializer, deps);
                } else if (ts.isShorthandPropertyAssignment(prop)) {
                    // For shorthand properties like { increment }, the identifier is the value
                    deps.push(prop.name.text);
                } else if (ts.isMethodDeclaration(prop)) {
                    // Method declarations might contain dependencies in their body
                    ts.forEachChild(prop, child => {
                        if (ts.isExpression(child)) {
                            this.extractDependencies(child, deps);
                        }
                    });
                }
            });
            return;
        }

        if (ts.isArrayLiteralExpression(expr)) {
            expr.elements.forEach(el => {
                if (ts.isExpression(el)) {
                    this.extractDependencies(el, deps);
                }
            });
            return;
        }

        // Handle other expression types as needed
        ts.forEachChild(expr, child => {
            if (ts.isExpression(child)) {
                this.extractDependencies(child, deps);
            }
        });
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
        const tagName = ts.isJsxElement(node)
            ? node.openingElement.tagName
            : node.tagName;

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

        // Memoize if it has dynamic props or children and has dependencies
        if ((blockInfo.dynamicProps.length > 0 || blockInfo.hasDynamicChildren) &&
            blockInfo.dependencies.length > 0) {
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
}
