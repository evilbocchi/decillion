export { default as millionTransformer } from "./transformer";

// Runtime exports
export {
  useMemoizedBlock,
  shouldUpdateBlock,
  createBlock,
  createStaticElement,
  clearBlockCache,
  getCacheStats,
  useOptimizedComponent
} from "./runtime";

// Type exports
export type { BlockInstance } from "./runtime";