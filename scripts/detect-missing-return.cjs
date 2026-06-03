const fs = require('fs');
const path = require('path');

const baseDir = 'docs';
const modules = ['auth', 'inventaris', 'keuangan', 'praktikum', 'kegiatan_proker', 'piket', 'kuesioner'];

function detectIssues(content, filePath) {
    const lines = content.split('\n');
    const issues = [];

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        // Skip non-message lines
        if (!line.includes('->') && !line.includes('-->')) continue;
        if (line.includes('@startuml') || line.includes('@enduml') || line.includes('skinparam') || line.includes('!theme') || line.includes('title') || line.includes('actor') || line.includes('boundary') || line.includes('control') || line.includes('entity')) continue;
        if (line.trim().startsWith('==') || line.trim().startsWith('alt') || line.trim().startsWith('else') || line.trim().startsWith('end') || line.trim().startsWith('loop') || line.trim().startsWith('opt') || line.trim().startsWith('par') || line.trim().startsWith('group')) continue;
        if (line.trim().startsWith("'") || line.trim().startsWith('/')) continue;

        // Only look at request lines (-> with single dash)
        const requestMatch = line.match(/(\w+)\s*->\s*(\w+)/);
        if (!requestMatch) continue;

        const sender = requestMatch[1];

        // Look at next lines to find consecutive requests from same sender
        let j = i + 1;
        while (j < lines.length) {
            const nextLine = lines[j];
            if (nextLine.includes('@enduml') || nextLine.trim().startsWith('==')) break;
            if (nextLine.includes('-->')) {
                // Response found, this pattern is OK
                break;
            }
            const nextRequestMatch = nextLine.match(/(\w+)\s*->\s*(\w+)/);
            if (nextRequestMatch && nextRequestMatch[1] === sender) {
                issues.push({
                    line: i + 1,
                    content: line.trim(),
                    nextLine: j + 1,
                    nextContent: nextLine.trim(),
                    file: filePath
                });
                // Skip ahead to avoid duplicate reports
                break;
            }
            if (nextRequestMatch && nextRequestMatch[1] !== sender) {
                // Different sender sending request, check if there was a response before
                break;
            }
            j++;
        }
    }

    return issues;
}

// Scan all sequence files
let totalIssues = 0;
for (const mod of modules) {
    const seqDir = path.join(baseDir, mod, 'sequence');
    if (fs.existsSync(seqDir)) {
        const files = fs.readdirSync(seqDir).filter(f => f.endsWith('.puml'));
        for (const file of files) {
            const filePath = path.join(seqDir, file);
            const content = fs.readFileSync(filePath, 'utf-8');
            const issues = detectIssues(content, filePath);
            if (issues.length > 0) {
                console.log(`\n=== ${filePath} ===`);
                for (const issue of issues) {
                    console.log(`L${issue.line}: ${issue.content}`);
                    console.log(`L${issue.nextLine}: ${issue.nextContent}`);
                    console.log(`--- Missing return between these two requests ---`);
                    totalIssues++;
                }
            }
        }
    }
}

console.log(`\n\nTotal issues found: ${totalIssues}`);
