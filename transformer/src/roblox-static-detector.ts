import * as fs from "fs";
import * as path from "path";
import * as ts from "typescript";

interface CacheData {
    version: string;
    staticConstructors: string[];
    staticMethods: Record<string, string[]>;
    staticProperties: Record<string, string[]>;
}

/**
 * Cache for Roblox built-in detection to avoid re-parsing roblox.d.ts
 */
class RobloxStaticDetector {
    private staticConstructors = new Set<string>();
    private staticMethods = new Map<string, Set<string>>();
    private staticProperties = new Map<string, Set<string>>();
    private initialized = false;
    private visitedFiles = new Set<string>();
    private currentRbxtsVersion?: string;
    private cacheFilePath?: string;

    /**
     * Initialize the detector by parsing roblox.d.ts and all referenced files
     */
    initialize(program: ts.Program): void {
        if (this.initialized) return;

        // Clear visited files cache for fresh initialization
        this.visitedFiles.clear();

        // Get @rbxts/types version for caching
        this.currentRbxtsVersion = this.getRbxtsVersion(program);
        this.cacheFilePath = this.getCacheFilePath(program);

        // Try to load from cache first
        if (this.currentRbxtsVersion && this.loadFromCache()) {
            this.initialized = true;
            return;
        }

        const resolved = this.resolveRobloxDTs(program);
        if (!resolved) {
            throw new Error('Could not resolve @rbxts/types');
        }

        const robloxDTs = this.createSourceFileFromPath(resolved.resolvedFileName);
        if (!robloxDTs) {
            throw new Error('Could not create source file for roblox.d.ts');
        }
        

        // Parse the main roblox.d.ts file
        this.parseRbxtsDts(robloxDTs);

        // Parse all referenced files
        this.parseReferencedFiles(robloxDTs);

        // Save to cache
        this.saveToCache();

        this.initialized = true;
    }

    private resolveRobloxDTs(program: ts.Program): ts.ResolvedModuleFull | undefined {
        return ts.resolveModuleName(
            '@rbxts/types',
            program.getCurrentDirectory(),
            program.getCompilerOptions(),
            ts.sys
        ).resolvedModule;
    }

    /**
     * Get the @rbxts/types version from package.json
     */
    private getRbxtsVersion(program: ts.Program): string | undefined {
        try {
            const currentDir = program.getCurrentDirectory();
            const packageJsonPath = this.findPackageJson(currentDir);
            
            if (!packageJsonPath || !fs.existsSync(packageJsonPath)) {
                return undefined;
            }

            const packageJsonContent = fs.readFileSync(packageJsonPath, 'utf-8');
            const packageJson = JSON.parse(packageJsonContent);
            
            // Check both dependencies and devDependencies
            const version = packageJson.dependencies?.['@rbxts/types'] || 
                          packageJson.devDependencies?.['@rbxts/types'];
            
            return version;
        } catch (error) {
            console.warn('Failed to read @rbxts/types version:', error);
            return undefined;
        }
    }

    /**
     * Find the nearest package.json file
     */
    private findPackageJson(dir: string): string | undefined {
        let currentDir = dir;
        
        while (currentDir !== path.dirname(currentDir)) {
            const packageJsonPath = path.join(currentDir, 'package.json');
            if (fs.existsSync(packageJsonPath)) {
                return packageJsonPath;
            }
            currentDir = path.dirname(currentDir);
        }
        
        return undefined;
    }

    /**
     * Get the cache file path
     */
    private getCacheFilePath(program: ts.Program): string {
        const currentDir = program.getCurrentDirectory();
        const cacheDir = path.join(currentDir, 'node_modules', '.cache', 'decillion');
        
        // Ensure cache directory exists
        if (!fs.existsSync(cacheDir)) {
            fs.mkdirSync(cacheDir, { recursive: true });
        }
        
        return path.join(cacheDir, 'roblox-static-cache.json');
    }

