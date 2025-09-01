-- Compiled with roblox-ts v3.0.0
local TS = require(game:GetService("ReplicatedStorage"):WaitForChild("rbxts_include"):WaitForChild("RuntimeLib"))
local createStaticElement = TS.import(script, game:GetService("ReplicatedStorage"), "rbxts_include", "node_modules", "@decillion", "runtime", "out").createStaticElement
local Reflect = TS.import(script, game:GetService("ReplicatedStorage"), "rbxts_include", "node_modules", "@flamework", "core", "out").Reflect
local Service = TS.import(script, game:GetService("ReplicatedStorage"), "rbxts_include", "node_modules", "@flamework", "core", "out").Service
local ReactRoblox = TS.import(script, game:GetService("ReplicatedStorage"), "rbxts_include", "node_modules", "@rbxts", "react-roblox")
local Workspace = TS.import(script, game:GetService("ReplicatedStorage"), "rbxts_include", "node_modules", "@rbxts", "services").Workspace
local STATIC_PROPS_TEXTLABEL_4kyyln = {
	Text = "Static Element",
}
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
		return createStaticElement("frame", nil, createStaticElement("textlabel", STATIC_PROPS_TEXTLABEL_4kyyln))
	end
	function FlameworkClass:onInit()
		print("FlameworkClass initialized!")
		ReactRoblox.createRoot(Workspace):render(self:createStaticElement())
	end
	do
		-- (Flamework) FlameworkClass metadata
		Reflect.defineMetadata(FlameworkClass, "identifier", "flamework-class@FlameworkClass")
		Reflect.defineMetadata(FlameworkClass, "flamework:implements", { "$:flamework@OnInit" })
	end
end
-- (Flamework) FlameworkClass decorators
Reflect.decorate(FlameworkClass, "$:flamework@Service", Service, {})
return {
	default = FlameworkClass,
}
