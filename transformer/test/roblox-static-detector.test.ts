import { describe, it, expect, beforeEach } from 'vitest';
import * as ts from 'typescript';

// Import the class directly to create a new instance for testing
import { robloxStaticDetector } from '../src/roblox-static-detector';

describe('RobloxStaticDetector', () => {    
    beforeEach(() => {
        // Initialize with a simple empty program to trigger fallback mode
        const emptyProgram = ts.createProgram([], {}, ts.createCompilerHost({}));
        robloxStaticDetector.initialize(emptyProgram);
    });

    function createCallExpression(code: string): ts.CallExpression | undefined {
        const sourceFile = ts.createSourceFile('test.ts', code, ts.ScriptTarget.Latest);
        let callExpression: ts.CallExpression | undefined;
        
        const visit = (node: ts.Node) => {
            if (ts.isCallExpression(node)) {
                callExpression = node;
            }
            ts.forEachChild(node, visit);
        };
        visit(sourceFile);
        
        return callExpression;
    }

    function createNewExpression(code: string): ts.NewExpression | undefined {
        const sourceFile = ts.createSourceFile('test.ts', code, ts.ScriptTarget.Latest);
        let newExpression: ts.NewExpression | undefined;
        
        const visit = (node: ts.Node) => {
            if (ts.isNewExpression(node)) {
                newExpression = node;
            }
            ts.forEachChild(node, visit);
        };
        visit(sourceFile);
        
        return newExpression;
    }

    describe('isStaticRobloxCall', () => {
        it('should detect Color3.fromRGB as static', () => {
            const callExpression = createCallExpression('Color3.fromRGB(255, 0, 0)');
            expect(callExpression).toBeDefined();
            expect(robloxStaticDetector.isStaticRobloxCall(callExpression!)).toBe(true);
        });

        it('should detect Color3.new as static', () => {
            const callExpression = createCallExpression('Color3.new(1, 0, 0)');
            expect(callExpression).toBeDefined();
            expect(robloxStaticDetector.isStaticRobloxCall(callExpression!)).toBe(true);
        });

        it('should detect UDim2.fromScale as static', () => {
            const callExpression = createCallExpression('UDim2.fromScale(0.5, 0.5)');
            expect(callExpression).toBeDefined();
            expect(robloxStaticDetector.isStaticRobloxCall(callExpression!)).toBe(true);
        });

        it('should not detect non-Roblox calls as static', () => {
            const callExpression = createCallExpression('Math.random()');
            expect(callExpression).toBeDefined();
            expect(robloxStaticDetector.isStaticRobloxCall(callExpression!)).toBe(false);
        });
    });

    describe('isStaticRobloxNew', () => {
        it('should detect new Color3() as static', () => {
            const newExpression = createNewExpression('new Color3(1, 0, 0)');
            expect(newExpression).toBeDefined();
            expect(robloxStaticDetector.isStaticRobloxNew(newExpression!)).toBe(true);
        });

        it('should detect new Vector2() as static', () => {
            const newExpression = createNewExpression('new Vector2(100, 200)');
            expect(newExpression).toBeDefined();
            expect(robloxStaticDetector.isStaticRobloxNew(newExpression!)).toBe(true);
        });

        it('should not detect non-Roblox constructors as static', () => {
            const newExpression = createNewExpression('new Date()');
            expect(newExpression).toBeDefined();
            expect(robloxStaticDetector.isStaticRobloxNew(newExpression!)).toBe(false);
        });
    });
});
