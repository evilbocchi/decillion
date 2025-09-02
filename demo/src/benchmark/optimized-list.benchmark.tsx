import React, { useState, useEffect } from "@rbxts/react";

/**
 * Advanced List Optimization Benchmark
 * Demonstrates the impact of different optimization strategies
 */

interface ListItemProps {
    id: number;
    name: string;
    value: number;
    isActive: boolean;
    onToggle: (id: number) => void;
}

// Pure traditional approach (no optimization at all)
function TraditionalListItem({ id, name, value, isActive, onToggle }: ListItemProps) {
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
            <textbutton
                Text={isActive ? "Active" : "Inactive"}
                Size={new UDim2(0.2, 0, 1, 0)}
                Position={new UDim2(0.8, 0, 0, 0)}
                TextColor3={Color3.fromRGB(255, 255, 255)}
                BackgroundColor3={isActive ? Color3.fromRGB(0, 100, 0) : Color3.fromRGB(100, 0, 0)}
                Event={{
                    MouseButton1Click: () => onToggle(id)
                }}
            />
        </frame>
    );
}

// Decillion optimized approach
function OptimizedListItem({ id, name, value, isActive, onToggle }: ListItemProps) {
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
            <textbutton
                Text={isActive ? "Active" : "Inactive"}
                Size={new UDim2(0.2, 0, 1, 0)}
                Position={new UDim2(0.8, 0, 0, 0)}
                TextColor3={Color3.fromRGB(255, 255, 255)}
                BackgroundColor3={isActive ? Color3.fromRGB(0, 100, 0) : Color3.fromRGB(100, 0, 0)}
                Event={{
                    MouseButton1Click: () => onToggle(id)
                }}
            />
        </frame>
    );
}

export default function OptimizedListBenchmark() {
    const [itemCount, setItemCount] = useState(100);
    const [useOptimized, setUseOptimized] = useState(true);
    const [renderCount, setRenderCount] = useState(0);
    const [items, setItems] = useState<ListItemProps[]>([]);

    // Initialize test data
    useEffect(() => {
        const newItems: ListItemProps[] = [];
        for (let i = 0; i < itemCount; i++) {
            newItems.push({
                id: i,
                name: `Item ${i}`,
                value: math.random(1, 1000),
                isActive: math.random() > 0.5,
                onToggle: (id: number) => toggleItem(id),
            });
        }
        setItems(newItems);
    }, [itemCount]);

    const toggleItem = (id: number) => {
        setItems(prevItems => 
            prevItems.map(item => 
                item.id === id ? { ...item, isActive: !item.isActive } : item
            )
        );
    };

    const triggerFullRerender = () => {
        setRenderCount(renderCount + 1);
        // Force all items to update their values
        setItems(prevItems => 
            prevItems.map(item => ({
                ...item,
                value: math.random(1, 1000)
            }))
        );
    };

    const ListComponent = useOptimized ? OptimizedListItem : TraditionalListItem;

    return (
        <frame Size={new UDim2(1, 0, 1, 0)} BackgroundColor3={Color3.fromRGB(20, 20, 20)}>
            {/* Controls */}
            <frame Size={new UDim2(1, 0, 0, 120)} BackgroundColor3={Color3.fromRGB(40, 40, 40)}>
                <textlabel
                    Text={`Optimized List Benchmark - ${itemCount} Items (Render: ${renderCount})`}
                    Size={new UDim2(1, 0, 0, 25)}
                    TextColor3={Color3.fromRGB(255, 255, 255)}
                    BackgroundTransparency={1}
                />

                <textbutton
                    Text={useOptimized ? "Using Optimized" : "Using Traditional"}
                    Size={new UDim2(0.25, 0, 0, 25)}
                    Position={new UDim2(0, 0, 0, 30)}
                    BackgroundColor3={useOptimized ? Color3.fromRGB(0, 150, 0) : Color3.fromRGB(150, 150, 0)}
                    TextColor3={Color3.fromRGB(255, 255, 255)}
                    Event={{ MouseButton1Click: () => setUseOptimized(!useOptimized) }}
                />

                <textbutton
                    Text="Re-render All"
                    Size={new UDim2(0.25, 0, 0, 25)}
                    Position={new UDim2(0.25, 0, 0, 30)}
                    BackgroundColor3={Color3.fromRGB(100, 100, 150)}
                    TextColor3={Color3.fromRGB(255, 255, 255)}
                    Event={{ MouseButton1Click: triggerFullRerender }}
                />

                <textbutton
                    Text="Toggle First Item"
                    Size={new UDim2(0.25, 0, 0, 25)}
                    Position={new UDim2(0.5, 0, 0, 30)}
                    BackgroundColor3={Color3.fromRGB(150, 100, 100)}
                    TextColor3={Color3.fromRGB(255, 255, 255)}
                    Event={{ MouseButton1Click: () => toggleItem(0) }}
                />

                <textbutton
                    Text={`Items: ${itemCount}`}
                    Size={new UDim2(0.25, 0, 0, 25)}
                    Position={new UDim2(0.75, 0, 0, 30)}
                    BackgroundColor3={Color3.fromRGB(100, 100, 100)}
                    TextColor3={Color3.fromRGB(255, 255, 255)}
                    Event={{ 
                        MouseButton1Click: () => setItemCount(itemCount === 100 ? 500 : itemCount === 500 ? 1000 : 100)
                    }}
                />

                <textlabel
                    Text="Click individual items to toggle them. Notice how Decillion only updates changed items."
                    Size={new UDim2(1, 0, 0, 50)}
                    Position={new UDim2(0, 0, 0, 60)}
                    TextColor3={Color3.fromRGB(200, 200, 200)}
                    BackgroundTransparency={1}
                    TextWrapped={true}
                />
            </frame>

            {/* Scrollable List */}
            <scrollingframe
                Size={new UDim2(1, 0, 1, -120)}
                Position={new UDim2(0, 0, 0, 120)}
                BackgroundColor3={Color3.fromRGB(30, 30, 30)}
                CanvasSize={new UDim2(0, 0, 0, itemCount * 45)}
                ScrollBarThickness={10}
            >
                <uilistlayout SortOrder={Enum.SortOrder.LayoutOrder} Padding={new UDim(0, 5)} />

                {items.map((item: ListItemProps) => (
                    <ListComponent
                        key={`item-${item.id}`}
                        id={item.id}
                        name={item.name}
                        value={item.value}
                        isActive={item.isActive}
                        onToggle={item.onToggle}
                    />
                ))}
            </scrollingframe>
        </frame>
    );
}
