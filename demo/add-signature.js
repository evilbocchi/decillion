#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const signature = `--[[
 * This file was optimized by Decillion - Million.js-inspired Roblox-TS transformer
 * Generated on: ${new Date().toISOString()}
 * Transformer version: 1.0.0
 * 
 * Original source: src/counter.tsx
 * Optimizations applied: Block memoization, static extraction, efficient diffing
 * 
 * @see https://github.com/evilbocchi/decillion
 * @generated Automatically generated - do not edit directly
]]

`;

// Add signature to counter.luau
const counterPath = path.join(__dirname, 'out', 'counter.luau');
if (fs.existsSync(counterPath)) {
    const content = fs.readFileSync(counterPath, 'utf-8');
    const newContent = signature + content;
    fs.writeFileSync(counterPath, newContent, 'utf-8');
    console.log('Added Decillion signature to counter.luau');
} else {
    console.log('counter.luau not found');
}