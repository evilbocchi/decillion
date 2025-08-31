-- Compiled with roblox-ts v3.0.0
local TS = _G[script]
local Service = TS.import(script, TS.getModule(script, "@flamework", "core").out).Service
local React = TS.import(script, TS.getModule(script, "@rbxts", "react"))
local ReactRoblox = TS.import(script, TS.getModule(script, "@rbxts", "react-roblox"))
local Workspace = TS.import(script, TS.getModule(script, "@rbxts", "services")).Workspace
local FlameworkClass
do
	FlameworkClass = setmetatable({}, {
		__tostring = function()
			return "FlameworkClass"
		end,
	})
	FlameworkClass.__index = FlameworkClass
	function FlameworkClass.new(...)
		local self = setmetatable({}, FlameworkClass)
		return self:constructor(...) or self
	end
	function FlameworkClass:constructor()
	end
	function FlameworkClass:createStaticElement()
		return React.createElement("frame", nil, React.createElement("textlabel", {
			Text = "Static Element",
		}))
	end
	function FlameworkClass:onInit()
		print("FlameworkClass initialized!")
		ReactRoblox.createRoot(Workspace):render(self:createStaticElement())
	end
	FlameworkClass = Service()(FlameworkClass) or FlameworkClass
end
return {
	default = FlameworkClass,
}
