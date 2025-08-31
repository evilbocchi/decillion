import * as ts from "typescript";

/**
 * Debug transformer that traverses the entire tree looking for JSX
 */
function debugTreeTransformer(program: ts.Program): ts.TransformerFactory<ts.SourceFile> {
    return (context: ts.TransformationContext) => {
        return (sourceFile: ts.SourceFile) => {
            console.log(`=== Debug Tree Transformer ===`);
            console.log(`Processing: ${sourceFile.fileName}`);
            
            let nodeCount = 0;
            let foundJSX = false;
            let foundReactCalls = false;
            
            function traverseNode(node: ts.Node, depth: number = 0): void {
                nodeCount++;
                const indent = "  ".repeat(Math.min(depth, 5));
                const nodeType = ts.SyntaxKind[node.kind];
                
                // Log first 20 nodes to see structure
                if (nodeCount <= 20) {
                    console.log(`${indent}${nodeType}`);
                    
                    if (ts.isIdentifier(node)) {
                        console.log(`${indent}  "${node.text}"`);
                    }
                }
                
                // Check for JSX
                if (ts.isJsxElement(node) || ts.isJsxSelfClosingElement(node)) {
                    foundJSX = true;
                    console.log(`🎯 FOUND JSX: ${nodeType} at depth ${depth}`);
                }
                
                // Check for React.createElement
                if (ts.isCallExpression(node)) {
                    const expr = node.expression;
                    if (ts.isPropertyAccessExpression(expr)) {
                        if (ts.isIdentifier(expr.expression) && expr.expression.text === "React" &&
                            ts.isIdentifier(expr.name) && expr.name.text === "createElement") {
                            foundReactCalls = true;
                            console.log(`🎯 FOUND React.createElement at depth ${depth}`);
                        }
                    }
                }
                
                // Continue traversing
                node.forEachChild(child => traverseNode(child, depth + 1));
            }
            
            traverseNode(sourceFile);
            
            console.log(`Total nodes: ${nodeCount}`);
            console.log(`Found JSX: ${foundJSX}`);
            console.log(`Found React.createElement: ${foundReactCalls}`);
            console.log(`=== End Debug ===`);
            
            return sourceFile;
        };
    };
}

export default debugTreeTransformer;