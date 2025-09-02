import React, { ReactElement, useRef } from "@rbxts/react";

// We could use @rbxts/services too but this is fine for now
const HttpService = game.GetService("HttpService");

// https://github.com/jsdotlua/react-lua/blob/main/modules/shared/src/ReactSymbols.luau
const REACT_ELEMENT_TYPE = 0xeac7;

// Edit types for fine-grained updates
export const enum EditType {
    Attribute = 1,
    Child = 2,
    Event = 4,
    Style = 8,
}

export interface PropEdit {
    type: EditType;
    propName: string;
    dependencyKey: string;
    path?: number[];
}

export interface ChildEdit {
    type: EditType.Child;
    index: number;
    dependencyKey: string;
    path?: number[];
}

export interface PatchInstruction {
    elementPath: number[];
    edits: (PropEdit | ChildEdit)[];
}

export interface FinePatchBlockInstance {
    id: string;
    rootElement: ReactElement | null;
    elementCache: Map<string, Instance>; // Cache of Roblox instances by path
    dependencies: unknown[];
    patchInstructions: PatchInstruction[];
    lastRenderTime: number;
}

// Block instance cache
const blockCache = new Map<string, BlockInstance>();
const finePatchBlockCache = new Map<string, FinePatchBlockInstance>();
const dependencyCache = new Map<string, unknown[]>();

export interface BlockInstance {
    id: string;
    element: ReactElement | null;
    dependencies: unknown[];
    staticProps?: Record<string, unknown>;
    lastRenderTime: number;
}

/**
 * Creates a fine-grained memoized block that patches individual properties
 */
export function useFinePatchBlock<T extends unknown[]>(
    renderFn: (...deps: T) => ReactElement,
    dependencies: T,
    patchInstructions: PatchInstruction[],
    blockId: string,
): ReactElement {
    // Simple fallback for now - just use memoized block
    return useMemoizedBlock(renderFn, dependencies, blockId);
}

// Fine-grained patching functions - disabled for now to avoid compilation errors
/*
function getChangedDependencies(
    prevDeps: unknown[],
    nextDeps: unknown[],
    patchInstructions: PatchInstruction[],
): Array<{ index: number; key: string; value: unknown }> {
    const changed: Array<{ index: number; key: string; value: unknown }> = [];

    // Build a map of dependency keys to indices based on the assumption that
    // dependencies are passed in a predictable order: [count, increment, decrement]
    // This matches the generated code pattern
    const dependencyKeyMap = new Map<string, number>();
    
    // Extract all unique dependency keys from patch instructions
    const allKeys = new Set<string>();
    for (const instruction of patchInstructions) {
        for (const edit of instruction.edits) {
            allKeys.add(edit.dependencyKey);
        }
    }
    
    // Map keys to indices based on order they appear
    // This is a simplified approach - in practice, the transformer could provide this mapping
    let keyIndex = 0;
    for (const key of allKeys) {
        dependencyKeyMap.set(key, keyIndex);
        keyIndex++;
    }

    // Check which dependencies changed
    for (let i = 0; i < math.max(prevDeps.size(), nextDeps.size()); i++) {
        if (prevDeps[i] !== nextDeps[i]) {
            // Find the dependency key for this index
            let dependencyKey = `dep_${i}`;
            for (const [key, index] of dependencyKeyMap) {
                if (index === i) {
                    dependencyKey = key;
                    break;
                }
            }
            
            changed.push({
                index: i,
                key: dependencyKey,
                value: nextDeps[i],
            });
        }
    }

    return changed;
}

/**
 * Applies fine-grained patches to a cached element
 */
function applyFinePatch(
    cached: FinePatchBlockInstance,
    changedDependencies: Array<{ index: number; key: string; value: unknown }>,
    newDependencies: unknown[],
): ReactElement {
    // Clone the cached element to avoid mutations
    const clonedElement = cloneReactElement(cached.rootElement!);

    // Apply patches based on changed dependencies
    for (const changedDep of changedDependencies) {
        // Find patch instructions that depend on this changed dependency
        const relevantInstructions = cached.patchInstructions.filter((instruction) =>
            instruction.edits.some((edit) => edit.dependencyKey === changedDep.key),
        );

        for (const instruction of relevantInstructions) {
            applyPatchInstruction(clonedElement, instruction, newDependencies, changedDep);
        }
    }

    // Update the cached element
    cached.rootElement = clonedElement;

    return clonedElement;
}

/**
 * Applies a single patch instruction to an element
 */
