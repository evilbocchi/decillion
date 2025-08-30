const ts = require('typescript');
const path = require('path');

// Import our transformer
const { millionTransformer } = require('./transformer/out/index.js');

// Read the demo file
const demoFile = path.join(__dirname, 'demo/src/counter.tsx');
const sourceCode = require('fs').readFileSync(demoFile, 'utf8');

// Create a proper TypeScript program
const fileName = path.resolve(demoFile);
const configFileName = path.join(__dirname, 'demo/tsconfig.json');

// Read the actual tsconfig.json
const configFile = ts.readConfigFile(configFileName, ts.sys.readFile);
const compilerOptions = ts.parseJsonConfigFileContent(configFile.config, ts.sys, path.dirname(configFileName));

// Create program with proper type checking
const program = ts.createProgram([fileName], compilerOptions.options);

// Create our transformer
const transformer = millionTransformer(program, { 
    addSignature: true, 
    debug: true 
});

// Get the source file from the program
const sourceFile = program.getSourceFile(fileName);

if (!sourceFile) {
    console.error('Could not load source file');
    process.exit(1);
}

// Create transformation context
const context = {
    factory: ts.factory,
    readEmitHelpers: () => undefined,
    requestEmitHelper: () => {},
    getEmitHelperUniqueId: () => 0
};

// Apply the transformer
const transformedFile = transformer(context)(sourceFile);

// Print the result
console.log('=== ORIGINAL ===');
console.log(sourceCode.substring(0, 200) + '...');
console.log('\n=== TRANSFORMED ===');

// Check if the file was actually transformed
if (transformedFile !== sourceFile) {
    console.log('File was transformed!');
    try {
        const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed });
        const result = printer.printFile(transformedFile);
        console.log(result.substring(0, 800));
    } catch (e) {
        console.log('Error printing, using getText() instead:');
        console.log(transformedFile.getFullText().substring(0, 800));
    }
} else {
    console.log('File was NOT transformed (returned original)');
    console.log(sourceCode.substring(0, 800));
}