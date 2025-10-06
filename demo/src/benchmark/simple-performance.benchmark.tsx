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
    const [lastRenderTime, setLastRenderTime] = useState(0);

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
        const start = os.clock();

        // Update states - React should batch these automatically in modern versions
        setRenderTrigger(renderTrigger + 1);
        setHighlightIndex((highlightIndex + 1) % itemCount);

        // Use multiple frame waits to ensure render completion
        task.spawn(() => {
            task.wait(); // Wait for React to schedule
            task.wait(); // Wait for potential second frame
            const elapsed = (os.clock() - start) * 1000;
            setLastRenderTime(elapsed);
            print(
                `Render time: ${string.format("%.2f", elapsed)}ms (${
                    useOptimized ? "Optimized" : "Unoptimized"
                }) - Items: ${itemCount}`,
            );
        });
    };

    // Add this inside your SimplePerformanceTest component

    function runRenderConsistencyTest() {
        const testCounts = [100, 500, 1000];
        const runsPerCount = 10;

        let currentCountIndex = 0;
        let run = 0;
        let times: number[] = [];

        function nextTest() {
            if (run >= runsPerCount) {
                // Calculate stats
                const avg = times.reduce((a, b) => a + b, 0) / times.size();
                const std = math.sqrt(times.reduce((a, b) => a + math.pow(b - avg, 2), 0) / times.size());
                print(
                    `ItemCount: ${testCounts[currentCountIndex]}, Avg: ${math.floor(avg * 100) / 100}ms, StdDev: ${
                        math.floor(std * 100) / 100
                    }ms, Times: [${times.map((t) => math.floor(t * 100) / 100).join(", ")}]`,
                );
                // Next item count
                currentCountIndex++;
                run = 0;
                times = [];
                if (currentCountIndex >= testCounts.size()) {
                    print("Render consistency test complete.");
                    return;
                }
                setItemCount(testCounts[currentCountIndex]);
                task.wait(0.5); // Give time for UI to update
            }
            // Trigger render and measure
            const start = os.clock();
            setRenderTrigger((r) => r + 1);
            setHighlightIndex((highlightIndex + 1) % testCounts[currentCountIndex]);
            task.spawn(() => {
                task.wait();
                task.wait();
                const elapsed = (os.clock() - start) * 1000;
                times.push(elapsed);
                run++;
                nextTest();
            });
        }

        // Start test
        setItemCount(testCounts[0]);
        task.wait(0.5);
        nextTest();
    }

    // Test just highlight changes (should be much faster)
    const triggerHighlightOnly = () => {
        const start = os.clock();
        setHighlightIndex((highlightIndex + 1) % itemCount);

        task.spawn(() => {
            task.wait();
            const elapsed = (os.clock() - start) * 1000;
            print(
                `Highlight-only time: ${string.format("%.2f", elapsed)}ms (${
                    useOptimized ? "Optimized" : "Unoptimized"
                }) - Items: ${itemCount}`,
            );
        });
    };

    const ItemComponent = useOptimized ? OptimizedItem : UnoptimizedItem;

    return (
        <frame Size={new UDim2(1, 0, 1, 0)} BackgroundColor3={Color3.fromRGB(20, 20, 20)}>
            {/* Control Panel */}
            <frame Size={new UDim2(1, 0, 0, 110)} BackgroundColor3={Color3.fromRGB(40, 40, 40)}>
                <textlabel
                    Text={`Simple Performance Test - ${itemCount} Items${
                        lastRenderTime > 0 ? ` (Last: ${string.format("%.1f", lastRenderTime)}ms)` : ""
                    }`}
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
                    Text="Full Re-render Test"
                    Size={new UDim2(0.3, 0, 0, 25)}
                    Position={new UDim2(0.35, 0, 0, 30)}
                    BackgroundColor3={Color3.fromRGB(100, 100, 150)}
                    TextColor3={Color3.fromRGB(255, 255, 255)}
                    Event={{ MouseButton1Click: triggerRender }}
                />

                <textbutton
                    Text="Highlight-Only Test"
                    Size={new UDim2(0.3, 0, 0, 25)}
                    Position={new UDim2(0.7, 0, 0, 30)}
                    BackgroundColor3={Color3.fromRGB(150, 100, 100)}
                    TextColor3={Color3.fromRGB(255, 255, 255)}
                    Event={{ MouseButton1Click: triggerHighlightOnly }}
                />

                <textbutton
                    Text="Run Consistency Benchmark"
                    Size={new UDim2(0.3, 0, 0, 25)}
                    Position={new UDim2(0, 0, 0, 90)}
                    BackgroundColor3={Color3.fromRGB(80, 80, 180)}
                    TextColor3={Color3.fromRGB(255, 255, 255)}
                    Event={{ MouseButton1Click: runRenderConsistencyTest }}
                />

                <textbutton
                    Text={`Items: ${itemCount}`}
                    Size={new UDim2(0.3, 0, 0, 25)}
                    Position={new UDim2(0, 0, 0, 60)}
                    BackgroundColor3={Color3.fromRGB(100, 100, 100)}
                    TextColor3={Color3.fromRGB(255, 255, 255)}
                    Event={{
                        MouseButton1Click: () => setItemCount(itemCount === 100 ? 500 : itemCount === 500 ? 1000 : 100),
                    }}
                />

                <textlabel
                    Text="Full re-render forces all items to recreate. Highlight-only should be much faster!"
                    Size={new UDim2(1, 0, 0, 20)}
                    Position={new UDim2(0, 0, 0, 85)}
                    TextColor3={Color3.fromRGB(200, 200, 200)}
                    BackgroundTransparency={1}
                />
            </frame>

            {/* List */}
            <scrollingframe
                Size={new UDim2(1, 0, 1, -110)}
                Position={new UDim2(0, 0, 0, 110)}
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
