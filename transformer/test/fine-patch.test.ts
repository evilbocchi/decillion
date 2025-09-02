import * as ts from "typescript";
import { describe, expect, it } from "vitest";
import { BlockAnalyzer } from "../src/analyzer";
import { EditType } from "../src/types";

describe("Fine-grained patching", () => {
    function createProgram(code: string): {
        program: ts.Program;
        sourceFile: ts.SourceFile;
        typeChecker: ts.TypeChecker;
    } {
        const sourceFile = ts.createSourceFile("test.tsx", "", ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);

        const program = ts.createProgram(
            ["test.tsx"],
            {},
            {
                getSourceFile: () => sourceFile,
                writeFile: () => {},
                getCurrentDirectory: () => "",
                getDirectories: () => [],
                fileExists: () => true,
                readFile: () => "",
                getCanonicalFileName: (fileName) => fileName,
                useCaseSensitiveFileNames: () => true,
                getNewLine: () => "\n",
                getDefaultLibFileName: () => "lib.d.ts",
            },
        );

        return { program, sourceFile, typeChecker: program.getTypeChecker() };
    }

    function findJsxElement(sourceFile: ts.SourceFile): ts.JsxElement | ts.JsxSelfClosingElement | null {
        let found: ts.JsxElement | ts.JsxSelfClosingElement | null = null;

        function visit(node: ts.Node) {
            if ((ts.isJsxElement(node) || ts.isJsxSelfClosingElement(node)) && !found) {
                found = node;
                return;
            }
            ts.forEachChild(node, visit);
        }

        visit(sourceFile);
        return found;
    }

    it("should generate patch instructions for dynamic props", () => {
        const code = `
function Component({ color, text }: { color: string; text: string }) {
    return (
        <textlabel 
            Text={text}
            BackgroundColor3={color}
            Size={new UDim2(1, 0, 0, 30)}
        />
    );
}`;

        const { program, sourceFile, typeChecker } = createProgram(code);
        const context = {} as ts.TransformationContext;
        const analyzer = new BlockAnalyzer(typeChecker, context, program);

        const jsxElement = findJsxElement(sourceFile);
        expect(jsxElement).toBeTruthy();

        const patchInfo = analyzer.generatePatchInstructions(jsxElement!);

        expect(patchInfo.patchInstructions).toBeDefined();
        expect(patchInfo.patchInstructions.length).toBeGreaterThan(0);

        // Check that we have patch instructions for dynamic props
        const firstInstruction = patchInfo.patchInstructions[0];
        expect(firstInstruction.edits.length).toBeGreaterThan(0);

        // Should have edits for Text and BackgroundColor3 props
        const propNames = firstInstruction.edits.map((edit) => ("propName" in edit ? edit.propName : ""));
        expect(propNames).toContain("Text");
        expect(propNames).toContain("BackgroundColor3");
    });

    it("should categorize edit types correctly", () => {
        const code = `
function Component({ color, onClick, text }: { color: string; onClick: () => void; text: string }) {
    return (
        <textbutton 
            Text={text}
            BackgroundColor3={color}
            MouseButton1Click={onClick}
        />
    );
}`;

        const { program, sourceFile, typeChecker } = createProgram(code);
        const context = {} as ts.TransformationContext;
        const analyzer = new BlockAnalyzer(typeChecker, context, program);

        const jsxElement = findJsxElement(sourceFile);
        expect(jsxElement).toBeTruthy();

        const patchInfo = analyzer.generatePatchInstructions(jsxElement!);

        const edits = patchInfo.patchInstructions[0].edits;

        // Find the BackgroundColor3 edit (should be Style type)
        const colorEdit = edits.find((edit) => "propName" in edit && edit.propName === "BackgroundColor3");
        expect(colorEdit?.type).toBe(EditType.Style);

        // Find the Text edit (should be Attribute type)
        const textEdit = edits.find((edit) => "propName" in edit && edit.propName === "Text");
        expect(textEdit?.type).toBe(EditType.Attribute);

        // Find the click handler (should be Event type)
        const clickEdit = edits.find((edit) => "propName" in edit && edit.propName === "MouseButton1Click");
        expect(clickEdit?.type).toBe(EditType.Event);
    });

    it("should generate patch instructions for dynamic children", () => {
        const code = `
function Component({ items }: { items: string[] }) {
    return (
        <frame>
            {items.map(item => <textlabel Text={item} key={item} />)}
        </frame>
    );
}`;

        const { program, sourceFile, typeChecker } = createProgram(code);
        const context = {} as ts.TransformationContext;
        const analyzer = new BlockAnalyzer(typeChecker, context, program);

        const jsxElement = findJsxElement(sourceFile);
        expect(jsxElement).toBeTruthy();

        const patchInfo = analyzer.generatePatchInstructions(jsxElement!);

        // Should have patch instructions for dynamic children
        expect(patchInfo.patchInstructions.length).toBeGreaterThan(0);

        // Check if any instruction contains child edits
        const hasChildEdits = patchInfo.patchInstructions.some((instruction) =>
            instruction.edits.some((edit) => edit.type === EditType.Child),
        );
        expect(hasChildEdits).toBe(true);
    });
});
