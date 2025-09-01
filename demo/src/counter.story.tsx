import React from "@rbxts/react";
import ReactRoblox from "@rbxts/react-roblox";
import Counter from "counter";

export = {
    react: React,
    reactRoblox: ReactRoblox,
    story: () => {
        return <Counter />;
    },
};