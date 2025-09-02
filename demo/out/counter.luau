-- Compiled with roblox-ts v3.0.0
local TS = require(game:GetService("ReplicatedStorage"):WaitForChild("rbxts_include"):WaitForChild("RuntimeLib"))
local createStaticElement = TS.import(script, game:GetService("ReplicatedStorage"), "rbxts_include", "node_modules", "@decillion", "runtime", "out").createStaticElement
local _react = TS.import(script, game:GetService("ReplicatedStorage"), "rbxts_include", "node_modules", "@rbxts", "react")
local React = _react
local useState = _react.useState
-- Static declarations - extracted from render functions for optimal performance
local STATIC_PROPS_TEXTLABEL_4qbg3s = {
	Text = "Optimized Counter App",
	TextColor3 = Color3.fromRGB(255, 255, 255),
	BackgroundTransparency = 1,
	Size = UDim2.new(1, 0, 1, 0),
}
local STATIC_PROPS_TEXTLABEL_5rx6df = {
	Text = "Performance: Decillion Optimized",
	TextColor3 = Color3.fromRGB(200, 200, 200),
	BackgroundTransparency = 1,
	Size = UDim2.new(1, 0, 1, 0),
}
local STATIC_PROPS_FRAME_l7b4n1 = {
	BackgroundColor3 = Color3.fromRGB(50, 50, 50),
	Size = UDim2.new(1, 0, 0, 50),
}
local STATIC_PROPS_FRAME_3afnud = {
	Size = UDim2.new(1, 0, 0, 100),
	Position = UDim2.new(0, 0, 0, 160),
	BackgroundColor3 = Color3.fromRGB(60, 60, 60),
}
local STATIC_ELEMENT_TEXTLABEL_rqbjh5 = createStaticElement("textlabel", STATIC_PROPS_TEXTLABEL_4qbg3s)
local STATIC_ELEMENT_FRAME_i98rh4 = createStaticElement("frame", STATIC_PROPS_FRAME_l7b4n1, STATIC_ELEMENT_TEXTLABEL_rqbjh5)
local STATIC_ELEMENT_TEXTLABEL_mkv9lk = createStaticElement("textlabel", STATIC_PROPS_TEXTLABEL_5rx6df)
local STATIC_ELEMENT_FRAME_pabiud = createStaticElement("frame", STATIC_PROPS_FRAME_3afnud, STATIC_ELEMENT_TEXTLABEL_mkv9lk)
local function Counter()
	local count, setCount = useState(0)
	local increment = function()
		return setCount(count + 1)
	end
	local decrement = function()
		return setCount(count - 1)
	end
	return React.createElement("frame", {
		Size = UDim2.new(1, 0, 1, 0),
		BackgroundColor3 = Color3.fromRGB(30, 30, 30),
	}, STATIC_ELEMENT_FRAME_i98rh4, React.createElement("textlabel", {
		Text = `Count: {count}`,
		TextColor3 = Color3.fromRGB(255, 255, 255),
		BackgroundColor3 = Color3.fromRGB(100, 100, 100),
		Size = UDim2.new(1, 0, 0, 40),
		Position = UDim2.new(0, 0, 0, 60),
	}), React.createElement("textbutton", {
		Text = "Increment",
		TextColor3 = Color3.fromRGB(255, 255, 255),
		BackgroundColor3 = Color3.fromRGB(0, 150, 0),
		Size = UDim2.new(0.5, -5, 0, 40),
		Position = UDim2.new(0, 0, 0, 110),
		Event = {
			MouseButton1Click = increment,
		},
	}), React.createElement("textbutton", {
		Text = "Decrement",
		TextColor3 = Color3.fromRGB(255, 255, 255),
		BackgroundColor3 = Color3.fromRGB(150, 0, 0),
		Size = UDim2.new(0.5, -5, 0, 40),
		Position = UDim2.new(0.5, 5, 0, 110),
		Event = {
			MouseButton1Click = decrement,
		},
	}), STATIC_ELEMENT_FRAME_pabiud)
end
return {
	default = Counter,
}
