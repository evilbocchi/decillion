import * as ts from 'typescript';
import { describe, expect, it } from 'vitest';
import decillionTransformer from '../src/index';

describe('End-to-End Transformation', () => {
    function transformCode(sourceCode: string): string {
        const sourceFile = ts.createSourceFile(
            'test.tsx',
            sourceCode,
            ts.ScriptTarget.Latest,
            true,
            ts.ScriptKind.TSX
        );

        const program = ts.createProgram(['test.tsx'], {}, {
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

        const transformer = decillionTransformer(program, { debug: false });

        // Wrap transformer to ensure correct return type
        const wrappedTransformer: ts.TransformerFactory<ts.SourceFile> = (context) => {
            const inner = transformer(context);
            return (file) => inner(file) as ts.SourceFile;
        };
        const result = ts.transform(sourceFile, [wrappedTransformer]);
        const transformedFile = result.transformed[0] as ts.SourceFile;

        const printer = ts.createPrinter();
        return printer.printFile(transformedFile);
    }

    describe('Static Element Optimization', () => {
        it('should optimize completely static JSX elements', () => {
            const input = `
                import React from "@rbxts/react";
                
                export function StaticComponent() {
                    return (
                        <textlabel 
                            Text="Hello World"
                            BackgroundColor3={Color3.fromRGB(255, 0, 0)}
                            Size={new UDim2(1, 0, 0, 50)}
                        />
                    );
                }
            `;

            const output = transformCode(input);

            // Should add runtime import
            expect(output).toContain('import { createStaticElement');

            // Should create static props table
            expect(output).toMatch(/const STATIC_PROPS_TEXTLABEL_[a-z0-9]{6} = {/);

            // Should use createStaticElement call
            expect(output).toContain('createStaticElement("textlabel"');

            // Should reference static props table
            expect(output).toMatch(/createStaticElement\("textlabel", STATIC_PROPS_TEXTLABEL_[a-z0-9]{6}\)/);
        });

        it('should preserve static Roblox constructor calls', () => {
            const input = `
                import React from "@rbxts/react";
                
                export function ColoredFrame() {
                    return (
                        <frame 
                            BackgroundColor3={Color3.fromRGB(100, 150, 200)}
                            Size={UDim2.new(0.5, 0, 0.5, 0)}
                            Position={Vector2.new(10, 20)}
                        />
                    );
                }
            `;

            const output = transformCode(input);

            expect(output).toContain('Color3.fromRGB(100, 150, 200)');
            expect(output).toContain('UDim2.new(0.5, 0, 0.5, 0)');
            expect(output).toContain('Vector2.new(10, 20)');
        });
    });

    describe('Dynamic Element Optimization', () => {
        it('should optimize components with dynamic dependencies', () => {
            const input = `
                import React from "@rbxts/react";
                
                export function DynamicCounter({ count }: { count: number }) {
                    return (
                        <textlabel 
                            Text={\`Count: \${count}\`}
                            BackgroundColor3={Color3.fromRGB(255, 255, 255)}
                        />
                    );
                }
            `;

            const output = transformCode(input);

            // Should add runtime import for memoization
            expect(output).toContain('useMemoizedBlock');

            // Should create memoized block call
            expect(output).toContain('useMemoizedBlock(');

            // Should include count as dependency
            expect(output).toMatch(/\[count\]/);

            // Should generate block ID
            expect(output).toMatch(/"dynamic_textlabel_[a-z0-9]{9}"/);
        });

        it('should handle multiple dependencies correctly', () => {
            const input = `
                import React from "@rbxts/react";
                
                export function MultiDependency({ title, isVisible, onClick }: any) {
                    return (
                        <textbutton 
                            Text={title}
                            Visible={isVisible}
                            Event={{ MouseButton1Click: onClick }}
                        />
                    );
                }
            `;

            const output = transformCode(input);

            // Should extract all dependencies
            expect(output).toMatch(/\[title, isVisible, onClick\]/);

            // Should create arrow function with typed parameters
            expect(output).toContain('(title: string, isVisible: boolean, onClick: () => void)');
        });
    });

    describe('Mixed Static and Dynamic Content', () => {
        it('should handle components with both static and dynamic props', () => {
            const input = `
                import React from "@rbxts/react";
                
                export function MixedComponent({ dynamicText }: { dynamicText: string }) {
                    return (
                        <frame
                            Size={UDim2.new(1, 0, 1, 0)}
                            BackgroundColor3={Color3.fromRGB(50, 50, 50)}
                        >
                            <textlabel
                                Text={dynamicText}
                                TextColor3={Color3.fromRGB(255, 255, 255)}
                                BackgroundTransparency={1}
                            />
                        </frame>
                    );
                }
            `;

            const output = transformCode(input);

            // Outer frame should be optimized as static (no dynamic props)
            expect(output).toMatch(/createStaticElement\("frame"/);

            // Inner textlabel should be memoized (has dynamic Text prop)
            expect(output).toContain('useMemoizedBlock');
            expect(output).toContain('[dynamicText]');
        });
    });

    describe('React Component Handling', () => {
        it('should treat PascalCase components as dynamic', () => {
            const input = `
                import React from "@rbxts/react";
                import { MyButton } from "./MyButton";
                
                export function ComponentUser({ label }: { label: string }) {
                    return (
                        <MyButton 
                            text={label}
                            onClick={() => print("clicked")}
                        />
                    );
                }
            `;

            const output = transformCode(input);

            // Should create identifier reference, not string literal
            expect(output).toContain('React.createElement(MyButton');

            // Should be memoized because it's a component with dependencies
            expect(output).toContain('useMemoizedBlock');
            expect(output).toMatch(/\[MyButton, label\]/);
        });
    });

    describe('Complex Nested Structures', () => {
        it('should optimize nested structures appropriately', () => {
            const input = `
                import React from "@rbxts/react";
                
                export function NestedExample({ count, items }: any) {
                    return (
                        <frame Size={UDim2.new(1, 0, 1, 0)}>
                            <textlabel Text="Static Header" />
                            <textlabel Text={\`Count: \${count}\`} />
                            {items.map((item: any) => (
                                <textbutton key={item.id} Text={item.name} />
                            ))}
                        </frame>
                    );
                }
            `;

            const output = transformCode(input);

            // Should have multiple optimization strategies:
            // 1. Static outer frame
            expect(output).toMatch(/createStaticElement\("frame"/);

            // 2. Static header textlabel
            expect(output).toMatch(/createStaticElement\("textlabel"/);

            // 3. Dynamic count textlabel
            expect(output).toContain('useMemoizedBlock');
            expect(output).toContain('[count]');

            // 4. Dynamic items mapping
            expect(output).toContain('[items]');
        });
    });

    describe('Skip Patterns', () => {
        it('should skip transformation when //undecillion comment is present', () => {
            const input = `
                //undecillion
                import React from "@rbxts/react";
                
                export function SkippedComponent() {
                    return <textlabel Text="This should not be optimized" />;
                }
            `;

            const output = transformCode(input);

            // Should not add runtime imports
            expect(output).not.toContain('createStaticElement');
            expect(output).not.toContain('useMemoizedBlock');

            // Should preserve original JSX
            expect(output).toContain('<textlabel Text="This should not be optimized" />');
        });

        it('should skip files without JSX', () => {
            const input = `
                export function pureFunction(x: number): number {
                    return x * 2;
                }
                
                export const constants = {
                    MAX_SIZE: 100,
                    DEFAULT_COLOR: "red"
                };
            `;

            const output = transformCode(input);

            // Should be unchanged
            expect(output).toBe(input.trim());
        });
    });

    describe('Error Handling', () => {
        it('should gracefully handle malformed JSX', () => {
            const input = `
                import React from "@rbxts/react";
                
                export function BrokenComponent() {
                    return (
                        <textlabel 
                            Text={someUndefinedVariable}
                            MalformedProp={}
                        />
                    );
                }
            `;

            // Should not throw during transformation
            expect(() => transformCode(input)).not.toThrow();
        });
    });

    describe('Performance Edge Cases', () => {
        it('should handle deeply nested structures', () => {
            const input = `
                import React from "@rbxts/react";
                
                export function DeepNesting({ data }: any) {
                    return (
                        <frame>
                            <frame>
                                <frame>
                                    <frame>
                                        <textlabel Text={data.deeply.nested.value} />
                                    </frame>
                                </frame>
                            </frame>
                        </frame>
                    );
                }
            `;

            const output = transformCode(input);

            // Should optimize static frames
            expect(output).toMatch(/createStaticElement\("frame"/);

            // Should memoize the dynamic textlabel
            expect(output).toContain('useMemoizedBlock');
            expect(output).toContain('[data]');
        });

        it('should handle components with many props', () => {
            const input = `
                import React from "@rbxts/react";
                
                export function ManyProps({ a, b, c, d, e, f, g, h, i, j }: any) {
                    return (
                        <textlabel 
                            Text={a}
                            Size={b}
                            Position={c}
                            BackgroundColor3={d}
                            TextColor3={e}
                            Font={f}
                            TextSize={g}
                            Visible={h}
                            Active={i}
                            ZIndex={j}
                        />
                    );
                }
            `;

            const output = transformCode(input);

            // Should handle all dependencies
            expect(output).toMatch(/\[a, b, c, d, e, f, g, h, i, j\]/);

            // Should create memoized block
            expect(output).toContain('useMemoizedBlock');
        });
    });
});
