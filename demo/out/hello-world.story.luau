-- Compiled with roblox-ts v3.0.0
local TS = require(game:GetService("ReplicatedStorage"):WaitForChild("rbxts_include"):WaitForChild("RuntimeLib"))
local createStaticElement = TS.import(script, game:GetService("ReplicatedStorage"), "rbxts_include", "node_modules", "@decillion", "runtime", "out").createStaticElement
local React = TS.import(script, game:GetService("ReplicatedStorage"), "rbxts_include", "node_modules", "@rbxts", "react")
local ReactRoblox = TS.import(script, game:GetService("ReplicatedStorage"), "rbxts_include", "node_modules", "@rbxts", "react-roblox")
local STATIC_PROPS_TEXTLABEL_z9daxe = {
	AnchorPoint = Vector2.new(0.5, 0.5),
	BackgroundColor3 = Color3.new(1, 1, 1),
	Position = UDim2.new(0.5, 0, 0.5, 0),
	Size = UDim2.new(0, 200, 0, 200),
	Text = "Hello, world!",
}
return {
	react = React,
	reactRoblox = ReactRoblox,
	story = function()
		return createStaticElement("textlabel", STATIC_PROPS_TEXTLABEL_z9daxe)
	end,
}
