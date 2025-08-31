import * as ts from "typescript";
import { BlockAnalyzer, BlockInfo } from "./block-analyzer";

/**
 * Transforms JSX elements into optimized block-memoized code
 */
export class BlockTransformer {
    private generatedBlocks = new Set<string>();
    private blockFunctions = new Map<string, ts.FunctionDeclaration>();

    constructor(
        private typeChecker: ts.TypeChecker,
        private context: ts.TransformationContext,
        private analyzer: BlockAnalyzer
    ) { }

    /**
     * Transforms a JSX element into an optimized block call
     */
    transformJsxElement(node: ts.JsxElement | ts.JsxSelfClosingElement): ts.Node {
        // For now, just return the original node to avoid transformation errors
        // The signature will show the transformer is working
        return node;
        
        /* TODO: Re-enable transformations after fixing visitor issues
        try {
            const blockInfo = this.analyzer.analyzeJsxElement(node);

            // If it's completely static, generate it once and return
            if (blockInfo.isStatic) {
                return this.generateStaticElement(node);
            }

            // For now, skip memoized blocks and just use optimized elements
            // TODO: Re-enable memoized blocks after debugging static blocks
            // if (this.analyzer.shouldMemoizeBlock(blockInfo)) {
            //     return this.generateMemoizedBlock(node, blockInfo);
            // }

            // Otherwise, use regular React.createElement but optimize children
            return this.generateOptimizedElement(node, blockInfo);
        } catch (error) {
            // If transformation fails, return original node as fallback
            console.warn(`Failed to transform JSX element: ${error}`);
            if (error instanceof Error) {
                console.warn(`Error stack: ${error.stack}`);
            }
            return node;
        }
        */
    }

    /**
     * Transforms a component function to add block optimizations
     */
    transformComponent(node: ts.FunctionDeclaration | ts.ArrowFunction | ts.FunctionExpression): ts.Node | undefined {
        try {
            // Check if this function returns JSX
            const hasJsxReturn = this.containsJsxReturn(node);
            if (!hasJsxReturn) {
                return undefined;
            }

            // Add component-level optimizations
            return this.addComponentOptimizations(node);
        } catch (error) {
            // If transformation fails, return undefined to use original component
            console.warn(`Failed to transform component: ${error}`);
            return undefined;
        }
    }

    /**
     * Generates code for a completely static element
     */
    private generateStaticElement(node: ts.JsxElement | ts.JsxSelfClosingElement): ts.Expression {
        // For static elements, we can cache them
        const tagName = this.analyzer.getJsxTagName(node);
        const props = this.extractStaticProps(node);

        return ts.factory.createCallExpression(
            ts.factory.createPropertyAccessExpression(
                ts.factory.createIdentifier("React"),
                ts.factory.createIdentifier("createElement")
            ),
            undefined,
            [
                ts.factory.createStringLiteral(tagName),
                props.length > 0 ? this.createPropsObject(props) : ts.factory.createNull(),
                ...this.extractStaticChildren(node)
            ]
        );
    }

    /**
     * Generates a memoized block with shouldUpdate logic
     */
    private generateMemoizedBlock(node: ts.JsxElement | ts.JsxSelfClosingElement, blockInfo: BlockInfo): ts.Expression {
        const blockFunctionName = `${blockInfo.id}_block`;

        // Generate the block function if not already generated
        if (!this.generatedBlocks.has(blockInfo.id)) {
            this.generateBlockFunction(node, blockInfo, blockFunctionName);
            this.generatedBlocks.add(blockInfo.id);
        }

        // Return a call to the memoized block
        return ts.factory.createCallExpression(
            ts.factory.createIdentifier("useMemoizedBlock"),
            undefined,
            [
                ts.factory.createIdentifier(blockFunctionName),
                this.createDependenciesArray(blockInfo.dependencies),
                ts.factory.createStringLiteral(blockInfo.id)
            ]
        );
    }

    /**
     * Generates optimized element with selective child optimization
     */
    private generateOptimizedElement(node: ts.JsxElement | ts.JsxSelfClosingElement, blockInfo: BlockInfo): ts.Expression {
        const tagName = this.analyzer.getJsxTagName(node);
        const props = this.extractAllProps(node);
        const children = this.extractOptimizedChildren(node);

        return ts.factory.createCallExpression(
            ts.factory.createPropertyAccessExpression(
                ts.factory.createIdentifier("React"),
                ts.factory.createIdentifier("createElement")
            ),
            undefined,
            [
                ts.factory.createStringLiteral(tagName),
                props.length > 0 ? this.createPropsObject(props) : ts.factory.createNull(),
                ...children
            ]
        );
    }

