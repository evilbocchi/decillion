import '@rbxts/types';
import * as fs from "fs";
import * as path from "path";
import * as ts from "typescript";

/**
 * Cache for Roblox built-in detection to avoid re-parsing roblox.d.ts
 */
class RobloxStaticDetector {
    private staticConstructors = new Set<string>();
    private staticMethods = new Map<string, Set<string>>();
    private staticProperties = new Map<string, Set<string>>();
    private initialized = false;

    /**
     * Initialize the detector by parsing roblox.d.ts
     */
    initialize(program: ts.Program): void {
        if (this.initialized) return;

        // Find roblox.d.ts in the program
        const robloxDtsFile = this.findRobloxDts(program);
        if (robloxDtsFile) {
            this.parseRobloxDts(robloxDtsFile);
        } else {
            // Fallback to hardcoded knowledge when types aren't available
            this.initializeFallbackMode();
        }

        this.initialized = true;
    }

    /**
     * Find roblox.d.ts file in the TypeScript program
     */
    private findRobloxDts(program: ts.Program): ts.SourceFile | undefined {
        const sourceFiles = program.getSourceFiles();

        for (const sourceFile of sourceFiles) {
            if (sourceFile.fileName.includes('roblox.d.ts') ||
                sourceFile.fileName.includes('@rbxts/types')) {
                return sourceFile;
            }
        }

        // Try to find it manually in node_modules
        const compilerOptions = program.getCompilerOptions();
        if (compilerOptions.typeRoots) {
            for (const typeRoot of compilerOptions.typeRoots) {
                const robloxPath = path.join(typeRoot, '@rbxts', 'types', 'include', 'roblox.d.ts');
                if (fs.existsSync(robloxPath)) {
                    const sourceFile = program.getSourceFile(robloxPath);
                    if (sourceFile) return sourceFile;
                }
            }
        }

        return this.resolveRobloxTypes(program);
    }