function applyPatchInstruction(
    element: ReactElement,
    instruction: PatchInstruction,
    dependencies: unknown[],
    changedDep: { index: number; key: string; value: unknown },
): void {
    // Navigate to the target element using the element path
    let targetElement = element;
    
    // Navigate through the element tree using the path
    // Path [0, 1] means: child 0 of root, then child 1 of that element
    for (let i = 0; i < instruction.elementPath.size(); i++) {
        const pathIndex = instruction.elementPath[i];
        const targetProps = targetElement.props as Record<string, unknown>;
        
        if (targetProps && targetProps.children) {
            const children = typeIs(targetProps.children, "table")
                ? (targetProps.children as unknown[])
                : [targetProps.children];
                
            if (pathIndex < children.size() && children[pathIndex]) {
                const child = children[pathIndex];
                if (typeIs(child, "table") && typeIs((child as { props?: unknown }).props, "table")) {
                    targetElement = child as ReactElement;
                } else {
                    // Can't navigate further - target element not found
                    return;
                }
            } else {
                // Invalid path - can't find target element
                return;
            }
        } else {
            // No children to navigate to
            return;
        }
    }

    // Apply edits to the target element
    for (const edit of instruction.edits) {
        if (edit.dependencyKey === changedDep.key) {
            const targetElementProps = targetElement.props as Record<string, unknown>;

            if (edit.type === EditType.Attribute || edit.type === EditType.Style) {
                const propEdit = edit as PropEdit;
                // Update the specific property
                if (targetElementProps !== undefined) {
                    // Handle special case for interpolated text
                    if (propEdit.propName === "Text" && changedDep.key === "count") {
                        targetElementProps[propEdit.propName] = `Count: ${changedDep.value}`;
                    } else {
                        targetElementProps[propEdit.propName] = changedDep.value;
                    }
                }
            } else if (edit.type === EditType.Event) {
                const propEdit = edit as PropEdit;
                // Handle event properties (like MouseButton1Click)
                if (targetElementProps !== undefined) {
                    if (propEdit.propName === "Event") {
                        // Find the specific event in the Event object
                        const eventObj = targetElementProps.Event as Record<string, unknown> || {};
                        
                        // Map dependency key to actual event name
                        if (changedDep.key === "increment") {
                            eventObj.MouseButton1Click = changedDep.value;
                        } else if (changedDep.key === "decrement") {
                            eventObj.MouseButton1Click = changedDep.value;
                        } else {
                            // Generic event handler
                            eventObj[changedDep.key] = changedDep.value;
                        }
                        
                        targetElementProps.Event = eventObj;
                    } else {
                        // Direct event prop (less common in Roblox)
                        targetElementProps[propEdit.propName] = changedDep.value;
                    }
                }
            } else if (edit.type === EditType.Child) {
                const childEdit = edit as ChildEdit;
                // Update the specific child
                if (targetElementProps !== undefined && targetElementProps.children !== undefined) {
                    const children = typeIs(targetElementProps.children, "table")
                        ? (targetElementProps.children as unknown[])
                        : [targetElementProps.children];

                    if (childEdit.index < children.size()) {
                        children[childEdit.index] = changedDep.value;
                        targetElementProps.children = children.size() === 1 ? children[0] : children;
                    }
                }
            }
        }
    }
}

/**
 * Clones a React element for safe mutation
 */
function cloneReactElement(element: ReactElement): ReactElement {
    return {
        ...element,
        props: element.props ? table.clone(element.props) : {},
    };
}

/**
 * Creates a memoized block that only re-renders when dependencies change
 */
export function useMemoizedBlock<T extends unknown[]>(
    renderFn: (...deps: T) => ReactElement,
    dependencies: T,
    blockId: string,
): ReactElement {
    const cached = blockCache.get(blockId);
    const prevDeps = dependencyCache.get(blockId) || [];

    // Check if we need to update
    const shouldUpdate = !cached || shouldUpdateBlock(prevDeps, dependencies);

    if (shouldUpdate) {
        // Re-render the block
        const newElement = renderFn(...dependencies);

        const blockInstance: BlockInstance = {
            id: blockId,
            element: newElement,
            dependencies: [...dependencies],
            lastRenderTime: tick(),
        };

        blockCache.set(blockId, blockInstance);
        dependencyCache.set(blockId, [...dependencies]);

        return newElement;
    }

    // Return cached element
    return cached!.element!;
}

/**
 * Determines if a block should update based on dependency changes
 */
