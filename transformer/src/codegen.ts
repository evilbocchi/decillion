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
export function createDependenciesArray(dependencies: string[]): ts.ArrayLiteralExpression {
    const elements = dependencies.map(dep =>
        ts.factory.createIdentifier(dep)
    );

    return ts.factory.createArrayLiteralExpression(elements, false);
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
 * Creates the appropriate tag reference for React calls
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

/**
 * Creates a call to createStaticElement
 */
export function createStaticElementCall(
    tagName: string,
    propsArg: ts.Expression,
    children: ts.Expression[] = []
): ts.CallExpression {
    return ts.factory.createCallExpression(
        ts.factory.createIdentifier("createStaticElement"),
        undefined,
        [
            createTagReference(tagName),
            propsArg,
            ...children
        ]
    );
}

/**
 * Creates a call to useMemoizedBlock
 */
export function createMemoizedBlockCall(
    blockFunction: ts.ArrowFunction,
    dependencies: string[],
    blockId: string
): ts.CallExpression {
    return ts.factory.createCallExpression(
        ts.factory.createIdentifier("useMemoizedBlock"),
        undefined,
        [
            blockFunction,
            createDependenciesArray(dependencies),
            ts.factory.createStringLiteral(blockId)
        ]
    );
}

/**
 * Creates parameter declarations with proper type annotations
 */
export function createParametersWithTypes(dependencies: string[]): ts.ParameterDeclaration[] {
    return dependencies.map(dep => {
        let typeNode: ts.TypeNode | undefined;

        // Common Roblox types we can infer
        if (dep === 'Color3') {
            typeNode = ts.factory.createTypeReferenceNode(
                ts.factory.createIdentifier('Color3Constructor'),
                undefined
            );
        } else if (dep === 'UDim2') {
            typeNode = ts.factory.createTypeReferenceNode(
                ts.factory.createIdentifier('UDim2Constructor'),
                undefined
            );
        } else if (dep === 'Vector2' || dep === 'Vector3') {
            typeNode = ts.factory.createTypeReferenceNode(
                ts.factory.createIdentifier(dep + 'Constructor'),
                undefined
            );
        } else if (dep.includes('count') || dep.includes('number') || dep.includes('size') || dep.includes('position')) {
            typeNode = ts.factory.createKeywordTypeNode(ts.SyntaxKind.NumberKeyword);
        } else if (dep.includes('text') || dep.includes('name') || dep.includes('title')) {
            typeNode = ts.factory.createKeywordTypeNode(ts.SyntaxKind.StringKeyword);
        } else if (dep.includes('visible') || dep.includes('enabled') || dep.includes('active')) {
            typeNode = ts.factory.createKeywordTypeNode(ts.SyntaxKind.BooleanKeyword);
        } else if (dep.includes('ment') || dep.includes('click') || dep.includes('handler') || dep.endsWith('ment') || dep.includes('callback')) {
            // Function dependencies (event handlers like increment, decrement)
            typeNode = ts.factory.createFunctionTypeNode(
                undefined,
                [],
                ts.factory.createKeywordTypeNode(ts.SyntaxKind.VoidKeyword)
            );
        } else {
            typeNode = ts.factory.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword);
        }

        return ts.factory.createParameterDeclaration(
            undefined,
            undefined,
            ts.factory.createIdentifier(dep),
            undefined,
            typeNode,
            undefined
        );
    });
}

/**
 * Creates arrow function for memoized blocks
 */
export function createMemoizedArrowFunction(
    dependencies: string[],
    body: ts.Expression
): ts.ArrowFunction {
    return ts.factory.createArrowFunction(
        undefined,
        undefined,
        createParametersWithTypes(dependencies),
        undefined,
        ts.factory.createToken(ts.SyntaxKind.EqualsGreaterThanToken),
        body
    );
}
