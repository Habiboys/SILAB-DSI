const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const docsDir = path.join(__dirname, '..', 'docs');

// Find all .puml files that contain actor "Admin"
const result = execSync(`grep -rl "actor.*Admin" --include="*.puml" "${docsDir}"`, { encoding: 'utf8' });
const files = result.trim().split('\n').filter(Boolean);

console.log(`Found ${files.length} files with actor Admin`);

let modified = 0;
let skipped = 0;

for (const filepath of files) {
  let content = fs.readFileSync(filepath, 'utf8');

  // Skip files that already have SuperAdmin
  if (content.includes('actor "SuperAdmin"') || content.includes('actor SuperAdmin')) {
    console.log(`  SKIP (already has SuperAdmin): ${path.relative(docsDir, filepath)}`);
    skipped++;
    continue;
  }

  // Find the actor "Admin" line and add SuperAdmin after it
  const lines = content.split('\n');
  let newLines = [];
  let found = false;

  for (const line of lines) {
    newLines.push(line);
    // Match actor "Admin" as Admin (with any amount of whitespace)
    if (!found && /^\s*actor\s+"Admin"\s+as\s+Admin/.test(line)) {
      // Insert SuperAdmin after this line
      const indent = line.match(/^\s*/)[0];
      newLines.push(`${indent}actor       "SuperAdmin"            as SuperAdmin`);
      found = true;
    }
  }

  if (found) {
    fs.writeFileSync(filepath, newLines.join('\n'), 'utf8');
    console.log(`  MODIFIED: ${path.relative(docsDir, filepath)}`);
    modified++;
  } else {
    console.log(`  WARNING: No actor "Admin" found in ${path.relative(docsDir, filepath)}`);
    skipped++;
  }
}

console.log(`\nDone! Modified: ${modified}, Skipped: ${skipped}`);
