import * as ts from "typescript";
import type { BlockAnalyzer } from "./analyzer";

/**
 * Core types for block analysis and transformation
 */

export interface DependencyInfo {
    name: string;
    type?: ts.TypeNode;
    sourceNode?: ts.Node; // The original node where this dependency was found
}

export interface BlockInfo {
    id: string;
    staticProps: string[];
    dynamicProps: string[];
    hasDynamicChildren: boolean;
    isStatic: boolean;
    dependencies: string[];
    dependencyTypes?: Map<string, DependencyInfo>; // Enhanced dependency tracking with types
}

export interface PropInfo {
    name: string;
    value: ts.Expression;
    isStatic: boolean;
}

/**
 * Information about a static element that can be extracted to module level
 */
export interface StaticElementInfo {
    id: string;
    tagName: string;
    propsTableId: string;
    children: ts.Expression[];
    element: ts.CallExpression;
    instanceFactoryId?: string;
}

export interface TransformResult {
    element: ts.Expression;
    needsRuntimeImport: boolean;
    staticPropsTable?: { id: string; props: PropInfo[] };
    staticElement?: StaticElementInfo;
    staticInstanceFactoryId?: string;
}

/**
 * Edit types for fine-grained updates (similar to Million.js)
 */
export const enum EditType {
    Attribute = 1,
    Child = 2,
    Event = 4,
    Style = 8,
}

export interface PropEdit {
    type: EditType;
    propName: string;
    dependencyKey: string; // Which dependency this edit depends on
    path?: number[]; // Path to the element in the tree (for nested elements)
}

export interface ChildEdit {
    type: EditType.Child;
    index: number;
    dependencyKey: string;
    path?: number[];
}

export interface PatchInstruction {
    elementPath: number[]; // Path to the element in the component tree
    edits: (PropEdit | ChildEdit)[];
}

export interface FinePatchBlockInfo extends BlockInfo {
    patchInstructions: PatchInstruction[];
    elementPaths: Map<ts.Node, number[]>; // Map JSX nodes to their paths
}

export interface OptimizationContext {
    typeChecker: ts.TypeChecker;
    context: ts.TransformationContext;
    blockCounter: number;
    generatedBlocks: Set<string>;
    blockFunctions: Map<string, ts.FunctionDeclaration>;
    staticPropsTables: Map<string, PropInfo[]>;
    staticElements: Map<string, StaticElementInfo>;
    blockAnalyzer?: BlockAnalyzer;
    /** Set of function/component names that should be skipped due to @undecillion decorator */
    skipTransformFunctions: Set<string>;
    /** Stack of current function context to track if we're inside a skip function */
    functionContextStack: string[];
    /** Map of tag names to Roblox instance names */
    tagToInstanceNameMap: Map<string, string>;
}
