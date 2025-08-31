--[[
 * This file was optimized by Decillion - Million.js-inspired Roblox-TS transformer
 * Generated on: 2025-08-31T07:06:55.613Z
 * Transformer version: 1.0.0
 * 
 * Original source: src/counter.tsx
 * Optimizations applied: Block memoization, static extraction, efficient diffing
 * 
 * @see https://github.com/evilbocchi/decillion
 * @generated Automatically generated - do not edit directly
]]

-- Compiled with roblox-ts v3.0.0
local TS = _G[script]
local _react = TS.import(script, TS.getModule(script, "@rbxts", "react"))
local React = _react
local useState = _react.useState
local function OptimizedApp()
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
	}, React.createElement("frame", {
		BackgroundColor3 = Color3.fromRGB(50, 50, 50),
		Size = UDim2.new(1, 0, 0, 50),
	}, React.createElement("textlabel", {
		Text = "Optimized Counter App",
		TextColor3 = Color3.fromRGB(255, 255, 255),
		BackgroundTransparency = 1,
		Size = UDim2.new(1, 0, 1, 0),
	})), React.createElement("textlabel", {
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
	}), React.createElement("frame", {
		Size = UDim2.new(1, 0, 0, 100),
		Position = UDim2.new(0, 0, 0, 160),
		BackgroundColor3 = Color3.fromRGB(60, 60, 60),
	}, React.createElement("textlabel", {
		Text = "Performance: Decillion Optimized",
		TextColor3 = Color3.fromRGB(200, 200, 200),
		BackgroundTransparency = 1,
		Size = UDim2.new(1, 0, 1, 0),
	})))
end
return {
	default = OptimizedApp,
}
