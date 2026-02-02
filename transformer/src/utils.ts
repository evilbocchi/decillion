import * as ts from "typescript";

/**
 * Shared utility functions for JSX transformation
 */

/**
 * Converts a JSX tag name expression to a string representation.
 * Handles PropertyAccessExpression recursively (e.g., Ctx.Provider -> "Ctx.Provider")
 * Handles ThisExpression (e.g., <this.Component> -> "this.Component")
 */
export function jsxTagExpressionToString(expr: ts.JsxTagNameExpression): string {
    if (ts.isIdentifier(expr)) {
        return expr.text;
    } else if (ts.isPropertyAccessExpression(expr)) {
        const base = jsxTagExpressionToString(expr.expression as ts.JsxTagNameExpression);
        return base + "." + expr.name.text;
    } else if ((expr as ts.Node).kind === ts.SyntaxKind.ThisKeyword) {
        // Handle ThisExpression
        return "this";
    } else if (ts.isJsxNamespacedName(expr)) {
        // Handle namespaced names (e.g., <ns:tag>)
        return expr.namespace.text + ":" + expr.name.text;
    }
    return "Unknown";
}
