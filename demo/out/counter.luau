-- Compiled with roblox-ts v3.0.0
local TS = require(game:GetService("ReplicatedStorage"):WaitForChild("rbxts_include"):WaitForChild("RuntimeLib"))
local _runtime = TS.import(script, game:GetService("ReplicatedStorage"), "rbxts_include", "node_modules", "@decillion", "runtime", "out")
local createStaticElement = _runtime.createStaticElement
local useMemoizedBlock = _runtime.useMemoizedBlock
local _react = TS.import(script, game:GetService("ReplicatedStorage"), "rbxts_include", "node_modules", "@rbxts", "react")
local React = _react
local useState = _react.useState
local block_0_block
local function Counter()
	local count, setCount = useState(0)
	local increment = function()
		return setCount(count + 1)
	end
	local decrement = function()
		return setCount(count - 1)
	end
	return useMemoizedBlock(function(count, increment, decrement)
		return block_0_block(count, increment, decrement)
	end, { count, increment, decrement }, "block_0")
end
local function block_3_block(count)
	return React.createElement("textlabel", {
		Text = `Count: {count}`,
		TextColor3 = Color3.fromRGB(255, 255, 255),
		BackgroundColor3 = Color3.fromRGB(100, 100, 100),
		Size = UDim2.new(1, 0, 0, 40),
		Position = UDim2.new(0, 0, 0, 60),
	})
end
local function block_4_block(increment)
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
end
local function block_5_block(decrement)
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
end
function block_0_block(count, increment, decrement)
	return React.createElement("frame", {
		Size = UDim2.new(1, 0, 1, 0),
		BackgroundColor3 = Color3.fromRGB(30, 30, 30),
	}, createStaticElement("frame", nil, createStaticElement("textlabel", {
		Text = "Optimized Counter App",
	})), useMemoizedBlock(function(count)
		return block_3_block(count)
	end, { count }, "block_3"), useMemoizedBlock(function(increment)
		return block_4_block(increment)
	end, { increment }, "block_4"), useMemoizedBlock(function(decrement)
		return block_5_block(decrement)
	end, { decrement }, "block_5"), createStaticElement("frame", nil, createStaticElement("textlabel", {
		Text = "Performance: Decillion Optimized",
	})))
end
return {
	default = Counter,
}
