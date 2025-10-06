import React, { useState } from "@rbxts/react";

interface ItemData {
    key: string;
    label: string;
    color: Color3;
}

const initialItems: ItemData[] = [
    { key: "a", label: "Alpha", color: Color3.fromRGB(220, 70, 70) },
    { key: "b", label: "Bravo", color: Color3.fromRGB(70, 220, 120) },
    { key: "c", label: "Charlie", color: Color3.fromRGB(70, 130, 220) },
    { key: "d", label: "Delta", color: Color3.fromRGB(220, 200, 70) },
];

function createShuffled(items: ItemData[]): ItemData[] {
    const clone = [...items];
    for (let i = clone.size() - 1; i > 0; i--) {
        const j = math.random(0, i);
        const temp = clone[i];
        clone[i] = clone[j];
        clone[j] = temp;
    }
    return clone;
}

interface MoveItemRowProps {
    item: ItemData;
    index: number;
}

function MoveItemRow({ item, index }: MoveItemRowProps) {
    return (
        <frame
            LayoutOrder={index}
            Size={new UDim2(1, -20, 0, 46)}
            Position={new UDim2(0, 10, 0, 0)}
            BackgroundColor3={item.color}
            BorderSizePixel={0}
        >
            <textlabel
                Text={`${item.label} (${string.upper(item.key)}) - #${index + 1}`}
                Size={new UDim2(1, 0, 1, 0)}
                TextColor3={Color3.fromRGB(255, 255, 255)}
                BackgroundTransparency={1}
                TextSize={20}
            />
        </frame>
    );
}

export default function MoveTestBenchmark() {
    const [items, setItems] = useState(initialItems);
    const [iteration, setIteration] = useState(0);

    const rotateForward = () => {
        if (items.size() === 0) return;
        const head = items[0];
        const rest: ItemData[] = [];
        for (let i = 1; i < items.size(); i++) {
            rest.push(items[i]);
        }
        setItems([...rest, head]);
        setIteration((count) => count + 1);
    };

    const rotateBackward = () => {
        if (items.size() === 0) return;
        const last = items[items.size() - 1];
        const rest: ItemData[] = [];
        for (let i = 0; i < items.size() - 1; i++) {
            rest.push(items[i]);
        }
        setItems([last, ...rest]);
        setIteration((count) => count + 1);
    };

    const shuffleItems = () => {
        setItems(createShuffled(items));
        setIteration((count) => count + 1);
    };

    const swapMiddle = () => {
        if (items.size() < 2) return;
        const clone = [...items];
        const mid = math.floor(clone.size() / 2);
        const first = mid - 1;
        if (first < 0) return;
        const temp = clone[first];
        clone[first] = clone[mid];
        clone[mid] = temp;
        setItems(clone);
        setIteration((count) => count + 1);
    };

    return (
        <frame Size={new UDim2(1, 0, 1, 0)} BackgroundColor3={Color3.fromRGB(20, 20, 30)}>
            <frame Size={new UDim2(1, 0, 0, 140)} BackgroundColor3={Color3.fromRGB(40, 40, 60)}>
                <textlabel
                    Text={`Move Operation Test (iteration ${iteration})`}
                    Size={new UDim2(1, 0, 0, 30)}
                    TextColor3={Color3.fromRGB(255, 255, 255)}
                    BackgroundTransparency={1}
                />

                <textbutton
                    Text="Rotate Forward"
                    Size={new UDim2(0.24, 0, 0, 30)}
                    Position={new UDim2(0, 0, 0, 40)}
                    BackgroundColor3={Color3.fromRGB(60, 160, 220)}
                    TextColor3={Color3.fromRGB(255, 255, 255)}
                    Event={{ MouseButton1Click: rotateForward }}
                />

                <textbutton
                    Text="Rotate Backward"
                    Size={new UDim2(0.24, 0, 0, 30)}
                    Position={new UDim2(0.26, 0, 0, 40)}
                    BackgroundColor3={Color3.fromRGB(160, 120, 220)}
                    TextColor3={Color3.fromRGB(255, 255, 255)}
                    Event={{ MouseButton1Click: rotateBackward }}
                />

                <textbutton
                    Text="Swap Middle"
                    Size={new UDim2(0.24, 0, 0, 30)}
                    Position={new UDim2(0.52, 0, 0, 40)}
                    BackgroundColor3={Color3.fromRGB(220, 140, 120)}
                    TextColor3={Color3.fromRGB(255, 255, 255)}
                    Event={{ MouseButton1Click: swapMiddle }}
                />

                <textbutton
                    Text="Shuffle"
                    Size={new UDim2(0.24, 0, 0, 30)}
                    Position={new UDim2(0.78, 0, 0, 40)}
                    BackgroundColor3={Color3.fromRGB(120, 200, 160)}
                    TextColor3={Color3.fromRGB(255, 255, 255)}
                    Event={{ MouseButton1Click: shuffleItems }}
                />

                <textlabel
                    Text="Use the buttons to reorder blocks without remounting."
                    Size={new UDim2(1, 0, 0, 30)}
                    Position={new UDim2(0, 0, 0, 80)}
                    TextColor3={Color3.fromRGB(200, 200, 220)}
                    BackgroundTransparency={1}
                    TextWrapped={true}
                />
            </frame>

            <scrollingframe
                Size={new UDim2(1, 0, 1, -140)}
                Position={new UDim2(0, 0, 0, 140)}
                BackgroundColor3={Color3.fromRGB(30, 30, 40)}
                CanvasSize={new UDim2(0, 0, 0, items.size() * 50)}
                ScrollBarThickness={6}
            >
                <uilistlayout SortOrder={Enum.SortOrder.LayoutOrder} Padding={new UDim(0, 4)} />
                {items.map((item, index) => (
                    <MoveItemRow key={item.key} item={item} index={index} />
                ))}
            </scrollingframe>
        </frame>
    );
}
