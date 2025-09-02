import { describe, it, expect } from 'vitest';
import * as ts from 'typescript';
import {
    createPropsObject,
    createDependenciesArray,
    generateStaticPropsId,
    generateBlockId,
    createStaticElementCall,
    createMemoizedBlockCall,
    createParametersWithTypes,
    createMemoizedArrowFunction
} from '../src/codegen';
import type { PropInfo } from '../src/types';

describe('Code Generation', () => {
    describe('createPropsObject', () => {
        it('should create object literal from prop array', () => {
            const props: PropInfo[] = [
                {
                    name: 'Text',
                    value: ts.factory.createStringLiteral('Hello'),
                    isStatic: true
                },
                {
                    name: 'Size', 
                    value: ts.factory.createIdentifier('dynamicSize'),
                    isStatic: false
                }
            ];

            const result = createPropsObject(props);

            expect(ts.isObjectLiteralExpression(result)).toBe(true);
            expect(result.properties).toHaveLength(2);
            
            const textProp = result.properties[0] as ts.PropertyAssignment;
            const sizeProp = result.properties[1] as ts.PropertyAssignment;
            
            expect(ts.isIdentifier(textProp.name) && textProp.name.text).toBe('Text');
            expect(ts.isIdentifier(sizeProp.name) && sizeProp.name.text).toBe('Size');
        });

        it('should handle empty props array', () => {
            const result = createPropsObject([]);
            
            expect(ts.isObjectLiteralExpression(result)).toBe(true);
            expect(result.properties).toHaveLength(0);
        });

        it('should preserve prop value types', () => {
            const numberLiteral = ts.factory.createNumericLiteral('42');
            const identifier = ts.factory.createIdentifier('someVar');
            
            const props: PropInfo[] = [
                { name: 'count', value: numberLiteral, isStatic: true },
                { name: 'handler', value: identifier, isStatic: false }
            ];

            const result = createPropsObject(props);
            const countProp = result.properties[0] as ts.PropertyAssignment;
            const handlerProp = result.properties[1] as ts.PropertyAssignment;

            expect(countProp.initializer).toBe(numberLiteral);
            expect(handlerProp.initializer).toBe(identifier);
        });
    });

    describe('createDependenciesArray', () => {
        it('should create array literal from dependency names', () => {
            const dependencies = ['count', 'isVisible', 'onClick'];
            const result = createDependenciesArray(dependencies);

            expect(ts.isArrayLiteralExpression(result)).toBe(true);
            expect(result.elements).toHaveLength(3);

            const elements = result.elements.map(e => {
                expect(ts.isIdentifier(e)).toBe(true);
                return e as ts.Identifier;
            });
            expect(elements[0].text).toBe('count');
            expect(elements[1].text).toBe('isVisible');
            expect(elements[2].text).toBe('onClick');
        });

        it('should handle empty dependencies', () => {
            const result = createDependenciesArray([]);
            
            expect(ts.isArrayLiteralExpression(result)).toBe(true);
            expect(result.elements).toHaveLength(0);
        });
    });

    describe('ID Generation', () => {
        it('should generate unique static props IDs', () => {
            const id1 = generateStaticPropsId('textlabel');
            const id2 = generateStaticPropsId('textlabel');
            const id3 = generateStaticPropsId('textbutton');

            expect(id1).toMatch(/^STATIC_PROPS_TEXTLABEL_[a-z0-9]{6}$/);
            expect(id2).toMatch(/^STATIC_PROPS_TEXTLABEL_[a-z0-9]{6}$/);
            expect(id3).toMatch(/^STATIC_PROPS_TEXTBUTTON_[a-z0-9]{6}$/);
            
            expect(id1).not.toBe(id2); // Should be unique
        });

        it('should generate unique block IDs', () => {
            const id1 = generateBlockId('Counter');
            const id2 = generateBlockId('Counter');
            const id3 = generateBlockId('Button');

            expect(id1).toMatch(/^dynamic_Counter_[a-z0-9]{9}$/);
            expect(id2).toMatch(/^dynamic_Counter_[a-z0-9]{9}$/);
            expect(id3).toMatch(/^dynamic_Button_[a-z0-9]{9}$/);
            
            expect(id1).not.toBe(id2); // Should be unique
        });
    });

    describe('createStaticElementCall', () => {
        it('should create call to createStaticElement with string tag', () => {
            const propsArg = ts.factory.createIdentifier('STATIC_PROPS_TEXTLABEL_abc123');
            const child = ts.factory.createStringLiteral('Hello');
            
            const result = createStaticElementCall('textlabel', propsArg, [child]);

            expect(ts.isCallExpression(result)).toBe(true);
            expect(ts.isIdentifier(result.expression) && result.expression.text).toBe('createStaticElement');
            expect(result.arguments).toHaveLength(3);

            const tagArg = result.arguments[0];
            expect(ts.isStringLiteral(tagArg) && tagArg.text).toBe('textlabel');
            expect(result.arguments[1]).toBe(propsArg);
            expect(result.arguments[2]).toBe(child);
        });

        it('should create call with component identifier for PascalCase tags', () => {
            const propsArg = ts.factory.createIdentifier('undefined');
            
            const result = createStaticElementCall('MyComponent', propsArg);

            const tagArg = result.arguments[0];
            expect(ts.isIdentifier(tagArg) && tagArg.text).toBe('MyComponent');
        });

        it('should handle no children', () => {
            const propsArg = ts.factory.createIdentifier('undefined');
            const result = createStaticElementCall('frame', propsArg);

            expect(result.arguments).toHaveLength(2); // tag + props only
        });

        it('should handle multiple children', () => {
            const propsArg = ts.factory.createIdentifier('undefined');
            const children = [
                ts.factory.createStringLiteral('Child 1'),
                ts.factory.createStringLiteral('Child 2'),
                ts.factory.createIdentifier('dynamicChild')
            ];
            
            const result = createStaticElementCall('frame', propsArg, children);

            expect(result.arguments).toHaveLength(5); // tag + props + 3 children
        });
    });

    describe('createMemoizedBlockCall', () => {
        it('should create call to useMemoizedBlock', () => {
            const arrowFunction = ts.factory.createArrowFunction(
                undefined,
                undefined,
                [],
                undefined,
                ts.factory.createToken(ts.SyntaxKind.EqualsGreaterThanToken),
                ts.factory.createIdentifier('React')
            );
            const dependencies = ['count', 'onClick'];
            const blockId = 'dynamic_Counter_abc123def';

            const result = createMemoizedBlockCall(arrowFunction, dependencies, blockId);

            expect(ts.isCallExpression(result)).toBe(true);
            expect(ts.isIdentifier(result.expression) && result.expression.text).toBe('useMemoizedBlock');
            expect(result.arguments).toHaveLength(3);

            expect(result.arguments[0]).toBe(arrowFunction);
            
            const depsArg = result.arguments[1];
            expect(ts.isArrayLiteralExpression(depsArg)).toBe(true);
            
            const blockIdArg = result.arguments[2];
            expect(ts.isStringLiteral(blockIdArg) && blockIdArg.text).toBe(blockId);
        });
    });

    describe('createParametersWithTypes', () => {
        it('should create typed parameters for common patterns', () => {
            const dependencies = ['count', 'userName', 'isVisible', 'onClick'];
            const result = createParametersWithTypes(dependencies);

            expect(result).toHaveLength(4);
            
            const countParam = result[0];
            const userNameParam = result[1];
            const isVisibleParam = result[2];
            const onClickParam = result[3];

            expect(ts.isIdentifier(countParam.name) && countParam.name.text).toBe('count');
            expect(ts.isIdentifier(userNameParam.name) && userNameParam.name.text).toBe('userName');
            expect(ts.isIdentifier(isVisibleParam.name) && isVisibleParam.name.text).toBe('isVisible');
            expect(ts.isIdentifier(onClickParam.name) && onClickParam.name.text).toBe('onClick');

            // Check type annotations exist
            expect(countParam.type).toBeDefined();
            expect(userNameParam.type).toBeDefined();
            expect(isVisibleParam.type).toBeDefined();
            expect(onClickParam.type).toBeDefined();
        });

        it('should infer number types for count-like names', () => {
            const dependencies = ['count', 'number', 'size', 'position'];
            const result = createParametersWithTypes(dependencies);

            result.forEach(param => {
                expect(param.type?.kind).toBe(ts.SyntaxKind.NumberKeyword);
            });
        });

        it('should infer string types for text-like names', () => {
            const dependencies = ['text', 'name', 'title'];
            const result = createParametersWithTypes(dependencies);

            result.forEach(param => {
                expect(param.type?.kind).toBe(ts.SyntaxKind.StringKeyword);
            });
        });

        it('should infer boolean types for flag-like names', () => {
            const dependencies = ['visible', 'enabled', 'active'];
            const result = createParametersWithTypes(dependencies);

            result.forEach(param => {
                expect(param.type?.kind).toBe(ts.SyntaxKind.BooleanKeyword);
            });
        });

        it('should infer function types for handler-like names', () => {
            const dependencies = ['increment', 'onClick', 'handleClick', 'callback'];
            const result = createParametersWithTypes(dependencies);

            result.forEach(param => {
                expect(ts.isFunctionTypeNode(param.type!)).toBe(true);
            });
        });

        it('should default to unknown for unknown patterns', () => {
            const dependencies = ['unknownVar', 'mysteriousData'];
            const result = createParametersWithTypes(dependencies);

            result.forEach(param => {
                expect(param.type?.kind).toBe(ts.SyntaxKind.UnknownKeyword);
            });
        });

        it('should handle empty dependencies', () => {
            const result = createParametersWithTypes([]);
            expect(result).toHaveLength(0);
        });

        it('should infer Roblox UI property types', () => {
            const dependencies = ['AnchorPoint', 'Position', 'Size'];
            const result = createParametersWithTypes(dependencies);

            result.forEach(param => {
                expect(ts.isTypeReferenceNode(param.type!)).toBe(true);
                const typeRef = param.type as ts.TypeReferenceNode;
                expect(ts.isIdentifier(typeRef.typeName) && typeRef.typeName.text).toBe('UDim2');
            });
        });

        it('should infer Roblox Color3 property types', () => {
            const dependencies = ['BackgroundColor3', 'TextColor3', 'BorderColor3'];
            const result = createParametersWithTypes(dependencies);

            result.forEach(param => {
                expect(ts.isTypeReferenceNode(param.type!)).toBe(true);
                const typeRef = param.type as ts.TypeReferenceNode;
                expect(ts.isIdentifier(typeRef.typeName) && typeRef.typeName.text).toBe('Color3');
            });
        });

        it('should infer Vector2 property types', () => {
            const dependencies = ['AbsolutePosition', 'AbsoluteSize', 'MousePosition'];
            const result = createParametersWithTypes(dependencies);

            result.forEach(param => {
                expect(ts.isTypeReferenceNode(param.type!)).toBe(true);
                const typeRef = param.type as ts.TypeReferenceNode;
                expect(ts.isIdentifier(typeRef.typeName) && typeRef.typeName.text).toBe('Vector2');
            });
        });

        it('should infer Roblox Instance types', () => {
            const dependencies = ['frame', 'textlabel', 'textbutton', 'ImageLabel'];
            const result = createParametersWithTypes(dependencies);

            expect(result[0].type).toBeDefined();
            expect(result[1].type).toBeDefined();
            expect(result[2].type).toBeDefined();
            expect(result[3].type).toBeDefined();

            // Check that they're type references (Instance types)
            result.forEach(param => {
                expect(ts.isTypeReferenceNode(param.type!)).toBe(true);
            });
        });

        it('should infer array types for collection patterns', () => {
            const dependencies = ['items', 'children', 'list', 'dataArray'];
            const result = createParametersWithTypes(dependencies);

            result.forEach(param => {
                expect(ts.isArrayTypeNode(param.type!)).toBe(true);
            });
        });

        it('should infer expanded number types', () => {
            const dependencies = ['width', 'height', 'offset', 'scale', 'rotation', 'transparency', 'index'];
            const result = createParametersWithTypes(dependencies);

            result.forEach(param => {
                expect(param.type?.kind).toBe(ts.SyntaxKind.NumberKeyword);
            });
        });

        it('should infer expanded string types', () => {
            const dependencies = ['label', 'content', 'message', 'description', 'placeholder', 'fontName'];
            const result = createParametersWithTypes(dependencies);

            result.forEach(param => {
                expect(param.type?.kind).toBe(ts.SyntaxKind.StringKeyword);
            });
        });

        it('should infer expanded boolean types', () => {
            const dependencies = ['isOpen', 'hasItems', 'canEdit', 'shouldShow', 'willUpdate', 'selected', 'focused'];
            const result = createParametersWithTypes(dependencies);

            result.forEach(param => {
                expect(param.type?.kind).toBe(ts.SyntaxKind.BooleanKeyword);
            });
        });

        it('should infer specific function types for mouse events', () => {
            const dependencies = ['onClick', 'onButtonClick', 'handleAction'];
            const result = createParametersWithTypes(dependencies);

            result.forEach(param => {
                expect(ts.isFunctionTypeNode(param.type!)).toBe(true);
                const funcType = param.type as ts.FunctionTypeNode;
                // Should have one parameter for InputObject
                expect(funcType.parameters).toHaveLength(1);
            });
        });

        it('should infer specific function types for change events', () => {
            const dependencies = ['onChange', 'onUpdate', 'handleEdit'];
            const result = createParametersWithTypes(dependencies);

            result.forEach(param => {
                expect(ts.isFunctionTypeNode(param.type!)).toBe(true);
                const funcType = param.type as ts.FunctionTypeNode;
                // Should have one parameter for newValue
                expect(funcType.parameters).toHaveLength(1);
            });
        });

        it('should infer state/data types as Record', () => {
            const dependencies = ['state', 'data', 'model', 'store'];
            const result = createParametersWithTypes(dependencies);

            result.forEach(param => {
                expect(ts.isTypeReferenceNode(param.type!)).toBe(true);
                const typeRef = param.type as ts.TypeReferenceNode;
                expect(ts.isIdentifier(typeRef.typeName) && typeRef.typeName.text).toBe('Record');
            });
        });

        it('should infer React component types', () => {
            const dependencies = ['component', 'element', 'node'];
            const result = createParametersWithTypes(dependencies);

            result.forEach(param => {
                expect(ts.isTypeReferenceNode(param.type!)).toBe(true);
                const typeRef = param.type as ts.TypeReferenceNode;
                expect(ts.isIdentifier(typeRef.typeName) && typeRef.typeName.text).toBe('ReactElement');
            });
        });
    });

    describe('createMemoizedArrowFunction', () => {
        it('should create arrow function with typed parameters', () => {
            const dependencies = ['count', 'onClick'];
            const body = ts.factory.createCallExpression(
                ts.factory.createPropertyAccessExpression(
                    ts.factory.createIdentifier('React'),
                    ts.factory.createIdentifier('createElement')
                ),
                undefined,
                [ts.factory.createStringLiteral('textlabel')]
            );

            const result = createMemoizedArrowFunction(dependencies, body);

            expect(ts.isArrowFunction(result)).toBe(true);
            expect(result.parameters).toHaveLength(2);
            expect(result.body).toBe(body);

            const countParam = result.parameters[0];
            const onClickParam = result.parameters[1];

            expect(ts.isIdentifier(countParam.name) && countParam.name.text).toBe('count');
            expect(ts.isIdentifier(onClickParam.name) && onClickParam.name.text).toBe('onClick');
            expect(countParam.type).toBeDefined();
            expect(onClickParam.type).toBeDefined();
        });

        it('should create arrow function with no parameters', () => {
            const body = ts.factory.createStringLiteral('static');
            const result = createMemoizedArrowFunction([], body);

            expect(ts.isArrowFunction(result)).toBe(true);
            expect(result.parameters).toHaveLength(0);
            expect(result.body).toBe(body);
        });
    });

    describe('Integration', () => {
        it('should work together to create complex call expressions', () => {
            // Simulate creating a complete memoized block call
            const props: PropInfo[] = [
                { name: 'Text', value: ts.factory.createIdentifier('title'), isStatic: false },
                { name: 'Visible', value: ts.factory.createIdentifier('isVisible'), isStatic: false }
            ];

            const dependencies = ['title', 'isVisible'];
            const blockId = generateBlockId('Counter');

            const reactCall = ts.factory.createCallExpression(
                ts.factory.createPropertyAccessExpression(
                    ts.factory.createIdentifier('React'),
                    ts.factory.createIdentifier('createElement')
                ),
                undefined,
                [
                    ts.factory.createStringLiteral('textlabel'),
                    createPropsObject(props)
                ]
            );

            const arrowFunction = createMemoizedArrowFunction(dependencies, reactCall);
            const finalCall = createMemoizedBlockCall(arrowFunction, dependencies, blockId);

            expect(ts.isCallExpression(finalCall)).toBe(true);
            expect(ts.isIdentifier(finalCall.expression) && finalCall.expression.text).toBe('useMemoizedBlock');
            expect(finalCall.arguments).toHaveLength(3);

            // Verify the arrow function is properly structured
            const arrowArg = finalCall.arguments[0];
            expect(ts.isArrowFunction(arrowArg)).toBe(true);

            // Verify dependencies array
            const depsArg = finalCall.arguments[1];
            expect(ts.isArrayLiteralExpression(depsArg)).toBe(true);
            if (ts.isArrayLiteralExpression(depsArg)) {
                expect(depsArg.elements).toHaveLength(2);
            }

            // Verify block ID
            const blockIdArg = finalCall.arguments[2];
            expect(ts.isStringLiteral(blockIdArg)).toBe(true);
        });
    });
});
