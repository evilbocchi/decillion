import React from "@rbxts/react";
import ReactRoblox from "@rbxts/react-roblox";
import MassiveListBenchmark from "benchmark/massive-list.benchmark";

export = {
    react: React,
    reactRoblox: ReactRoblox,
    story: () => {
        return <MassiveListBenchmark />;
    },
};
