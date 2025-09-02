import * as ts from 'typescript';
import { beforeEach, describe, expect, it } from 'vitest';

// Import the class directly to create a new instance for testing
import { robloxStaticDetector } from '../src/roblox-static-detector';

describe('RobloxStaticDetector', () => {
    let program: ts.Program;

    beforeEach(() => {
        // Create a minimal TypeScript program for testing
        const sourceFile = ts.createSourceFile(
            'test.tsx',
            '',
            ts.ScriptTarget.Latest,
            true,
            ts.ScriptKind.TSX
        );

        program = ts.createProgram(['test.tsx'], {}, {
            getSourceFile: () => sourceFile,
            writeFile: () => { },
            getCurrentDirectory: () => '',
            getDirectories: () => [],
            fileExists: () => true,
            readFile: () => '',
            getCanonicalFileName: (fileName) => fileName,
            useCaseSensitiveFileNames: () => true,
            getNewLine: () => '\n',
            getDefaultLibFileName: () => 'lib.d.ts'
        });

        robloxStaticDetector.initialize(program, true);
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

    describe('isStaticRoblox', () => {
        it('should detect Color3.fromRGB as static', () => {
            const callExpression = createCallExpression('Color3.fromRGB(255, 0, 0)');
            expect(callExpression).toBeDefined();
            expect(robloxStaticDetector.isStaticRobloxCall(callExpression!)).toBe(true);
        });

        it('should detect Color3 constructor as static', () => {
            const newExpression = createNewExpression('new Color3(1, 0, 0)');
            expect(newExpression).toBeDefined();
            expect(robloxStaticDetector.isStaticRobloxNew(newExpression!)).toBe(true);
        });

        it('should detect UDim2.fromScale as static', () => {
            const callExpression = createCallExpression('UDim2.fromScale(0.5, 0.5)');
            expect(callExpression).toBeDefined();
            expect(robloxStaticDetector.isStaticRobloxCall(callExpression!)).toBe(true);
        });

        it('should detect new Vector2() as static', () => {
            const newExpression = createNewExpression('new Vector2(100, 200)');
            expect(newExpression).toBeDefined();
            expect(robloxStaticDetector.isStaticRobloxNew(newExpression!)).toBe(true);
        });

        it('should not detect non-Roblox calls as static', () => {
            const callExpression = createCallExpression('Math.random()');
            expect(callExpression).toBeDefined();
            expect(robloxStaticDetector.isStaticRobloxCall(callExpression!)).toBe(false);
        });

        it('should not detect non-Roblox constructors as static', () => {
            const newExpression = createNewExpression('new Date()');
            expect(newExpression).toBeDefined();
            expect(robloxStaticDetector.isStaticRobloxNew(newExpression!)).toBe(false);
        });

        it('should detect string.format as static', () => {
            const callExpression = createCallExpression('string.format("%.3f", 123.456)');
            expect(callExpression).toBeDefined();
            expect(robloxStaticDetector.isStaticRobloxCall(callExpression!)).toBe(true);
        });
    });
});
