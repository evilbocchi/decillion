import { transformJsxElement } from "transformer";
import { OptimizationContext, PropInfo } from "types";
import * as ts from "typescript";
import { BlockAnalyzer } from "./block-analyzer";

/**
 * Legacy wrapper for block transformation
 * @deprecated Use the new modular block system instead
 */
export class BlockTransformer {
    private context: OptimizationContext;

    constructor(
        private typeChecker: ts.TypeChecker,
        private transformationContext: ts.TransformationContext,
        private analyzer: BlockAnalyzer
    ) {
        this.context = {
            typeChecker,
            context: transformationContext,
            blockCounter: 0,
            generatedBlocks: new Set<string>(),
            blockFunctions: new Map<string, ts.FunctionDeclaration>(),
            staticPropsTables: new Map<string, PropInfo[]>()
        };
    }

    /**
     * Transforms a JSX element into an optimized block call
     */
    transformJsxElement(node: ts.JsxElement | ts.JsxSelfClosingElement): ts.Node {
        try {
            const result = transformJsxElement(node, this.context);
            return result.element;
        } catch (error) {
            // If transformation fails, return original node as fallback
            console.warn(`Failed to transform JSX element: ${error}`);
            return node;
        }
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

            // For now, we'll focus on optimizing the JSX content itself
            // The individual JSX elements will be handled by transformJsxElement
            // Future enhancement: Add React.memo equivalent for component-level memoization

            return this.addComponentOptimizations(node);
        } catch (error) {
            // If transformation fails, return undefined to use original component
            console.warn(`Failed to transform component: ${error}`);
            return undefined;
        }
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
        return this.context.generatedBlocks.size > 0;
    }

    getBlockFunctions(): Map<string, ts.FunctionDeclaration> {
        return this.context.blockFunctions;
    }

    hasStaticPropsTables(): boolean {
        return this.context.staticPropsTables.size > 0;
    }

    getStaticPropsTables(): Map<string, PropInfo[]> {
        return this.context.staticPropsTables;
    }
}
