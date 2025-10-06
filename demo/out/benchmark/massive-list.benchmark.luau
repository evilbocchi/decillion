-- Compiled with roblox-ts v3.0.0
local TS = require(game:GetService("ReplicatedStorage"):WaitForChild("rbxts_include"):WaitForChild("RuntimeLib"))
local useFinePatchBlock = TS.import(script, game:GetService("ReplicatedStorage"), "rbxts_include", "node_modules", "@decillion", "runtime", "out").useFinePatchBlock
local _react = TS.import(script, game:GetService("ReplicatedStorage"), "rbxts_include", "node_modules", "@rbxts", "react")
local React = _react
local useState = _react.useState
--[[
	*
	 * Benchmark: Massive List Rendering
	 * Tests: Large list performance with and without optimization
	 
]]
-- Traditional React approach (for comparison) - skipped by @undecillion
-- @undecillion
local function TraditionalListItem(_param)
	local id = _param.id
	local name = _param.name
	local value = _param.value
	local isActive = _param.isActive
	return React.createElement("frame", {
		Size = UDim2.new(1, 0, 0, 40),
		BackgroundColor3 = if isActive then Color3.fromRGB(100, 150, 100) else Color3.fromRGB(80, 80, 80),
	}, React.createElement("textlabel", {
		Text = `{name}: {value}`,
		Size = UDim2.new(0.8, 0, 1, 0),
		TextColor3 = Color3.fromRGB(255, 255, 255),
		BackgroundTransparency = 1,
	}), React.createElement("textlabel", {
		Text = `#{id}`,
		Size = UDim2.new(0.2, 0, 1, 0),
		Position = UDim2.new(0.8, 0, 0, 0),
		TextColor3 = Color3.fromRGB(200, 200, 200),
		BackgroundTransparency = 1,
	}))
end
-- Optimized Decillion approach
local function OptimizedListItem(_param)
	local id = _param.id
	local name = _param.name
	local value = _param.value
	local isActive = _param.isActive
	return useFinePatchBlock(function(isActive, name, value, id)
		return React.createElement("frame", {
			Size = UDim2.new(1, 0, 0, 40),
			BackgroundColor3 = if isActive then Color3.fromRGB(100, 150, 100) else Color3.fromRGB(80, 80, 80),
		}, React.createElement("textlabel", {
			Text = `{name}: {value}`,
			Size = UDim2.new(0.8, 0, 1, 0),
			TextColor3 = Color3.fromRGB(255, 255, 255),
			BackgroundTransparency = 1,
		}), React.createElement("textlabel", {
			Text = `#{id}`,
			Size = UDim2.new(0.2, 0, 1, 0),
			Position = UDim2.new(0.8, 0, 0, 0),
			TextColor3 = Color3.fromRGB(200, 200, 200),
			BackgroundTransparency = 1,
		}))
	end, { isActive, name, value, id }, { {
		elementPath = {},
		edits = { {
			type = 8,
			dependencyKey = "isActive",
			propName = "BackgroundColor3",
			path = {},
		} },
	}, {
		elementPath = { 0, 0 },
		edits = { {
			type = 1,
			dependencyKey = "name",
			propName = "Text",
			path = { 0, 0 },
		} },
	}, {
		elementPath = { 0, 1 },
		edits = { {
			type = 1,
			dependencyKey = "id",
			propName = "Text",
			path = { 0, 1 },
		} },
	} }, "dynamic_frame_73bz0ezrr")
