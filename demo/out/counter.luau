-- Compiled with roblox-ts v3.0.0
local TS = require(game:GetService("ReplicatedStorage"):WaitForChild("rbxts_include"):WaitForChild("RuntimeLib"))
local useMemoizedBlock = TS.import(script, game:GetService("ReplicatedStorage"), "rbxts_include", "node_modules", "@decillion", "decillion-runtime").useMemoizedBlock
local _react = TS.import(script, game:GetService("ReplicatedStorage"), "rbxts_include", "node_modules", "@decillion", "runtime", "node_modules", "@rbxts", "react", "src")
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
	return useMemoizedBlock(function(Color3, count, increment, decrement)
		return block_0_block(Color3, count, increment, decrement)
	end, { Color3, count, increment, decrement }, "block_0")
end
local function block_2_block(Color3)
	return React.createElement("textlabel", {
		Text = "Optimized Counter App",
		TextColor3 = Color3.fromRGB(255, 255, 255),
		BackgroundTransparency = 1,
		Size = UDim2.new(1, 0, 1, 0),
	})
end
local function block_1_block(Color3)
	return React.createElement("frame", {
		BackgroundColor3 = Color3.fromRGB(50, 50, 50),
		Size = UDim2.new(1, 0, 0, 50),
	}, useMemoizedBlock(function(Color3)
		return block_2_block(Color3)
	end, { Color3 }, "block_2"))
end
local function block_3_block(count, Color3)
	return React.createElement("textlabel", {
		Text = `Count: {count}`,
		TextColor3 = Color3.fromRGB(255, 255, 255),
		BackgroundColor3 = Color3.fromRGB(100, 100, 100),
		Size = UDim2.new(1, 0, 0, 40),
		Position = UDim2.new(0, 0, 0, 60),
	})
end
local function block_4_block(Color3, increment)
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
local function block_5_block(Color3, decrement)
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
local function block_7_block(Color3)
	return React.createElement("textlabel", {
		Text = "Performance: Decillion Optimized",
		TextColor3 = Color3.fromRGB(200, 200, 200),
		BackgroundTransparency = 1,
		Size = UDim2.new(1, 0, 1, 0),
	})
end
local function block_6_block(Color3)
	return React.createElement("frame", {
		Size = UDim2.new(1, 0, 0, 100),
		Position = UDim2.new(0, 0, 0, 160),
		BackgroundColor3 = Color3.fromRGB(60, 60, 60),
	}, useMemoizedBlock(function(Color3)
		return block_7_block(Color3)
	end, { Color3 }, "block_7"))
end
function block_0_block(Color3, count, increment, decrement)
	return React.createElement("frame", {
		Size = UDim2.new(1, 0, 1, 0),
		BackgroundColor3 = Color3.fromRGB(30, 30, 30),
	}, useMemoizedBlock(function(Color3)
		return block_1_block(Color3)
	end, { Color3 }, "block_1"), useMemoizedBlock(function(count, Color3)
		return block_3_block(count, Color3)
	end, { count, Color3 }, "block_3"), useMemoizedBlock(function(Color3, increment)
		return block_4_block(Color3, increment)
	end, { Color3, increment }, "block_4"), useMemoizedBlock(function(Color3, decrement)
		return block_5_block(Color3, decrement)
	end, { Color3, decrement }, "block_5"), useMemoizedBlock(function(Color3)
		return block_6_block(Color3)
	end, { Color3 }, "block_6"))
end
return {
	default = Counter,
}
