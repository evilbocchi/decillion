-- Compiled with roblox-ts v3.0.0
local TS = require(game:GetService("ReplicatedStorage"):WaitForChild("rbxts_include"):WaitForChild("RuntimeLib"))
local React = TS.import(script, game:GetService("ReplicatedStorage"), "rbxts_include", "node_modules", "@rbxts", "react")
local ReactRoblox = TS.import(script, game:GetService("ReplicatedStorage"), "rbxts_include", "node_modules", "@rbxts", "react-roblox")
local MassiveListBenchmark = TS.import(script, game:GetService("ReplicatedStorage"), "TS", "benchmark", "massive-list.benchmark").default
return {
	react = React,
	reactRoblox = ReactRoblox,
	story = function()
		return React.createElement(MassiveListBenchmark, nil)
	end,
}
