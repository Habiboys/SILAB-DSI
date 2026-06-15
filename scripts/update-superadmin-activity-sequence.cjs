const fs = require('fs');
const path = require('path');

const docsDir = path.join(__dirname, '..', 'docs');

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  return entries.flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return walk(full);
    return entry.isFile() && entry.name.endsWith('.puml') ? [full] : [];
  });
}

function rel(file) {
  return path.relative(path.join(__dirname, '..'), file).replace(/\\/g, '/');
}

const files = walk(docsDir);
let activityModified = 0;
let sequenceModified = 0;
let skipped = 0;

for (const file of files) {
  const normalized = rel(file);
  const isActivity = normalized.includes('/activity/');
  const isSequence = normalized.includes('/sequence/');
  if (!isActivity && !isSequence) continue;

  const original = fs.readFileSync(file, 'utf8');
  let content = original;

  if (isActivity && content.includes('|Admin|') && !content.includes('|SuperAdmin|')) {
    content = content.replace(/\|Admin\|/g, '|SuperAdmin|Admin|');
    activityModified++;
    console.log(`ACTIVITY: ${normalized}`);
  }

  if (
    isSequence &&
    /actor\s+"Admin"\s+as\s+Admin/.test(content) &&
    !/actor\s+"SuperAdmin"\s+as\s+SuperAdmin/.test(content)
  ) {
    content = content.replace(
      /^(\s*)actor(\s+)"Admin"(\s+)as(\s+)Admin\s*$/m,
      (match, indent, gap1, gap2, gap3) =>
        `${indent}actor${gap1}"SuperAdmin"${gap2}as${gap3}SuperAdmin\n${match}`
    );
    sequenceModified++;
    console.log(`SEQUENCE: ${normalized}`);
  }

  // Handle files where Admin is aliased as User, but keep original alias so diagram flow stays valid.
  if (
    isSequence &&
    /actor\s+"Admin"\s+as\s+User/.test(content) &&
    !/actor\s+"SuperAdmin"\s+as\s+SuperAdmin/.test(content)
  ) {
    content = content.replace(
      /^(\s*)actor(\s+)"Admin"(\s+)as(\s+)User\s*$/m,
      (match, indent) => `${indent}actor       "SuperAdmin"                 as SuperAdmin\n${match}`
    );
    sequenceModified++;
    console.log(`SEQUENCE(alias User): ${normalized}`);
  }

  // Remove accidental wrong actor declarations inside activity bodies if any exist from older failed script attempts.
  content = content.replace(/\nactor\s+"SuperAdmin"\s+as\s+SuperAdmin\n/g, '\n');

  if (content !== original) {
    fs.writeFileSync(file, content, 'utf8');
  } else {
    skipped++;
  }
}

console.log(`\nUpdated activity files: ${activityModified}`);
console.log(`Updated sequence files: ${sequenceModified}`);
console.log(`Skipped/no change: ${skipped}`);
