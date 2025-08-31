-- Compiled with roblox-ts v3.0.0
local TS = _G[script]
local React = TS.import(script, TS.getModule(script, "@rbxts", "react"))
local function TestImport()
	return React.createElement("frame", nil, React.createElement("textlabel", {
		Text = "Test",
	}))
end
return {
	default = TestImport,
}
