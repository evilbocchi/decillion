import * as ts from "typescript";
import type { BlockInfo } from "./analyzer";
import {
    createMemoizedArrowFunction,
    createMemoizedBlockCall,
    createPropsObject,
    createStaticElementCall,
    generateBlockId,
    generateStaticPropsId
} from "./codegen";
import type { OptimizationContext, PropInfo, TransformResult } from "./types";

/**
 * Creates the appropriate tag reference for React.createElement
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
 * Core block transformation logic
 * Following Million.js pattern using the existing BlockAnalyzer
 */

/**
 * Main transformer class that consolidates all transformation logic
 */
export class DecillionTransformer {
    private context: OptimizationContext;

    constructor(
        typeChecker: ts.TypeChecker,
        transformationContext: ts.TransformationContext,
        blockAnalyzer: any
    ) {
        this.context = {
            typeChecker,
            context: transformationContext,
            blockCounter: 0,
            generatedBlocks: new Set<string>(),
            blockFunctions: new Map<string, ts.FunctionDeclaration>(),
            staticPropsTables: new Map<string, PropInfo[]>(),
            blockAnalyzer,
            skipTransformFunctions: new Set<string>(),
            functionContextStack: []
        };
    }

    /**
     * Analyzes a JSX element using the existing BlockAnalyzer
     */
    analyzeJsxElement(
        node: ts.JsxElement | ts.JsxSelfClosingElement
    ): BlockInfo {
        // Use the existing BlockAnalyzer for analysis
        if (!this.context.blockAnalyzer) {
            throw new Error("BlockAnalyzer not provided in context");
        }

        return this.context.blockAnalyzer.analyzeJsxElement(node);
    }

    /**
     * Gets the optimization context for external access
     */
    getContext(): OptimizationContext {
        return this.context;
    }
}

/**
 * Transforms a JSX element into optimized code using BlockAnalyzer
 */
export function transformJsxElement(
    node: ts.JsxElement | ts.JsxSelfClosingElement,
    context: OptimizationContext
): TransformResult {
    const transformer = new DecillionTransformer(
        context.typeChecker,
        context.context,
        context.blockAnalyzer
    );
    
    const blockInfo = transformer.analyzeJsxElement(node);
    const tagName = context.blockAnalyzer!.getJsxTagName(node);

    if (blockInfo.isStatic) {
        return generateStaticElement(node, tagName, context);
    }

    if (context.blockAnalyzer!.shouldMemoizeBlock(blockInfo)) {
        return generateMemoizedBlock(node, blockInfo, tagName, context);
    }

    return generateOptimizedElement(node, tagName, context);
}

/**
 * Generates a static element with extracted props table
 */
function generateStaticElement(
    node: ts.JsxElement | ts.JsxSelfClosingElement,
    tagName: string,
    context: OptimizationContext
): TransformResult {
    const staticProps = extractPropsFromJsx(node, true);
    const children = extractStaticChildren(node, context);

    let propsArg: ts.Expression;
    let staticPropsTable: { id: string; props: PropInfo[]; } | undefined;

    if (staticProps.length > 0) {
        const propsId = generateStaticPropsId(tagName);
        staticPropsTable = { id: propsId, props: staticProps };
        context.staticPropsTables.set(propsId, staticProps);
        propsArg = ts.factory.createIdentifier(propsId);
    } else {
        propsArg = ts.factory.createIdentifier("undefined");
    }

    return {
        element: createStaticElementCall(tagName, propsArg, children),
        needsRuntimeImport: true,
        staticPropsTable
    };
}

/**
 * Generates a memoized block
 */
function generateMemoizedBlock(
    node: ts.JsxElement | ts.JsxSelfClosingElement,
    blockInfo: BlockInfo,
    tagName: string,
    context: OptimizationContext
): TransformResult {
    const blockId = generateBlockId(tagName);
    const allProps = extractPropsFromJsx(node);
    const children = extractOptimizedChildren(node, context);

    // Create the React.createElement call inside the arrow function
    const createElementCall = ts.factory.createCallExpression(
        ts.factory.createPropertyAccessExpression(
            ts.factory.createIdentifier("React"),
            ts.factory.createIdentifier("createElement")
        ),
        undefined,
        [
            createTagReference(tagName),
            allProps.length > 0 ? createPropsObject(allProps) : ts.factory.createIdentifier("undefined"),
            ...children
        ]
    );

    const arrowFunction = createMemoizedArrowFunction(blockInfo.dependencies, createElementCall);

    return {
        element: createMemoizedBlockCall(arrowFunction, blockInfo.dependencies, blockId),
        needsRuntimeImport: true
    };
}

/**
 * Generates an optimized element without full memoization
 */
