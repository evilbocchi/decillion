import React, { useState, useEffect } from "@rbxts/react";

/**
 * Benchmark: Massive List Rendering
 * Tests: Large list performance with and without optimization
 */

interface ListItemProps {
    id: number;
    name: string;
    value: number;
    isActive: boolean;
}

// Traditional React approach (for comparison) - skipped by @undecillion
// @undecillion
function TraditionalListItem({ id, name, value, isActive }: ListItemProps) {
    return (
        <frame
            Size={new UDim2(1, 0, 0, 40)}
            BackgroundColor3={isActive ? Color3.fromRGB(100, 150, 100) : Color3.fromRGB(80, 80, 80)}
        >
            <textlabel
                Text={`${name}: ${value}`}
                Size={new UDim2(0.8, 0, 1, 0)}
                TextColor3={Color3.fromRGB(255, 255, 255)}
                BackgroundTransparency={1}
            />
            <textlabel
                Text={`#${id}`}
                Size={new UDim2(0.2, 0, 1, 0)}
                Position={new UDim2(0.8, 0, 0, 0)}
                TextColor3={Color3.fromRGB(200, 200, 200)}
                BackgroundTransparency={1}
            />
        </frame>
    );
}

// Optimized Decillion approach
function OptimizedListItem({ id, name, value, isActive }: ListItemProps) {
    return (
        <frame
            Size={new UDim2(1, 0, 0, 40)}
            BackgroundColor3={isActive ? Color3.fromRGB(100, 150, 100) : Color3.fromRGB(80, 80, 80)}
        >
            {/* Static structure should be completely optimized */}
            <textlabel
                Text={`${name}: ${value}`}
                Size={new UDim2(0.8, 0, 1, 0)}
                TextColor3={Color3.fromRGB(255, 255, 255)}
                BackgroundTransparency={1}
            />
            <textlabel
                Text={`#${id}`}
                Size={new UDim2(0.2, 0, 1, 0)}
                Position={new UDim2(0.8, 0, 0, 0)}
                TextColor3={Color3.fromRGB(200, 200, 200)}
                BackgroundTransparency={1}
            />
        </frame>
    );
}

export default function MassiveListBenchmark() {
    const [itemCount, setItemCount] = useState(100);
    const [useOptimized, setUseOptimized] = useState(true);
    const [updateTrigger, setUpdateTrigger] = useState(0);
    const [renderTime, setRenderTime] = useState(0);

    // Generate test data
    const items: ListItemProps[] = [];
    for (let i = 0; i < itemCount; i++) {
        items.push({
            id: i,
            name: `Item ${i}`,
            value: math.random(1, 1000),
            isActive: math.random() > 0.7,
        });
    }

    const triggerUpdate = () => {
        const startTime = tick();
        setUpdateTrigger(updateTrigger + 1);

        // Measure render time (simplified)
        task.spawn(() => {
            task.wait();
            setRenderTime(tick() - startTime);
        });
    };

    const ListComponent = useOptimized ? OptimizedListItem : TraditionalListItem;

    return (
        <frame Size={new UDim2(1, 0, 1, 0)} BackgroundColor3={Color3.fromRGB(20, 20, 20)}>
            {/* Benchmark Controls */}
            <frame Size={new UDim2(1, 0, 0, 100)} BackgroundColor3={Color3.fromRGB(40, 40, 40)}>
                <textlabel
                    Text={`Massive List Benchmark - ${itemCount} Items`}
                    Size={new UDim2(1, 0, 0, 30)}
                    TextColor3={Color3.fromRGB(255, 255, 255)}
                    BackgroundTransparency={1}
                />

                <textbutton
                    Text={useOptimized ? "Using Optimized" : "Using Traditional"}
                    Size={new UDim2(0.3, 0, 0, 30)}
                    Position={new UDim2(0, 0, 0, 35)}
                    BackgroundColor3={useOptimized ? Color3.fromRGB(0, 150, 0) : Color3.fromRGB(150, 150, 0)}
                    TextColor3={Color3.fromRGB(255, 255, 255)}
                    Event={{ MouseButton1Click: () => setUseOptimized(!useOptimized) }}
                />

                <textbutton
                    Text="Trigger Re-render"
                    Size={new UDim2(0.3, 0, 0, 30)}
                    Position={new UDim2(0.35, 0, 0, 35)}
                    BackgroundColor3={Color3.fromRGB(100, 100, 150)}
                    TextColor3={Color3.fromRGB(255, 255, 255)}
                    Event={{ MouseButton1Click: triggerUpdate }}
                />

                <textlabel
                    Text={`Last Render: ${string.format("%.3f", renderTime)}ms`}
                    Size={new UDim2(0.3, 0, 0, 30)}
                    Position={new UDim2(0.7, 0, 0, 35)}
                    TextColor3={Color3.fromRGB(200, 200, 200)}
                    BackgroundTransparency={1}
                />

                <textlabel
                    Text={`Items: ${itemCount}`}
                    Size={new UDim2(0.5, 0, 0, 30)}
                    Position={new UDim2(0, 0, 0, 70)}
                    TextColor3={Color3.fromRGB(200, 200, 200)}
                    BackgroundTransparency={1}
                />
            </frame>

            {/* Scrollable List */}
            <scrollingframe
                Size={new UDim2(1, 0, 1, -100)}
                Position={new UDim2(0, 0, 0, 100)}
                BackgroundColor3={Color3.fromRGB(30, 30, 30)}
                CanvasSize={new UDim2(0, 0, 0, itemCount * 45)}
                ScrollBarThickness={10}
            >
                <uilistlayout SortOrder={Enum.SortOrder.LayoutOrder} Padding={new UDim(0, 5)} />

                {items.map((item: ListItemProps, index: number) => (
                    <ListComponent key={`item-${item.id}-${updateTrigger}`} {...item} />
                ))}
            </scrollingframe>
        </frame>
    );
}

// Alternative ways to use @undecillion

// Comment-style for arrow functions
// @undecillion - Skip transformation for this component
const SkippedArrowComponent = ({ text }: { text: string }) => {
    return (
        <textlabel
            Text={text}
            Size={new UDim2(1, 0, 0, 30)}
            BackgroundTransparency={1}
            TextColor3={Color3.fromRGB(255, 255, 255)}
        />
    );
};

// JSDoc-style documentation
/**
 * @undecillion
 * This component will not be optimized by Decillion
 */
function DocumentedSkippedComponent() {
    return (
        <frame Size={new UDim2(1, 0, 0, 50)}>
            <textlabel Text="This won't be optimized" />
        </frame>
    );
}