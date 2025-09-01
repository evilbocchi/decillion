-- Compiled with roblox-ts v3.0.0
local TS = _G[script]
--Optimized by Decillion - static elements converted to createStaticElement calls
local Reflect = TS.import(script, TS.getModule(script, "@flamework", "core").out).Reflect
local Service = TS.import(script, TS.getModule(script, "@flamework", "core").out).Service
local React = TS.import(script, TS.getModule(script, "@rbxts", "react"))
local ReactRoblox = TS.import(script, TS.getModule(script, "@rbxts", "react-roblox"))
local Workspace = TS.import(script, TS.getModule(script, "@rbxts", "services")).Workspace
local createStaticElement = TS.import(script, TS.getModule(script, "@rbxts", "decillion-runtime").out).createStaticElement
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
		return React.createElement("frame", nil, createStaticElement("textlabel", {
			Text = "Static Element",
		}))
	end
	function FlameworkClass:onInit()
		print("FlameworkClass initialized!")
		ReactRoblox.createRoot(Workspace):render(self:createStaticElement())
	end
	do
		-- (Flamework) FlameworkClass metadata
		Reflect.defineMetadata(FlameworkClass, "identifier", "@rbxts/decillion-example:flamework-class@FlameworkClass")
		Reflect.defineMetadata(FlameworkClass, "flamework:implements", { "$:flamework@OnInit" })
	end
end
-- (Flamework) FlameworkClass decorators
Reflect.decorate(FlameworkClass, "$:flamework@Service", Service, {})
return {
	default = FlameworkClass,
}
