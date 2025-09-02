/// <reference types="@rbxts/types" />
/// <reference types="./globals.d.ts" />
import { describe, expect, it } from "vitest";

describe("Test Infrastructure", () => {
    it("should have working test environment", () => {
        expect(true).toBe(true);
    });

    it("should have Roblox globals available", () => {
        expect(UDim2).toBeDefined();
        expect(Vector2).toBeDefined();
        expect(Color3).toBeDefined();
        expect(React).toBeDefined();
    });

    it("should be able to create Roblox objects", () => {
        const udim = new UDim2(1, 0, 1, 0);
        expect(udim.X).toBe(1);
        expect(udim.Width).toBe(0);

        const vector = new Vector2(10, 20);
        expect(vector.X).toBe(10);
        expect(vector.Y).toBe(20);

        const color = Color3.fromRGB(255, 128, 0);
        expect(color.R).toBe(1);
        expect(color.G).toBeCloseTo(0.5, 2);
        expect(color.B).toBe(0);
    });

    it("should be able to create React elements", () => {
        const element = React.createElement("textlabel", { Text: "Hello" });
        expect(element.type).toBe("textlabel");
        expect(element.props.Text).toBe("Hello");
    });
});
