import eslint from "@eslint/js";
import tsParser from "@typescript-eslint/parser";
import prettier from "eslint-plugin-prettier/recommended";
import tseslint from "typescript-eslint";

export default [
    eslint.configs.recommended,
    ...tseslint.configs.recommended,
    prettier,
    {
        files: ["**/*.ts"],
        languageOptions: {
            parser: tsParser,
            parserOptions: {
                project: [
                    "tsconfig.json",
                    "tsconfig.vitest.json"
                ],
                sourceType: "module",
            },
            
        },
    },
    {
        ignores: ["test/**/*"],
    },
];
