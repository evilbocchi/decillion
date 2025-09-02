-- Compiled with roblox-ts v3.0.0
local TS = require(game:GetService("ReplicatedStorage"):WaitForChild("rbxts_include"):WaitForChild("RuntimeLib"))
local _runtime = TS.import(script, game:GetService("ReplicatedStorage"), "rbxts_include", "node_modules", "@decillion", "runtime", "out")
local createStaticElement = _runtime.createStaticElement
local useMemoizedBlock = _runtime.useMemoizedBlock
local _react = TS.import(script, game:GetService("ReplicatedStorage"), "rbxts_include", "node_modules", "@rbxts", "react")
local React = _react
local useState = _react.useState
local ReactRoblox = TS.import(script, game:GetService("ReplicatedStorage"), "rbxts_include", "node_modules", "@rbxts", "react-roblox")
local STATIC_PROPS_TEXTLABEL_kci9kd = {
	Text = "🚫 Decorator: NOT optimized by Decillion",
	Size = UDim2.new(1, 0, 1, 0),
	TextColor3 = Color3.fromRGB(255, 255, 255),
	BackgroundTransparency = 1,
	TextScaled = true,
}
local STATIC_PROPS_TEXTLABEL_jez817 = {
	Text = "🚫 Nested: Marked with @undecillion",
	Size = UDim2.new(1, 0, 1, 0),
	TextColor3 = Color3.fromRGB(255, 255, 255),
	BackgroundTransparency = 1,
	TextScaled = true,
}
local STATIC_PROPS_TEXTLABEL_2tgmks = {
	Text = "@undecillion Decorator Examples",
	Size = UDim2.new(1, 0, 0, 40),
	TextColor3 = Color3.fromRGB(255, 255, 255),
	BackgroundColor3 = Color3.fromRGB(40, 40, 40),
	TextScaled = true,
	LayoutOrder = 1,
}
local STATIC_PROPS_TEXTBUTTON_kou6z9 = {
	Text = "Update Message",
	Position = UDim2.new(0.5, 5, 0, 0),
	BackgroundColor3 = Color3.fromRGB(120, 60, 60),
	TextColor3 = Color3.fromRGB(255, 255, 255),
	TextScaled = true,
}
local STATIC_PROPS_TEXTLABEL_t3jq4g = {
	Position = UDim2.new(0, 5, 0, 5),
	TextColor3 = Color3.fromRGB(200, 200, 200),
	BackgroundTransparency = 1,
	TextWrapped = true,
}
local STATIC_PROPS_FRAME_yji1yi = {
	Size = UDim2.new(1, 0, 0, 80),
	BackgroundColor3 = Color3.fromRGB(25, 25, 25),
	LayoutOrder = 8,
}
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
	return useMemoizedBlock(function(LayoutOrder)
		return React.createElement("frame", {
			Size = UDim2.new(1, 0, 0, 60),
			BackgroundColor3 = Color3.fromRGB(100, 50, 50),
			LayoutOrder = LayoutOrder,
		}, createStaticElement("textlabel", STATIC_PROPS_TEXTLABEL_kci9kd))
	end, { LayoutOrder }, "dynamic_frame_cwciziao6")
end
-- Example 2: Comment-style for arrow functions
-- @undecillion - Skip transformation
local SkippedArrowFunction = function(_param)
	local message = _param.message
	local LayoutOrder = _param.LayoutOrder
	return useMemoizedBlock(function(LayoutOrder, message)
		return React.createElement("frame", {
			Size = UDim2.new(1, 0, 0, 60),
			BackgroundColor3 = Color3.fromRGB(50, 100, 50),
			LayoutOrder = LayoutOrder,
		}, useMemoizedBlock(function(message)
			return React.createElement("textlabel", {
				Text = `🚫 Arrow: {message}`,
				Size = UDim2.new(1, 0, 1, 0),
				TextColor3 = Color3.fromRGB(255, 255, 255),
				BackgroundTransparency = 1,
				TextScaled = true,
			})
		end, { message }, "dynamic_textlabel_a6an4llbz"))
	end, { LayoutOrder, message }, "dynamic_frame_csq05vut3")
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
	return useMemoizedBlock(function(LayoutOrder, count)
		return React.createElement("frame", {
			Size = UDim2.new(1, 0, 0, 60),
			BackgroundColor3 = Color3.fromRGB(50, 50, 100),
			LayoutOrder = LayoutOrder,
		}, useMemoizedBlock(function(count)
			return React.createElement("textlabel", {
				Text = `🚫 JSDoc: Count = {count}`,
				Size = UDim2.new(1, 0, 1, 0),
				TextColor3 = Color3.fromRGB(255, 255, 255),
				BackgroundTransparency = 1,
				TextScaled = true,
			})
		end, { count }, "dynamic_textlabel_ftpaa18lv"))
	end, { LayoutOrder, count }, "dynamic_frame_lz923uc0o")
