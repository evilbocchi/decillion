import * as ts from "typescript";

/**
 * Simple debug transformer to understand what roblox-ts passes to transformers
 */
function simpleDecillionTransformer(program: ts.Program): ts.TransformerFactory<ts.SourceFile> {
    return (context: ts.TransformationContext) => {
        return (sourceFile: ts.SourceFile) => {
            console.log(`Simple transformer processing: ${sourceFile.fileName}`);
            console.log(`Source file statements: ${sourceFile.statements.length}`);
            
            // Log the first few statements to understand structure
            sourceFile.statements.slice(0, 5).forEach((stmt, index) => {
                console.log(`Statement ${index}: ${ts.SyntaxKind[stmt.kind]}`);
                
                // If it's a variable declaration, look deeper
                if (ts.isVariableStatement(stmt)) {
                    console.log(`  VariableStatement details:`);
                    stmt.declarationList.declarations.forEach((decl, declIndex) => {
                        console.log(`    Declaration ${declIndex}: ${decl.name.getText()}`);
                        if (decl.initializer) {
                            console.log(`      Initializer: ${ts.SyntaxKind[decl.initializer.kind]}`);
                        }
                    });
                } else if (ts.isExportAssignment(stmt)) {
                    console.log(`  ExportAssignment: ${stmt.expression ? ts.SyntaxKind[stmt.expression.kind] : 'no expression'}`);
                } else if (ts.isFunctionDeclaration(stmt)) {
                    console.log(`  FunctionDeclaration: ${stmt.name?.getText() || 'anonymous'}`);
                    if (stmt.body) {
                        console.log(`    Body: ${ts.SyntaxKind[stmt.body.kind]}`);
                    }
                } else if (stmt.kind === ts.SyntaxKind.VariableDeclarationList) {
                    console.log(`  VariableDeclarationList details:`);
                    // This shouldn't happen as VariableDeclarationList is not a statement
                    console.log(`  Unexpected VariableDeclarationList as statement`);
                } else {
                    console.log(`  Statement text preview: ${stmt.getText().substring(0, 100)}...`);
                }
            });
            
            // Look for any JSX or React elements
            let foundReactElements = false;
            
            const visitor = (node: ts.Node): ts.Node => {
                // Log interesting nodes but be careful with the visitor return
                if (ts.isJsxElement(node) || ts.isJsxSelfClosingElement(node)) {
                    console.log(`Found JSX element!`);
                    foundReactElements = true;
                }
                
                if (ts.isCallExpression(node)) {
                    const expr = node.expression;
                    if (ts.isPropertyAccessExpression(expr)) {
                        const text = expr.getText();
                        if (text.includes("React.createElement")) {
                            console.log(`Found React.createElement call!`);
                            foundReactElements = true;
                        }
                    }
                }
                
                // Skip EnumMember nodes that cause issues
                if (node.kind === ts.SyntaxKind.EnumMember) {
                    return node;
                }
                
                // Use proper visitor pattern with safety check
                try {
                    return ts.visitEachChild(node, visitor, context);
                } catch (error) {
                    console.log(`Skipping node ${ts.SyntaxKind[node.kind]} due to error: ${error}`);
                    return node;
                }
            };
            
            const result = ts.visitNode(sourceFile, visitor) as ts.SourceFile;
            
            if (foundReactElements) {
                console.log(`✓ Found React elements in ${sourceFile.fileName}`);
            } else {
                console.log(`✗ No React elements found in ${sourceFile.fileName}`);
            }
            
            return result;
        };
    };
}

export default simpleDecillionTransformer;