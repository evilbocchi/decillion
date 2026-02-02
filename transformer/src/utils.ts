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
        // For PropertyAccessExpression, recursively process the base expression
        // In JSX context, expr.expression should be another valid JSX tag name expression
        // (Identifier, PropertyAccessExpression, or ThisExpression)
        const baseExpr = expr.expression;
        let baseString: string;
        
        if (ts.isIdentifier(baseExpr)) {
            baseString = baseExpr.text;
        } else if (ts.isPropertyAccessExpression(baseExpr)) {
            // Recursively handle nested property access (e.g., a.b.c)
            // Type assertion is safe here because we know it's a PropertyAccessExpression
            baseString = jsxTagExpressionToString(baseExpr as ts.JsxTagNameExpression);
        } else if ((baseExpr as ts.Node).kind === ts.SyntaxKind.ThisKeyword) {
            baseString = "this";
        } else {
            // Fallback for unexpected expression types
            baseString = "Unknown";
        }
        
        return baseString + "." + expr.name.text;
    } else if ((expr as ts.Node).kind === ts.SyntaxKind.ThisKeyword) {
        // Handle ThisExpression
        return "this";
    } else if (ts.isJsxNamespacedName(expr)) {
        // Handle namespaced names (e.g., <ns:tag>)
        return expr.namespace.text + ":" + expr.name.text;
    }
    return "Unknown";
}
