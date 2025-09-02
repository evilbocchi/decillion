import React from "@rbxts/react";
import ReactRoblox from "@rbxts/react-roblox";
import SimplePerformanceTest from "./simple-performance.benchmark";

export = {
    react: React,
    reactRoblox: ReactRoblox,
    story: () => {
        return <SimplePerformanceTest />;
    },
};
