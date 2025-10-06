import React from "@rbxts/react";
import ReactRoblox from "@rbxts/react-roblox";
import MoveTestBenchmark from "./move-test.benchmark";

export = {
    react: React,
    reactRoblox: ReactRoblox,
    story: () => {
        return <MoveTestBenchmark />;
    },
};