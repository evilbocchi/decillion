import { OnInit, Service } from "@flamework/core";
import React from "@rbxts/react";
import ReactRoblox from "@rbxts/react-roblox";
import { Workspace } from "@rbxts/services";

@Service()
export default class FlameworkClass implements OnInit {
    createStaticElement() {
        return (
            <frame>
                <textlabel Text="Static Element" />
            </frame>
        );
    }

    onInit() {
        print("FlameworkClass initialized!");
        ReactRoblox.createRoot(Workspace).render(this.createStaticElement());
    }
}
