// Global test setup
import 'vitest';

// Mock React for runtime tests
const mockReact = {
    createElement: (type: any, props: any, ...children: any[]) => ({
        type, props, children,
        $$typeof: Symbol.for('react.element')
    })
};
(globalThis as any).React = mockReact;
export type React = typeof mockReact;

// Mock UDim2
class MockUDim2 {
    public X: number;
    public Width: number;
    public Y: number;
    public Height: number;

    constructor(xScale: number, xOffset: number, yScale: number, yOffset: number) {
        this.X = xScale;
        this.Width = xOffset;
        this.Y = yScale;
        this.Height = yOffset;
    }

    static new(xScale: number, xOffset: number, yScale: number, yOffset: number): MockUDim2 {
        return new MockUDim2(xScale, xOffset, yScale, yOffset);
    }
}

// Mock Vector2
class MockVector2 {
    public X: number;
    public Y: number;

    constructor(x: number, y: number) {
        this.X = x;
        this.Y = y;
    }

    static new(x: number, y: number): MockVector2 {
        return new MockVector2(x, y);
    }
}

// Mock Color3
class MockColor3 {
    public R: number;
    public G: number;
    public B: number;

    constructor(r: number, g: number, b: number) {
        this.R = r;
        this.G = g;
        this.B = b;
    }

    static new(r: number, g: number, b: number): MockColor3 {
        return new MockColor3(r, g, b);
    }

    static fromRGB(r: number, g: number, b: number): MockColor3 {
        return new MockColor3(r / 255, g / 255, b / 255);
    }

    static fromHSV(h: number, s: number, v: number): MockColor3 {
        // Simple HSV to RGB conversion
        const c = v * s;
        const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
        const m = v - c;

        let r = 0, g = 0, b = 0;

        if (0 <= h && h < 60) {
            r = c; g = x; b = 0;
        } else if (60 <= h && h < 120) {
            r = x; g = c; b = 0;
        } else if (120 <= h && h < 180) {
            r = 0; g = c; b = x;
        } else if (180 <= h && h < 240) {
            r = 0; g = x; b = c;
        } else if (240 <= h && h < 300) {
            r = x; g = 0; b = c;
        } else if (300 <= h && h < 360) {
            r = c; g = 0; b = x;
        }

        return new MockColor3(r + m, g + m, b + m);
    }
}

// Assign mocks to global objects
(globalThis as any).UDim2 = MockUDim2;
(globalThis as any).Vector2 = MockVector2;
(globalThis as any).Color3 = MockColor3;
// Assign mocks to global objects
(globalThis as any).UDim2 = MockUDim2;
(globalThis as any).Vector2 = MockVector2;
(globalThis as any).Color3 = MockColor3;
