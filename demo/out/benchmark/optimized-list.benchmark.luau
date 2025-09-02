-- Compiled with roblox-ts v3.0.0
local TS = require(game:GetService("ReplicatedStorage"):WaitForChild("rbxts_include"):WaitForChild("RuntimeLib"))
local _runtime = TS.import(script, game:GetService("ReplicatedStorage"), "rbxts_include", "node_modules", "@decillion", "runtime", "out")
local createStaticElement = _runtime.createStaticElement
local useFinePatchBlock = _runtime.useFinePatchBlock
local _react = TS.import(script, game:GetService("ReplicatedStorage"), "rbxts_include", "node_modules", "@rbxts", "react")
local React = _react
local useState = _react.useState
local useEffect = _react.useEffect
-- Static declarations - extracted from render functions for optimal performance
local STATIC_PROPS_TEXTBUTTON_vlmv01 = {
	Text = "Toggle First Item",
	Size = UDim2.new(0.25, 0, 0, 25),
	Position = UDim2.new(0.5, 0, 0, 30),
	BackgroundColor3 = Color3.fromRGB(150, 100, 100),
	TextColor3 = Color3.fromRGB(255, 255, 255),
}
local STATIC_PROPS_TEXTLABEL_24k0mj = {
	Text = "Click individual items to toggle them. Notice how Decillion only updates changed items.",
	Size = UDim2.new(1, 0, 0, 50),
	Position = UDim2.new(0, 0, 0, 60),
	TextColor3 = Color3.fromRGB(200, 200, 200),
	BackgroundTransparency = 1,
	TextWrapped = true,
}
local STATIC_ELEMENT_TEXTBUTTON_gcu5ea = createStaticElement("TextButton", STATIC_PROPS_TEXTBUTTON_vlmv01)
local STATIC_ELEMENT_TEXTLABEL_vxbyj3 = createStaticElement("TextLabel", STATIC_PROPS_TEXTLABEL_24k0mj)
--[[
	*
	 * Advanced List Optimization Benchmark
	 * Demonstrates the impact of different optimization strategies
	 
]]
-- Pure traditional approach (no optimization at all)
local function TraditionalListItem(_param)
	local id = _param.id
	local name = _param.name
	local value = _param.value
	local isActive = _param.isActive
	local onToggle = _param.onToggle
	return useFinePatchBlock(function(isActive, name, value)
		return React.createElement("frame", {
			Size = UDim2.new(1, 0, 0, 40),
			BackgroundColor3 = if isActive then Color3.fromRGB(100, 150, 100) else Color3.fromRGB(80, 80, 80),
		}, React.createElement("textlabel", {
			Text = `{name}: {value}`,
			Size = UDim2.new(0.8, 0, 1, 0),
			TextColor3 = Color3.fromRGB(255, 255, 255),
			BackgroundTransparency = 1,
		}), React.createElement("textbutton", {
			Text = if isActive then "Active" else "Inactive",
			Size = UDim2.new(0.2, 0, 1, 0),
			Position = UDim2.new(0.8, 0, 0, 0),
			TextColor3 = Color3.fromRGB(255, 255, 255),
			BackgroundColor3 = if isActive then Color3.fromRGB(0, 100, 0) else Color3.fromRGB(100, 0, 0),
			Event = {
				MouseButton1Click = function()
					return onToggle(id)
				end,
			},
		}))
	end, { isActive, name, value }, { {
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
			dependencyKey = "isActive",
			propName = "Text",
			path = { 0, 1 },
		}, {
			type = 8,
			dependencyKey = "isActive",
			propName = "BackgroundColor3",
			path = { 0, 1 },
		} },
	} }, "dynamic_frame_p80rkkbxz")
end
-- Decillion optimized approach
local function OptimizedListItem(_param)
	local id = _param.id
	local name = _param.name
	local value = _param.value
	local isActive = _param.isActive
	local onToggle = _param.onToggle
	return useFinePatchBlock(function(isActive, name, value)
		return React.createElement("frame", {
			Size = UDim2.new(1, 0, 0, 40),
			BackgroundColor3 = if isActive then Color3.fromRGB(100, 150, 100) else Color3.fromRGB(80, 80, 80),
		}, React.createElement("textlabel", {
			Text = `{name}: {value}`,
			Size = UDim2.new(0.8, 0, 1, 0),
			TextColor3 = Color3.fromRGB(255, 255, 255),
			BackgroundTransparency = 1,
		}), React.createElement("textbutton", {
			Text = if isActive then "Active" else "Inactive",
			Size = UDim2.new(0.2, 0, 1, 0),
			Position = UDim2.new(0.8, 0, 0, 0),
			TextColor3 = Color3.fromRGB(255, 255, 255),
			BackgroundColor3 = if isActive then Color3.fromRGB(0, 100, 0) else Color3.fromRGB(100, 0, 0),
			Event = {
				MouseButton1Click = function()
					return onToggle(id)
				end,
			},
		}))
	end, { isActive, name, value }, { {
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
			dependencyKey = "isActive",
			propName = "Text",
			path = { 0, 1 },
		}, {
			type = 8,
			dependencyKey = "isActive",
			propName = "BackgroundColor3",
			path = { 0, 1 },
		} },
	} }, "dynamic_frame_i9i06fude")
