const fs = require('fs');
const path = require('path');
const { transformSync } = require('../node_modules/esbuild/lib/main.js');

const roots = ['resources/js/Pages', 'resources/js/Components', 'resources/js/Layouts', 'resources/js/Hooks'];
const bad = [];

function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) walk(full);
        else if (entry.name.endsWith('.jsx') || entry.name.endsWith('.js')) {
            const src = fs.readFileSync(full, 'utf8');
            try {
                transformSync(src, { loader: 'jsx' });
            } catch (e) {
                bad.push({ file: full, error: String(e.message).split('\n').slice(0, 3).join(' | ') });
            }
        }
    }
}

roots.forEach(walk);
if (bad.length === 0) {
    console.log('ALL CLEAN');
} else {
    bad.forEach((b) => console.log(`\n${b.file}\n  ${b.error}`));
    console.log(`\n${bad.length} file(s) with syntax errors`);
}
