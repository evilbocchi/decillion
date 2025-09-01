import React from "@rbxts/react";
import ReactRoblox from "@rbxts/react-roblox";

export = {
    react: React,
    reactRoblox: ReactRoblox,
    story: () => {
        return (
            <frame>
                <textlabel Text={"Hello, world!"} />
            </frame>
        );
    },
};