function generateOptimizedElement(
    node: ts.JsxElement | ts.JsxSelfClosingElement,
    tagName: string,
    context: OptimizationContext
): TransformResult {
    const allProps = extractPropsFromJsx(node);
    const children = extractOptimizedChildren(node, context);

    const propsArg = allProps.length > 0 ?
        createPropsObject(allProps) :
        ts.factory.createIdentifier("undefined");

    const element = ts.factory.createCallExpression(
        ts.factory.createPropertyAccessExpression(
            ts.factory.createIdentifier("React"),
            ts.factory.createIdentifier("createElement")
        ),
        undefined,
        [
            createTagReference(tagName),
            propsArg,
            ...children
        ]
    );

    return {
        element,
        needsRuntimeImport: false
    };
}

/**
 * Extracts static children from JSX element
 */
function extractStaticChildren(
    node: ts.JsxElement | ts.JsxSelfClosingElement,
    context: OptimizationContext
): ts.Expression[] {
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
            const childResult = transformJsxElement(child, context);
            if (childResult.staticPropsTable) {
                // Store static props table for child
                context.staticPropsTables.set(
                    childResult.staticPropsTable.id,
                    childResult.staticPropsTable.props
                );
            }
            children.push(childResult.element);
        }
    }

    return children;
}

/**
 * Extracts and optimizes children from JSX element
 */
function extractOptimizedChildren(
    node: ts.JsxElement | ts.JsxSelfClosingElement,
    context: OptimizationContext
): ts.Expression[] {
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
            const childResult = transformJsxElement(child, context);
            if (childResult.staticPropsTable) {
                context.staticPropsTables.set(
                    childResult.staticPropsTable.id,
                    childResult.staticPropsTable.props
                );
            }
            children.push(childResult.element);
        } else if (ts.isJsxExpression(child) && child.expression) {
            children.push(child.expression);
        }
    }

    return children;
}

/**
 * Extracts props from JSX element, categorizing them as static or dynamic
 */
function extractPropsFromJsx(
    node: ts.JsxElement | ts.JsxSelfClosingElement,
    onlyStatic = false
): PropInfo[] {
    const props: PropInfo[] = [];
    const attributes = getJsxAttributes(node);

    for (const attr of attributes) {
        if (ts.isJsxAttribute(attr) && attr.initializer) {
            const propName = ts.isIdentifier(attr.name) ? attr.name.text : attr.name.getText();

            if (ts.isStringLiteral(attr.initializer)) {
                // String literal props are static
                props.push({
                    name: propName,
                    value: attr.initializer,
                    isStatic: true
                });
            } else if (ts.isJsxExpression(attr.initializer) && attr.initializer.expression) {
                // Check if the JSX expression contains a static value
                const isStatic = isStaticExpression(attr.initializer.expression);
                if (!onlyStatic || isStatic) {
                    props.push({
                        name: propName,
                        value: attr.initializer.expression,
                        isStatic
                    });
                }
            }
        }
    }

    return props;
}

/**
 * Gets JSX attributes from either JsxElement or JsxSelfClosingElement
 */
function getJsxAttributes(node: ts.JsxElement | ts.JsxSelfClosingElement): ts.NodeArray<ts.JsxAttributeLike> {
    if (ts.isJsxElement(node)) {
        return node.openingElement.attributes.properties;
    }
    return node.attributes.properties;
}

/**
 * Determines if an expression contains only static values
 */
function isStaticExpression(expr: ts.Expression): boolean {
    if (ts.isStringLiteral(expr) || ts.isNumericLiteral(expr) ||
        ts.isBooleanLiteral(expr) || expr.kind === ts.SyntaxKind.NullKeyword) {
        return true;
    }

    if (ts.isCallExpression(expr)) {
        const callExpr = expr.expression;
        // Allow certain known static calls (like Color3.fromRGB, UDim2.new, Vector2.new)
        if (ts.isPropertyAccessExpression(callExpr)) {
            const objName = ts.isIdentifier(callExpr.expression) ? callExpr.expression.text : "";
            const methodName = ts.isIdentifier(callExpr.name) ? callExpr.name.text : "";

            if ((objName === "Color3" && (methodName === "fromRGB" || methodName === "new")) ||
                (objName === "UDim2" && methodName === "new") ||
                (objName === "Vector2" && methodName === "new") ||
                (objName === "Vector3" && methodName === "new")) {
                // Check if all arguments are static
                return expr.arguments.every(arg => isStaticExpression(arg as ts.Expression));
            }
        }

        // Allow new expressions for Roblox constructors
        if (ts.isIdentifier(callExpr)) {
            const constructorName = callExpr.text;
            if (constructorName === "Color3" || constructorName === "UDim2" ||
                constructorName === "Vector2" || constructorName === "Vector3") {
                return expr.arguments.every(arg => isStaticExpression(arg as ts.Expression));
            }
        }

        return false;
    }

    // Handle new expressions (new Color3(), new Vector2(), etc.)
    if (ts.isNewExpression(expr)) {
        if (ts.isIdentifier(expr.expression)) {
            const constructorName = expr.expression.text;
            if (constructorName === "Color3" || constructorName === "UDim2" ||
                constructorName === "Vector2" || constructorName === "Vector3") {
                return expr.arguments ? expr.arguments.every(arg => isStaticExpression(arg as ts.Expression)) : true;
            }
        }
        return false;
    }

    if (ts.isTemplateExpression(expr)) {
        // Template expressions with variables are dynamic
        return false;
    }

    if (ts.isIdentifier(expr) || ts.isPropertyAccessExpression(expr)) {
        // Variable references are dynamic
        return false;
    }

    return false;
}

