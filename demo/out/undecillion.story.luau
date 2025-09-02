-- Compiled with roblox-ts v3.0.0
local TS = require(game:GetService("ReplicatedStorage"):WaitForChild("rbxts_include"):WaitForChild("RuntimeLib"))
--undecillion
local React = TS.import(script, game:GetService("ReplicatedStorage"), "rbxts_include", "node_modules", "@rbxts", "react")
local ReactRoblox = TS.import(script, game:GetService("ReplicatedStorage"), "rbxts_include", "node_modules", "@rbxts", "react-roblox")
return {
	react = React,
	reactRoblox = ReactRoblox,
	story = function()
		return React.createElement("textlabel", {
			AnchorPoint = Vector2.new(0.5, 0.5),
			BackgroundColor3 = Color3.new(1, 1, 1),
			Position = UDim2.new(0.5, 0, 0.5, 0),
			Size = UDim2.new(0, 200, 0, 200),
			Text = "This should not be transformed by Decillion!",
		})
	end,
}