end
local function MassiveListBenchmark()
	local itemCount, setItemCount = useState(1000)
	local useOptimized, setUseOptimized = useState(true)
	local updateTrigger, setUpdateTrigger = useState(0)
	local renderTime, setRenderTime = useState(0)
	-- Generate test data
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
				name = `Item {i}`,
				value = math.random(1, 1000),
				isActive = math.random() > 0.7,
			}
			table.insert(items, _arg0)
		end
	end
	local triggerUpdate = function()
		local startTime = tick()
		setUpdateTrigger(updateTrigger + 1)
		-- Measure render time (simplified)
		task.spawn(function()
			task.wait()
			setRenderTime((tick() - startTime) * 1000)
		end)
	end
	local ListComponent = if useOptimized then OptimizedListItem else TraditionalListItem
	return useFinePatchBlock(function(itemCount, useOptimized, triggerUpdate, renderTime, items, ListComponent)
		return React.createElement("frame", {
			Size = UDim2.new(1, 0, 1, 0),
			BackgroundColor3 = Color3.fromRGB(20, 20, 20),
		}, useFinePatchBlock(function(itemCount, useOptimized, triggerUpdate, renderTime)
			return React.createElement("frame", {
				Size = UDim2.new(1, 0, 0, 100),
				BackgroundColor3 = Color3.fromRGB(40, 40, 40),
			}, React.createElement("textlabel", {
				Text = `Massive List Benchmark - {itemCount} Items`,
				Size = UDim2.new(1, 0, 0, 30),
				TextColor3 = Color3.fromRGB(255, 255, 255),
				BackgroundTransparency = 1,
			}), React.createElement("textbutton", {
				Text = if useOptimized then "Using Optimized" else "Using Traditional",
				Size = UDim2.new(0.3, 0, 0, 30),
				Position = UDim2.new(0, 0, 0, 35),
				BackgroundColor3 = if useOptimized then Color3.fromRGB(0, 150, 0) else Color3.fromRGB(150, 150, 0),
				TextColor3 = Color3.fromRGB(255, 255, 255),
				Event = {
					MouseButton1Click = function()
						return setUseOptimized(not useOptimized)
					end,
				},
			}), React.createElement("textbutton", {
				Text = "Trigger Re-render",
				Size = UDim2.new(0.3, 0, 0, 30),
				Position = UDim2.new(0.35, 0, 0, 35),
				BackgroundColor3 = Color3.fromRGB(100, 100, 150),
				TextColor3 = Color3.fromRGB(255, 255, 255),
				Event = {
					MouseButton1Click = triggerUpdate,
				},
			}), React.createElement("textlabel", {
				Text = `Last Render: {string.format("%.3f", renderTime)}ms`,
				Size = UDim2.new(0.3, 0, 0, 30),
				Position = UDim2.new(0.7, 0, 0, 35),
				TextColor3 = Color3.fromRGB(200, 200, 200),
				BackgroundTransparency = 1,
			}), React.createElement("textlabel", {
				Text = `Items: {itemCount}`,
				Size = UDim2.new(0.5, 0, 0, 30),
				Position = UDim2.new(0, 0, 0, 70),
				TextColor3 = Color3.fromRGB(200, 200, 200),
				BackgroundTransparency = 1,
			}))
		end, { itemCount, useOptimized, triggerUpdate, renderTime }, { {
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
				dependencyKey = "triggerUpdate",
				propName = "Event",
				path = { 0, 2 },
			} },
		}, {
			elementPath = { 0, 3 },
			edits = { {
				type = 1,
				dependencyKey = "renderTime",
				propName = "Text",
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
		} }, "dynamic_frame_286c8u4xu"), useFinePatchBlock(function(itemCount, items, ListComponent)
			local _exp = {
				Size = UDim2.new(1, 0, 1, -100),
				Position = UDim2.new(0, 0, 0, 100),
				BackgroundColor3 = Color3.fromRGB(30, 30, 30),
				CanvasSize = UDim2.new(0, 0, 0, itemCount * 45),
				ScrollBarThickness = 10,
			}
			local _exp_1 = React.createElement("uilistlayout", {
				SortOrder = Enum.SortOrder.LayoutOrder,
				Padding = UDim.new(0, 5),
			})
			-- ▼ ReadonlyArray.map ▼
			local _newValue = table.create(#items)
			local _callback = function(item, index)
				local _attributes = {
					key = `item-{item.id}-{updateTrigger}`,
				}
				for _k, _v in item do
					_attributes[_k] = _v
				end
				return React.createElement(ListComponent, _attributes)
			end
			for _k, _v in items do
				_newValue[_k] = _callback(_v, _k - 1, items)
			end
			-- ▲ ReadonlyArray.map ▲
			return React.createElement("scrollingframe", _exp, _exp_1, _newValue)
		end, { itemCount, items, ListComponent }, { {
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
		} }, "dynamic_scrollingframe_a3yjgudsn"))
	end, { itemCount, useOptimized, triggerUpdate, renderTime, items, ListComponent }, { {
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
			dependencyKey = "triggerUpdate",
			propName = "Event",
			path = { 0, 0, 2 },
		} },
	}, {
		elementPath = { 0, 0, 3 },
		edits = { {
			type = 1,
			dependencyKey = "renderTime",
			propName = "Text",
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
	} }, "dynamic_frame_0admk4o4r")
end
-- Alternative ways to use @undecillion
-- Comment-style for arrow functions
-- @undecillion - Skip transformation for this component
local SkippedArrowComponent = function(_param)
	local text = _param.text
	return React.createElement("textlabel", {
		Text = text,
		Size = UDim2.new(1, 0, 0, 30),
		BackgroundTransparency = 1,
		TextColor3 = Color3.fromRGB(255, 255, 255),
	})
end
-- JSDoc-style documentation
--[[
	*
	 * @undecillion
	 * This component will not be optimized by Decillion
	 
]]
local function DocumentedSkippedComponent()
	return React.createElement("frame", {
		Size = UDim2.new(1, 0, 0, 50),
	}, React.createElement("textlabel", {
		Text = "This won't be optimized",
	}))
end
return {
	default = MassiveListBenchmark,
}