    /**
     * Load cached data if version matches
     */
    private loadFromCache(): boolean {
        if (!this.cacheFilePath || !this.currentRbxtsVersion) {
            return false;
        }

        try {
            if (!fs.existsSync(this.cacheFilePath)) {
                return false;
            }

            const cacheContent = fs.readFileSync(this.cacheFilePath, 'utf-8');
            const cacheData: CacheData = JSON.parse(cacheContent);

            // Check if version matches
            if (cacheData.version !== this.currentRbxtsVersion) {
                return false;
            }

            // Load cached data
            this.staticConstructors = new Set(cacheData.staticConstructors);
            
            this.staticMethods.clear();
            for (const [key, values] of Object.entries(cacheData.staticMethods)) {
                this.staticMethods.set(key, new Set(values));
            }
            
            this.staticProperties.clear();
            for (const [key, values] of Object.entries(cacheData.staticProperties)) {
                this.staticProperties.set(key, new Set(values));
            }

            return true;
        } catch (error) {
            console.warn('Failed to load cache:', error);
            return false;
        }
    }

    /**
     * Save current data to cache
     */
    private saveToCache(): void {
        if (!this.cacheFilePath || !this.currentRbxtsVersion) {
            return;
        }

        try {
            const cacheData: CacheData = {
                version: this.currentRbxtsVersion,
                staticConstructors: Array.from(this.staticConstructors),
                staticMethods: Object.fromEntries(
                    Array.from(this.staticMethods.entries()).map(([key, values]) => [key, Array.from(values)])
                ),
                staticProperties: Object.fromEntries(
                    Array.from(this.staticProperties.entries()).map(([key, values]) => [key, Array.from(values)])
                )
            };

            fs.writeFileSync(this.cacheFilePath, JSON.stringify(cacheData, null, 2), 'utf-8');
        } catch (error) {
            console.warn('Failed to save cache:', error);
        }
    }

    /**
     * Parse all files referenced by triple-slash directives
     */
    private parseReferencedFiles(sourceFile: ts.SourceFile): void {
        const baseDir = path.dirname(sourceFile.fileName);

        // Normalize the file path to prevent duplicate processing
        const normalizedPath = path.resolve(sourceFile.fileName);
        
        // Skip if we've already visited this file to prevent circular references
        if (this.visitedFiles.has(normalizedPath)) {
            return;
        }
        
        // Mark this file as visited
        this.visitedFiles.add(normalizedPath);

        // Extract reference paths from the source file
        const referencePaths = this.extractReferenceDirectives(sourceFile);

        for (const refPath of referencePaths) {
            const resolvedPath = path.resolve(baseDir, refPath);
            const referencedFile = this.createSourceFileFromPath(resolvedPath);

            if (referencedFile) {
                this.parseRbxtsDts(referencedFile);

                // Recursively parse any references in the referenced file
                this.parseReferencedFiles(referencedFile);
            }
        }
    }

