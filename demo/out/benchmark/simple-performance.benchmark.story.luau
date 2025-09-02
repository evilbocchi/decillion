-- Compiled with roblox-ts v3.0.0
local TS = require(game:GetService("ReplicatedStorage"):WaitForChild("rbxts_include"):WaitForChild("RuntimeLib"))
local React = TS.import(script, game:GetService("ReplicatedStorage"), "rbxts_include", "node_modules", "@rbxts", "react")
local ReactRoblox = TS.import(script, game:GetService("ReplicatedStorage"), "rbxts_include", "node_modules", "@rbxts", "react-roblox")
local SimplePerformanceTest = TS.import(script, game:GetService("ReplicatedStorage"), "TS", "benchmark", "simple-performance.benchmark").default
return {
	react = React,
	reactRoblox = ReactRoblox,
	story = function()
		return React.createElement(SimplePerformanceTest, nil)
	end,
}
