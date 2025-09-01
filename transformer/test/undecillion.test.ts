import { describe, it, expect } from "vitest";
import * as ts from "typescript";
import { hasUndecillionDecorator, getFunctionName } from "../src/transformer";

describe("@undecillion decorator detection", () => {
    function createSourceFile(code: string): ts.SourceFile {
        return ts.createSourceFile(
            "test.tsx",
            code,
            ts.ScriptTarget.ES2020,
            true,
            ts.ScriptKind.TSX
        );
    }

    function findFunctionInFile(sourceFile: ts.SourceFile): ts.FunctionDeclaration | ts.ArrowFunction | null {
        let foundFunction: ts.FunctionDeclaration | ts.ArrowFunction | null = null;
        
        function visit(node: ts.Node) {
            if (ts.isFunctionDeclaration(node) || ts.isArrowFunction(node)) {
                if (!foundFunction) { // Get the first one found
                    foundFunction = node;
                }
                return;
            }
            ts.forEachChild(node, visit);
        }
        
        visit(sourceFile);
        return foundFunction;
    }

    it("should detect @undecillion comment before function declaration", () => {
        const code = `
// @undecillion
function TestComponent() {
    return <div>test</div>;
}`;
        
        const sourceFile = createSourceFile(code);
        const functionNode = findFunctionInFile(sourceFile);
        
        expect(functionNode).toBeTruthy();
        expect(hasUndecillionDecorator(functionNode!)).toBe(true);
    });

    it("should detect @undecillion comment before arrow function", () => {
        const code = `
// @undecillion - Skip transformation
const TestComponent = () => {
    return <div>test</div>;
};`;
        
        const sourceFile = createSourceFile(code);
        const functionNode = findFunctionInFile(sourceFile);
        
        expect(functionNode).toBeTruthy();
        expect(hasUndecillionDecorator(functionNode!)).toBe(true);
    });

    it("should detect @undecillion in JSDoc comment", () => {
        const code = `
/**
 * Test component
 * @undecillion
 */
function TestComponent() {
    return <div>test</div>;
}`;
        
        const sourceFile = createSourceFile(code);
        const functionNode = findFunctionInFile(sourceFile);
        
        expect(functionNode).toBeTruthy();
        expect(hasUndecillionDecorator(functionNode!)).toBe(true);
    });

    it("should not detect @undecillion when not present", () => {
        const code = `
function TestComponent() {
    return <div>test</div>;
}`;
        
        const sourceFile = createSourceFile(code);
        const functionNode = findFunctionInFile(sourceFile);
        
        expect(functionNode).toBeTruthy();
        expect(hasUndecillionDecorator(functionNode!)).toBe(false);
    });

    it("should not detect @undecillion in distant comments", () => {
        const code = `
// @undecillion - This is too far away

const someOtherCode = true;

function TestComponent() {
    return <div>test</div>;
}`;
        
        const sourceFile = createSourceFile(code);
        const functionNode = findFunctionInFile(sourceFile);
        
        expect(functionNode).toBeTruthy();
        expect(hasUndecillionDecorator(functionNode!)).toBe(false);
    });

    it("should get function name from function declaration", () => {
        const code = `
function TestComponent() {
    return <div>test</div>;
}`;
        
        const sourceFile = createSourceFile(code);
        const functionNode = findFunctionInFile(sourceFile);
        
        expect(functionNode).toBeTruthy();
        expect(getFunctionName(functionNode!)).toBe("TestComponent");
    });

    it("should get function name from variable declaration with arrow function", () => {
        const code = `
const TestComponent = () => {
    return <div>test</div>;
};`;
        
        const sourceFile = createSourceFile(code);
        const functionNode = findFunctionInFile(sourceFile);
        
        expect(functionNode).toBeTruthy();
        expect(getFunctionName(functionNode!)).toBe("TestComponent");
    });
});
