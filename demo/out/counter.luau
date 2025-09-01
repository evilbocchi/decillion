-- Compiled with roblox-ts v3.0.0
local TS = require(game:GetService("ReplicatedStorage"):WaitForChild("rbxts_include"):WaitForChild("RuntimeLib"))
local _runtime = TS.import(script, game:GetService("ReplicatedStorage"), "rbxts_include", "node_modules", "@decillion", "runtime", "out")
local createStaticElement = _runtime.createStaticElement
local useMemoizedBlock = _runtime.useMemoizedBlock
local _react = TS.import(script, game:GetService("ReplicatedStorage"), "rbxts_include", "node_modules", "@rbxts", "react")
local React = _react
local useState = _react.useState
local STATIC_PROPS_TEXTLABEL_ps0azh = {
	Text = "Optimized Counter App",
	TextColor3 = Color3.fromRGB(255, 255, 255),
	BackgroundTransparency = 1,
	Size = UDim2.new(1, 0, 1, 0),
}
local STATIC_PROPS_FRAME_gou88w = {
	BackgroundColor3 = Color3.fromRGB(50, 50, 50),
	Size = UDim2.new(1, 0, 0, 50),
}
local STATIC_PROPS_TEXTLABEL_ecs8yi = {
	Text = "Performance: Decillion Optimized",
	TextColor3 = Color3.fromRGB(200, 200, 200),
	BackgroundTransparency = 1,
	Size = UDim2.new(1, 0, 1, 0),
}
local STATIC_PROPS_FRAME_rd1ywj = {
	Size = UDim2.new(1, 0, 0, 100),
	Position = UDim2.new(0, 0, 0, 160),
	BackgroundColor3 = Color3.fromRGB(60, 60, 60),
}
local function Counter()
	local count, setCount = useState(0)
	local increment = function()
		return setCount(count + 1)
	end
	local decrement = function()
		return setCount(count - 1)
	end
	return useMemoizedBlock(function(count, increment, decrement)
		return React.createElement("frame", {
			Size = UDim2.new(1, 0, 1, 0),
			BackgroundColor3 = Color3.fromRGB(30, 30, 30),
		}, createStaticElement("frame", STATIC_PROPS_FRAME_gou88w, createStaticElement("textlabel", STATIC_PROPS_TEXTLABEL_ps0azh)), useMemoizedBlock(function(count)
			return React.createElement("textlabel", {
				Text = `Count: {count}`,
				TextColor3 = Color3.fromRGB(255, 255, 255),
				BackgroundColor3 = Color3.fromRGB(100, 100, 100),
				Size = UDim2.new(1, 0, 0, 40),
				Position = UDim2.new(0, 0, 0, 60),
			})
		end, { count }, "dynamic_textlabel_zhk83h6n3"), useMemoizedBlock(function(increment)
			return React.createElement("textbutton", {
				Text = "Increment",
				TextColor3 = Color3.fromRGB(255, 255, 255),
				BackgroundColor3 = Color3.fromRGB(0, 150, 0),
				Size = UDim2.new(0.5, -5, 0, 40),
				Position = UDim2.new(0, 0, 0, 110),
				Event = {
					MouseButton1Click = increment,
				},
			})
		end, { increment }, "dynamic_textbutton_309k6gof9"), useMemoizedBlock(function(decrement)
			return React.createElement("textbutton", {
				Text = "Decrement",
				TextColor3 = Color3.fromRGB(255, 255, 255),
				BackgroundColor3 = Color3.fromRGB(150, 0, 0),
				Size = UDim2.new(0.5, -5, 0, 40),
				Position = UDim2.new(0.5, 5, 0, 110),
				Event = {
					MouseButton1Click = decrement,
				},
			})
		end, { decrement }, "dynamic_textbutton_qz6oh6qiv"), createStaticElement("frame", STATIC_PROPS_FRAME_rd1ywj, createStaticElement("textlabel", STATIC_PROPS_TEXTLABEL_ecs8yi)))
	end, { count, increment, decrement }, "dynamic_frame_5n1g8guzj")
end
return {
	default = Counter,
}
