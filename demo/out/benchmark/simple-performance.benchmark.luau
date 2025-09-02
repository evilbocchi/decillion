-- Compiled with roblox-ts v3.0.0
local TS = require(game:GetService("ReplicatedStorage"):WaitForChild("rbxts_include"):WaitForChild("RuntimeLib"))
local _runtime = TS.import(script, game:GetService("ReplicatedStorage"), "rbxts_include", "node_modules", "@decillion", "runtime", "out")
local createStaticElement = _runtime.createStaticElement
local useFinePatchBlock = _runtime.useFinePatchBlock
local _react = TS.import(script, game:GetService("ReplicatedStorage"), "rbxts_include", "node_modules", "@rbxts", "react")
local React = _react
local useState = _react.useState
-- Static declarations - extracted from render functions for optimal performance
local STATIC_PROPS_TEXTLABEL_phdbj7 = {
	Text = "Full re-render forces all items to recreate. Highlight-only should be much faster!",
	Size = UDim2.new(1, 0, 0, 20),
	Position = UDim2.new(0, 0, 0, 85),
	TextColor3 = Color3.fromRGB(200, 200, 200),
	BackgroundTransparency = 1,
}
local STATIC_ELEMENT_TEXTLABEL_j50j3c = createStaticElement("TextLabel", STATIC_PROPS_TEXTLABEL_phdbj7)
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
	return useFinePatchBlock(function(isHighlighted, text)
		return React.createElement("frame", {
			Size = UDim2.new(1, 0, 0, 30),
			BackgroundColor3 = if isHighlighted then Color3.fromRGB(100, 100, 200) else Color3.fromRGB(50, 50, 50),
		}, React.createElement("textlabel", {
			Text = text,
			Size = UDim2.new(1, 0, 1, 0),
			TextColor3 = Color3.fromRGB(255, 255, 255),
			BackgroundTransparency = 1,
		}))
	end, { isHighlighted, text }, { {
		elementPath = {},
		edits = { {
			type = 8,
			dependencyKey = "isHighlighted",
			propName = "BackgroundColor3",
			path = {},
		} },
	}, {
		elementPath = { 0, 0 },
		edits = { {
			type = 1,
			dependencyKey = "text",
			propName = "Text",
			path = { 0, 0 },
		} },
	} }, "dynamic_frame_jpwkoi7l8")
