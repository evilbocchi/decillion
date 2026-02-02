import * as ts from "typescript";

/**
 * Shared utility functions for JSX transformation
 */

/**
 * Converts a JSX tag name expression to a string representation.
 * Handles PropertyAccessExpression recursively (e.g., Ctx.Provider -> "Ctx.Provider")
 */
export function jsxTagExpressionToString(expr: ts.Expression): string {
    if (ts.isIdentifier(expr)) {
        return expr.text;
    } else if (ts.isPropertyAccessExpression(expr)) {
        return jsxTagExpressionToString(expr.expression) + "." + expr.name.text;
    }
    return "Unknown";
}
