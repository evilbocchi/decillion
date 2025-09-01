//undecillion
import React from "@rbxts/react";
import ReactRoblox from "@rbxts/react-roblox";

export = {
    react: React,
    reactRoblox: ReactRoblox,
    story: () => {
        return (
            <textlabel
                AnchorPoint={new Vector2(0.5, 0.5)}
                BackgroundColor3={new Color3(1, 1, 1)}
                Position={new UDim2(0.5, 0, 0.5, 0)}
                Size={new UDim2(0, 200, 0, 200)}
                Text={"This should not be transformed by Decillion!"}
            />
        );
    },
};