/**
 * Utility functions for @undecillion decorator detection
 */

/**
 * Checks if a function has the @undecillion decorator or comment
 */
export function hasUndecillionDecorator(node: ts.FunctionDeclaration | ts.FunctionExpression | ts.ArrowFunction | ts.MethodDeclaration): boolean {
    // Get the source file and text
    const sourceFile = node.getSourceFile();
    if (!sourceFile) {
        return false;
    }

    const fullText = sourceFile.getFullText();
    
    // For arrow functions, we need to find the top-level statement that contains the comment
    let checkNode: ts.Node = node;
    if (ts.isArrowFunction(node)) {
        // Navigate up to find the VariableStatement which contains the leading comments
        let parent = node.parent;
        if (ts.isVariableDeclaration(parent)) {
            parent = parent.parent; // VariableDeclarationList
            if (ts.isVariableDeclarationList(parent)) {
                parent = parent.parent; // VariableStatement
                if (ts.isVariableStatement(parent)) {
                    checkNode = parent;
                }
            }
        }
    }
    
    // Get the start position of the node (including leading trivia like comments)
    const nodeStart = checkNode.getFullStart();
    const nodePos = checkNode.getStart(sourceFile);
    
    // Look for @undecillion in the text before the actual node start
    const textBeforeNode = fullText.substring(nodeStart, nodePos);
    
    // Also check a reasonable amount of text before the full start
    const contextStart = Math.max(0, nodeStart - 500); // Look back up to 500 characters
    const contextText = fullText.substring(contextStart, nodePos);
    
    // Check if @undecillion appears in comments before the function
    const hasUndecillionMarker = contextText.includes('@undecillion') || textBeforeNode.includes('@undecillion');
    
    if (hasUndecillionMarker) {
        // Ensure it's in a comment context, not just random text
        const lines = contextText.split('\n');
        
        for (let i = lines.length - 1; i >= 0; i--) {
            const line = lines[i].trim();
            
            // Check if this line contains @undecillion in a comment context
            if (line.includes('@undecillion')) {
                // Verify it's in a comment (starts with //, /*, or is part of JSDoc)
                if (line.startsWith('//') || 
                    line.startsWith('/*') || 
                    line.startsWith('*') ||
                    line.includes('* @undecillion') ||
                    line.match(/^\s*@undecillion/)) {
                    return true;
                }
            }
            
            // Stop searching if we hit actual code (non-comment, non-whitespace)
            if (line && 
                !line.startsWith('//') && 
                !line.startsWith('/*') && 
                !line.startsWith('*') && 
                !line.startsWith('@') &&
                !line.match(/^\s*$/)) {
                break;
            }
        }
    }

    return false;
}

/**
 * Gets the function name for tracking purposes
 */
export function getFunctionName(node: ts.FunctionDeclaration | ts.FunctionExpression | ts.ArrowFunction | ts.MethodDeclaration): string | undefined {
    if (ts.isFunctionDeclaration(node) && node.name) {
        return node.name.text;
    }
    
    if (ts.isMethodDeclaration(node) && ts.isIdentifier(node.name)) {
        return node.name.text;
    }
    
    // For function expressions and arrow functions, try to get name from variable declaration
    if (!node.parent) {
        return undefined;
    }
    
    const parent = node.parent;
    if (ts.isVariableDeclaration(parent) && ts.isIdentifier(parent.name)) {
        return parent.name.text;
    }
    
    if (ts.isPropertyAssignment(parent) && ts.isIdentifier(parent.name)) {
        return parent.name.text;
    }
    
    return undefined;
}

/**
 * Checks if we're currently inside a function that should skip transformation
 */
export function shouldSkipTransformation(context: OptimizationContext): boolean {
    return context.functionContextStack.some(functionName => 
        context.skipTransformFunctions.has(functionName)
    );
}
