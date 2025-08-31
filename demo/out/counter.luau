-- Compiled with roblox-ts v3.0.0
local TS = _G[script]
local _react = TS.import(script, TS.getModule(script, "@rbxts", "react"))
local React = _react
local useState = _react.useState
local _decillion_runtime = TS.import(script, TS.getModule(script, "@rbxts", "decillion-runtime").out)
local getCacheStats = _decillion_runtime.getCacheStats
local createBlock = _decillion_runtime.createBlock
-- This will be optimized by our transformer
local function OptimizedApp()
	local count, setCount = useState(0)
	local increment = function()
		return setCount(count + 1)
	end
	local decrement = function()
		return setCount(count - 1)
	end
	-- Demonstrate runtime optimization by showing cache stats
	local cacheStats = getCacheStats()
	-- Create an optimized static block for the header
	local renderHeader = createBlock(function()
		return React.createElement("frame", {
			BackgroundColor3 = Color3.fromRGB(50, 50, 50),
			Size = UDim2.new(1, 0, 0, 50),
		}, React.createElement("textlabel", {
			Text = "Optimized Counter App",
			TextColor3 = Color3.fromRGB(255, 255, 255),
			BackgroundTransparency = 1,
			Size = UDim2.new(1, 0, 1, 0),
		}))
	end)
	-- Create an optimized static block for the performance panel
	local renderPerformancePanel = createBlock(function()
		return React.createElement("frame", {
			Size = UDim2.new(1, 0, 0, 100),
			Position = UDim2.new(0, 0, 0, 160),
			BackgroundColor3 = Color3.fromRGB(60, 60, 60),
		}, React.createElement("textlabel", {
			Text = `Performance: Decillion Optimized - Blocks: {cacheStats.totalBlocks}, Hit Rate: {math.floor(cacheStats.cacheHitRate * 100)}%`,
			TextColor3 = Color3.fromRGB(200, 200, 200),
			BackgroundTransparency = 1,
			Size = UDim2.new(1, 0, 1, 0),
		}))
	end, {
		blockType = "static-performance",
	})
	return React.createElement("frame", {
		Size = UDim2.new(1, 0, 1, 0),
		BackgroundColor3 = Color3.fromRGB(30, 30, 30),
	}, renderHeader(), React.createElement("textlabel", {
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
	}), renderPerformancePanel())
end
return {
	default = OptimizedApp,
}
