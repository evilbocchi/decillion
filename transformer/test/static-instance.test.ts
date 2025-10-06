import * as ts from "typescript";
import { describe, expect, it } from "vitest";
import decillionTransformer from "../src/index";

describe("Static instance factory emission", () => {
    function createProgramWithSource(code: string) {
        const sourceFile = ts.createSourceFile("test.tsx", code, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);

        const program = ts.createProgram(
            ["test.tsx"],
            {
                target: ts.ScriptTarget.ES2020,
                module: ts.ModuleKind.CommonJS,
                jsx: ts.JsxEmit.React,
                lib: ["lib.es2020.d.ts"],
            },
            {
                getSourceFile: (fileName) => (fileName === "test.tsx" ? sourceFile : undefined),
                writeFile: () => void 0,
                getCurrentDirectory: () => "",
                getDirectories: () => [],
                fileExists: (fileName) => fileName === "test.tsx",
                readFile: () => "",
                getCanonicalFileName: (fileName) => fileName,
                useCaseSensitiveFileNames: () => true,
                getNewLine: () => "\n",
                getDefaultLibFileName: () => "lib.es2020.d.ts",
            },
        );

        return { program, sourceFile };
    }

    it("should emit createStaticInstanceFactory for fully static JSX", () => {
        const source = `
const element = (
    <frame>
        <textlabel Text="Hello" />
    </frame>
);

export function Render() {
    return element;
}
`;

        const { program, sourceFile } = createProgramWithSource(source);
        const transformer = decillionTransformer(program, { addSignature: false, debug: false });
        const transformerFactory = transformer as ts.TransformerFactory<ts.SourceFile>;

        const transformResult = ts.transform(sourceFile, [transformerFactory]);
        const transformedFile = transformResult.transformed[0] as ts.SourceFile;
        transformResult.dispose();

        const printer = ts.createPrinter();
        const output = printer.printFile(transformedFile);

        expect(output).toContain("createStaticInstanceFactory");
        expect(output).toMatch(/const STATIC_INSTANCE_/);
    });
});