    /**
     * Extract reference directive paths from a source file
     */
    private extractReferenceDirectives(sourceFile: ts.SourceFile): string[] {
        const referencePaths: string[] = [];
        const fullText = sourceFile.getFullText();

        // Match triple-slash reference directives
        const referenceRegex = /\/\/\/\s*<reference\s+path="([^"]+)"\s*\/>/g;
        let match;

        while ((match = referenceRegex.exec(fullText)) !== null) {
            referencePaths.push(match[1]);
        }

        return referencePaths;
    }

    /**
     * Create a TypeScript SourceFile from a file path
     */
    private createSourceFileFromPath(filePath: string): ts.SourceFile | undefined {
        try {
            if (!fs.existsSync(filePath)) {
                return undefined;
            }

            const fileContent = fs.readFileSync(filePath, 'utf-8');
            return ts.createSourceFile(
                filePath,
                fileContent,
                ts.ScriptTarget.Latest,
                true // setParentNodes
            );
        } catch (error) {
            console.warn(`Failed to read ${filePath}:`, error);
            return undefined;
        }
    }

    /**
     * Parse a rbxts built-in declaration file to extract static constructors and methods
     */
    private parseRbxtsDts(sourceFile: ts.SourceFile): void {
        const visit = (node: ts.Node) => {
            // Look for interface or class declarations
            if (ts.isInterfaceDeclaration(node) || ts.isClassDeclaration(node)) {
                const typeName = node.name?.text;
                if (!typeName) return;

                this.parseDataTypeMembers(node, typeName);
            }

            // Look for namespace declarations (like Enum)
            if (ts.isModuleDeclaration(node) && node.name && ts.isIdentifier(node.name)) {
                const namespaceName = node.name.text;
                if (namespaceName === 'Enum' && node.body && ts.isModuleBlock(node.body)) {
                    this.parseEnumNamespace(node.body);
                }
            }

            ts.forEachChild(node, visit);
        };

        visit(sourceFile);
    }

    /**
     * Parse members of a data type interface/class
     */
    private parseDataTypeMembers(node: ts.InterfaceDeclaration | ts.ClassDeclaration, typeName: string): void {
        if (!node.members) return;

        for (const member of node.members) {
            if (ts.isMethodSignature(member) || ts.isMethodDeclaration(member)) {
                const memberName = member.name && ts.isIdentifier(member.name) ? member.name.text : undefined;
                if (!memberName) continue;

                if (!this.staticMethods.has(typeName)) {
                    this.staticMethods.set(typeName, new Set());
                }
                this.staticMethods.get(typeName)!.add(memberName);
            }

            if (ts.isPropertySignature(member) || ts.isPropertyDeclaration(member)) {
                const memberName = member.name && ts.isIdentifier(member.name) ? member.name.text : undefined;
                if (!memberName) continue;

                if (!this.staticProperties.has(typeName)) {
                    this.staticProperties.set(typeName, new Set());
                }
                this.staticProperties.get(typeName)!.add(memberName);
            }
        }

        // Mark as having constructor if it's a known constructible type
        this.staticConstructors.add(typeName);
    }

    /**
     * Parse Enum namespace to find enum types
     */
    private parseEnumNamespace(moduleBody: ts.ModuleBlock): void {
        for (const statement of moduleBody.statements) {
            if (ts.isModuleDeclaration(statement) && statement.name && ts.isIdentifier(statement.name)) {
                const enumName = statement.name.text;
                // Enum values are essentially static properties
                if (!this.staticProperties.has('Enum')) {
                    this.staticProperties.set('Enum', new Set());
                }
                this.staticProperties.get('Enum')!.add(enumName);
            }
        }
    }

    /**
     * Check if a call expression is a static Roblox constructor or method
     */
    isStaticRobloxCall(expr: ts.CallExpression): boolean {
        if (ts.isPropertyAccessExpression(expr.expression)) {
            const objName = ts.isIdentifier(expr.expression.expression) ? expr.expression.expression.text : "";
            const methodName = ts.isIdentifier(expr.expression.name) ? expr.expression.name.text : "";

            // Check if it's a static method call
            const staticMethods = this.staticMethods.get(objName);
            return staticMethods ? staticMethods.has(methodName) : false;
        }

        if (ts.isIdentifier(expr.expression)) {
            const constructorName = expr.expression.text;
            return this.staticConstructors.has(constructorName);
        }

        return false;
    }

    /**
     * Check if a new expression is a static Roblox constructor
     */
    isStaticRobloxNew(expr: ts.NewExpression): boolean {
        if (ts.isIdentifier(expr.expression)) {
            const constructorName = expr.expression.text;
            return this.staticConstructors.has(constructorName);
        }

        return false;
    }

    /**
     * Check if a property access expression is a static Roblox property
     */
    isStaticRobloxProperty(expr: ts.PropertyAccessExpression): boolean {
        const objName = ts.isIdentifier(expr.expression) ? expr.expression.text : "";
        const propName = ts.isIdentifier(expr.name) ? expr.name.text : "";

        const staticProps = this.staticProperties.get(objName);
        return staticProps ? staticProps.has(propName) : false;
    }
}

// Create a singleton instance
export const robloxStaticDetector = new RobloxStaticDetector();