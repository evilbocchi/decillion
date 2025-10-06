-- Compiled with roblox-ts v3.0.0
local TS = require(game:GetService("ReplicatedStorage"):WaitForChild("rbxts_include"):WaitForChild("RuntimeLib"))
local _runtime = TS.import(script, game:GetService("ReplicatedStorage"), "rbxts_include", "node_modules", "@decillion", "runtime", "out")
local createStaticElement = _runtime.createStaticElement
local createStaticInstanceFactory = _runtime.createStaticInstanceFactory
local useFinePatchBlock = _runtime.useFinePatchBlock
local _react = TS.import(script, game:GetService("ReplicatedStorage"), "rbxts_include", "node_modules", "@rbxts", "react")
local React = _react
local useState = _react.useState
-- Static declarations - extracted from render functions for optimal performance
local STATIC_PROPS_TEXTLABEL_zqsm5r = {
	Text = "Use the buttons to reorder blocks without remounting.",
	Size = UDim2.new(1, 0, 0, 30),
	Position = UDim2.new(0, 0, 0, 80),
	TextColor3 = Color3.fromRGB(200, 200, 220),
	BackgroundTransparency = 1,
	TextWrapped = true,
}
local STATIC_ELEMENT_TEXTLABEL_87ft9l = createStaticElement("TextLabel", STATIC_PROPS_TEXTLABEL_zqsm5r)
local STATIC_INSTANCE_TEXTLABEL_qguxwy = createStaticInstanceFactory(STATIC_ELEMENT_TEXTLABEL_87ft9l)
local initialItems = { {
	key = "a",
	label = "Alpha",
	color = Color3.fromRGB(220, 70, 70),
}, {
	key = "b",
	label = "Bravo",
	color = Color3.fromRGB(70, 220, 120),
}, {
	key = "c",
	label = "Charlie",
	color = Color3.fromRGB(70, 130, 220),
}, {
	key = "d",
	label = "Delta",
	color = Color3.fromRGB(220, 200, 70),
} }
local function createShuffled(items)
	local _array = {}
	local _length = #_array
	table.move(items, 1, #items, _length + 1, _array)
	local clone = _array
	for i = #clone - 1, 1, -1 do
		local j = math.random(0, i)
		local temp = clone[i + 1]
		clone[i + 1] = clone[j + 1]
		clone[j + 1] = temp
	end
	return clone
end
local function MoveItemRow(_param)
	local item = _param.item
	local index = _param.index
	return useFinePatchBlock(function(index, item)
		return React.createElement("frame", {
			LayoutOrder = index,
			Size = UDim2.new(1, -20, 0, 46),
			Position = UDim2.new(0, 10, 0, 0),
			BackgroundColor3 = item.color,
			BorderSizePixel = 0,
		}, React.createElement("textlabel", {
			Text = `{item.label} ({string.upper(item.key)}) - #{index + 1}`,
			Size = UDim2.new(1, 0, 1, 0),
			TextColor3 = Color3.fromRGB(255, 255, 255),
			BackgroundTransparency = 1,
			TextSize = 20,
		}))
	end, { index, item }, { {
		elementPath = {},
		edits = { {
			type = 1,
			dependencyKey = "index",
			propName = "LayoutOrder",
			path = {},
		}, {
			type = 8,
			dependencyKey = "item",
			propName = "BackgroundColor3",
			path = {},
		} },
	}, {
		elementPath = { 0, 0 },
		edits = { {
			type = 1,
			dependencyKey = "item",
			propName = "Text",
			path = { 0, 0 },
		} },
	} }, "dynamic_frame_r9rirktxv")
end
local function MoveTestBenchmark()
	local items, setItems = useState(initialItems)
	local iteration, setIteration = useState(0)
	local rotateForward = function()
		if #items == 0 then
			return nil
		end
		local head = items[1]
		local rest = {}
		for i = 1, #items - 1 do
			local _arg0 = items[i + 1]
			table.insert(rest, _arg0)
		end
		local _array = {}
		local _length = #_array
		local _restLength = #rest
		table.move(rest, 1, _restLength, _length + 1, _array)
		_length += _restLength
		_array[_length + 1] = head
		setItems(_array)
		setIteration(function(count)
			return count + 1
		end)
	end
	local rotateBackward = function()
		if #items == 0 then
			return nil
		end
		local last = items[#items]
		local rest = {}
		for i = 0, #items - 2 do
			local _arg0 = items[i + 1]
			table.insert(rest, _arg0)
		end
		local _array = { last }
		local _length = #_array
		table.move(rest, 1, #rest, _length + 1, _array)
		setItems(_array)
		setIteration(function(count)
			return count + 1
		end)
	end
	local shuffleItems = function()
		setItems(createShuffled(items))
		setIteration(function(count)
			return count + 1
		end)
	end
	local swapMiddle = function()
		if #items < 2 then
			return nil
		end
		local _array = {}
		local _length = #_array
		table.move(items, 1, #items, _length + 1, _array)
		local clone = _array
		local mid = math.floor(#clone / 2)
		local first = mid - 1
		if first < 0 then
			return nil
		end
		local temp = clone[first + 1]
		clone[first + 1] = clone[mid + 1]
		clone[mid + 1] = temp
		setItems(clone)
		setIteration(function(count)
			return count + 1
		end)
	end
	return useFinePatchBlock(function(iteration, rotateForward, rotateBackward, swapMiddle, shuffleItems, items, MoveItemRow)
		return React.createElement("frame", {
			Size = UDim2.new(1, 0, 1, 0),
			BackgroundColor3 = Color3.fromRGB(20, 20, 30),
		}, useFinePatchBlock(function(iteration, rotateForward, rotateBackward, swapMiddle, shuffleItems)
			return React.createElement("frame", {
				Size = UDim2.new(1, 0, 0, 140),
				BackgroundColor3 = Color3.fromRGB(40, 40, 60),
			}, React.createElement("textlabel", {
				Text = `Move Operation Test (iteration {iteration})`,
				Size = UDim2.new(1, 0, 0, 30),
				TextColor3 = Color3.fromRGB(255, 255, 255),
				BackgroundTransparency = 1,
			}), React.createElement("textbutton", {
				Text = "Rotate Forward",
				Size = UDim2.new(0.24, 0, 0, 30),
				Position = UDim2.new(0, 0, 0, 40),
				BackgroundColor3 = Color3.fromRGB(60, 160, 220),
				TextColor3 = Color3.fromRGB(255, 255, 255),
				Event = {
					MouseButton1Click = rotateForward,
				},
			}), React.createElement("textbutton", {
				Text = "Rotate Backward",
				Size = UDim2.new(0.24, 0, 0, 30),
				Position = UDim2.new(0.26, 0, 0, 40),
				BackgroundColor3 = Color3.fromRGB(160, 120, 220),
				TextColor3 = Color3.fromRGB(255, 255, 255),
				Event = {
					MouseButton1Click = rotateBackward,
				},
			}), React.createElement("textbutton", {
				Text = "Swap Middle",
				Size = UDim2.new(0.24, 0, 0, 30),
				Position = UDim2.new(0.52, 0, 0, 40),
				BackgroundColor3 = Color3.fromRGB(220, 140, 120),
				TextColor3 = Color3.fromRGB(255, 255, 255),
				Event = {
					MouseButton1Click = swapMiddle,
				},
			}), React.createElement("textbutton", {
				Text = "Shuffle",
				Size = UDim2.new(0.24, 0, 0, 30),
				Position = UDim2.new(0.78, 0, 0, 40),
				BackgroundColor3 = Color3.fromRGB(120, 200, 160),
				TextColor3 = Color3.fromRGB(255, 255, 255),
				Event = {
					MouseButton1Click = shuffleItems,
				},
			}), STATIC_ELEMENT_TEXTLABEL_87ft9l)
		end, { iteration, rotateForward, rotateBackward, swapMiddle, shuffleItems }, { {
			elementPath = { 0, 0 },
			edits = { {
				type = 1,
				dependencyKey = "iteration",
				propName = "Text",
				path = { 0, 0 },
			} },
		}, {
			elementPath = { 0, 1 },
			edits = { {
				type = 4,
				dependencyKey = "rotateForward",
				propName = "Event",
				path = { 0, 1 },
			} },
		}, {
			elementPath = { 0, 2 },
			edits = { {
				type = 4,
				dependencyKey = "rotateBackward",
				propName = "Event",
				path = { 0, 2 },
			} },
		}, {
			elementPath = { 0, 3 },
			edits = { {
				type = 4,
				dependencyKey = "swapMiddle",
				propName = "Event",
				path = { 0, 3 },
			} },
		}, {
			elementPath = { 0, 4 },
			edits = { {
				type = 4,
				dependencyKey = "shuffleItems",
				propName = "Event",
				path = { 0, 4 },
			} },
		} }, "dynamic_frame_uacu8nchb"), useFinePatchBlock(function(items, MoveItemRow)
			local _exp = {
				Size = UDim2.new(1, 0, 1, -140),
				Position = UDim2.new(0, 0, 0, 140),
				BackgroundColor3 = Color3.fromRGB(30, 30, 40),
				CanvasSize = UDim2.new(0, 0, 0, #items * 50),
				ScrollBarThickness = 6,
			}
			local _exp_1 = React.createElement("uilistlayout", {
				SortOrder = Enum.SortOrder.LayoutOrder,
				Padding = UDim.new(0, 4),
			})
			-- ▼ ReadonlyArray.map ▼
			local _newValue = table.create(#items)
			local _callback = function(item, index)
				return React.createElement(MoveItemRow, {
					key = item.key,
					item = item,
					index = index,
				})
			end
			for _k, _v in items do
				_newValue[_k] = _callback(_v, _k - 1, items)
			end
			-- ▲ ReadonlyArray.map ▲
			return React.createElement("scrollingframe", _exp, _exp_1, _newValue)
		end, { items, MoveItemRow }, { {
			elementPath = {},
			edits = { {
				type = 1,
				dependencyKey = "items",
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
		} }, "dynamic_scrollingframe_rwiw6ximf"))
	end, { iteration, rotateForward, rotateBackward, swapMiddle, shuffleItems, items, MoveItemRow }, { {
		elementPath = { 0, 0, 0 },
		edits = { {
			type = 1,
			dependencyKey = "iteration",
			propName = "Text",
			path = { 0, 0, 0 },
		} },
	}, {
		elementPath = { 0, 0, 1 },
		edits = { {
			type = 4,
			dependencyKey = "rotateForward",
			propName = "Event",
			path = { 0, 0, 1 },
		} },
	}, {
		elementPath = { 0, 0, 2 },
		edits = { {
			type = 4,
			dependencyKey = "rotateBackward",
			propName = "Event",
			path = { 0, 0, 2 },
		} },
	}, {
		elementPath = { 0, 0, 3 },
		edits = { {
			type = 4,
			dependencyKey = "swapMiddle",
			propName = "Event",
			path = { 0, 0, 3 },
		} },
	}, {
		elementPath = { 0, 0, 4 },
		edits = { {
			type = 4,
			dependencyKey = "shuffleItems",
			propName = "Event",
			path = { 0, 0, 4 },
		} },
	}, {
		elementPath = { 0, 1 },
		edits = { {
			type = 1,
			dependencyKey = "items",
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
	} }, "dynamic_frame_86ss4jzop")
end
return {
	default = MoveTestBenchmark,
}