    private resolveRobloxTypes(program: ts.Program): ts.SourceFile | undefined {
        // Use ts.sys as the module resolution host
        const resolved = ts.resolveModuleName(
            '@rbxts/types',
            program.getCurrentDirectory(),
            program.getCompilerOptions(),
            ts.sys
        );

        if (resolved.resolvedModule) {
            const resolvedFileName = resolved.resolvedModule.resolvedFileName;
            
            // First try to get it from the program
            let sourceFile = program.getSourceFile(resolvedFileName);
            if (sourceFile) {
                return sourceFile;
            }
            
            // If not in program, check if it's the main roblox.d.ts file we need
            if (resolvedFileName.includes('roblox.d.ts')) {
                return this.createSourceFileFromPath(resolvedFileName);
            }
            
            // If it's the main @rbxts/types module, look for roblox.d.ts in the same directory
            const robloxDtsPath = path.join(path.dirname(resolvedFileName), 'roblox.d.ts');
            if (fs.existsSync(robloxDtsPath)) {
                return this.createSourceFileFromPath(robloxDtsPath);
            }
            
            // Try the include subdirectory
            const includeRobloxPath = path.join(path.dirname(resolvedFileName), 'include', 'roblox.d.ts');
            if (fs.existsSync(includeRobloxPath)) {
                return this.createSourceFileFromPath(includeRobloxPath);
            }
        }
        return undefined;
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
     * Parse roblox.d.ts to extract static constructors and methods
     */
    private parseRobloxDts(sourceFile: ts.SourceFile): void {
        const visit = (node: ts.Node) => {
            // Look for interface or class declarations
            if (ts.isInterfaceDeclaration(node) || ts.isClassDeclaration(node)) {
                const typeName = node.name?.text;
                if (!typeName) return;

                // Check if this looks like a Roblox data type
                if (this.isRobloxDataType(typeName)) {
                    this.parseDataTypeMembers(node, typeName);
                }
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
     * Check if a type name looks like a Roblox data type
     */
    private isRobloxDataType(typeName: string): boolean {
        // Common Roblox data types that have constructors
        const dataTypePattern = /^(Color3|Vector[23]|UDim2?|CFrame|Ray|Region3|BrickColor|NumberRange|ColorSequence|NumberSequence|PathWaypoint|TweenInfo|Random)$/;
        return dataTypePattern.test(typeName);
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

                // Check if it's a static method
                const isStatic = member.modifiers?.some(mod => mod.kind === ts.SyntaxKind.StaticKeyword);

                if (isStatic || this.isKnownStaticMethod(typeName, memberName)) {
                    if (!this.staticMethods.has(typeName)) {
                        this.staticMethods.set(typeName, new Set());
                    }
                    this.staticMethods.get(typeName)!.add(memberName);
                }
            }

            if (ts.isPropertySignature(member) || ts.isPropertyDeclaration(member)) {
                const memberName = member.name && ts.isIdentifier(member.name) ? member.name.text : undefined;
                if (!memberName) continue;

                const isStatic = member.modifiers?.some(mod => mod.kind === ts.SyntaxKind.StaticKeyword);

                if (isStatic || this.isKnownStaticProperty(typeName, memberName)) {
                    if (!this.staticProperties.has(typeName)) {
                        this.staticProperties.set(typeName, new Set());
                    }
                    this.staticProperties.get(typeName)!.add(memberName);
                }
            }
        }

        // Mark as having constructor if it's a known constructible type
        if (this.isConstructibleType(typeName)) {
            this.staticConstructors.add(typeName);
        }
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
     * Check if a method is known to be static (based on Roblox API knowledge)
     */
    private isKnownStaticMethod(typeName: string, methodName: string): boolean {
        const knownStatic: Record<string, string[]> = {
            'Color3': ['new', 'fromRGB', 'fromHSV', 'fromHex'],
            'Vector2': ['new'],
            'Vector3': ['new', 'FromNormalId', 'FromAxis'],
            'UDim': ['new'],
            'UDim2': ['new', 'fromScale', 'fromOffset'],
            'CFrame': ['new', 'lookAt', 'fromAxisAngle', 'fromOrientation', 'fromEulerAnglesXYZ', 'fromEulerAnglesYXZ', 'fromMatrix', 'Angles'],
            'Ray': ['new'],
            'Region3': ['new'],
            'BrickColor': ['new', 'palette', 'random', 'White', 'Gray', 'DarkGray', 'Black', 'Red', 'Yellow', 'Green', 'Blue'],
            'NumberRange': ['new'],
            'ColorSequence': ['new'],
            'NumberSequence': ['new'],
            'PathWaypoint': ['new'],
            'TweenInfo': ['new'],
            'Random': ['new']
        };

        return knownStatic[typeName]?.includes(methodName) || false;
    }

    /**
     * Check if a property is known to be static
     */
    private isKnownStaticProperty(typeName: string, propertyName: string): boolean {
        const knownStatic: Record<string, string[]> = {
            'BrickColor': ['White', 'Gray', 'DarkGray', 'Black', 'Red', 'Yellow', 'Green', 'Blue'],
            'CFrame': ['identity']
        };

        return knownStatic[typeName]?.includes(propertyName) || false;
    }

    /**
     * Check if a type is constructible (has a constructor)
     */
    private isConstructibleType(typeName: string): boolean {
        const constructibleTypes = [
            'Color3', 'Vector2', 'Vector3', 'UDim', 'UDim2', 'CFrame', 'Ray',
            'Region3', 'BrickColor', 'NumberRange', 'ColorSequence',
            'NumberSequence', 'PathWaypoint', 'TweenInfo', 'Random'
        ];
        return constructibleTypes.includes(typeName);
    }

    /**
     * Initialize fallback mode with hardcoded Roblox API knowledge
     * Used when @rbxts/types is not available at transform time
     */
    private initializeFallbackMode(): void {
        // Static constructors
        const constructibleTypes = [
            'Color3', 'Vector2', 'Vector3', 'UDim', 'UDim2', 'CFrame', 'Ray',
            'Region3', 'BrickColor', 'NumberRange', 'ColorSequence',
            'NumberSequence', 'PathWaypoint', 'TweenInfo', 'Random'
        ];

        for (const type of constructibleTypes) {
            this.staticConstructors.add(type);
        }

        // Static methods
        const staticMethods: Record<string, string[]> = {
            'Color3': ['new', 'fromRGB', 'fromHSV', 'fromHex'],
            'Vector2': ['new'],
            'Vector3': ['new', 'FromNormalId', 'FromAxis'],
            'UDim': ['new'],
            'UDim2': ['new', 'fromScale', 'fromOffset'],
            'CFrame': ['new', 'lookAt', 'fromAxisAngle', 'fromOrientation', 'fromEulerAnglesXYZ', 'fromEulerAnglesYXZ', 'fromMatrix', 'Angles'],
            'Ray': ['new'],
            'Region3': ['new'],
            'BrickColor': ['new', 'palette', 'random', 'White', 'Gray', 'DarkGray', 'Black', 'Red', 'Yellow', 'Green', 'Blue'],
            'NumberRange': ['new'],
            'ColorSequence': ['new'],
            'NumberSequence': ['new'],
            'PathWaypoint': ['new'],
            'TweenInfo': ['new'],
            'Random': ['new']
        };

        for (const [typeName, methods] of Object.entries(staticMethods)) {
            this.staticMethods.set(typeName, new Set(methods));
        }

        // Static properties
        const staticProperties: Record<string, string[]> = {
            'BrickColor': ['White', 'Gray', 'DarkGray', 'Black', 'Red', 'Yellow', 'Green', 'Blue'],
            'CFrame': ['identity'],
            'Enum': [] // Will be populated with all enum types
        };

        for (const [typeName, properties] of Object.entries(staticProperties)) {
            this.staticProperties.set(typeName, new Set(properties));
        }

        // Common Enum types (subset for performance)
        const commonEnums = [
            'Material', 'SurfaceType', 'FormFactor', 'Shape', 'Axis', 'NormalId',
            'Font', 'FontSize', 'TextXAlignment', 'TextYAlignment', 'SizeConstraint',
            'AspectType', 'DominantAxis', 'FillDirection', 'HorizontalAlignment',
            'SortOrder', 'VerticalAlignment', 'EasingDirection', 'EasingStyle',
            'KeyCode', 'UserInputType', 'PlaybackState', 'ThumbnailType',
            'ThumbnailSize', 'DeviceType', 'Platform'
        ];

        const enumSet = this.staticProperties.get('Enum') || new Set<string>();
        for (const enumType of commonEnums) {
            enumSet.add(enumType);
        }
        this.staticProperties.set('Enum', enumSet);
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