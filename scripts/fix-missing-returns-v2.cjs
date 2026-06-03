const fs = require('fs');
const path = require('path');
const glob = require('glob');

const baseDir = path.resolve(__dirname, '..');
const files = glob.sync('docs/**/sequence/*.puml', { cwd: baseDir });

let totalFixed = 0;
let fileReport = {};

files.forEach(file => {
    const fullPath = path.join(baseDir, file);
    const content = fs.readFileSync(fullPath, 'utf-8');
    const lines = content.split('\n');
    const newLines = [];
    let fixedCount = 0;

    for (let i = 0; i < lines.length; i++) {
        newLines.push(lines[i]);
    }

    // Work backwards or forwards? Work forwards with insertions.
    // Re-parse newLines each time we find an issue
    let changed = true;
    while (changed) {
        changed = false;
        let currentLines = [...newLines];

        for (let i = 0; i < currentLines.length - 1; i++) {
            const line1 = currentLines[i].trim();
            const line2 = currentLines[i + 1].trim();

            if (!line1 || line1.startsWith("'")) continue;
            if (!line2 || line2.startsWith("'")) continue;

            // Skip header lines
            if (line1.startsWith('@') || line1.startsWith('==') || line1.startsWith('!') ||
                line1.startsWith('skin') || line1.startsWith('title') || line1.startsWith('actor') ||
                line1.startsWith('boundary') || line1.startsWith('control') || line1.startsWith('entity') ||
                line1.startsWith('database') || line1.startsWith('participant')) continue;

            if (line2.startsWith('@') || line2.startsWith('==') || line2.startsWith('!') ||
                line2.startsWith('skin') || line2.startsWith('title') || line2.startsWith('actor') ||
                line2.startsWith('boundary') || line2.startsWith('control') || line2.startsWith('entity') ||
                line2.startsWith('database') || line2.startsWith('participant')) continue;

            // Check if line1 is a request arrow
            // Request: Source -> Dest : label (solid arrow, not return)
            const req1Match = line1.match(/^(\s*)(\S+)\s+->\s+(\S+)\s*(.*)$/);
            if (!req1Match) continue;
            if (line1.includes('-->') || line1.includes('->>')) continue;

            // Check if line2 is also a request arrow (not a return)
            if (line2.includes('-->') || line2.includes('->>')) continue;
            const req2Match = line2.match(/^(\s*)(\S+)\s+->\s+(\S+)\s*(.*)$/);
            if (!req2Match) continue;

            // Get source and dest from line1
            const ws1 = req1Match[1];
            const src1 = req1Match[2];
            const dst1 = req1Match[3];
            const label1 = req1Match[4].trim();

            // Get indentation from current line (use ws of line1 or line2)
            const indent = ws1;

            // Insert return arrow before line2
            let returnDesc = '';
            if (line1.includes('Browser') || line1.includes('Page')) {
                if (line2.includes('Controller') || line2.includes('Ctrl')) {
                    returnDesc = ' : response / redirect';
                }
            } else if (line1.includes('Controller') || line1.includes('Ctrl')) {
                if (line2.includes('Model')) {
                    returnDesc = ' : Hasil query';
                } else if (line2.includes('Controller') || line2.includes('Ctrl')) {
                    returnDesc = ' : Hasil proses';
                } else if (line2.includes('Browser') || line2.includes('Page')) {
                    returnDesc = ' : Response data';
                }
            } else if (line1.includes('Model')) {
                returnDesc = ' : Hasil proses';
            } else if (line1.includes('Mail') || line1.includes('Notification') || line1.includes('Notif')) {
                returnDesc = ' : Status kirim';
            } else {
                returnDesc = ' : Return';
            }

            const returnLine = indent + dst1 + ' --> ' + src1 + returnDesc;

            // Insert the return line
            newLines.splice(i + 1, 0, returnLine);
            fixedCount++;
            totalFixed++;
            changed = true;
            break; // Restart scan since array changed
        }
    }

    if (fixedCount > 0) {
        const newContent = newLines.join('\n');
        fs.writeFileSync(fullPath, newContent, 'utf-8');
        fileReport[file] = fixedCount;
        console.log('Fixed ' + fixedCount + ' issues in: ' + file);
    }
});

console.log('\n=== SUMMARY ===');
let grandTotal = 0;
Object.keys(fileReport).sort().forEach(file => {
    console.log('  ' + file + ': ' + fileReport[file] + ' fixes');
    grandTotal += fileReport[file];
});
console.log('Total files modified: ' + Object.keys(fileReport).length);
console.log('Total return arrows inserted: ' + grandTotal);
