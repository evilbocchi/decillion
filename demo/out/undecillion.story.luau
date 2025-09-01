-- Compiled with roblox-ts v3.0.0
local TS = require(game:GetService("ReplicatedStorage"):WaitForChild("rbxts_include"):WaitForChild("RuntimeLib"))
local _react = TS.import(script, game:GetService("ReplicatedStorage"), "rbxts_include", "node_modules", "@rbxts", "react")
local React = _react
local useState = _react.useState
local ReactRoblox = TS.import(script, game:GetService("ReplicatedStorage"), "rbxts_include", "node_modules", "@rbxts", "react-roblox")
--[[
	*
	 * @undecillion Decorator Examples
	 *
	 * This file demonstrates different ways to use @undecillion to skip
	 * Decillion transformation for specific functions/components.
	 *
	 * Note: The file-level //undecillion comment has been removed to allow
	 * function-level examples to work.
	 
]]
-- Example 1: Traditional decorator syntax (if supported)
-- @undecillion
local function SkippedDecoratorComponent(_param)
	local LayoutOrder = _param.LayoutOrder
	return React.createElement("frame", {
		Size = UDim2.new(1, 0, 0, 60),
		BackgroundColor3 = Color3.fromRGB(100, 50, 50),
		LayoutOrder = LayoutOrder,
	}, React.createElement("textlabel", {
		Text = "🚫 Decorator: NOT optimized by Decillion",
		Size = UDim2.new(1, 0, 1, 0),
		TextColor3 = Color3.fromRGB(255, 255, 255),
		BackgroundTransparency = 1,
		TextScaled = true,
	}))
end
-- Example 2: Comment-style for arrow functions
-- @undecillion - Skip transformation
local SkippedArrowFunction = function(_param)
	local message = _param.message
	local LayoutOrder = _param.LayoutOrder
	return React.createElement("frame", {
		Size = UDim2.new(1, 0, 0, 60),
		BackgroundColor3 = Color3.fromRGB(50, 100, 50),
		LayoutOrder = LayoutOrder,
	}, React.createElement("textlabel", {
		Text = `🚫 Arrow: {message}`,
		Size = UDim2.new(1, 0, 1, 0),
		TextColor3 = Color3.fromRGB(255, 255, 255),
		BackgroundTransparency = 1,
		TextScaled = true,
	}))
end
-- Example 3: JSDoc-style
--[[
	*
	 * This component demonstrates JSDoc-style @undecillion usage
	 * @undecillion
	 * @param props Component props
	 
]]
local function JSDocSkippedComponent(_param)
	local count = _param.count
	local LayoutOrder = _param.LayoutOrder
	return React.createElement("frame", {
		Size = UDim2.new(1, 0, 0, 60),
		BackgroundColor3 = Color3.fromRGB(50, 50, 100),
		LayoutOrder = LayoutOrder,
	}, React.createElement("textlabel", {
		Text = `🚫 JSDoc: Count = {count}`,
		Size = UDim2.new(1, 0, 1, 0),
		TextColor3 = Color3.fromRGB(255, 255, 255),
		BackgroundTransparency = 1,
		TextScaled = true,
	}))
end
-- Example 4: Regular component (WILL be optimized by Decillion)
local function OptimizedComponent(_param)
	local title = _param.title
	local LayoutOrder = _param.LayoutOrder
	return React.createElement("frame", {
		Size = UDim2.new(1, 0, 0, 60),
		BackgroundColor3 = Color3.fromRGB(100, 100, 50),
		LayoutOrder = LayoutOrder,
	}, React.createElement("textlabel", {
		Text = `⚡ Optimized: {title}`,
		Size = UDim2.new(1, 0, 1, 0),
		TextColor3 = Color3.fromRGB(255, 255, 255),
		BackgroundTransparency = 1,
		TextScaled = true,
	}))
