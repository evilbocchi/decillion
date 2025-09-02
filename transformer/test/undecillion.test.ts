import * as ts from "typescript";
import { describe, expect, it } from "vitest";
import { getFunctionName, hasUndecillionDecorator } from "../src/transformer";

describe("@undecillion decorator detection", () => {
    function createSourceFile(code: string): ts.SourceFile {
        return ts.createSourceFile("test.tsx", code, ts.ScriptTarget.ES2020, true, ts.ScriptKind.TSX);
    }

    function findFunctionInFile(sourceFile: ts.SourceFile): ts.FunctionDeclaration | ts.ArrowFunction | null {
        let foundFunction: ts.FunctionDeclaration | ts.ArrowFunction | null = null;

        function visit(node: ts.Node) {
            if (ts.isFunctionDeclaration(node) || ts.isArrowFunction(node)) {
                if (!foundFunction) {
                    // Get the first one found
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
        expect(hasUndecillionDecorator(functionNode!, sourceFile)).toBe(true);
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
        expect(hasUndecillionDecorator(functionNode!, sourceFile)).toBe(true);
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
        expect(hasUndecillionDecorator(functionNode!, sourceFile)).toBe(true);
    });

    it("should detect @undecillion with exact demo format - TraditionalListItem", () => {
        const code = `
// Traditional React approach (for comparison) - skipped by @undecillion
// @undecillion
function TraditionalListItem({ id, name, value, isActive }: ListItemProps) {
    return (
        <frame
            Size={new UDim2(1, 0, 0, 40)}
            BackgroundColor3={isActive ? Color3.fromRGB(100, 150, 100) : Color3.fromRGB(80, 80, 80)}
        >
            <textlabel Text={\`\${name}: \${value}\`} />
        </frame>
    );
}`;

        const sourceFile = createSourceFile(code);
        const functionNode = findFunctionInFile(sourceFile);

        expect(functionNode).toBeTruthy();
        expect(hasUndecillionDecorator(functionNode!, sourceFile)).toBe(true);
    });

    it("should detect @undecillion with exact demo format - DocumentedSkippedComponent", () => {
        const code = `
/**
 * @undecillion
 * This component will not be optimized by Decillion
 */
function DocumentedSkippedComponent() {
    return (
        <frame Size={new UDim2(1, 0, 0, 50)}>
            <textlabel Text="This won't be optimized" />
        </frame>
    );
}`;

        const sourceFile = createSourceFile(code);
        const functionNode = findFunctionInFile(sourceFile);

        expect(functionNode).toBeTruthy();
        expect(hasUndecillionDecorator(functionNode!, sourceFile)).toBe(true);
    });

    it("should not detect @undecillion when not present", () => {
        const code = `
function TestComponent() {
    return <div>test</div>;
}`;

        const sourceFile = createSourceFile(code);
        const functionNode = findFunctionInFile(sourceFile);

        expect(functionNode).toBeTruthy();
        expect(hasUndecillionDecorator(functionNode!, sourceFile)).toBe(false);
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
        expect(hasUndecillionDecorator(functionNode!, sourceFile)).toBe(false);
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
