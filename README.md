# Decillion: Million.js-Style UI Optimization for Roblox-TS

> **⚠️ This project is in active development. Expect bugs, breaking changes, and incomplete features! Use at your own risk and report issues.**

Decillion is a TypeScript-to-Luau compiler plugin and runtime that brings Million.js-inspired UI performance to Roblox. It statically analyzes TSX/JSX UI code, splits it into memoized blocks, and generates highly efficient Luau code that minimizes unnecessary Roblox UI tree mutations.

## Features

- **TypeScript/JSX to Luau Transpilation**: Write declarative UI in Roblox-TS, compile to optimized Luau.
- **Block Memoization**: UI is split into blocks/components that only re-render if their props/state change, inspired by Million.js.
- **Static Extraction**: 100% static UI subtrees are built once, skipping reconciliation.
- **Efficient Patch System**: Only updates Roblox Instances that actually need to change.
- **Roact-like API**: Familiar, ergonomic API for Roblox-TS developers.
- **Compile-Time Optimizations**: Most work is done at compile time, not runtime.

## Example

```tsx
// Write UI in Roblox-TS JSX
return (
  <frame>
    <textlabel Text={props.name} />
    <uigridlayout />
    {props.items.map(item => <textbutton Text={item} />)}
  </frame>
)
```

Decillion compiles this to Luau code that only updates changed parts of the UI tree.

## How It Works

1. **Write UI in Roblox-TS JSX**
2. **Compiler plugin transforms source:**
   - Detects block boundaries
   - Generates block memoization wrappers
   - Emits `shouldUpdate` logic per block
3. **Output Luau code:**
   - Each block is a function/class
   - UI tree is built with block skips
   - Patches only what’s needed when state/props change

## Project Structure

- `transformer/` — TypeScript transformer, codegen, and analysis logic
- `runtime/` — Luau runtime helpers
- `src/` — Example stories and benchmarks
- `MILLION_REFERENCE/` — Reference implementation from Million.js
- `demo/` — Demo project for Roblox

## Getting Started

1. **Install dependencies:**
   ```sh
   npm install
   ```
2. **Build sub-projects:**
   ```sh
   npm run build
   ```
3. **Run tests:**
   ```sh
   npm run test
   ```
4. **Try the demo:**
   See `demo/` for example usage and integration.

## Design Principles

- **Compile-time first:** Prefer static analysis and codegen over runtime logic.
- **Blockify everything:** Memoize UI blocks for maximum performance.
- **Minimal mutations:** Only update Roblox UI when absolutely necessary.
- **Developer ergonomics:** Keep APIs clear and easy to use.

## Contributing

Contributions are welcome! Please open issues or pull requests for bugs, features, or questions.

## License

MIT License. See [LICENSE](LICENSE) for details.
