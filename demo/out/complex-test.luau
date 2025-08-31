-- Compiled with roblox-ts v3.0.0
local TS = _G[script]
-- Optimized by Decillion - static elements converted to createStaticElement calls
local Service = TS.import(script, TS.getModule(script, "@flamework", "core").out).Service
local React = TS.import(script, TS.getModule(script, "@rbxts", "react"))
local ReactRoblox = TS.import(script, TS.getModule(script, "@rbxts", "react-roblox"))
local Workspace = TS.import(script, TS.getModule(script, "@rbxts", "services")).Workspace
local createStaticElement = TS.import(script, TS.getModule(script, "@rbxts", "decillion-runtime").out).createStaticElement
local ComplexFlameworkComponent
do
	ComplexFlameworkComponent = setmetatable({}, {
		__tostring = function()
			return "ComplexFlameworkComponent"
		end,
	})
	ComplexFlameworkComponent.__index = ComplexFlameworkComponent
	function ComplexFlameworkComponent.new(...)
		local self = setmetatable({}, ComplexFlameworkComponent)
		return self:constructor(...) or self
	end
	function ComplexFlameworkComponent:constructor()
		self.count = 0
	end
	function ComplexFlameworkComponent:createComplexUI()
		return React.createElement("frame", {
			Size = UDim2.new(1, 0, 1, 0),
			BackgroundColor3 = Color3.fromRGB(50, 50, 50),
		}, createStaticElement("textlabel", {
			Text = "Complex Flamework + Decillion Component",
			TextColor3 = Color3.fromRGB(255, 255, 255),
			BackgroundTransparency = 1,
			Size = UDim2.new(1, 0, 0, 40),
		}), React.createElement("textlabel", {
			Text = `Count: {self.count}`,
			TextColor3 = Color3.fromRGB(255, 255, 255),
			BackgroundColor3 = Color3.fromRGB(100, 100, 100),
			Size = UDim2.new(1, 0, 0, 40),
			Position = UDim2.new(0, 0, 0, 50),
		}), React.createElement("frame", {
			Size = UDim2.new(1, 0, 0, 40),
			Position = UDim2.new(0, 0, 0, 100),
			BackgroundColor3 = Color3.fromRGB(30, 30, 30),
		}, createStaticElement("textlabel", {
			Text = "Powered by Flamework + Decillion",
			TextColor3 = Color3.fromRGB(200, 200, 200),
			BackgroundTransparency = 1,
			Size = UDim2.new(1, 0, 1, 0),
		})))
	end
	function ComplexFlameworkComponent:increment()
		self.count += 1
		-- Re-render would happen here in a real scenario
	end
	function ComplexFlameworkComponent:onInit()
		print("ComplexFlameworkComponent initialized!")
		print(`Service instance count: {self.count}`)
		ReactRoblox.createRoot(Workspace):render(self:createComplexUI())
	end
	ComplexFlameworkComponent = Service()(ComplexFlameworkComponent) or ComplexFlameworkComponent
end
return {
	default = ComplexFlameworkComponent,
}