end
local function OptimizedListBenchmark()
	local itemCount, setItemCount = useState(100)
	local useOptimized, setUseOptimized = useState(true)
	local renderCount, setRenderCount = useState(0)
	local items, setItems = useState({})
	-- Initialize test data
	local toggleItem
	useEffect(function()
		local newItems = {}
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
					isActive = math.random() > 0.5,
					onToggle = function(id)
						return toggleItem(id)
					end,
				}
				table.insert(newItems, _arg0)
			end
		end
		setItems(newItems)
	end, { itemCount })
	toggleItem = function(id)
		setItems(function(prevItems)
			-- ▼ ReadonlyArray.map ▼
			local _newValue = table.create(#prevItems)
			local _callback = function(item)
				local _result
				if item.id == id then
					local _object = table.clone(item)
					setmetatable(_object, nil)
					_object.isActive = not item.isActive
					_result = _object
				else
					_result = item
				end
				return _result
			end
			for _k, _v in prevItems do
				_newValue[_k] = _callback(_v, _k - 1, prevItems)
			end
			-- ▲ ReadonlyArray.map ▲
			return _newValue
		end)
	end
	local triggerFullRerender = function()
		setRenderCount(renderCount + 1)
		-- Force all items to update their values
		setItems(function(prevItems)
			-- ▼ ReadonlyArray.map ▼
			local _newValue = table.create(#prevItems)
			local _callback = function(item)
				local _object = table.clone(item)
				setmetatable(_object, nil)
				_object.value = math.random(1, 1000)
				return _object
			end
			for _k, _v in prevItems do
				_newValue[_k] = _callback(_v, _k - 1, prevItems)
			end
			-- ▲ ReadonlyArray.map ▲
			return _newValue
		end)
	end
	local ListComponent = if useOptimized then OptimizedListItem else TraditionalListItem
	return useFinePatchBlock(function(itemCount, renderCount, useOptimized, triggerFullRerender, items, ListComponent)
		return React.createElement("frame", {
			Size = UDim2.new(1, 0, 1, 0),
			BackgroundColor3 = Color3.fromRGB(20, 20, 20),
		}, useFinePatchBlock(function(itemCount, renderCount, useOptimized, triggerFullRerender)
			return React.createElement("frame", {
				Size = UDim2.new(1, 0, 0, 120),
				BackgroundColor3 = Color3.fromRGB(40, 40, 40),
			}, React.createElement("textlabel", {
				Text = `Optimized List Benchmark - {itemCount} Items (Render: {renderCount})`,
				Size = UDim2.new(1, 0, 0, 25),
				TextColor3 = Color3.fromRGB(255, 255, 255),
				BackgroundTransparency = 1,
			}), React.createElement("textbutton", {
				Text = if useOptimized then "Using Optimized" else "Using Traditional",
				Size = UDim2.new(0.25, 0, 0, 25),
				Position = UDim2.new(0, 0, 0, 30),
				BackgroundColor3 = if useOptimized then Color3.fromRGB(0, 150, 0) else Color3.fromRGB(150, 150, 0),
				TextColor3 = Color3.fromRGB(255, 255, 255),
				Event = {
					MouseButton1Click = function()
						return setUseOptimized(not useOptimized)
					end,
				},
			}), React.createElement("textbutton", {
				Text = "Re-render All",
				Size = UDim2.new(0.25, 0, 0, 25),
				Position = UDim2.new(0.25, 0, 0, 30),
				BackgroundColor3 = Color3.fromRGB(100, 100, 150),
				TextColor3 = Color3.fromRGB(255, 255, 255),
				Event = {
					MouseButton1Click = triggerFullRerender,
				},
			}), STATIC_ELEMENT_TEXTBUTTON_gcu5ea, React.createElement("textbutton", {
				Text = `Items: {itemCount}`,
				Size = UDim2.new(0.25, 0, 0, 25),
				Position = UDim2.new(0.75, 0, 0, 30),
				BackgroundColor3 = Color3.fromRGB(100, 100, 100),
				TextColor3 = Color3.fromRGB(255, 255, 255),
				Event = {
					MouseButton1Click = function()
						return setItemCount(if itemCount == 100 then 500 elseif itemCount == 500 then 1000 else 100)
					end,
				},
			}), STATIC_ELEMENT_TEXTLABEL_vxbyj3)
		end, { itemCount, renderCount, useOptimized, triggerFullRerender }, { {
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
				dependencyKey = "triggerFullRerender",
				propName = "Event",
				path = { 0, 2 },
			} },
		}, {
			elementPath = { 0, 4 },
			edits = { {
				type = 1,
				dependencyKey = "itemCount",
				propName = "Text",
				path = { 0, 4 },
			} },
		} }, "dynamic_frame_yoozgqlvg"), useFinePatchBlock(function(itemCount, items, ListComponent)
			local _exp = {
				Size = UDim2.new(1, 0, 1, -120),
				Position = UDim2.new(0, 0, 0, 120),
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
			local _callback = function(item)
				return React.createElement(ListComponent, {
					key = `item-{item.id}`,
					id = item.id,
					name = item.name,
					value = item.value,
					isActive = item.isActive,
					onToggle = item.onToggle,
				})
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
		} }, "dynamic_scrollingframe_llyauikz2"))
	end, { itemCount, renderCount, useOptimized, triggerFullRerender, items, ListComponent }, { {
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
			dependencyKey = "triggerFullRerender",
			propName = "Event",
			path = { 0, 0, 2 },
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
	} }, "dynamic_frame_eewgk54yp")
end
return {
	default = OptimizedListBenchmark,
}
