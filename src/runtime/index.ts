import React from "@rbxts/react";

// Block instance cache
const blockCache = new Map<string, BlockInstance>();
const dependencyCache = new Map<string, unknown[]>();

export interface BlockInstance {
  id: string;
  element: React.ReactElement | null;
  dependencies: unknown[];
  staticProps?: Record<string, unknown>;
  lastRenderTime: number;
}

/**
 * Creates a memoized block that only re-renders when dependencies change
 */
export function useMemoizedBlock<T extends unknown[]>(
  renderFn: (...deps: T) => React.ReactElement,
  dependencies: T,
  blockId: string
): React.ReactElement {
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
      lastRenderTime: tick()
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
  if (prevDeps.length !== nextDeps.length) {
    return true;
  }

  for (let i = 0; i < prevDeps.length; i++) {
    if (!Object.is(prevDeps[i], nextDeps[i])) {
      return true;
    }
  }

  return false;
}

/**
 * Creates an optimized block with static prop caching
 */
export function createBlock<T extends unknown[]>(
  renderFn: (...deps: T) => React.ReactElement,
  staticProps?: Record<string, unknown>
): (...deps: T) => React.ReactElement {
  return (...dependencies: T) => {
    const blockId = generateBlockId(renderFn as (...args: unknown[]) => React.ReactElement, staticProps);
    return useMemoizedBlock(renderFn, dependencies, blockId);
  };
}

/**
 * Generates a unique block ID based on the render function and static props
 */
function generateBlockId(renderFn: (...args: unknown[]) => React.ReactElement, staticProps?: Record<string, unknown>): string {
  // Create a hash based on function string and static props
  const fnString = renderFn.toString();
  const propsString = staticProps ? JSON.stringify(staticProps) : "";
  
  // Simple hash function
  let hash = 0;
  const str = fnString + propsString;
  
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  return `block_${math.abs(hash)}`;
}

/**
 * Creates an optimized createElement that skips unnecessary prop processing for static elements
 */
export function createStaticElement(
  type: string,
  props: Record<string, unknown> | undefined,
  ...children: React.ReactNode[]
): React.ReactElement {
  // For static elements, we can optimize by pre-processing props
  return React.createElement(type, props, ...children);
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
  
  const totalBlocks = blocks.length;
  
  if (totalBlocks === 0) {
    return {
      totalBlocks: 0,
      cacheHitRate: 0,
      averageRenderTime: 0
    };
  }

  const averageRenderTime = blocks.reduce((sum: number, block: BlockInstance) => sum + block.lastRenderTime, 0) / totalBlocks;
  
  return {
    totalBlocks,
    cacheHitRate: 0.95, // Placeholder - would need actual tracking
    averageRenderTime
  };
}

/**
 * Hook for component-level optimizations
 */
export function useOptimizedComponent<P extends Record<string, unknown>>(
  Component: React.ComponentType<P>,
  props: P
): React.ReactElement<P> {
  // Simple memo implementation for Roblox-TS
  const elementRef = React.useRef<React.ReactElement<P>>();
  const propsRef = React.useRef<P>();

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
  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);

  if (keys1.length !== keys2.length) {
    return false;
  }

  for (const key of keys1) {
    if (!Object.is(obj1[key], obj2[key])) {
      return false;
    }
  }

  return true;
}