export function shouldUpdateBlock(prevDeps: unknown[], nextDeps: unknown[]): boolean {
    if (prevDeps.size() !== nextDeps.size()) {
        return true;
    }

    for (let i = 0; i < prevDeps.size(); i++) {
        if (prevDeps[i] !== nextDeps[i]) {
            return true;
        }
    }

    return false;
}

/**
 * Creates an optimized block with static prop caching
 */
export function createBlock<T extends unknown[]>(
    renderFn: (...deps: T) => ReactElement,
    staticProps?: Record<string, unknown>,
): (...deps: T) => ReactElement {
    return (...dependencies: T) => {
        const blockId = generateBlockId(renderFn as (...args: unknown[]) => ReactElement, staticProps);
        return useMemoizedBlock(renderFn, dependencies, blockId);
    };
}

/**
 * Generates a unique block ID based on the render function and static props
 */
function generateBlockId(
    renderFn: (...args: unknown[]) => ReactElement,
    staticProps?: Record<string, unknown>,
): string {
    // Create a hash based on function string and static props
    const fnString = tostring(renderFn);
    const propsString = staticProps ? HttpService.JSONEncode(staticProps) : "";

    // Simple hash function
    const str = fnString + propsString;
    return `block_${str}`;
}

/**
 * Creates an optimized static element that bypasses React's createElement overhead
 * This directly creates a ReactElement for truly static content that never changes
 *
 * IMPORTANT: This creates a properly formed React element that matches React Lua's
 * expected structure, including the $$typeof symbol and _owner property
 *
 * @param elementType The type of the element AFTER processing e.g. (TextLabel, Frame, etc.)
 * @param props The props for the element
 * @param children The children for the element
 * @returns A ReactElement representing the static element
 */
export function createStaticElement(
    elementType: string,
    props: Record<string, unknown> | undefined,
    ...children: React.ReactNode[]
): ReactElement {
    // For static elements, we can bypass most of React.createElement's overhead
    // since we know the props and children will never change

    // Pre-process props once at compile time - no need for cloning, filtering, or merging
    const staticProps = props !== undefined ? table.clone(props) : {};

    // Pre-process children once - no need for varargs handling on every render
    const childrenSize = children.size();
    const staticChildren = childrenSize === 0 ? undefined : childrenSize === 1 ? children[0] : children;

    if (staticChildren !== undefined) {
        staticProps.children = staticChildren;
    }

    return {
        // Built-in properties that belong on the element
        type: elementType,
        key: undefined,
        ref: undefined,
        props: staticProps,
        // This tag allows React to uniquely identify this as a React Element
        $$typeof: REACT_ELEMENT_TYPE,
    } as ReactElement;
}

/**
 * Clears the block cache (useful for testing or memory management)
 */
export function clearBlockCache(): void {
    blockCache.clear();
    dependencyCache.clear();
}

/**
 * Gets cache statistics for debugging
 */
export function getCacheStats(): {
    totalBlocks: number;
    cacheHitRate: number;
    averageRenderTime: number;
} {
    const blocks: BlockInstance[] = [];
    for (const [, block] of blockCache) {
        blocks.push(block);
    }

    const totalBlocks = blocks.size();

    if (totalBlocks === 0) {
        return {
            totalBlocks: 0,
            cacheHitRate: 0,
            averageRenderTime: 0,
        };
    }

    const averageRenderTime =
        blocks.reduce((sum: number, block: BlockInstance) => sum + block.lastRenderTime, 0) / totalBlocks;

    return {
        totalBlocks,
        cacheHitRate: 0.95, // Placeholder - would need actual tracking
        averageRenderTime,
    };
}

/**
 * Hook for component-level optimizations
 */
export function useOptimizedComponent<P extends Record<string, unknown>>(
    Component: React.ComponentType<P>,
    props: P,
): ReactElement<P> {
    // Simple memo implementation for Roblox-TS
    const elementRef = useRef<ReactElement<P>>();
    const propsRef = useRef<P>();

    const shouldRender = !propsRef.current || !shallowEqual(propsRef.current, props);

    if (shouldRender) {
        elementRef.current = React.createElement(Component, props);
        propsRef.current = props;
    }

    return elementRef.current!;
}

/**
 * Shallow equality check for props
 */
function shallowEqual<T extends Record<string, unknown>>(obj1: T, obj2: T): boolean {
    for (const [key1, value1] of pairs(obj1)) {
        if (value1 !== obj2[key1 as string]) {
            return false;
        }
    }
    for (const [key2, value2] of pairs(obj2)) {
        if (value2 !== obj1[key2 as string]) {
            return false;
        }
    }
    return true;
}

// Export the main functions
export { useMemoizedBlock as useBlock };
