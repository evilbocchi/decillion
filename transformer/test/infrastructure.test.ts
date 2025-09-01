import { describe, it, expect } from 'vitest';

describe('Test Infrastructure', () => {
    it('should have working test environment', () => {
        expect(true).toBe(true);
    });

    it('should have Roblox globals available', () => {
        expect(UDim2).toBeDefined();
        expect(Vector2).toBeDefined();
        expect(Color3).toBeDefined();
        expect(React).toBeDefined();
    });

    it('should be able to create Roblox objects', () => {
        const udim = UDim2.new(1, 0, 1, 0);
        expect(udim.scaleX).toBe(1);
        expect(udim.offsetX).toBe(0);

        const vector = Vector2.new(10, 20);
        expect(vector.x).toBe(10);
        expect(vector.y).toBe(20);

        const color = Color3.fromRGB(255, 128, 0);
        expect(color.r).toBe(1);
        expect(color.g).toBeCloseTo(0.5, 2);
        expect(color.b).toBe(0);
    });

    it('should be able to create React elements', () => {
        const element = React.createElement('textlabel', { Text: 'Hello' });
        expect(element.type).toBe('textlabel');
        expect(element.props.Text).toBe('Hello');
    });
});
