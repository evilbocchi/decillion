#!/usr/bin/env node

/**
 * Copy runtime build output to demo node_modules for testing
 * 
 * This script copies the built runtime from runtime/out to demo/node_modules/@decillion/runtime/out
 * to avoid symlink issues during development.
 * 
 * Usage:
 *   node copy-runtime.js
 *   node copy-runtime.js --watch
 *   node copy-runtime.js --verbose
 *   node copy-runtime.js --watch --verbose
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

// Parse command line arguments
const args = process.argv.slice(2);
const watch = args.includes('--watch');
const verbose = args.includes('--verbose');

// Define paths
const scriptDir = __dirname;
const runtimeOutPath = path.join(scriptDir, 'runtime', 'out');
const demoNodeModulesPath = path.join(scriptDir, 'demo', 'node_modules', '@decillion', 'runtime');
const targetOutPath = path.join(demoNodeModulesPath, 'out');

function log(message, color = 'white') {
    const colors = {
        red: '\x1b[31m',
        green: '\x1b[32m',
        yellow: '\x1b[33m',
        blue: '\x1b[34m',
        cyan: '\x1b[36m',
        gray: '\x1b[90m',
        white: '\x1b[37m',
        reset: '\x1b[0m'
    };
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function copyDirectorySync(src, dest) {
    if (!fs.existsSync(src)) {
        return false;
    }
    
    if (!fs.existsSync(dest)) {
        fs.mkdirSync(dest, { recursive: true });
    }
    
    const entries = fs.readdirSync(src, { withFileTypes: true });
    
    for (const entry of entries) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);
        
        if (entry.isDirectory()) {
            copyDirectorySync(srcPath, destPath);
        } else {
            fs.copyFileSync(srcPath, destPath);
        }
    }
    
    return true;
}

function countFiles(dir) {
    let count = 0;
    
    function countRecursive(currentDir) {
        const entries = fs.readdirSync(currentDir, { withFileTypes: true });
        for (const entry of entries) {
            const fullPath = path.join(currentDir, entry.name);
            if (entry.isDirectory()) {
                countRecursive(fullPath);
            } else {
                count++;
            }
        }
    }
    
    if (fs.existsSync(dir)) {
        countRecursive(dir);
    }
    
    return count;
}

function copyRuntimeFiles(isVerbose = false) {
    // Check if source exists
    if (!fs.existsSync(runtimeOutPath)) {
        log(`Runtime output directory not found at: ${runtimeOutPath}`, 'red');
        log("Please run 'npm run build' in the runtime directory first.", 'yellow');
        return false;
    }

    // Create target directory structure if it doesn't exist
    if (!fs.existsSync(demoNodeModulesPath)) {
        if (isVerbose) {
            log(`Creating directory: ${demoNodeModulesPath}`, 'cyan');
        }
        fs.mkdirSync(demoNodeModulesPath, { recursive: true });
    }

    // Remove existing out directory if it exists
    if (fs.existsSync(targetOutPath)) {
        if (isVerbose) {
            log(`Removing existing: ${targetOutPath}`, 'yellow');
        }
        fs.rmSync(targetOutPath, { recursive: true, force: true });
    }

    // Copy the out directory
    try {
        if (isVerbose) {
            log(`Copying ${runtimeOutPath} -> ${targetOutPath}`, 'green');
        }
        
        copyDirectorySync(runtimeOutPath, targetOutPath);
        
        const fileCount = countFiles(targetOutPath);
        log(`✅ Successfully copied ${fileCount} files to demo/node_modules/@decillion/runtime/out`, 'green');
        return true;
    } catch (error) {
        log(`Failed to copy runtime files: ${error.message}`, 'red');
        return false;
    }
}

// Initial copy
log('🔄 Copying runtime output to demo...', 'blue');
const success = copyRuntimeFiles(verbose);

if (!success) {
    process.exit(1);
}

// Watch mode
if (watch) {
    log('👀 Watching for changes in runtime/out...', 'blue');
    log('Press Ctrl+C to stop watching', 'gray');
    
    const chokidar = require('chokidar');
    
    // Check if chokidar is available, if not provide fallback
    let watcher;
    try {
        watcher = chokidar.watch(runtimeOutPath, {
            ignored: /(^|[\/\\])\../, // ignore dotfiles
            persistent: true,
            ignoreInitial: true
        });
        
        let timeoutId;
        
        const debouncedCopy = () => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                copyRuntimeFiles(verbose);
            }, 500);
        };
        
        watcher
            .on('add', (filePath) => {
                log(`🔄 Detected file added: ${path.relative(runtimeOutPath, filePath)}`, 'yellow');
                debouncedCopy();
            })
            .on('change', (filePath) => {
                log(`🔄 Detected file changed: ${path.relative(runtimeOutPath, filePath)}`, 'yellow');
                debouncedCopy();
            })
            .on('unlink', (filePath) => {
                log(`🔄 Detected file deleted: ${path.relative(runtimeOutPath, filePath)}`, 'yellow');
                debouncedCopy();
            });
            
    } catch (error) {
        log('chokidar not found, falling back to basic fs.watch', 'yellow');
        log('For better file watching, install chokidar: npm install chokidar', 'yellow');
        
        // Fallback to fs.watch
        let timeoutId;
        
        const debouncedCopy = () => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                copyRuntimeFiles(verbose);
            }, 500);
        };
        
        fs.watch(runtimeOutPath, { recursive: true }, (eventType, filename) => {
            if (filename) {
                log(`🔄 Detected ${eventType} in ${filename}`, 'yellow');
                debouncedCopy();
            }
        });
    }
    
    // Keep the process running
    process.on('SIGINT', () => {
        log('\n👋 Stopping file watcher...', 'gray');
        if (watcher && watcher.close) {
            watcher.close();
        }
        process.exit(0);
    });
}