end
local function UndecillionDemo()
	local counter, setCounter = useState(0)
	local message, setMessage = useState("Hello Decillion!")
	-- @undecillion - This nested function won't be optimized
	local NestedSkippedComponent = function(_param)
		local LayoutOrder = _param.LayoutOrder
		return React.createElement("frame", {
			Size = UDim2.new(1, 0, 0, 60),
			BackgroundColor3 = Color3.fromRGB(80, 80, 80),
			LayoutOrder = LayoutOrder,
		}, React.createElement("textlabel", {
			Text = "🚫 Nested: Marked with @undecillion",
			Size = UDim2.new(1, 0, 1, 0),
			TextColor3 = Color3.fromRGB(255, 255, 255),
			BackgroundTransparency = 1,
			TextScaled = true,
		}))
	end
	return React.createElement("frame", {
		Size = UDim2.new(1, 0, 1, 0),
		BackgroundColor3 = Color3.fromRGB(20, 20, 20),
	}, React.createElement("uilistlayout", {
		SortOrder = Enum.SortOrder.LayoutOrder,
		Padding = UDim.new(0, 5),
	}), React.createElement("textlabel", {
		Text = "@undecillion Decorator Examples",
		Size = UDim2.new(1, 0, 0, 40),
		TextColor3 = Color3.fromRGB(255, 255, 255),
		BackgroundColor3 = Color3.fromRGB(40, 40, 40),
		TextScaled = true,
		LayoutOrder = 1,
	}), React.createElement("frame", {
		Size = UDim2.new(1, 0, 0, 50),
		BackgroundColor3 = Color3.fromRGB(30, 30, 30),
		LayoutOrder = 2,
	}, React.createElement("textbutton", {
		Text = `Counter: {counter}`,
		Size = UDim2.new(0.5, -5, 1, 0),
		Position = UDim2.new(0, 0, 0, 0),
		BackgroundColor3 = Color3.fromRGB(60, 120, 60),
		TextColor3 = Color3.fromRGB(255, 255, 255),
		TextScaled = true,
		Event = {
			MouseButton1Click = function()
				return setCounter(counter + 1)
			end,
		},
	}), React.createElement("textbutton", {
		Text = "Update Message",
		Size = UDim2.new(0.5, -5, 1, 0),
		Position = UDim2.new(0.5, 5, 0, 0),
		BackgroundColor3 = Color3.fromRGB(120, 60, 60),
		TextColor3 = Color3.fromRGB(255, 255, 255),
		TextScaled = true,
		Event = {
			MouseButton1Click = function()
				return setMessage(`Updated {counter}`)
			end,
		},
	})), React.createElement(SkippedDecoratorComponent, {
		LayoutOrder = 3,
	}), React.createElement(SkippedArrowFunction, {
		message = message,
		LayoutOrder = 4,
	}), React.createElement(JSDocSkippedComponent, {
		count = counter,
		LayoutOrder = 5,
	}), React.createElement(OptimizedComponent, {
		title = `Dynamic content {counter}`,
		LayoutOrder = 6,
	}), React.createElement(NestedSkippedComponent, {
		LayoutOrder = 7,
	}), React.createElement("frame", {
		Size = UDim2.new(1, 0, 0, 80),
		BackgroundColor3 = Color3.fromRGB(25, 25, 25),
		LayoutOrder = 8,
	}, React.createElement("textlabel", {
		Text = `🚫 = Skipped by @undecillion (not optimized)\
⚡ = Optimized by Decillion\
\
Use @undecillion to skip transformation for specific components while keeping others optimized.`,
		Size = UDim2.new(1, -10, 1, -10),
		Position = UDim2.new(0, 5, 0, 5),
		TextColor3 = Color3.fromRGB(200, 200, 200),
		BackgroundTransparency = 1,
		TextWrapped = true,
		TextYAlignment = Enum.TextYAlignment.Top,
		TextXAlignment = Enum.TextXAlignment.Left,
	})))
end
return {
	react = React,
	reactRoblox = ReactRoblox,
	story = UndecillionDemo,
}
