-- Compiled with roblox-ts v3.0.0
local TS = require(game:GetService("ReplicatedStorage"):WaitForChild("rbxts_include"):WaitForChild("RuntimeLib"))
local createStaticElement = TS.import(script, game:GetService("ReplicatedStorage"), "rbxts_include", "node_modules", "@decillion", "runtime", "out").createStaticElement
local React = TS.import(script, game:GetService("ReplicatedStorage"), "rbxts_include", "node_modules", "@rbxts", "react")
local ReactRoblox = TS.import(script, game:GetService("ReplicatedStorage"), "rbxts_include", "node_modules", "@rbxts", "react-roblox")
-- Static declarations - extracted from render functions for optimal performance
local STATIC_PROPS_TEXTLABEL_uakr8b = {
	AnchorPoint = Vector2.new(0.5, 0.5),
	BackgroundColor3 = Color3.new(1, 1, 1),
	Position = UDim2.new(0.5, 0, 0.5, 0),
	Size = UDim2.new(0, 200, 0, 200),
	Text = "Hello, world!",
}
local STATIC_ELEMENT_TEXTLABEL_e53r3n = createStaticElement("TextLabel", STATIC_PROPS_TEXTLABEL_uakr8b)
return {
	react = React,
	reactRoblox = ReactRoblox,
	story = function()
		return STATIC_ELEMENT_TEXTLABEL_e53r3n
	end,
}
