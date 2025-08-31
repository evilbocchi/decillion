import React, { useState } from "@rbxts/react";

export default function App() {
  const [count, setCount] = useState(0);

  const increment = () => setCount(count + 1);
  const decrement = () => setCount(count - 1);

  return (
    <frame
      Size={new UDim2(1, 0, 1, 0)}
      BackgroundColor3={Color3.fromRGB(30, 30, 30)}
    >
      {/* Static header - should be completely optimized */}
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

      {/* Performance info panel - static block */}
      <frame
        Size={new UDim2(1, 0, 0, 100)}
        Position={new UDim2(0, 0, 0, 160)}
        BackgroundColor3={Color3.fromRGB(60, 60, 60)}
      >
        <textlabel
          Text="Performance: Decillion Optimized"
          TextColor3={Color3.fromRGB(200, 200, 200)}
          BackgroundTransparency={1}
          Size={new UDim2(1, 0, 1, 0)}
        />
      </frame>
    </frame>
  );
}
