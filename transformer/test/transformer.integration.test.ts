import * as ts from "typescript";
import { describe, expect, it } from "vitest";
import decillionTransformer, { type DecillionTransformerOptions } from "../src/index";

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

function transformSource(code: string, options?: DecillionTransformerOptions): string {
    const { program, sourceFile } = createProgramWithSource(code);
    const transformer = decillionTransformer(program, {
        addSignature: false,
        debug: false,
        ...(options ?? {}),
    });
    const transformerFactory = transformer as ts.TransformerFactory<ts.SourceFile>;
    const { transformed } = ts.transform(sourceFile, [transformerFactory]);
    const transformedFile = transformed[0] as ts.SourceFile;
    const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed });
    const result = printer.printFile(transformedFile);
    return result.replace(/\r\n/g, "\n");
}

describe("Decillion transformer integration", () => {
    it("extracts nested static elements and props tables", () => {
        const source = `
export function StaticView() {
    return (
        <frame BackgroundTransparency={0}>
            <uigridlayout />
            <textlabel Text="Static" />
        </frame>
    );
}
`;

        const output = transformSource(source);

        expect(output).toMatch(/const STATIC_PROPS_FRAME_[A-Za-z0-9]+/);
        expect(output).toMatch(/const STATIC_ELEMENT_FRAME_[A-Za-z0-9]+/);
        expect(output).toMatch(/const STATIC_INSTANCE_FRAME_[A-Za-z0-9]+/);
        expect(output).toContain("createStaticElement(\"Frame\"");
        expect(output).toContain("createStaticElement(\"UIGridLayout\"");
        expect(output).toContain("createStaticElement(\"TextLabel\"");
    });

    it("memoizes complex dynamic components with fine patch blocks", () => {
        const source = `
export function DynamicButton({ count, color, onClick }: { count: number; color: Color3; onClick: () => void }) {
    return (
        <textbutton BackgroundColor3={color} MouseButton1Click={onClick} Text={"Count: " + count}>
            <textlabel Text={count} />
        </textbutton>
    );
}
`;

        const output = transformSource(source);

        expect(output).toContain("useFinePatchBlock");
        expect(output).toMatch(/\[\s*color,\s*onClick,\s*count\s*\]/);
        expect(output).toContain("MouseButton1Click");
    });

    it("leaves simple dynamic components un-memoized", () => {
        const source = `
export const Label = ({ message }: { message: string }) => <textlabel Text={message} />;
`;

        const output = transformSource(source);

        expect(output).not.toContain("useFinePatchBlock(");
        expect(output).not.toContain("useMemoizedBlock(");
        expect(output).toContain("React.createElement");
    });

    it("skips files with //undecillion directive", () => {
        const source = `
//undecillion
export function Skipped() {
    return <frame />;
}
`;
        const output = transformSource(source);
        expect(output).toContain("<frame />");
        expect(output).not.toContain("createStaticElement");
    });

    it("skips functions decorated with @undecillion", () => {
        const source = `
/**
 * @undecillion
 */
export function Decorated() {
    return <frame />;
}
`;
        const output = transformSource(source);
        expect(output).toContain("<frame />");
        expect(output).not.toContain("createStaticElement");
    });

    it("adds runtime import only once for multiple components", () => {
        const source = `
import React from "@rbxts/react";

export const One = ({ value }: { value: string }) => <textlabel Text={value} />;

export function Two({ count, items }: { count: number; items: string[] }) {
    return (
        <frame>
            <textlabel Text={count} />
            {items.map((item) => (
                <textlabel key={item} Text={item} />
            ))}
        </frame>
    );
}
`;
        const output = transformSource(source);
        const occur = output.match(/@decillion\/runtime/g) ?? [];
        expect(occur.length).toBe(1);
    });

    it("maps Roblox intrinsic tags to proper instance names", () => {
        const source = `
export const Intrinsic = () => (
    <frame>
        <textlabel Text="ok" />
    </frame>
);
`;
        const output = transformSource(source);
        expect(output).toContain("createStaticElement(\"Frame\"");
        expect(output).toContain("createStaticElement(\"TextLabel\"");
    });

    it("bails out advanced optimizations when using ref props", () => {
        const source = `
import { useRef } from "@rbxts/react";

export function WithRef() {
    const frameRef = useRef<Frame>();
    return <frame ref={frameRef} BackgroundTransparency={0.2} />;
}
`;

        const output = transformSource(source);
        expect(output).not.toContain("useFinePatchBlock(");
        expect(output).not.toContain("useMemoizedBlock(");
        expect(output).not.toContain("createStaticElement(\"Frame\"");
        expect(output).toContain("React.createElement");
        expect(output).toContain("ref: frameRef");
    });

    it("disables advanced optimizations for configured hooks like useContext", () => {
        const source = `
import React, { useContext } from "@rbxts/react";

const ThemeContext = {} as never;

export function WithContext() {
    const theme = useContext(ThemeContext);
    return <textlabel Text={theme as unknown as string} />;
}
`;

        const output = transformSource(source, {
            disabledOptimizations: { hooks: ["useContext"] },
        });

        expect(output).toContain("React.createElement");
        expect(output).not.toContain("createStaticElement");
        expect(output).not.toContain("useFinePatchBlock");
    });

    it("supports disabling optimizations for multiple configured hooks", () => {
        const source = `
import React, { useRef } from "@rbxts/react";

export function WithRefValue() {
    const value = useRef(0);
    return <textlabel Text={value.current as unknown as string} />;
}
`;

        const output = transformSource(source, {
            disabledOptimizations: { hooks: ["useRef"] },
        });

        expect(output).toContain("React.createElement");
        expect(output).not.toContain("createStaticElement");
        expect(output).not.toContain("useFinePatchBlock");
    });

    it("emits event patch instructions for event handlers", () => {
        const source = `
export function WithEvents({ onClick }: { onClick: () => void }) {
    return <textbutton MouseButton1Click={onClick} />;
}
`;
        const output = transformSource(source);
        expect(output).toContain("MouseButton1Click");
        expect(output).toContain("MouseButton1Click: onClick");
        expect(output).not.toMatch(/type:\s*4/);
    });

    it("tracks child edits for array rendering", () => {
        const source = `
export function List({ items }: { items: string[] }) {
    return (
        <frame>
            {items.map((item) => (
                <textlabel key={item} Text={item} />
            ))}
        </frame>
    );
}
`;
        const output = transformSource(source);
        expect(output).toContain("type: 2");
        expect(output).toContain("dependencyKey: \"items\"");
    });

    it("ignores files without JSX content", () => {
        const source = `
export const meaning = 42;
export function add(a: number, b: number) {
    return a + b;
}
`;
        const output = transformSource(source);
        expect(output).not.toContain("@decillion/runtime");
        expect(output).not.toContain("createStaticElement");
    });

    it("preserves existing imports order when adding runtime helpers", () => {
        const source = `
import { useState } from "@rbxts/react";

export function UsesState() {
    const [count] = useState(0);
    return <textlabel Text={count} />;
}
`;
        const output = transformSource(source);
        const runtimeIndex = output.indexOf("@decillion/runtime");
        const reactIndex = output.indexOf("@rbxts/react");
        expect(runtimeIndex).toBeLessThan(reactIndex);
    });
});
