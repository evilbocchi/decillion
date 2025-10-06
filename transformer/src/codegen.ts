import * as ts from "typescript";
import type { PropInfo } from "./types";

/**
 * Code generation utilities for creating optimized blocks
 * Following Million.js pattern of separating code generation
 */

/**
 * Creates a props object from prop array
 */
export function createPropsObject(props: PropInfo[]): ts.ObjectLiteralExpression {
    const properties = props.map((prop) =>
        ts.factory.createPropertyAssignment(ts.factory.createIdentifier(prop.name), prop.value),
    );

    return ts.factory.createObjectLiteralExpression(properties, true);
}

/**
 * Creates dependencies array for memoization
 */
export function createDependenciesArray(dependencies: string[]): ts.ArrayLiteralExpression {
    const elements = dependencies.map((dep) => ts.factory.createIdentifier(dep));

    return ts.factory.createArrayLiteralExpression(elements, false);
}

/**
 * Generates a unique static element identifier
 */
export function generateStaticElementId(tagName: string): string {
    return `STATIC_ELEMENT_${tagName.toUpperCase()}_${Math.random().toString(36).substr(2, 6)}`;
}

/**
 * Generates a unique static props table identifier
 */
export function generateStaticPropsId(tagName: string): string {
    return `STATIC_PROPS_${tagName.toUpperCase()}_${Math.random().toString(36).substr(2, 6)}`;
}

/**
 * Generates a unique block identifier
 */
export function generateBlockId(tagName: string): string {
    return `dynamic_${tagName}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Generates a unique static instance factory identifier
 */
export function generateStaticInstanceFactoryId(tagName: string): string {
    return `STATIC_INSTANCE_${tagName.toUpperCase()}_${Math.random().toString(36).substr(2, 6)}`;
}

/**
 * Creates the appropriate tag reference for React calls
 * - Lowercase tags (frame, textlabel) become string literals
 * - PascalCase tags (Counter, MyComponent) become identifiers
 */
function createTagReference(tagName: string, tagToInstanceNameMap: Map<string, string>): ts.Expression {
    // Check if tag name starts with uppercase (PascalCase component)
    if (tagName[0] && tagName[0] === tagName[0].toUpperCase()) {
        // React component - use identifier
        return ts.factory.createIdentifier(tagName);
    } else {
        // HTML-like element - use string literal
        return ts.factory.createStringLiteral(tagToInstanceNameMap.get(tagName.toLowerCase()) || tagName);
    }
}

/**
 * Creates a call to createStaticElement
 */
export function createStaticElementCall(
    tagName: string,
    propsArg: ts.Expression,
    children: ts.Expression[] = [],
    tagToInstanceNameMap: Map<string, string>,
): ts.CallExpression {
    return ts.factory.createCallExpression(ts.factory.createIdentifier("createStaticElement"), undefined, [
        createTagReference(tagName, tagToInstanceNameMap),
        propsArg,
        ...children,
    ]);
}

/**
 * Creates a call to useMemoizedBlock
 */
export function createMemoizedBlockCall(
    blockFunction: ts.ArrowFunction,
    dependencies: string[],
    blockId: string,
): ts.CallExpression {
    return ts.factory.createCallExpression(ts.factory.createIdentifier("useMemoizedBlock"), undefined, [
        blockFunction,
        createDependenciesArray(dependencies),
        ts.factory.createStringLiteral(blockId),
    ]);
}
