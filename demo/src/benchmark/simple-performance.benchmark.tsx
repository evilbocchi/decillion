import React, { useState } from "@rbxts/react";

/**
 * Simple Performance Test: Shows the clear difference between optimized and unoptimized rendering
 */

interface SimpleItemProps {
    id: number;
    text: string;
    isHighlighted: boolean;
}

// @undecillion
// Traditional component - no optimization
function UnoptimizedItem({ id, text, isHighlighted }: SimpleItemProps) {
    return (
        <frame
            Size={new UDim2(1, 0, 0, 30)}
            BackgroundColor3={isHighlighted ? Color3.fromRGB(100, 100, 200) : Color3.fromRGB(50, 50, 50)}
        >
            <textlabel
                Text={text}
                Size={new UDim2(1, 0, 1, 0)}
                TextColor3={Color3.fromRGB(255, 255, 255)}
                BackgroundTransparency={1}
            />
        </frame>
    );
}

// Optimized component - uses Decillion
function OptimizedItem({ id, text, isHighlighted }: SimpleItemProps) {
    return (
        <frame
            Size={new UDim2(1, 0, 0, 30)}
            BackgroundColor3={isHighlighted ? Color3.fromRGB(100, 100, 200) : Color3.fromRGB(50, 50, 50)}
        >
            <textlabel
                Text={text}
                Size={new UDim2(1, 0, 1, 0)}
                TextColor3={Color3.fromRGB(255, 255, 255)}
                BackgroundTransparency={1}
            />
        </frame>
    );
}

export default function SimplePerformanceTest() {
    const [itemCount, setItemCount] = useState(500);
    const [useOptimized, setUseOptimized] = useState(true);
    const [renderTrigger, setRenderTrigger] = useState(0);
    const [highlightIndex, setHighlightIndex] = useState(0);

    // Generate test items
    const items: SimpleItemProps[] = [];
    for (let i = 0; i < itemCount; i++) {
        items.push({
            id: i,
            text: `Item ${i}`,
            isHighlighted: i === highlightIndex,
        });
    }

    const triggerRender = () => {
        const start = tick();
        setRenderTrigger(renderTrigger + 1);
        
        // Move highlight to next item
        setHighlightIndex((highlightIndex + 1) % itemCount);
        
        task.spawn(() => {
            task.wait();
            const elapsed = (tick() - start) * 1000;
            print(`Render time: ${string.format("%.2f", elapsed)}ms (${useOptimized ? "Optimized" : "Unoptimized"})`);
        });
    };

    const ItemComponent = useOptimized ? OptimizedItem : UnoptimizedItem;

    return (
        <frame Size={new UDim2(1, 0, 1, 0)} BackgroundColor3={Color3.fromRGB(20, 20, 20)}>
            {/* Control Panel */}
            <frame Size={new UDim2(1, 0, 0, 80)} BackgroundColor3={Color3.fromRGB(40, 40, 40)}>
                <textlabel
                    Text={`Simple Performance Test - ${itemCount} Items`}
                    Size={new UDim2(1, 0, 0, 25)}
                    TextColor3={Color3.fromRGB(255, 255, 255)}
                    BackgroundTransparency={1}
                />

                <textbutton
                    Text={useOptimized ? "Optimized (Decillion)" : "Unoptimized (Plain React)"}
                    Size={new UDim2(0.3, 0, 0, 25)}
                    Position={new UDim2(0, 0, 0, 30)}
                    BackgroundColor3={useOptimized ? Color3.fromRGB(0, 150, 0) : Color3.fromRGB(150, 0, 0)}
                    TextColor3={Color3.fromRGB(255, 255, 255)}
                    Event={{ MouseButton1Click: () => setUseOptimized(!useOptimized) }}
                />

                <textbutton
                    Text="Trigger Render Test"
                    Size={new UDim2(0.3, 0, 0, 25)}
                    Position={new UDim2(0.35, 0, 0, 30)}
                    BackgroundColor3={Color3.fromRGB(100, 100, 150)}
                    TextColor3={Color3.fromRGB(255, 255, 255)}
                    Event={{ MouseButton1Click: triggerRender }}
                />

                <textbutton
                    Text={`Items: ${itemCount}`}
                    Size={new UDim2(0.3, 0, 0, 25)}
                    Position={new UDim2(0.7, 0, 0, 30)}
                    BackgroundColor3={Color3.fromRGB(100, 100, 100)}
                    TextColor3={Color3.fromRGB(255, 255, 255)}
                    Event={{ 
                        MouseButton1Click: () => setItemCount(itemCount === 100 ? 500 : itemCount === 500 ? 1000 : 100)
                    }}
                />

                <textlabel
                    Text="Check console for render times. Optimized should be significantly faster!"
                    Size={new UDim2(1, 0, 0, 20)}
                    Position={new UDim2(0, 0, 0, 55)}
                    TextColor3={Color3.fromRGB(200, 200, 200)}
                    BackgroundTransparency={1}
                />
            </frame>

            {/* List */}
            <scrollingframe
                Size={new UDim2(1, 0, 1, -80)}
                Position={new UDim2(0, 0, 0, 80)}
                BackgroundColor3={Color3.fromRGB(30, 30, 30)}
                CanvasSize={new UDim2(0, 0, 0, itemCount * 35)}
                ScrollBarThickness={8}
            >
                <uilistlayout SortOrder={Enum.SortOrder.LayoutOrder} Padding={new UDim(0, 2)} />

                {items.map((item) => (
                    <ItemComponent
                        key={`item-${item.id}-${renderTrigger}`}
                        id={item.id}
                        text={item.text}
                        isHighlighted={item.isHighlighted}
                    />
                ))}
            </scrollingframe>
        </frame>
    );
}
