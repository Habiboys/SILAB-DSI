const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Cari semua file .puml di docs yang ada di subfolder sequence
const baseDir = path.resolve(__dirname, '..');
const files = glob.sync('docs/**/sequence/*.puml', { cwd: baseDir });

let totalIssues = 0;

files.forEach(file => {
    const fullPath = path.join(baseDir, file);
    const content = fs.readFileSync(fullPath, 'utf-8');
    const lines = content.split('\n');

    // Process per-section (dipisah oleh == section ==)
    const sections = content.split(/(?=^=+\s)/m);

    let sectionStart = 0;
    let currentSection = 'header';

    for (let i = 0; i < lines.length; i++) {
        if (lines[i].match(/^=+\s/)) {
            currentSection = lines[i].trim();
        }

        // Cari baris: Controller -> Sesuatu  (request ke entity)
        const requestMatch = lines[i].match(/^\s*(Controller)\s+->\s+/);
        if (!requestMatch) continue;

        // Cari apakah baris ini yang terakhir sebelum enduml
        // Liat ke bawah: apakah ada return (-->) atau request berikutnya
        let foundReturn = false;
        let foundNextRequest = false;
        let nextRequestLine = -1;

        for (let j = i + 1; j < lines.length; j++) {
            const line = lines[j].trim();
            if (!line || line.startsWith("'") || line.startsWith("==") || line.startsWith("@")) {
                if (line.startsWith("==")) break; // section baru
                continue;
            }

            if (line.includes('-->')) {
                foundReturn = true;
                break;
            }

            if (line.startsWith('@enduml')) break;

            // Cek kalo ada request tanpa return sebelumnya
            if (line.match(/^\s*(Controller|Browser)\s+->\s+/)) {
                // tapi return harusnya ada di antara
                // skip validation - this is handled by the main check
            }
        }

        if (!foundReturn && !lines[i].includes('@enduml')) {
            // Double check: cari return di baris berikutnya
            let foundReturnAfter = false;
            for (let j = i + 1; j < Math.min(i + 10, lines.length); j++) {
                if (lines[j].includes('-->')) {
                    foundReturnAfter = true;
                    break;
                }
                if (lines[j].match(/^\s*(Controller|Browser)\s+->\s+/) || lines[j].startsWith('==') || lines[j].startsWith('@enduml')) {
                    break;
                }
            }

            if (!foundReturnAfter) {
                // It's fine - last line before endl or next section
                // But check if there's another request right after without return
                for (let j = i + 1; j < lines.length; j++) {
                    const line = lines[j].trim();
                    if (!line || line.startsWith("'")) continue;
                    if (line.startsWith("@enduml") || line.startsWith("==")) break;
                    if (line.includes('-->')) break;

                    if (line.match(/^\s*Controller\s+->\s+/)) {
                        console.log(`ISSUE: ${file}:${i+1} -> ${j+1}`);
                        console.log(`  ${lines[i].trim()}`);
                        console.log(`  ${lines[j].trim()}`);
                        console.log('  (Missing return between consecutive requests)');
                        console.log('');
                        totalIssues++;
                        break;
                    }
                }
            }
        }
    }
});

console.log(`\nTotal issues found: ${totalIssues}`);
