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
        const lowerDep = dep.toLowerCase();

        // Exact Roblox type matches (highest priority)
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
        } 
        // Exact Roblox UI property matches
        else if (dep === 'AnchorPoint' || dep === 'Position' || dep === 'Size') {
            typeNode = ts.factory.createTypeReferenceNode(
                ts.factory.createIdentifier('UDim2'),
                undefined
            );
        } else if (dep === 'AbsolutePosition' || dep === 'AbsoluteSize' || dep === 'MousePosition') {
            typeNode = ts.factory.createTypeReferenceNode(
                ts.factory.createIdentifier('Vector2'),
                undefined
            );
        } else if (dep === 'BackgroundColor3' || dep === 'TextColor3' || dep === 'BorderColor3') {
            typeNode = ts.factory.createTypeReferenceNode(
                ts.factory.createIdentifier('Color3'),
                undefined
            );
        } else if (dep === 'TextScaled' || dep === 'AutoButtonColor' || dep === 'ClipsDescendants') {
            typeNode = ts.factory.createKeywordTypeNode(ts.SyntaxKind.BooleanKeyword);
        }
        // Roblox Instance types (check before string patterns to avoid conflicts with "label")
        else if (/^(frame|textlabel|textbutton|textbox|imagelabel|imagebutton|scrollingframe|uipadding|uilayout|uigridlayout|uilistlayout)$/i.test(dep)) {
            // Instance names should be Instance types
            const instanceTypeName = dep.charAt(0).toUpperCase() + dep.slice(1);
            typeNode = ts.factory.createTypeReferenceNode(
                ts.factory.createIdentifier(instanceTypeName),
                undefined
            );
        }
        // Boolean patterns (check before string patterns to avoid conflicts with "selected", "focused", "update")
        else if (dep.startsWith('is') || dep.startsWith('has') || dep.startsWith('can') || 
                 dep.startsWith('should') || dep.startsWith('will') ||
                 lowerDep.includes('visible') || lowerDep.includes('enabled') || lowerDep.includes('active') || 
                 lowerDep.includes('disabled') || lowerDep.includes('selected') || lowerDep.includes('checked') || 
                 lowerDep.includes('focused') || lowerDep.includes('hovered') || lowerDep.includes('loading') || 
                 lowerDep.includes('open') || lowerDep.includes('closed')) {
            typeNode = ts.factory.createKeywordTypeNode(ts.SyntaxKind.BooleanKeyword);
        }
        // Array/Collection patterns (check before other patterns to avoid conflicts)
        else if (/^(items|children|elements|nodes|components)$/i.test(dep) || 
                 lowerDep.includes('list') || lowerDep.includes('array') || 
                 (dep.endsWith('s') && !lowerDep.includes('text') && !lowerDep.includes('name') && 
                  !lowerDep.includes('class') && !lowerDep.includes('visible') && !lowerDep.includes('enabled') && 
                  !lowerDep.includes('active') && !dep.startsWith('is') && !dep.startsWith('has'))) {
            typeNode = ts.factory.createArrayTypeNode(
                ts.factory.createKeywordTypeNode(ts.SyntaxKind.UnknownKeyword)
            );
        }
        // React/Component patterns (before string patterns to avoid conflicts)
        else if (/^(component|element|node|reactElement)$/i.test(dep)) {
            typeNode = ts.factory.createTypeReferenceNode(
                ts.factory.createIdentifier('ReactElement'),
                undefined
            );
        } else if (lowerDep.includes('ref')) {
            typeNode = ts.factory.createTypeReferenceNode(
                ts.factory.createIdentifier('Ref'),
                [ts.factory.createKeywordTypeNode(ts.SyntaxKind.UnknownKeyword)]
            );
        }
        // Function patterns (check specific patterns first)
        else if (lowerDep.includes('click') || lowerDep.includes('button') || lowerDep.includes('action')) {
            // Mouse event handlers
            typeNode = ts.factory.createFunctionTypeNode(
                undefined,
                [ts.factory.createParameterDeclaration(
                    undefined,
                    undefined,
                    ts.factory.createIdentifier('event'),
                    undefined,
                    ts.factory.createTypeReferenceNode(
                        ts.factory.createIdentifier('InputObject'),
                        undefined
                    ),
                    undefined
                )],
                ts.factory.createKeywordTypeNode(ts.SyntaxKind.VoidKeyword)
            );
        } else if (lowerDep.includes('change') || lowerDep.includes('update') || lowerDep.includes('edit')) {
            // Change event handlers
            typeNode = ts.factory.createFunctionTypeNode(
                undefined,
                [ts.factory.createParameterDeclaration(
                    undefined,
                    undefined,
                    ts.factory.createIdentifier('newValue'),
                    undefined,
                    ts.factory.createKeywordTypeNode(ts.SyntaxKind.UnknownKeyword),
                    undefined
                )],
                ts.factory.createKeywordTypeNode(ts.SyntaxKind.VoidKeyword)
            );
        } else if (lowerDep.includes('ment') || lowerDep.includes('handler') || 
                   dep.endsWith('ment') || lowerDep.includes('callback') || lowerDep.includes('listener') || 
                   lowerDep.includes('event') || dep.startsWith('on') || dep.startsWith('handle') || 
                   lowerDep.includes('trigger')) {
            // Generic event handlers
            typeNode = ts.factory.createFunctionTypeNode(
                undefined,
                [],
                ts.factory.createKeywordTypeNode(ts.SyntaxKind.VoidKeyword)
            );
        }
        // Roblox Enum patterns
        else if (lowerDep.includes('enum') || /^(Font|TextXAlignment|TextYAlignment|SizeConstraint|AutomaticSize)$/i.test(dep)) {
            typeNode = ts.factory.createTypeReferenceNode(
                ts.factory.createIdentifier('Enum'),
                undefined
            );
        }
        // Number patterns
        else if (lowerDep.includes('count') || lowerDep.includes('number') || lowerDep.includes('size') || lowerDep.includes('position') ||
                 lowerDep.includes('width') || lowerDep.includes('height') || lowerDep.includes('offset') || lowerDep.includes('scale') ||
                 lowerDep.includes('rotation') || lowerDep.includes('transparency') || lowerDep.includes('index') || lowerDep.includes('length')) {
            typeNode = ts.factory.createKeywordTypeNode(ts.SyntaxKind.NumberKeyword);
        }
        // String patterns
        else if (lowerDep.includes('text') || lowerDep.includes('name') || lowerDep.includes('title') || lowerDep.includes('label') ||
                 lowerDep.includes('content') || lowerDep.includes('message') || lowerDep.includes('description') || lowerDep.includes('placeholder') ||
                 lowerDep.includes('id') || lowerDep.includes('key') || lowerDep.includes('tag') || lowerDep.includes('font')) {
            typeNode = ts.factory.createKeywordTypeNode(ts.SyntaxKind.StringKeyword);
        }
        // State patterns (only match specific state-like patterns, not arbitrary "data")
        else if (lowerDep.includes('state') || lowerDep === 'data' || lowerDep.includes('model') || lowerDep.includes('store') || 
                 lowerDep.includes('appdata') || lowerDep.includes('userdata') || lowerDep.includes('gamedata')) {
            typeNode = ts.factory.createTypeReferenceNode(
                ts.factory.createIdentifier('Record'),
                [
                    ts.factory.createKeywordTypeNode(ts.SyntaxKind.StringKeyword),
                    ts.factory.createKeywordTypeNode(ts.SyntaxKind.UnknownKeyword)
                ]
            );
        }
        // Default to unknown instead of any for better type safety
        else {
            typeNode = ts.factory.createKeywordTypeNode(ts.SyntaxKind.UnknownKeyword);
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
