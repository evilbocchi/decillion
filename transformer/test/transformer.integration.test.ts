import * as ts from "typescript";
import { describe, expect, it } from "vitest";
import decillionTransformer from "../src/index";

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

function transformSource(code: string): string {
    const { program, sourceFile } = createProgramWithSource(code);
    const transformer = decillionTransformer(program, { addSignature: false, debug: false });
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

    it("handles Context.Provider components correctly", () => {
        const source = `
import React, { createContext, useContext } from "@rbxts/react";

const layerContext = createContext(0);

export default () => {
    const depth = useContext(layerContext);

    return <layerContext.Provider value={depth + 1}></layerContext.Provider>;
};
`;
        const output = transformSource(source);

        // Should not contain UnknownTag
        expect(output).not.toContain("UnknownTag");

        // Should generate React.createElement with layerContext.Provider
        expect(output).toContain("React.createElement");
        expect(output).toContain("layerContext.Provider");
    });

    it("handles React.Fragment correctly", () => {
        const source = `
import React from "@rbxts/react";

export function FragmentExample({ items }: { items: string[] }) {
    return (
        <React.Fragment>
            {items.map((item) => (
                <textlabel key={item} Text={item} />
            ))}
        </React.Fragment>
    );
}
`;
        const output = transformSource(source);

        // Should not contain UnknownTag
        expect(output).not.toContain("UnknownTag");

        // Should generate React.createElement with React.Fragment
        expect(output).toContain("React.createElement");
        expect(output).toContain("React.Fragment");
    });

    it("does not treat Provider with dynamic props as static", () => {
        const source = `
import React, { createContext } from "@rbxts/react";

const ThemeContext = createContext("light");

export function ThemeProvider({ theme, children }: { theme: string; children: React.ReactNode }) {
    return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
}
`;
        const output = transformSource(source);

        // Should not contain UnknownTag
        expect(output).not.toContain("UnknownTag");

        // Should generate React.createElement with ThemeContext.Provider
        expect(output).toContain("React.createElement");
        expect(output).toContain("ThemeContext.Provider");

        // Should NOT call createStaticElement with the Provider tag
        // (it may appear in imports, but should not be called for this component)
        expect(output).not.toMatch(/createStaticElement\([^)]*ThemeContext\.Provider/);
        
        // Should use useFinePatchBlock or regular createElement for dynamic props
        const hasFinePatch = output.includes("useFinePatchBlock");
        const hasCreateElement = output.includes("React.createElement(ThemeContext.Provider");
        expect(hasFinePatch || hasCreateElement).toBe(true);
    });
});