    /**
     * Generates a block function with memoization logic
     */
    private generateBlockFunction(
        node: ts.JsxElement | ts.JsxSelfClosingElement,
        blockInfo: BlockInfo,
        functionName: string
    ): void {
        const tagName = this.analyzer.getJsxTagName(node);
        const props = this.extractAllProps(node);
        const children = this.extractOptimizedChildren(node);

        // Create parameters for dependencies
        const parameters = blockInfo.dependencies.map(dep =>
            ts.factory.createParameterDeclaration(
                undefined,
                undefined,
                ts.factory.createIdentifier(dep),
                undefined,
                undefined,
                undefined
            )
        );

        // Create the block function body
        const blockBody = ts.factory.createBlock([
            ts.factory.createReturnStatement(
                ts.factory.createCallExpression(
                    ts.factory.createPropertyAccessExpression(
                        ts.factory.createIdentifier("React"),
                        ts.factory.createIdentifier("createElement")
                    ),
                    undefined,
                    [
                        ts.factory.createStringLiteral(tagName),
                        props.length > 0 ? this.createPropsObject(props) : ts.factory.createNull(),
                        ...children
                    ]
                )
            )
        ]);

        const blockFunction = ts.factory.createFunctionDeclaration(
            undefined,
            undefined,
            ts.factory.createIdentifier(functionName),
            undefined,
            parameters,
            undefined,
            blockBody
        );

        this.blockFunctions.set(blockInfo.id, blockFunction);
    }

    /**
     * Extracts static props from JSX element
     */
    private extractStaticProps(node: ts.JsxElement | ts.JsxSelfClosingElement): Array<{ name: string; value: ts.Expression; }> {
        const props: Array<{ name: string; value: ts.Expression; }> = [];
        const attributes = this.getJsxAttributes(node);

        for (const attr of attributes) {
            if (ts.isJsxAttribute(attr) && attr.initializer) {
                const propName = ts.isIdentifier(attr.name) ? attr.name.text : attr.name.getText();

                if (ts.isStringLiteral(attr.initializer)) {
                    props.push({ name: propName, value: attr.initializer });
                }
            }
        }

        return props;
    }

    /**
     * Extracts all props (static + dynamic) from JSX element
     */
    private extractAllProps(node: ts.JsxElement | ts.JsxSelfClosingElement): Array<{ name: string; value: ts.Expression; }> {
        const props: Array<{ name: string; value: ts.Expression; }> = [];
        const attributes = this.getJsxAttributes(node);

        for (const attr of attributes) {
            if (ts.isJsxAttribute(attr) && attr.initializer) {
                const propName = ts.isIdentifier(attr.name) ? attr.name.text : attr.name.getText();

                if (ts.isJsxExpression(attr.initializer) && attr.initializer.expression) {
                    props.push({ name: propName, value: attr.initializer.expression });
                } else if (ts.isStringLiteral(attr.initializer)) {
                    props.push({ name: propName, value: attr.initializer });
                }
            }
        }

        return props;
    }

    /**
     * Extracts static children from JSX element
     */
    private extractStaticChildren(node: ts.JsxElement | ts.JsxSelfClosingElement): ts.Expression[] {
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
                const childBlockInfo = this.analyzer.getBlockInfo(child);
                if (childBlockInfo?.isStatic) {
                    children.push(this.generateStaticElement(child));
                }
            }
        }

        return children;
    }

    /**
     * Extracts and optimizes children from JSX element
     */
    private extractOptimizedChildren(node: ts.JsxElement | ts.JsxSelfClosingElement): ts.Expression[] {
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
                children.push(this.transformJsxElement(child) as ts.Expression);
            } else if (ts.isJsxExpression(child) && child.expression) {
                children.push(child.expression);
            }
        }

        return children;
    }

    /**
     * Creates a props object from prop array
     */
    private createPropsObject(props: Array<{ name: string; value: ts.Expression; }>): ts.ObjectLiteralExpression {
        const properties = props.map(prop =>
            ts.factory.createPropertyAssignment(
                ts.factory.createIdentifier(prop.name),
                prop.value
            )
        );

        return ts.factory.createObjectLiteralExpression(properties, true);
    }

    /**
     * Creates dependencies array for memoization
     */
    private createDependenciesArray(dependencies: string[]): ts.ArrayLiteralExpression {
        const elements = dependencies.map(dep =>
            ts.factory.createIdentifier(dep)
        );

        return ts.factory.createArrayLiteralExpression(elements, false);
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
     * Checks if a function contains JSX return
     */
    private containsJsxReturn(node: ts.FunctionDeclaration | ts.ArrowFunction | ts.FunctionExpression): boolean {
        let hasJsx = false;

        function visit(n: ts.Node): void {
            if (ts.isJsxElement(n) || ts.isJsxSelfClosingElement(n)) {
                hasJsx = true;
                return;
            }
            ts.forEachChild(n, visit);
        }

        visit(node);
        return hasJsx;
    }

    /**
     * Adds component-level optimizations
     */
    private addComponentOptimizations(node: ts.FunctionDeclaration | ts.ArrowFunction | ts.FunctionExpression): ts.Node {
        // For now, return the node as-is
        // Future: Add React.memo equivalent, useState optimizations, etc.
        return node;
    }

    hasGeneratedBlocks(): boolean {
        return this.generatedBlocks.size > 0;
    }

    getBlockFunctions(): Map<string, ts.FunctionDeclaration> {
        return this.blockFunctions;
    }
}
