import * as ts from "typescript";
import { OptimizationContext, PropInfo } from "./types";
import { BlockAnalyzer } from "./block-analyzer";
import { DecillionTransformer, transformJsxElement } from "./transformer";

/**
 * Legacy compatibility wrapper for block transformation
 * This provides backward compatibility while using the new consolidated architecture
 * @deprecated Use DecillionTransformer class directly from transformer.ts
 */
export class BlockTransformer {
    private transformer: DecillionTransformer;

    constructor(
        private typeChecker: ts.TypeChecker,
        private transformationContext: ts.TransformationContext,
        private analyzer: BlockAnalyzer
    ) {
        this.transformer = new DecillionTransformer(
            typeChecker,
            transformationContext,
            analyzer
        );
    }

    /**
     * Transforms a JSX element into an optimized block call
     * @deprecated Use transformJsxElement function directly
     */
    transformJsxElement(node: ts.JsxElement | ts.JsxSelfClosingElement): ts.Node {
        try {
            const result = transformJsxElement(node, this.transformer.getContext());
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
        return this.transformer.getContext().generatedBlocks.size > 0;
    }

    getBlockFunctions(): Map<string, ts.FunctionDeclaration> {
        return this.transformer.getContext().blockFunctions;
    }

    hasStaticPropsTables(): boolean {
        return this.transformer.getContext().staticPropsTables.size > 0;
    }

    getStaticPropsTables(): Map<string, PropInfo[]> {
        return this.transformer.getContext().staticPropsTables;
    }
}