end
-- Example 4: Regular component (WILL be optimized by Decillion)
local function OptimizedComponent(_param)
	local title = _param.title
	local LayoutOrder = _param.LayoutOrder
	return useMemoizedBlock(function(LayoutOrder, title)
		return React.createElement("frame", {
			Size = UDim2.new(1, 0, 0, 60),
			BackgroundColor3 = Color3.fromRGB(100, 100, 50),
			LayoutOrder = LayoutOrder,
		}, useMemoizedBlock(function(title)
			return React.createElement("textlabel", {
				Text = `⚡ Optimized: {title}`,
				Size = UDim2.new(1, 0, 1, 0),
				TextColor3 = Color3.fromRGB(255, 255, 255),
				BackgroundTransparency = 1,
				TextScaled = true,
			})
		end, { title }, "dynamic_textlabel_q6saa7253"))
	end, { LayoutOrder, title }, "dynamic_frame_545gc3qgx")
end
local function UndecillionDemo()
	local counter, setCounter = useState(0)
	local message, setMessage = useState("Hello Decillion!")
	-- @undecillion - This nested function won't be optimized
	local NestedSkippedComponent = function(_param)
		local LayoutOrder = _param.LayoutOrder
		return useMemoizedBlock(function(LayoutOrder)
			return React.createElement("frame", {
				Size = UDim2.new(1, 0, 0, 60),
				BackgroundColor3 = Color3.fromRGB(80, 80, 80),
				LayoutOrder = LayoutOrder,
			}, createStaticElement("textlabel", STATIC_PROPS_TEXTLABEL_jez817))
		end, { LayoutOrder }, "dynamic_frame_nb0tgxb0d")
	end
	return useMemoizedBlock(function(counter, SkippedDecoratorComponent, SkippedArrowFunction, message, JSDocSkippedComponent, OptimizedComponent, NestedSkippedComponent)
		return React.createElement("frame", {
			Size = UDim2.new(1, 0, 1, 0),
			BackgroundColor3 = Color3.fromRGB(20, 20, 20),
		}, createStaticElement("uilistlayout", nil), createStaticElement("textlabel", STATIC_PROPS_TEXTLABEL_2tgmks), useMemoizedBlock(function(counter)
			return React.createElement("frame", {
				Size = UDim2.new(1, 0, 0, 50),
				BackgroundColor3 = Color3.fromRGB(30, 30, 30),
				LayoutOrder = 2,
			}, useMemoizedBlock(function(counter)
				return React.createElement("textbutton", {
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
				})
			end, { counter }, "dynamic_textbutton_9wpkxx2il"), createStaticElement("textbutton", STATIC_PROPS_TEXTBUTTON_kou6z9))
		end, { counter }, "dynamic_frame_ynmd481z8"), React.createElement(SkippedDecoratorComponent, {
			LayoutOrder = 3,
		}), useMemoizedBlock(function(SkippedArrowFunction, message)
			return React.createElement(SkippedArrowFunction, {
				message = message,
				LayoutOrder = 4,
			})
		end, { SkippedArrowFunction, message }, "dynamic_SkippedArrowFunction_7osjdgkhh"), useMemoizedBlock(function(JSDocSkippedComponent, counter)
			return React.createElement(JSDocSkippedComponent, {
				count = counter,
				LayoutOrder = 5,
			})
		end, { JSDocSkippedComponent, counter }, "dynamic_JSDocSkippedComponent_zrr6f3yhf"), useMemoizedBlock(function(OptimizedComponent, counter)
			return React.createElement(OptimizedComponent, {
				title = `Dynamic content {counter}`,
				LayoutOrder = 6,
			})
		end, { OptimizedComponent, counter }, "dynamic_OptimizedComponent_a2evnts65"), React.createElement(NestedSkippedComponent, {
			LayoutOrder = 7,
		}), createStaticElement("frame", STATIC_PROPS_FRAME_yji1yi, createStaticElement("textlabel", STATIC_PROPS_TEXTLABEL_t3jq4g)))
	end, { counter, SkippedDecoratorComponent, SkippedArrowFunction, message, JSDocSkippedComponent, OptimizedComponent, NestedSkippedComponent }, "dynamic_frame_s9r6v15j5")
end
return {
	react = React,
	reactRoblox = ReactRoblox,
	story = UndecillionDemo,
}
