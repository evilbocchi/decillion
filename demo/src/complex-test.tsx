import { OnInit, Service } from "@flamework/core";
import React, { useState } from "@rbxts/react";
import ReactRoblox from "@rbxts/react-roblox";
import { Workspace } from "@rbxts/services";

@Service()
export default class ComplexFlameworkComponent implements OnInit {
    private count = 0;

    createComplexUI() {
        return (
            <frame Size={new UDim2(1, 0, 1, 0)} BackgroundColor3={Color3.fromRGB(50, 50, 50)}>
                {/* Static header - should be optimized by Decillion */}
                <textlabel 
                    Text="Complex Flamework + Decillion Component"
                    TextColor3={Color3.fromRGB(255, 255, 255)}
                    BackgroundTransparency={1}
                    Size={new UDim2(1, 0, 0, 40)}
                />
                
                {/* Dynamic counter display */}
                <textlabel
                    Text={`Count: ${this.count}`}
                    TextColor3={Color3.fromRGB(255, 255, 255)}
                    BackgroundColor3={Color3.fromRGB(100, 100, 100)}
                    Size={new UDim2(1, 0, 0, 40)}
                    Position={new UDim2(0, 0, 0, 50)}
                />

                {/* Static footer - should be optimized by Decillion */}
                <frame 
                    Size={new UDim2(1, 0, 0, 40)} 
                    Position={new UDim2(0, 0, 0, 100)}
                    BackgroundColor3={Color3.fromRGB(30, 30, 30)}
                >
                    <textlabel
                        Text="Powered by Flamework + Decillion"
                        TextColor3={Color3.fromRGB(200, 200, 200)}
                        BackgroundTransparency={1}
                        Size={new UDim2(1, 0, 1, 0)}
                    />
                </frame>
            </frame>
        );
    }

    increment() {
        this.count++;
        // Re-render would happen here in a real scenario
    }

    onInit() {
        print("ComplexFlameworkComponent initialized!");
        print(`Service instance count: ${this.count}`);
        ReactRoblox.createRoot(Workspace).render(this.createComplexUI());
    }
}