end
local function SimplePerformanceTest()
	local itemCount, setItemCount = useState(500)
	local useOptimized, setUseOptimized = useState(true)
	local renderTrigger, setRenderTrigger = useState(0)
	local highlightIndex, setHighlightIndex = useState(0)
	local lastRenderTime, setLastRenderTime = useState(0)
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
		-- Update states - React should batch these automatically in modern versions
		setRenderTrigger(renderTrigger + 1)
		setHighlightIndex((highlightIndex + 1) % itemCount)
		-- Use multiple frame waits to ensure render completion
		task.spawn(function()
			task.wait()
			task.wait()
			local elapsed = (tick() - start) * 1000
			setLastRenderTime(elapsed)
			print(`Render time: {string.format("%.2f", elapsed)}ms ({if useOptimized then "Optimized" else "Unoptimized"}) - Items: {itemCount}`)
		end)
	end
	-- Test just highlight changes (should be much faster)
	local triggerHighlightOnly = function()
		local start = tick()
		setHighlightIndex((highlightIndex + 1) % itemCount)
		task.spawn(function()
			task.wait()
			local elapsed = (tick() - start) * 1000
			print(`Highlight-only time: {string.format("%.2f", elapsed)}ms ({if useOptimized then "Optimized" else "Unoptimized"}) - Items: {itemCount}`)
		end)
	end
	local ItemComponent = if useOptimized then OptimizedItem else UnoptimizedItem
	return useFinePatchBlock(function(itemCount, lastRenderTime, useOptimized, triggerRender, triggerHighlightOnly, items, ItemComponent)
		return React.createElement("frame", {
			Size = UDim2.new(1, 0, 1, 0),
			BackgroundColor3 = Color3.fromRGB(20, 20, 20),
		}, useFinePatchBlock(function(itemCount, lastRenderTime, useOptimized, triggerRender, triggerHighlightOnly)
			return React.createElement("frame", {
				Size = UDim2.new(1, 0, 0, 110),
				BackgroundColor3 = Color3.fromRGB(40, 40, 40),
			}, React.createElement("textlabel", {
				Text = `Simple Performance Test - {itemCount} Items{if lastRenderTime > 0 then ` (Last: {string.format("%.1f", lastRenderTime)}ms)` else ""}`,
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
				Text = "Full Re-render Test",
				Size = UDim2.new(0.3, 0, 0, 25),
				Position = UDim2.new(0.35, 0, 0, 30),
				BackgroundColor3 = Color3.fromRGB(100, 100, 150),
				TextColor3 = Color3.fromRGB(255, 255, 255),
				Event = {
					MouseButton1Click = triggerRender,
				},
			}), React.createElement("textbutton", {
				Text = "Highlight-Only Test",
				Size = UDim2.new(0.3, 0, 0, 25),
				Position = UDim2.new(0.7, 0, 0, 30),
				BackgroundColor3 = Color3.fromRGB(150, 100, 100),
				TextColor3 = Color3.fromRGB(255, 255, 255),
				Event = {
					MouseButton1Click = triggerHighlightOnly,
				},
			}), React.createElement("textbutton", {
				Text = `Items: {itemCount}`,
				Size = UDim2.new(0.3, 0, 0, 25),
				Position = UDim2.new(0, 0, 0, 60),
				BackgroundColor3 = Color3.fromRGB(100, 100, 100),
				TextColor3 = Color3.fromRGB(255, 255, 255),
				Event = {
					MouseButton1Click = function()
						return setItemCount(if itemCount == 100 then 500 elseif itemCount == 500 then 1000 else 100)
					end,
				},
			}), STATIC_ELEMENT_TEXTLABEL_j50j3c)
		end, { itemCount, lastRenderTime, useOptimized, triggerRender, triggerHighlightOnly }, { {
			elementPath = { 0, 0 },
			edits = { {
				type = 1,
				dependencyKey = "itemCount",
				propName = "Text",
				path = { 0, 0 },
			} },
		}, {
			elementPath = { 0, 1 },
			edits = { {
				type = 1,
				dependencyKey = "useOptimized",
				propName = "Text",
				path = { 0, 1 },
			}, {
				type = 8,
				dependencyKey = "useOptimized",
				propName = "BackgroundColor3",
				path = { 0, 1 },
			} },
		}, {
			elementPath = { 0, 2 },
			edits = { {
				type = 4,
				dependencyKey = "triggerRender",
				propName = "Event",
				path = { 0, 2 },
			} },
		}, {
			elementPath = { 0, 3 },
			edits = { {
				type = 4,
				dependencyKey = "triggerHighlightOnly",
				propName = "Event",
				path = { 0, 3 },
			} },
		}, {
			elementPath = { 0, 4 },
			edits = { {
				type = 1,
				dependencyKey = "itemCount",
				propName = "Text",
				path = { 0, 4 },
			} },
		} }, "dynamic_frame_k2z0y3h71"), useFinePatchBlock(function(itemCount, items, ItemComponent)
			local _exp = {
				Size = UDim2.new(1, 0, 1, -110),
				Position = UDim2.new(0, 0, 0, 110),
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
		end, { itemCount, items, ItemComponent }, { {
			elementPath = {},
			edits = { {
				type = 1,
				dependencyKey = "itemCount",
				propName = "CanvasSize",
				path = {},
			} },
		}, {
			elementPath = { 0 },
			edits = { {
				type = 2,
				dependencyKey = "items",
				index = 1,
				path = { 0, 1 },
			} },
		} }, "dynamic_scrollingframe_rs66knlno"))
	end, { itemCount, lastRenderTime, useOptimized, triggerRender, triggerHighlightOnly, items, ItemComponent }, { {
		elementPath = { 0, 0, 0 },
		edits = { {
			type = 1,
			dependencyKey = "itemCount",
			propName = "Text",
			path = { 0, 0, 0 },
		} },
	}, {
		elementPath = { 0, 0, 1 },
		edits = { {
			type = 1,
			dependencyKey = "useOptimized",
			propName = "Text",
			path = { 0, 0, 1 },
		}, {
			type = 8,
			dependencyKey = "useOptimized",
			propName = "BackgroundColor3",
			path = { 0, 0, 1 },
		} },
	}, {
		elementPath = { 0, 0, 2 },
		edits = { {
			type = 4,
			dependencyKey = "triggerRender",
			propName = "Event",
			path = { 0, 0, 2 },
		} },
	}, {
		elementPath = { 0, 0, 3 },
		edits = { {
			type = 4,
			dependencyKey = "triggerHighlightOnly",
			propName = "Event",
			path = { 0, 0, 3 },
		} },
	}, {
		elementPath = { 0, 0, 4 },
		edits = { {
			type = 1,
			dependencyKey = "itemCount",
			propName = "Text",
			path = { 0, 0, 4 },
		} },
	}, {
		elementPath = { 0, 1 },
		edits = { {
			type = 1,
			dependencyKey = "itemCount",
			propName = "CanvasSize",
			path = { 0, 1 },
		} },
	}, {
		elementPath = { 0, 1 },
		edits = { {
			type = 2,
			dependencyKey = "items",
			index = 1,
			path = { 0, 1, 1 },
		} },
	} }, "dynamic_frame_sojph71co")
end
return {
	default = SimplePerformanceTest,
}
