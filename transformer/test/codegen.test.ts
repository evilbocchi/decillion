import * as ts from "typescript";
import { describe, expect, it } from "vitest";
import {
    createDependenciesArray,
    createMemoizedBlockCall,
    createPropsObject,
    createStaticElementCall,
    generateBlockId,
    generateStaticPropsId,
} from "../src/codegen";
import type { PropInfo } from "../src/types";

describe("Code Generation", () => {
    describe("createPropsObject", () => {
        it("should create object literal from prop array", () => {
            const props: PropInfo[] = [
                {
                    name: "Text",
                    value: ts.factory.createStringLiteral("Hello"),
                    isStatic: true,
                },
                {
                    name: "Size",
                    value: ts.factory.createIdentifier("dynamicSize"),
                    isStatic: false,
                },
            ];

            const result = createPropsObject(props);

            expect(ts.isObjectLiteralExpression(result)).toBe(true);
            expect(result.properties).toHaveLength(2);

            const textProp = result.properties[0] as ts.PropertyAssignment;
            const sizeProp = result.properties[1] as ts.PropertyAssignment;

            expect(ts.isIdentifier(textProp.name) && textProp.name.text).toBe("Text");
            expect(ts.isIdentifier(sizeProp.name) && sizeProp.name.text).toBe("Size");
        });

        it("should handle empty props array", () => {
            const result = createPropsObject([]);

            expect(ts.isObjectLiteralExpression(result)).toBe(true);
            expect(result.properties).toHaveLength(0);
        });

        it("should preserve prop value types", () => {
            const numberLiteral = ts.factory.createNumericLiteral("42");
            const identifier = ts.factory.createIdentifier("someVar");

            const props: PropInfo[] = [
                { name: "count", value: numberLiteral, isStatic: true },
                { name: "handler", value: identifier, isStatic: false },
            ];

            const result = createPropsObject(props);
            const countProp = result.properties[0] as ts.PropertyAssignment;
            const handlerProp = result.properties[1] as ts.PropertyAssignment;

            expect(countProp.initializer).toBe(numberLiteral);
            expect(handlerProp.initializer).toBe(identifier);
        });
    });

    describe("createDependenciesArray", () => {
        it("should create array literal from dependency names", () => {
            const dependencies = ["count", "isVisible", "onClick"];
            const result = createDependenciesArray(dependencies);

            expect(ts.isArrayLiteralExpression(result)).toBe(true);
            expect(result.elements).toHaveLength(3);

            const elements = result.elements.map((e) => {
                expect(ts.isIdentifier(e)).toBe(true);
                return e as ts.Identifier;
            });
            expect(elements[0].text).toBe("count");
            expect(elements[1].text).toBe("isVisible");
            expect(elements[2].text).toBe("onClick");
        });

        it("should handle empty dependencies", () => {
            const result = createDependenciesArray([]);

            expect(ts.isArrayLiteralExpression(result)).toBe(true);
            expect(result.elements).toHaveLength(0);
        });
    });

    describe("ID Generation", () => {
        it("should generate unique static props IDs", () => {
            const id1 = generateStaticPropsId("textlabel");
            const id2 = generateStaticPropsId("textlabel");
            const id3 = generateStaticPropsId("textbutton");

            expect(id1).toMatch(/^STATIC_PROPS_TEXTLABEL_[a-z0-9]{6}$/);
            expect(id2).toMatch(/^STATIC_PROPS_TEXTLABEL_[a-z0-9]{6}$/);
            expect(id3).toMatch(/^STATIC_PROPS_TEXTBUTTON_[a-z0-9]{6}$/);

            expect(id1).not.toBe(id2); // Should be unique
        });

        it("should generate unique block IDs", () => {
            const id1 = generateBlockId("Counter");
            const id2 = generateBlockId("Counter");
            const id3 = generateBlockId("Button");

            expect(id1).toMatch(/^dynamic_Counter_[a-z0-9]{9}$/);
            expect(id2).toMatch(/^dynamic_Counter_[a-z0-9]{9}$/);
            expect(id3).toMatch(/^dynamic_Button_[a-z0-9]{9}$/);

            expect(id1).not.toBe(id2); // Should be unique
        });
    });

    describe("createStaticElementCall", () => {
        it("should create call to createStaticElement with string tag", () => {
            const propsArg = ts.factory.createIdentifier("STATIC_PROPS_TEXTLABEL_abc123");
            const child = ts.factory.createStringLiteral("Hello");

            const result = createStaticElementCall("textlabel", propsArg, [child]);

            expect(ts.isCallExpression(result)).toBe(true);
            expect(ts.isIdentifier(result.expression) && result.expression.text).toBe("createStaticElement");
            expect(result.arguments).toHaveLength(3);

            const tagArg = result.arguments[0];
            expect(ts.isStringLiteral(tagArg) && tagArg.text).toBe("textlabel");
            expect(result.arguments[1]).toBe(propsArg);
            expect(result.arguments[2]).toBe(child);
        });

        it("should create call with component identifier for PascalCase tags", () => {
            const propsArg = ts.factory.createIdentifier("undefined");

            const result = createStaticElementCall("MyComponent", propsArg);

            const tagArg = result.arguments[0];
            expect(ts.isIdentifier(tagArg) && tagArg.text).toBe("MyComponent");
        });

        it("should handle no children", () => {
            const propsArg = ts.factory.createIdentifier("undefined");
            const result = createStaticElementCall("frame", propsArg);

            expect(result.arguments).toHaveLength(2); // tag + props only
        });

        it("should handle multiple children", () => {
            const propsArg = ts.factory.createIdentifier("undefined");
            const children = [
                ts.factory.createStringLiteral("Child 1"),
                ts.factory.createStringLiteral("Child 2"),
                ts.factory.createIdentifier("dynamicChild"),
            ];

            const result = createStaticElementCall("frame", propsArg, children);

            expect(result.arguments).toHaveLength(5); // tag + props + 3 children
        });
    });

    describe("createMemoizedBlockCall", () => {
        it("should create call to useMemoizedBlock", () => {
            const arrowFunction = ts.factory.createArrowFunction(
                undefined,
                undefined,
                [],
                undefined,
                ts.factory.createToken(ts.SyntaxKind.EqualsGreaterThanToken),
                ts.factory.createIdentifier("React"),
            );
            const dependencies = ["count", "onClick"];
            const blockId = "dynamic_Counter_abc123def";

            const result = createMemoizedBlockCall(arrowFunction, dependencies, blockId);

            expect(ts.isCallExpression(result)).toBe(true);
            expect(ts.isIdentifier(result.expression) && result.expression.text).toBe("useMemoizedBlock");
            expect(result.arguments).toHaveLength(3);

            expect(result.arguments[0]).toBe(arrowFunction);

            const depsArg = result.arguments[1];
            expect(ts.isArrayLiteralExpression(depsArg)).toBe(true);

            const blockIdArg = result.arguments[2];
            expect(ts.isStringLiteral(blockIdArg) && blockIdArg.text).toBe(blockId);
        });
    });
});
