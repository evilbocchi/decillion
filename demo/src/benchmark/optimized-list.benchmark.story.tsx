import React from "@rbxts/react";
import OptimizedListBenchmark from "./optimized-list.benchmark";
import ReactRoblox from "@rbxts/react-roblox";

export = {
    react: React,
    reactRoblox: ReactRoblox,
    story: () => {
        return <OptimizedListBenchmark />;
    },
};
