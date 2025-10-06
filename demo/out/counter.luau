-- Compiled with roblox-ts v3.0.0
local TS = require(game:GetService("ReplicatedStorage"):WaitForChild("rbxts_include"):WaitForChild("RuntimeLib"))
local _runtime = TS.import(script, game:GetService("ReplicatedStorage"), "rbxts_include", "node_modules", "@decillion", "runtime", "out")
local createStaticElement = _runtime.createStaticElement
local useFinePatchBlock = _runtime.useFinePatchBlock
local _react = TS.import(script, game:GetService("ReplicatedStorage"), "rbxts_include", "node_modules", "@rbxts", "react")
local React = _react
local useState = _react.useState
-- Static declarations - extracted from render functions for optimal performance
local STATIC_PROPS_TEXTLABEL_mvzazr = {
	Text = "Optimized Counter App",
	TextColor3 = Color3.fromRGB(255, 255, 255),
	BackgroundTransparency = 1,
	Size = UDim2.new(1, 0, 1, 0),
}
local STATIC_PROPS_TEXTLABEL_84hnbe = {
	Text = "Performance: Decillion Optimized",
	TextColor3 = Color3.fromRGB(200, 200, 200),
	BackgroundTransparency = 1,
	Size = UDim2.new(1, 0, 1, 0),
}
local STATIC_PROPS_FRAME_nn83am = {
	BackgroundColor3 = Color3.fromRGB(50, 50, 50),
	Size = UDim2.new(1, 0, 0, 50),
}
local STATIC_PROPS_FRAME_4d1xrf = {
	Size = UDim2.new(1, 0, 0, 100),
	Position = UDim2.new(0, 0, 0, 160),
	BackgroundColor3 = Color3.fromRGB(60, 60, 60),
}
local STATIC_ELEMENT_TEXTLABEL_5l5ba8 = createStaticElement("TextLabel", STATIC_PROPS_TEXTLABEL_mvzazr)
local STATIC_ELEMENT_FRAME_fviyte = createStaticElement("Frame", STATIC_PROPS_FRAME_nn83am, STATIC_ELEMENT_TEXTLABEL_5l5ba8)
local STATIC_ELEMENT_TEXTLABEL_tt6if4 = createStaticElement("TextLabel", STATIC_PROPS_TEXTLABEL_84hnbe)
local STATIC_ELEMENT_FRAME_r52mtr = createStaticElement("Frame", STATIC_PROPS_FRAME_4d1xrf, STATIC_ELEMENT_TEXTLABEL_tt6if4)
local function Counter()
	local count, setCount = useState(0)
	local increment = function()
		return setCount(count + 1)
	end
	local decrement = function()
		return setCount(count - 1)
	end
	return useFinePatchBlock(function(count, increment, decrement)
		return React.createElement("frame", {
			Size = UDim2.new(1, 0, 1, 0),
			BackgroundColor3 = Color3.fromRGB(30, 30, 30),
		}, STATIC_ELEMENT_FRAME_fviyte, React.createElement("textlabel", {
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
		}), STATIC_ELEMENT_FRAME_r52mtr)
	end, { count, increment, decrement }, { {
		elementPath = { 0, 1 },
		edits = { {
			type = 1,
			dependencyKey = "count",
			propName = "Text",
			path = { 0, 1 },
		} },
	}, {
		elementPath = { 0, 2 },
		edits = { {
			type = 4,
			dependencyKey = "increment",
			propName = "Event",
			path = { 0, 2 },
		} },
	}, {
		elementPath = { 0, 3 },
		edits = { {
			type = 4,
			dependencyKey = "decrement",
			propName = "Event",
			path = { 0, 3 },
		} },
	} }, "dynamic_frame_socnhxd52")
end
return {
	default = Counter,
}
