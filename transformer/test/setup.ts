// Global test setup
import 'vitest'

declare global {
  var game: any;
  var workspace: any; 
  var Workspace: any;
  var UDim2: any;
  var Vector2: any;
  var Color3: any;
  var React: any;
}

// Mock Roblox globals for testing
(globalThis as any).game = {};
(globalThis as any).workspace = {};
(globalThis as any).Workspace = {};

// Mock UDim2, Vector2, Color3 for testing
(globalThis as any).UDim2 = {
  new: (scaleX: number, offsetX: number, scaleY: number, offsetY: number) => ({
    scaleX, offsetX, scaleY, offsetY, 
    toString: () => `UDim2(${scaleX}, ${offsetX}, ${scaleY}, ${offsetY})`
  })
};

(globalThis as any).Vector2 = {
  new: (x: number, y: number) => ({ x, y, toString: () => `Vector2(${x}, ${y})` })
};

(globalThis as any).Color3 = {
  new: (r: number, g: number, b: number) => ({ r, g, b, toString: () => `Color3(${r}, ${g}, ${b})` }),
  fromRGB: (r: number, g: number, b: number) => ({ r: r/255, g: g/255, b: b/255, toString: () => `Color3.fromRGB(${r}, ${g}, ${b})` })
};

// Mock React for runtime tests
(globalThis as any).React = {
  createElement: (type: any, props: any, ...children: any[]) => ({
    type, props, children, 
    $$typeof: Symbol.for('react.element')
  })
};
