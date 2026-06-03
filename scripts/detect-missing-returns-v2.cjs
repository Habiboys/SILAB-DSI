const fs = require('fs');
const path = require('path');
const glob = require('glob');

const baseDir = path.resolve(__dirname, '..');
const files = glob.sync('docs/**/sequence/*.puml', { cwd: baseDir });

let totalIssues = 0;
let fileReports = {};

files.forEach(file => {
    const fullPath = path.join(baseDir, file);
    const content = fs.readFileSync(fullPath, 'utf-8');
    const lines = content.split('\n');
    let fileIssues = [];

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line || line.startsWith("'")) continue;

        // Skip declaration/header lines
        if (line.startsWith('@') || line.startsWith('==') || line.startsWith('!') ||
            line.startsWith('skin') || line.startsWith('title') || line.startsWith('actor') ||
            line.startsWith('boundary') || line.startsWith('control') || line.startsWith('entity') ||
            line.startsWith('database') || line.startsWith('participant')) continue;

        // Detect request arrow: Something -> Something (solid line, not --> return, not ->> async)
        if (line.includes('->') && !line.includes('-->') && !line.includes('->>')) {
            const requestMatch = line.match(/^\s*\S+\s+->\s+\S+/);
            if (!requestMatch) continue;

            let foundReturn = false;
            let foundNextRequest = false;
            let nextRequestLine = -1;

            for (let j = i + 1; j < lines.length; j++) {
                const nextLine = lines[j].trim();
                if (!nextLine || nextLine.startsWith("'")) continue;
                if (nextLine.startsWith('==') || nextLine.startsWith('@enduml')) break;

                // Found return arrow (dashed)
                if (nextLine.includes('-->') || nextLine.includes('->>')) {
                    foundReturn = true;
                    break;
                }

                // Found another request arrow before return
                if (nextLine.includes('->') && !nextLine.includes('-->') && !nextLine.includes('->>')) {
                    const nrMatch = nextLine.match(/^\s*\S+\s+->\s+\S+/);
                    if (nrMatch) {
                        foundNextRequest = true;
                        nextRequestLine = j;
                        break;
                    }
                }
            }

            if (foundNextRequest) {
                fileIssues.push({
                    line1: i + 1,
                    line2: nextRequestLine + 1,
                    text1: lines[i].trim(),
                    text2: lines[nextRequestLine].trim()
                });
                totalIssues++;
            }
        }
    }

    if (fileIssues.length > 0) {
        fileReports[file] = fileIssues;
    }
});

// Output grouped by file
Object.keys(fileReports).sort().forEach(file => {
    console.log('FILE: ' + file);
    fileReports[file].forEach(issue => {
        console.log('  L' + issue.line1 + ' -> L' + issue.line2 + ':');
        console.log('    REQ1: ' + issue.text1);
        console.log('    REQ2: ' + issue.text2);
        console.log('    (Missing return arrow between requests)');
        console.log('');
    });
});

console.log('\nTotal issues found: ' + totalIssues);
