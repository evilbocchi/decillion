-- Compiled with roblox-ts v3.0.0
local TS = require(game:GetService("ReplicatedStorage"):WaitForChild("rbxts_include"):WaitForChild("RuntimeLib"))
local _runtime = TS.import(script, game:GetService("ReplicatedStorage"), "rbxts_include", "node_modules", "@decillion", "runtime", "out")
local createStaticElement = _runtime.createStaticElement
local useMemoizedBlock = _runtime.useMemoizedBlock
local _react = TS.import(script, game:GetService("ReplicatedStorage"), "rbxts_include", "node_modules", "@rbxts", "react")
local React = _react
local useState = _react.useState
-- Static declarations - extracted from render functions for optimal performance
local STATIC_PROPS_TEXTLABEL_h5h0qv = {
	Text = "Check console for render times. Optimized should be significantly faster!",
	Size = UDim2.new(1, 0, 0, 20),
	Position = UDim2.new(0, 0, 0, 55),
	TextColor3 = Color3.fromRGB(200, 200, 200),
	BackgroundTransparency = 1,
}
local STATIC_ELEMENT_TEXTLABEL_zey1ls = createStaticElement("TextLabel", STATIC_PROPS_TEXTLABEL_h5h0qv)
--[[
	*
	 * Simple Performance Test: Shows the clear difference between optimized and unoptimized rendering
	 
]]
-- @undecillion
-- Traditional component - no optimization
local function UnoptimizedItem(_param)
	local id = _param.id
	local text = _param.text
	local isHighlighted = _param.isHighlighted
	return React.createElement("frame", {
		Size = UDim2.new(1, 0, 0, 30),
		BackgroundColor3 = if isHighlighted then Color3.fromRGB(100, 100, 200) else Color3.fromRGB(50, 50, 50),
	}, React.createElement("textlabel", {
		Text = text,
		Size = UDim2.new(1, 0, 1, 0),
		TextColor3 = Color3.fromRGB(255, 255, 255),
		BackgroundTransparency = 1,
	}))
end
-- Optimized component - uses Decillion
local function OptimizedItem(_param)
	local id = _param.id
	local text = _param.text
	local isHighlighted = _param.isHighlighted
	return useMemoizedBlock(function(isHighlighted, text)
		return React.createElement("frame", {
			Size = UDim2.new(1, 0, 0, 30),
			BackgroundColor3 = if isHighlighted then Color3.fromRGB(100, 100, 200) else Color3.fromRGB(50, 50, 50),
		}, React.createElement("textlabel", {
			Text = text,
			Size = UDim2.new(1, 0, 1, 0),
			TextColor3 = Color3.fromRGB(255, 255, 255),
			BackgroundTransparency = 1,
		}))
	end, { isHighlighted, text }, "dynamic_frame_exj728egs")
end
local function SimplePerformanceTest()
	local itemCount, setItemCount = useState(500)
	local useOptimized, setUseOptimized = useState(true)
	local renderTrigger, setRenderTrigger = useState(0)
	local highlightIndex, setHighlightIndex = useState(0)
	-- Generate test items
	local items = {}
	do
		local i = 0
		local _shouldIncrement = false
		while true do
			if _shouldIncrement then
				i += 1
			else
				_shouldIncrement = true
			end
			if not (i < itemCount) then
				break
			end
			local _arg0 = {
				id = i,
				text = `Item {i}`,
				isHighlighted = i == highlightIndex,
			}
			table.insert(items, _arg0)
		end
	end
	local triggerRender = function()
		local start = tick()
		setRenderTrigger(renderTrigger + 1)
		-- Move highlight to next item
		setHighlightIndex((highlightIndex + 1) % itemCount)
		task.spawn(function()
			task.wait()
			local elapsed = (tick() - start) * 1000
			print(`Render time: {string.format("%.2f", elapsed)}ms ({if useOptimized then "Optimized" else "Unoptimized"})`)
		end)
	end
	local ItemComponent = if useOptimized then OptimizedItem else UnoptimizedItem
	return React.createElement("frame", {
		Size = UDim2.new(1, 0, 1, 0),
		BackgroundColor3 = Color3.fromRGB(20, 20, 20),
	}, React.createElement("frame", {
		Size = UDim2.new(1, 0, 0, 80),
		BackgroundColor3 = Color3.fromRGB(40, 40, 40),
	}, React.createElement("textlabel", {
		Text = `Simple Performance Test - {itemCount} Items`,
		Size = UDim2.new(1, 0, 0, 25),
		TextColor3 = Color3.fromRGB(255, 255, 255),
		BackgroundTransparency = 1,
	}), React.createElement("textbutton", {
		Text = if useOptimized then "Optimized (Decillion)" else "Unoptimized (Plain React)",
		Size = UDim2.new(0.3, 0, 0, 25),
		Position = UDim2.new(0, 0, 0, 30),
		BackgroundColor3 = if useOptimized then Color3.fromRGB(0, 150, 0) else Color3.fromRGB(150, 0, 0),
		TextColor3 = Color3.fromRGB(255, 255, 255),
		Event = {
			MouseButton1Click = function()
				return setUseOptimized(not useOptimized)
			end,
		},
	}), React.createElement("textbutton", {
		Text = "Trigger Render Test",
		Size = UDim2.new(0.3, 0, 0, 25),
		Position = UDim2.new(0.35, 0, 0, 30),
		BackgroundColor3 = Color3.fromRGB(100, 100, 150),
		TextColor3 = Color3.fromRGB(255, 255, 255),
		Event = {
			MouseButton1Click = triggerRender,
		},
	}), React.createElement("textbutton", {
		Text = `Items: {itemCount}`,
		Size = UDim2.new(0.3, 0, 0, 25),
		Position = UDim2.new(0.7, 0, 0, 30),
		BackgroundColor3 = Color3.fromRGB(100, 100, 100),
		TextColor3 = Color3.fromRGB(255, 255, 255),
		Event = {
			MouseButton1Click = function()
				return setItemCount(if itemCount == 100 then 500 elseif itemCount == 500 then 1000 else 100)
			end,
		},
	}), STATIC_ELEMENT_TEXTLABEL_zey1ls), useMemoizedBlock(function(itemCount, items, ItemComponent)
		local _exp = {
			Size = UDim2.new(1, 0, 1, -80),
			Position = UDim2.new(0, 0, 0, 80),
			BackgroundColor3 = Color3.fromRGB(30, 30, 30),
			CanvasSize = UDim2.new(0, 0, 0, itemCount * 35),
			ScrollBarThickness = 8,
		}
		local _exp_1 = React.createElement("uilistlayout", {
			SortOrder = Enum.SortOrder.LayoutOrder,
			Padding = UDim.new(0, 2),
		})
		-- ▼ ReadonlyArray.map ▼
		local _newValue = table.create(#items)
		local _callback = function(item)
			return React.createElement(ItemComponent, {
				key = `item-{item.id}-{renderTrigger}`,
				id = item.id,
				text = item.text,
				isHighlighted = item.isHighlighted,
			})
		end
		for _k, _v in items do
			_newValue[_k] = _callback(_v, _k - 1, items)
		end
		-- ▲ ReadonlyArray.map ▲
		return React.createElement("scrollingframe", _exp, _exp_1, _newValue)
	end, { itemCount, items, ItemComponent }, "dynamic_scrollingframe_ofg059k84"))
end
return {
	default = SimplePerformanceTest,
}
