import * as ts from "typescript";

/**
 * Working Decillion transformer that properly finds and transforms JSX
 */
function workingDecillionTransformer(program: ts.Program): ts.TransformerFactory<ts.SourceFile> {
    return (context: ts.TransformationContext) => {
        return (sourceFile: ts.SourceFile) => {
            console.log(`Decillion transformer processing: ${sourceFile.fileName}`);
            
            let hasOptimizations = false;
            let needsRuntimeImport = false;
            
            // Helper function to check if a JSX element is static
            const isStaticJSXElement = (node: ts.JsxElement | ts.JsxSelfClosingElement): boolean => {
                const attributes = ts.isJsxElement(node) 
                    ? (node.openingElement ? node.openingElement.attributes : null)
                    : node.attributes;
                    
                if (!attributes) return false;
                    
                // Check if all attributes are static (for simplicity, just check for no variables)
                for (const prop of attributes.properties) {
                    if (ts.isJsxAttribute(prop) && prop.initializer) {
                        if (ts.isJsxExpression(prop.initializer) && prop.initializer.expression) {
                            // If it contains identifiers (variables), it's dynamic
                            if (ts.isIdentifier(prop.initializer.expression) || 
                                ts.isPropertyAccessExpression(prop.initializer.expression) ||
                                ts.isTemplateExpression(prop.initializer.expression)) {
                                return false;
                            }
                        }
                    }
                }
                
                // Check children for JSX elements
                if (ts.isJsxElement(node) && node.children) {
                    for (const child of node.children) {
                        if ((ts.isJsxElement(child) || ts.isJsxSelfClosingElement(child))) {
                            if (!isStaticJSXElement(child)) {
                                return false;
                            }
                        } else if (ts.isJsxExpression(child) && child.expression) {
                            // If child contains variables, it's dynamic
                            if (ts.isIdentifier(child.expression) || 
                                ts.isPropertyAccessExpression(child.expression) ||
                                ts.isTemplateExpression(child.expression)) {
                                return false;
                            }
                        }
                    }
                }
                
                return true;
            };
            
            // Helper to convert JSX attributes to object literal
            const createPropsFromJSXAttributes = (attributes: ts.JsxAttributes): ts.ObjectLiteralExpression => {
                const props: ts.PropertyAssignment[] = [];
                
                for (const prop of attributes.properties) {
                    if (ts.isJsxAttribute(prop) && ts.isIdentifier(prop.name)) {
                        const key = prop.name.text;
                        let value: ts.Expression;
                        
                        if (prop.initializer) {
                            if (ts.isStringLiteral(prop.initializer)) {
                                value = prop.initializer;
                            } else if (ts.isJsxExpression(prop.initializer) && prop.initializer.expression) {
                                value = prop.initializer.expression;
                            } else {
                                value = ts.factory.createTrue();
                            }
                        } else {
                            value = ts.factory.createTrue();
                        }
                        
                        props.push(ts.factory.createPropertyAssignment(key, value));
                    }
                }
                
                return ts.factory.createObjectLiteralExpression(props);
            };
            
            // Track transformations
            const transformations: { original: ts.Node, replacement: ts.Node }[] = [];
            
            // First pass: find JSX elements to transform
            function findAndMarkTransformations(node: ts.Node): void {
                if (ts.isJsxElement(node) || ts.isJsxSelfClosingElement(node)) {
                    const elementName = ts.isJsxElement(node) 
                        ? (node.openingElement ? node.openingElement.tagName : undefined)
                        : node.tagName;
                    
                    if (elementName && ts.isIdentifier(elementName)) {
                        const name = elementName.text;
                        console.log(`  Found ${name} element, checking if static...`);
                        
                        // Only transform Roblox UI elements
                        if (name === "frame" || name === "textlabel" || name === "textbutton") {
                            const isStatic = isStaticJSXElement(node);
                            console.log(`  ${name} is ${isStatic ? 'static' : 'dynamic'}`);
                            
                            if (isStatic) {
                                console.log(`  Marking ${name} for transformation to createStaticElement`);
                                needsRuntimeImport = true;
                                hasOptimizations = true;
                                
                                const attributes = ts.isJsxElement(node) 
                                    ? (node.openingElement ? node.openingElement.attributes : ts.factory.createJsxAttributes([]))
                                    : node.attributes;
                                const props = createPropsFromJSXAttributes(attributes);
                                
                                // Transform children
                                const children: ts.Expression[] = [];
                                if (ts.isJsxElement(node) && node.children) {
                                    for (const child of node.children) {
                                        if (ts.isJsxText(child) && child.text.trim()) {
                                            children.push(ts.factory.createStringLiteral(child.text.trim()));
                                        }
                                    }
                                }
                                
                                // Create replacement
                                const replacement = ts.factory.createCallExpression(
                                    ts.factory.createIdentifier("createStaticElement"),
                                    undefined,
                                    [
                                        ts.factory.createStringLiteral(name),
                                        props,
                                        ...children
                                    ]
                                );
                                
                                transformations.push({ original: node, replacement });
                            }
                        }
                    }
                }
                
                try {
                    node.forEachChild(findAndMarkTransformations);
                } catch (error) {
                    // Skip problematic nodes
                    console.warn(`Skipping traversal of ${ts.SyntaxKind[node.kind]} due to error: ${error}`);
                }
            }
            
            // Find all transformations first
            findAndMarkTransformations(sourceFile);
            
            // Now create a transformer that applies the marked transformations
            const transformer = (node: ts.Node): ts.Node => {
                // Check if this node should be replaced
                const transformation = transformations.find(t => t.original === node);
                if (transformation) {
                    return transformation.replacement;
                }
                
                // Skip EnumMember nodes that cause issues
                if (node.kind === ts.SyntaxKind.EnumMember) {
                    return node;
                }
                
                // Continue visiting children with safety check
                try {
                    return ts.visitEachChild(node, transformer, context);
                } catch (error) {
                    console.warn(`Skipping node ${ts.SyntaxKind[node.kind]} due to error: ${error}`);
                    return node;
                }
            };
            
            // Transform the source file
            let transformedSourceFile = ts.visitNode(sourceFile, transformer) as ts.SourceFile;
            
            // Add runtime import if needed
            if (needsRuntimeImport) {
                console.log(`  Adding createStaticElement import`);
                
                const runtimeImport = ts.factory.createImportDeclaration(
                    undefined,
                    ts.factory.createImportClause(
                        false,
                        undefined,
                        ts.factory.createNamedImports([
                            ts.factory.createImportSpecifier(
                                false,
                                undefined,
                                ts.factory.createIdentifier("createStaticElement")
                            )
                        ])
                    ),
                    ts.factory.createStringLiteral("@rbxts/decillion-runtime")
                );

                // Add the import after existing imports
                const statements = [...transformedSourceFile.statements];
                let insertIndex = 0;
                
                for (let i = 0; i < statements.length; i++) {
                    if (ts.isImportDeclaration(statements[i])) {
                        insertIndex = i + 1;
                    } else {
                        break;
                    }
                }
                
                statements.splice(insertIndex, 0, runtimeImport);
                
                transformedSourceFile = ts.factory.updateSourceFile(
                    transformedSourceFile,
                    statements
                );
                
                // Add signature comment
                const sourceText = transformedSourceFile.getFullText();
                const commentedText = `// Optimized by Decillion - static elements converted to createStaticElement calls\n${sourceText}`;
                
                transformedSourceFile = ts.createSourceFile(
                    sourceFile.fileName,
                    commentedText,
                    sourceFile.languageVersion,
                    true
                );
            }
            
            if (hasOptimizations) {
                console.log(`✅ Applied Decillion optimizations to ${sourceFile.fileName}`);
                console.log(`Final transformed source preview:`);
                console.log(transformedSourceFile.getFullText().substring(0, 500) + "...");
            } else {
                console.log(`ℹ️  No static elements found to optimize in ${sourceFile.fileName}`);
            }
            
            return transformedSourceFile;
        };
    };
}

export default workingDecillionTransformer;