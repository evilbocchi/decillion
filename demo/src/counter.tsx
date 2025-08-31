import React, { useState } from "@rbxts/react";
import { getCacheStats, createBlock } from "@rbxts/decillion-runtime";

// This will be optimized by our transformer
export default function OptimizedApp() {
  const [count, setCount] = useState(0);

  const increment = () => setCount(count + 1);
  const decrement = () => setCount(count - 1);

  // Demonstrate runtime optimization by showing cache stats
  const cacheStats = getCacheStats();

  // Create an optimized static block for the header
  const renderHeader = createBlock(() => (
    <frame
      BackgroundColor3={Color3.fromRGB(50, 50, 50)}
      Size={new UDim2(1, 0, 0, 50)}
    >
      <textlabel
        Text="Optimized Counter App"
        TextColor3={Color3.fromRGB(255, 255, 255)}
        BackgroundTransparency={1}
        Size={new UDim2(1, 0, 1, 0)}
      />
    </frame>
  ));

  // Create an optimized static block for the performance panel
  const renderPerformancePanel = createBlock(() => (
    <frame
      Size={new UDim2(1, 0, 0, 100)}
      Position={new UDim2(0, 0, 0, 160)}
      BackgroundColor3={Color3.fromRGB(60, 60, 60)}
    >
      <textlabel
        Text={`Performance: Decillion Optimized - Blocks: ${cacheStats.totalBlocks}, Hit Rate: ${math.floor(cacheStats.cacheHitRate * 100)}%`}
        TextColor3={Color3.fromRGB(200, 200, 200)}
        BackgroundTransparency={1}
        Size={new UDim2(1, 0, 1, 0)}
      />
    </frame>
  ), { blockType: "static-performance" });

  return (
    <frame
      Size={new UDim2(1, 0, 1, 0)}
      BackgroundColor3={Color3.fromRGB(30, 30, 30)}
    >
      {/* Static header - now uses optimized block */}
      {renderHeader()}

      {/* Dynamic counter display - block should be memoized */}
      <textlabel
        Text={`Count: ${count}`}
        TextColor3={Color3.fromRGB(255, 255, 255)}
        BackgroundColor3={Color3.fromRGB(100, 100, 100)}
        Size={new UDim2(1, 0, 0, 40)}
        Position={new UDim2(0, 0, 0, 60)}
      />

      {/* Buttons - should be optimized for event handling */}
      <textbutton
        Text="Increment"
        TextColor3={Color3.fromRGB(255, 255, 255)}
        BackgroundColor3={Color3.fromRGB(0, 150, 0)}
        Size={new UDim2(0.5, -5, 0, 40)}
        Position={new UDim2(0, 0, 0, 110)}
        Event={{ MouseButton1Click: increment }}
      />

      <textbutton
        Text="Decrement"
        TextColor3={Color3.fromRGB(255, 255, 255)}
        BackgroundColor3={Color3.fromRGB(150, 0, 0)}
        Size={new UDim2(0.5, -5, 0, 40)}
        Position={new UDim2(0.5, 5, 0, 110)}
        Event={{ MouseButton1Click: decrement }}
      />

      {/* Performance info panel - optimized static block */}
      {renderPerformancePanel()}
    </frame>
  );
}
