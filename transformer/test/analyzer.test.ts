import { describe, it, expect, beforeEach } from 'vitest';
import * as ts from 'typescript';
import { BlockAnalyzer } from '../src/analyzer';

describe('BlockAnalyzer', () => {
    let analyzer: BlockAnalyzer;
    let typeChecker: ts.TypeChecker;
    let context: ts.TransformationContext;

    beforeEach(() => {
        // Create a minimal TypeScript program for testing
        const sourceFile = ts.createSourceFile(
            'test.tsx',
            '', 
            ts.ScriptTarget.Latest,
            true,
            ts.ScriptKind.TSX
        );
        
        const program = ts.createProgram(['test.tsx'], {}, {
            getSourceFile: () => sourceFile,
            writeFile: () => {},
            getCurrentDirectory: () => '',
            getDirectories: () => [],
            fileExists: () => true,
            readFile: () => '',
            getCanonicalFileName: (fileName) => fileName,
            useCaseSensitiveFileNames: () => true,
            getNewLine: () => '\n',
            getDefaultLibFileName: () => 'lib.d.ts'
        });

        typeChecker = program.getTypeChecker();
        context = {} as ts.TransformationContext;
        analyzer = new BlockAnalyzer(typeChecker, context);
    });

    function createJsxElement(tagName: string, props: Record<string, any> = {}): ts.JsxSelfClosingElement {
        const attributes = Object.entries(props).map(([key, value]) => {
            let initializer: ts.JsxAttributeValue;
            
            if (typeof value === 'string') {
                initializer = ts.factory.createStringLiteral(value);
            } else {
                initializer = ts.factory.createJsxExpression(
                    undefined,
                    value
                );
            }
            
            return ts.factory.createJsxAttribute(
                ts.factory.createIdentifier(key),
                initializer
            );
        });

        return ts.factory.createJsxSelfClosingElement(
            ts.factory.createIdentifier(tagName),
            undefined,
            ts.factory.createJsxAttributes(attributes)
        );
    }

    function createIdentifier(name: string): ts.Identifier {
        return ts.factory.createIdentifier(name);
    }

    function createPropertyAccess(obj: string, prop: string): ts.PropertyAccessExpression {
        return ts.factory.createPropertyAccessExpression(
            ts.factory.createIdentifier(obj),
            ts.factory.createIdentifier(prop)
        );
    }

    function createCallExpression(expression: ts.Expression, args: ts.Expression[]): ts.CallExpression {
        return ts.factory.createCallExpression(expression, undefined, args);
    }

    describe('Static Analysis', () => {
        it('should identify static elements correctly', () => {
            const element = createJsxElement('textlabel', {
                Text: 'Hello World',
                Size: createCallExpression(
                    createPropertyAccess('UDim2', 'new'),
                    [
                        ts.factory.createNumericLiteral('1'),
                        ts.factory.createNumericLiteral('0'),
                        ts.factory.createNumericLiteral('1'),
                        ts.factory.createNumericLiteral('0')
                    ]
                )
            });

            const blockInfo = analyzer.analyzeJsxElement(element);

            expect(blockInfo.isStatic).toBe(true);
            expect(blockInfo.staticProps).toContain('Text');
            expect(blockInfo.staticProps).toContain('Size');
            expect(blockInfo.dynamicProps).toHaveLength(0);
            expect(blockInfo.dependencies).toHaveLength(0);
        });

        it('should identify dynamic elements correctly', () => {
            const element = createJsxElement('textlabel', {
                Text: createIdentifier('dynamicText'),
                BackgroundColor3: createCallExpression(
                    createPropertyAccess('Color3', 'fromRGB'),
                    [
                        ts.factory.createNumericLiteral('255'),
                        ts.factory.createNumericLiteral('255'),
                        ts.factory.createNumericLiteral('255')
                    ]
                )
            });

            const blockInfo = analyzer.analyzeJsxElement(element);

            expect(blockInfo.isStatic).toBe(false);
            expect(blockInfo.dynamicProps).toContain('Text');
            expect(blockInfo.staticProps).toContain('BackgroundColor3');
            expect(blockInfo.dependencies).toContain('dynamicText');
        });

        it('should identify React components as dynamic', () => {
            const element = createJsxElement('MyComponent', {
                count: createIdentifier('count')
            });

            const blockInfo = analyzer.analyzeJsxElement(element);

            expect(blockInfo.isStatic).toBe(false);
            expect(blockInfo.dependencies).toContain('MyComponent');
            expect(blockInfo.dependencies).toContain('count');
        });

        it('should handle mixed static and dynamic props', () => {
            const element = createJsxElement('textbutton', {
                Text: 'Click Me',
                Position: createCallExpression(
                    createPropertyAccess('UDim2', 'new'),
                    [
                        ts.factory.createNumericLiteral('0'),
                        ts.factory.createNumericLiteral('0'),
                        ts.factory.createNumericLiteral('0'),
                        ts.factory.createNumericLiteral('0')
                    ]
                ),
                Visible: createIdentifier('isVisible')
            });

            const blockInfo = analyzer.analyzeJsxElement(element);

            expect(blockInfo.isStatic).toBe(false);
            expect(blockInfo.staticProps).toContain('Text');
            expect(blockInfo.staticProps).toContain('Position');
            expect(blockInfo.dynamicProps).toContain('Visible');
            expect(blockInfo.dependencies).toContain('isVisible');
        });
    });

    describe('Dependency Extraction', () => {
        it('should extract simple identifiers', () => {
            const element = createJsxElement('textlabel', {
                Text: createIdentifier('title'),
                Visible: createIdentifier('isVisible')
            });

            const blockInfo = analyzer.analyzeJsxElement(element);

            expect(blockInfo.dependencies).toContain('title');
            expect(blockInfo.dependencies).toContain('isVisible');
            expect(blockInfo.dependencies).toHaveLength(2);
        });

        it('should extract property access expressions', () => {
            const element = createJsxElement('textlabel', {
                Text: createPropertyAccess('props', 'title'),
                Size: createPropertyAccess('config', 'size')
            });

            const blockInfo = analyzer.analyzeJsxElement(element);

            expect(blockInfo.dependencies).toContain('props');
            expect(blockInfo.dependencies).toContain('config');
        });

        it('should handle function calls with dependencies', () => {
            const callExpr = createCallExpression(
                createIdentifier('formatText'),
                [createIdentifier('rawText'), createIdentifier('locale')]
            );

            const element = createJsxElement('textlabel', {
                Text: callExpr
            });

            const blockInfo = analyzer.analyzeJsxElement(element);

            expect(blockInfo.dependencies).toContain('formatText');
            expect(blockInfo.dependencies).toContain('rawText');
            expect(blockInfo.dependencies).toContain('locale');
        });

        it('should not extract dependencies from static Roblox constructors', () => {
            const element = createJsxElement('frame', {
                BackgroundColor3: createCallExpression(
                    createPropertyAccess('Color3', 'fromRGB'),
                    [
                        ts.factory.createNumericLiteral('255'),
                        ts.factory.createNumericLiteral('0'),
                        ts.factory.createNumericLiteral('0')
                    ]
                ),
                Size: createCallExpression(
                    createPropertyAccess('UDim2', 'new'),
                    [
                        ts.factory.createNumericLiteral('1'),
                        ts.factory.createNumericLiteral('0'),
                        ts.factory.createNumericLiteral('1'),
                        ts.factory.createNumericLiteral('0')
                    ]
                )
            });

            const blockInfo = analyzer.analyzeJsxElement(element);

            expect(blockInfo.dependencies).not.toContain('Color3');
            expect(blockInfo.dependencies).not.toContain('UDim2');
            expect(blockInfo.isStatic).toBe(true);
        });

        it('should extract dependencies from dynamic Roblox constructor arguments', () => {
            const element = createJsxElement('frame', {
                BackgroundColor3: createCallExpression(
                    createPropertyAccess('Color3', 'fromRGB'),
                    [
                        createIdentifier('red'),
                        ts.factory.createNumericLiteral('0'),
                        ts.factory.createNumericLiteral('0')
                    ]
                )
            });

            const blockInfo = analyzer.analyzeJsxElement(element);

            expect(blockInfo.dependencies).toContain('red');
            expect(blockInfo.dependencies).not.toContain('Color3');
            expect(blockInfo.isStatic).toBe(false);
        });

        it('should remove duplicate dependencies', () => {
            const element = createJsxElement('textlabel', {
                Text: createIdentifier('value'),
                Position: createPropertyAccess('value', 'position'),
                Visible: createIdentifier('value')
            });

            const blockInfo = analyzer.analyzeJsxElement(element);

            const valueCount = blockInfo.dependencies.filter(dep => dep === 'value').length;
            expect(valueCount).toBe(1);
        });
    });

    describe('Dynamic Content Detection', () => {
        it('should detect template literals as dynamic', () => {
            const templateLiteral = ts.factory.createTemplateExpression(
                ts.factory.createTemplateHead('Count: '),
                [ts.factory.createTemplateSpan(
                    createIdentifier('count'),
                    ts.factory.createTemplateTail('')
                )]
            );

            const element = createJsxElement('textlabel', {
                Text: templateLiteral
            });

            const blockInfo = analyzer.analyzeJsxElement(element);

            expect(blockInfo.isStatic).toBe(false);
            expect(blockInfo.dependencies).toContain('count');
        });

        it('should detect binary expressions as dynamic', () => {
            const binaryExpr = ts.factory.createBinaryExpression(
                createIdentifier('count'),
                ts.SyntaxKind.PlusToken,
                ts.factory.createNumericLiteral('1')
            );

            const element = createJsxElement('textlabel', {
                Text: binaryExpr
            });

            const blockInfo = analyzer.analyzeJsxElement(element);

            expect(blockInfo.isStatic).toBe(false);
            expect(blockInfo.dependencies).toContain('count');
        });

        it('should detect conditional expressions as dynamic', () => {
            const conditionalExpr = ts.factory.createConditionalExpression(
                createIdentifier('isVisible'),
                ts.factory.createToken(ts.SyntaxKind.QuestionToken),
                ts.factory.createStringLiteral('Visible'),
                ts.factory.createToken(ts.SyntaxKind.ColonToken),
                ts.factory.createStringLiteral('Hidden')
            );

            const element = createJsxElement('textlabel', {
                Text: conditionalExpr
            });

            const blockInfo = analyzer.analyzeJsxElement(element);

            expect(blockInfo.isStatic).toBe(false);
            expect(blockInfo.dependencies).toContain('isVisible');
        });
    });

    describe('Optimization Decisions', () => {
        it('should recommend memoization for dynamic components with dependencies', () => {
            const element = createJsxElement('textlabel', {
                Text: createIdentifier('dynamicText'),
                Count: createIdentifier('count')
            });

            const blockInfo = analyzer.analyzeJsxElement(element);

            expect(analyzer.shouldMemoizeBlock(blockInfo)).toBe(true);
        });

        it('should not recommend memoization for static components', () => {
            const element = createJsxElement('textlabel', {
                Text: 'Static Text',
                Size: createCallExpression(
                    createPropertyAccess('UDim2', 'new'),
                    [
                        ts.factory.createNumericLiteral('1'),
                        ts.factory.createNumericLiteral('0'),
                        ts.factory.createNumericLiteral('1'),
                        ts.factory.createNumericLiteral('0')
                    ]
                )
            });

            const blockInfo = analyzer.analyzeJsxElement(element);

            expect(analyzer.shouldMemoizeBlock(blockInfo)).toBe(false);
        });

        it('should not recommend memoization for dynamic components without dependencies', () => {
            const element = createJsxElement('MyComponent', {});

            const blockInfo = analyzer.analyzeJsxElement(element);
            // Manually clear dependencies to test edge case
            blockInfo.dependencies = [];

            expect(analyzer.shouldMemoizeBlock(blockInfo)).toBe(false);
        });
    });

    describe('Tag Name Detection', () => {
        it('should extract tag names correctly', () => {
            const elements = [
                createJsxElement('textlabel'),
                createJsxElement('textbutton'),
                createJsxElement('frame'),
                createJsxElement('MyComponent')
            ];

            const tagNames = elements.map(el => analyzer.getJsxTagName(el));

            expect(tagNames).toEqual(['textlabel', 'textbutton', 'frame', 'MyComponent']);
        });
    });

    describe('Cache and State Management', () => {
        it('should cache block analysis results', () => {
            const element = createJsxElement('textlabel', {
                Text: 'Hello'
            });

            const result1 = analyzer.analyzeJsxElement(element);
            const result2 = analyzer.analyzeJsxElement(element);

            expect(result1).toBe(result2); // Same reference = cached
        });

        it('should provide access to all analyzed blocks', () => {
            const element1 = createJsxElement('textlabel', { Text: 'Label 1' });
            const element2 = createJsxElement('textbutton', { Text: 'Button 1' });

            analyzer.analyzeJsxElement(element1);
            analyzer.analyzeJsxElement(element2);

            const allBlocks = analyzer.getAllBlocks();
            expect(allBlocks.size).toBe(2);
            expect(allBlocks.has(element1)).toBe(true);
            expect(allBlocks.has(element2)).toBe(true);
        });

        it('should provide block info lookup', () => {
            const element = createJsxElement('textlabel', { Text: 'Hello' });
            
            const originalInfo = analyzer.analyzeJsxElement(element);
            const retrievedInfo = analyzer.getBlockInfo(element);

            expect(retrievedInfo).toBe(originalInfo);
        });
    });
});
