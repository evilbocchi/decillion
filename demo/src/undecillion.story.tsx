import React, { useState } from "@rbxts/react";
import ReactRoblox from "@rbxts/react-roblox";

/**
 * @undecillion Decorator Examples
 * 
 * This file demonstrates different ways to use @undecillion to skip
 * Decillion transformation for specific functions/components.
 * 
 * Note: The file-level //undecillion comment has been removed to allow
 * function-level examples to work.
 */

// Example 1: Traditional decorator syntax (if supported)
// @undecillion
function SkippedDecoratorComponent({ LayoutOrder }: { LayoutOrder?: number }) {
    return (
        <frame Size={new UDim2(1, 0, 0, 60)} BackgroundColor3={Color3.fromRGB(100, 50, 50)} LayoutOrder={LayoutOrder}>
            <textlabel 
                Text="🚫 Decorator: NOT optimized by Decillion"
                Size={new UDim2(1, 0, 1, 0)}
                TextColor3={Color3.fromRGB(255, 255, 255)}
                BackgroundTransparency={1}
                TextScaled={true}
            />
        </frame>
    );
}

// Example 2: Comment-style for arrow functions
// @undecillion - Skip transformation
const SkippedArrowFunction = ({ message, LayoutOrder }: { message: string; LayoutOrder?: number }) => {
    return (
        <frame Size={new UDim2(1, 0, 0, 60)} BackgroundColor3={Color3.fromRGB(50, 100, 50)} LayoutOrder={LayoutOrder}>
            <textlabel 
                Text={`🚫 Arrow: ${message}`}
                Size={new UDim2(1, 0, 1, 0)}
                TextColor3={Color3.fromRGB(255, 255, 255)}
                BackgroundTransparency={1}
                TextScaled={true}
            />
        </frame>
    );
};

// Example 3: JSDoc-style
/**
 * This component demonstrates JSDoc-style @undecillion usage
 * @undecillion
 * @param props Component props
 */
function JSDocSkippedComponent({ count, LayoutOrder }: { count: number; LayoutOrder?: number }) {
    return (
        <frame Size={new UDim2(1, 0, 0, 60)} BackgroundColor3={Color3.fromRGB(50, 50, 100)} LayoutOrder={LayoutOrder}>
            <textlabel 
                Text={`🚫 JSDoc: Count = ${count}`}
                Size={new UDim2(1, 0, 1, 0)}
                TextColor3={Color3.fromRGB(255, 255, 255)}
                BackgroundTransparency={1}
                TextScaled={true}
            />
        </frame>
    );
}

// Example 4: Regular component (WILL be optimized by Decillion)
function OptimizedComponent({ title, LayoutOrder }: { title: string; LayoutOrder?: number }) {
    return (
        <frame Size={new UDim2(1, 0, 0, 60)} BackgroundColor3={Color3.fromRGB(100, 100, 50)} LayoutOrder={LayoutOrder}>
            <textlabel 
                Text={`⚡ Optimized: ${title}`}
                Size={new UDim2(1, 0, 1, 0)}
                TextColor3={Color3.fromRGB(255, 255, 255)}
                BackgroundTransparency={1}
                TextScaled={true}
            />
        </frame>
    );
}

function UndecillionDemo() {
    const [counter, setCounter] = useState(0);
    const [message, setMessage] = useState("Hello Decillion!");

    // @undecillion - This nested function won't be optimized
    const NestedSkippedComponent = ({ LayoutOrder }: { LayoutOrder?: number }) => {
        return (
            <frame Size={new UDim2(1, 0, 0, 60)} BackgroundColor3={Color3.fromRGB(80, 80, 80)} LayoutOrder={LayoutOrder}>
                <textlabel 
                    Text="🚫 Nested: Marked with @undecillion"
                    Size={new UDim2(1, 0, 1, 0)}
                    TextColor3={Color3.fromRGB(255, 255, 255)}
                    BackgroundTransparency={1}
                    TextScaled={true}
                />
            </frame>
        );
    };

    return (
        <frame Size={new UDim2(1, 0, 1, 0)} BackgroundColor3={Color3.fromRGB(20, 20, 20)}>
            <uilistlayout 
                SortOrder={Enum.SortOrder.LayoutOrder as any}
                Padding={new UDim(0, 5) as any}
            />

            {/* Header */}
            <textlabel 
                Text="@undecillion Decorator Examples"
                Size={new UDim2(1, 0, 0, 40)}
                TextColor3={Color3.fromRGB(255, 255, 255)}
                BackgroundColor3={Color3.fromRGB(40, 40, 40)}
                TextScaled={true}
                LayoutOrder={1}
            />

            {/* Controls */}
            <frame Size={new UDim2(1, 0, 0, 50)} BackgroundColor3={Color3.fromRGB(30, 30, 30)} LayoutOrder={2}>
                <textbutton
                    Text={`Counter: ${counter}`}
                    Size={new UDim2(0.5, -5, 1, 0)}
                    Position={new UDim2(0, 0, 0, 0)}
                    BackgroundColor3={Color3.fromRGB(60, 120, 60)}
                    TextColor3={Color3.fromRGB(255, 255, 255)}
                    TextScaled={true}
                    Event={{ MouseButton1Click: () => setCounter(counter + 1) }}
                />
                
                <textbutton
                    Text="Update Message"
                    Size={new UDim2(0.5, -5, 1, 0)}
                    Position={new UDim2(0.5, 5, 0, 0)}
                    BackgroundColor3={Color3.fromRGB(120, 60, 60)}
                    TextColor3={Color3.fromRGB(255, 255, 255)}
                    TextScaled={true}
                    Event={{ MouseButton1Click: () => setMessage(`Updated ${counter}`)} }
                />
            </frame>

            {/* Component Examples */}
            <SkippedDecoratorComponent LayoutOrder={3} />
            <SkippedArrowFunction message={message} LayoutOrder={4} />
            <JSDocSkippedComponent count={counter} LayoutOrder={5} />
            <OptimizedComponent title={`Dynamic content ${counter}`} LayoutOrder={6} />
            <NestedSkippedComponent LayoutOrder={7} />

            {/* Legend */}
            <frame Size={new UDim2(1, 0, 0, 80)} BackgroundColor3={Color3.fromRGB(25, 25, 25)} LayoutOrder={8}>
                <textlabel 
                    Text={`🚫 = Skipped by @undecillion (not optimized)
⚡ = Optimized by Decillion

Use @undecillion to skip transformation for specific components while keeping others optimized.`}
                    Size={new UDim2(1, -10, 1, -10)}
                    Position={new UDim2(0, 5, 0, 5)}
                    TextColor3={Color3.fromRGB(200, 200, 200)}
                    BackgroundTransparency={1}
                    TextWrapped={true}
                    TextYAlignment={Enum.TextYAlignment.Top as any}
                    TextXAlignment={Enum.TextXAlignment.Left as any}
                />
            </frame>
        </frame>
    );
}

export = {
    react: React,
    reactRoblox: ReactRoblox,
    story: UndecillionDemo,
};
