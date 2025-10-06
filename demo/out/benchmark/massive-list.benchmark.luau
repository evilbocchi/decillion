-- Compiled with roblox-ts v3.0.0
local TS = require(game:GetService("ReplicatedStorage"):WaitForChild("rbxts_include"):WaitForChild("RuntimeLib"))
local useFinePatchBlock = TS.import(script, game:GetService("ReplicatedStorage"), "rbxts_include", "node_modules", "@decillion", "runtime", "out").useFinePatchBlock
local _react = TS.import(script, game:GetService("ReplicatedStorage"), "rbxts_include", "node_modules", "@rbxts", "react")
local React = _react
local useState = _react.useState
local useMemo = _react.useMemo
local useVirtualList = TS.import(script, game:GetService("ReplicatedStorage"), "rbxts_include", "node_modules", "@decillion", "runtime", "out").useVirtualList
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
	local layoutOrder = _param.layoutOrder
	return React.createElement("frame", {
		Size = UDim2.new(1, 0, 0, 40),
		BackgroundColor3 = if isActive then Color3.fromRGB(100, 150, 100) else Color3.fromRGB(80, 80, 80),
		LayoutOrder = layoutOrder,
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
	local layoutOrder = _param.layoutOrder
	return useFinePatchBlock(function(isActive, layoutOrder, name, value, id)
		return React.createElement("frame", {
			Size = UDim2.new(1, 0, 0, 40),
			BackgroundColor3 = if isActive then Color3.fromRGB(100, 150, 100) else Color3.fromRGB(80, 80, 80),
			LayoutOrder = layoutOrder,
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
	end, { isActive, layoutOrder, name, value, id }, { {
		elementPath = {},
		edits = { {
			type = 8,
			dependencyKey = "isActive",
			propName = "BackgroundColor3",
			path = {},
		}, {
			type = 1,
			dependencyKey = "layoutOrder",
			propName = "LayoutOrder",
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
	} }, "dynamic_frame_n9yr06b60")
end
local function MassiveListBenchmark()
	local itemCount, setItemCount = useState(1000)
	local useOptimized, setUseOptimized = useState(true)
	local updateTrigger, setUpdateTrigger = useState(0)
	local renderTime, setRenderTime = useState(0)
	local ITEM_HEIGHT = 45
	-- Generate test data
	local items = useMemo(function()
		local generated = {}
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
				table.insert(generated, _arg0)
			end
		end
		return generated
	end, { itemCount, updateTrigger })
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
	local virtualList = useVirtualList({
		items = items,
		itemHeight = ITEM_HEIGHT,
		overscan = 6,
	})
	local baseLayoutOrder = virtualList.range.start * 2
	local visibleCount = #virtualList.visibleItems
	return useFinePatchBlock(function(itemCount, useOptimized, triggerUpdate, renderTime, baseLayoutOrder, virtualList, visibleCount)
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
			}), React.createElement("textbutton", {
				Text = `Items: {itemCount}`,
				Size = UDim2.new(0.3, 0, 0, 30),
				Position = UDim2.new(0, 0, 0, 70),
				BackgroundColor3 = Color3.fromRGB(80, 120, 180),
				TextColor3 = Color3.fromRGB(255, 255, 255),
				Event = {
					MouseButton1Click = function()
						return setItemCount(function(current)
							return if current >= 5000 then 1000 else current + 1000
						end)
					end,
				},
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
		} }, "dynamic_frame_l2to0lehr"), useFinePatchBlock(function(baseLayoutOrder, virtualList, visibleCount)
			local _exp = {
				Size = UDim2.new(1, 0, 1, -100),
				Position = UDim2.new(0, 0, 0, 100),
				BackgroundColor3 = Color3.fromRGB(30, 30, 30),
				ScrollBarThickness = 10,
			}
			local _exp_1 = React.createElement("uilistlayout", {
				SortOrder = Enum.SortOrder.LayoutOrder,
				Padding = UDim.new(0, 5),
			})
			local _exp_2 = useFinePatchBlock(function(baseLayoutOrder, virtualList)
				return React.createElement("frame", {
					LayoutOrder = baseLayoutOrder,
					Size = UDim2.new(1, 0, 0, virtualList.beforeSpacerHeight),
					BackgroundTransparency = 1,
				})
			end, { baseLayoutOrder, virtualList }, { {
				elementPath = {},
				edits = { {
					type = 1,
					dependencyKey = "baseLayoutOrder",
					propName = "LayoutOrder",
					path = {},
				}, {
					type = 1,
					dependencyKey = "virtualList",
					propName = "Size",
					path = {},
				} },
			} }, "dynamic_frame_96t5oo709")
			local _exp_3 = virtualList.visibleItems
			-- ▼ ReadonlyArray.map ▼
			local _newValue = table.create(#_exp_3)
			local _callback = function(virtualItem, visibleIndex)
				local _binding = virtualItem
				local item = _binding.item
				local _attributes = {
					key = `item-{item.id}`,
				}
				for _k, _v in item do
					_attributes[_k] = _v
				end
				_attributes.layoutOrder = baseLayoutOrder + visibleIndex * 2 + 1
				return React.createElement(ListComponent, _attributes)
			end
			for _k, _v in _exp_3 do
				_newValue[_k] = _callback(_v, _k - 1, _exp_3)
			end
			-- ▲ ReadonlyArray.map ▲
			return React.createElement("scrollingframe", _exp, _exp_1, _exp_2, _newValue, useFinePatchBlock(function(baseLayoutOrder, visibleCount, virtualList)
				return React.createElement("frame", {
					LayoutOrder = baseLayoutOrder + visibleCount * 2 + 1,
					Size = UDim2.new(1, 0, 0, virtualList.afterSpacerHeight),
					BackgroundTransparency = 1,
				})
			end, { baseLayoutOrder, visibleCount, virtualList }, { {
				elementPath = {},
				edits = { {
					type = 1,
					dependencyKey = "baseLayoutOrder",
					propName = "LayoutOrder",
					path = {},
				}, {
					type = 1,
					dependencyKey = "virtualList",
					propName = "Size",
					path = {},
				} },
			} }, "dynamic_frame_ytscngc7q"))
		end, { baseLayoutOrder, virtualList, visibleCount }, { {
			elementPath = { 0, 1 },
			edits = { {
				type = 1,
				dependencyKey = "baseLayoutOrder",
				propName = "LayoutOrder",
				path = { 0, 1 },
			}, {
				type = 1,
				dependencyKey = "virtualList",
				propName = "Size",
				path = { 0, 1 },
			} },
		}, {
			elementPath = { 0 },
			edits = { {
				type = 2,
				dependencyKey = "virtualList",
				index = 2,
				path = { 0, 2 },
			} },
		}, {
			elementPath = { 0, 3 },
			edits = { {
				type = 1,
				dependencyKey = "baseLayoutOrder",
				propName = "LayoutOrder",
				path = { 0, 3 },
			}, {
				type = 1,
				dependencyKey = "virtualList",
				propName = "Size",
				path = { 0, 3 },
			} },
		} }, "dynamic_scrollingframe_g68cmil6a"))
	end, { itemCount, useOptimized, triggerUpdate, renderTime, baseLayoutOrder, virtualList, visibleCount }, { {
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
		elementPath = { 0, 1, 1 },
		edits = { {
			type = 1,
			dependencyKey = "baseLayoutOrder",
			propName = "LayoutOrder",
			path = { 0, 1, 1 },
		}, {
			type = 1,
			dependencyKey = "virtualList",
			propName = "Size",
			path = { 0, 1, 1 },
		} },
	}, {
		elementPath = { 0, 1 },
		edits = { {
			type = 2,
			dependencyKey = "virtualList",
			index = 2,
			path = { 0, 1, 2 },
		} },
	}, {
		elementPath = { 0, 1, 3 },
		edits = { {
			type = 1,
			dependencyKey = "baseLayoutOrder",
			propName = "LayoutOrder",
			path = { 0, 1, 3 },
		}, {
			type = 1,
			dependencyKey = "virtualList",
			propName = "Size",
			path = { 0, 1, 3 },
		} },
	} }, "dynamic_frame_64biizil8")
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
