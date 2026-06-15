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

let activityFixed = 0;
let sequenceSuperAdminAdded = 0;
let sequenceResponseRemoved = 0;
let skipped = 0;

for (const file of files) {
  const normalized = rel(file);
  const isActivity = normalized.includes('/activity/');
  const isSequence = normalized.includes('/sequence/');
  if (!isActivity && !isSequence) continue;

  let content = fs.readFileSync(file, 'utf8');
  const original = content;
  let changed = false;

  // ============ ACTIVITY DIAGRAM FIXES ============
  if (isActivity) {
    // Rule: Both SuperAdmin and Admin share the SAME swimlane column.
    // "|SuperAdmin|Admin|" creates TWO separate swimlane columns — WRONG.
    // "|SuperAdmin / Admin|" creates ONE swimlane with combined label — CORRECT.
    //
    // We must first combine any existing "|SuperAdmin|Admin|" pair BEFORE
    // adding SuperAdmin to standalone "|Admin|" lanes, otherwise the sequential
    // replace would corrupt the pair.

    // Step 1: Fix existing "|SuperAdmin|Admin|" combos → "|SuperAdmin / Admin|"
    content = content.replace(/\|SuperAdmin\|\s*Admin\|(?!\s*\/)/g, '|SuperAdmin / Admin|');

    // Step 2: Now handle standalone "|Admin|" lanes that don't have SuperAdmin yet
    //   But we must NOT match "|SuperAdmin / Admin|" (already fixed) or
    //   other false positives. Since after Step 1 there are no "|SuperAdmin|Admin|"
    //   combos left, this safe regex targets only bare "|Admin|" occurrences.
    if (!content.includes('SuperAdmin')) {
      content = content.replace(/\|Admin\|/g, '|SuperAdmin / Admin|');
    }

    if (content !== original) changed = true;
  }

  // ============ SEQUENCE DIAGRAM FIXES ============
  if (isSequence) {
    // 1. Add actor SuperAdmin before actor Admin if not already there
    const hasSuperAdminActor = /actor\s+"SuperAdmin"\s+as\s+SuperAdmin/.test(content);
    const hasAdminActor = /actor\s+"Admin"\s+as\s+Admin/.test(content);
    const hasAdminAsUser = /actor\s+"Admin"\s+as\s+User/.test(content);

    if (!hasSuperAdminActor && hasAdminActor) {
      content = content.replace(
        /^(\s*)actor(\s+)"Admin"(\s+)as(\s+)Admin\s*$/m,
        (match, indent, gap1, gap2, gap3) =>
          `${indent}actor${gap1}"SuperAdmin"${gap2}as${gap3}SuperAdmin\n${match}`
      );
      changed = true;
    }
    // For Admin aliased as User
    if (!hasSuperAdminActor && hasAdminAsUser) {
      content = content.replace(
        /^(\s*)actor(\s+)"Admin"(\s+)as(\s+)User\s*$/m,
        (match, indent, gap1, gap2, gap3) =>
          `${indent}actor${gap1}"SuperAdmin"${gap2}as${gap3}SuperAdmin\n${match}`
      );
      changed = true;
    }

    // 2. Remove useless "response / redirect" return arrows
    //    These lines like "Browser --> Admin : response / redirect" add noise in sequence diagrams.
    //    The rule: flow from A -> B, then B does its processing, then B --> A returns the real result.
    //    Pseudo-return arrows with just "response/redirect" label are removed.
    const responseRedirectRegex = /^[A-Za-z0-9_]+\s+-->\s+[A-Za-z0-9_]+\s+:\s*response\s*\/\s*redirect\s*$/gm;
    const responseRemoved = (content.match(responseRedirectRegex) || []).length;
    if (responseRemoved > 0) {
      content = content.replace(responseRedirectRegex, '');
      changed = true;
    }
  }

  // Clean up: remove empty lines that may result from removals (but keep single blank lines)
  content = content.replace(/\n{3,}/g, '\n\n');

  if (changed) {
    fs.writeFileSync(file, content, 'utf8');
    if (isActivity) {
      console.log(`ACTIVITY FIXED: ${normalized}`);
      activityFixed++;
    }
    if (isSequence) {
      if (content !== original) {
        // Count how many response/redirect lines were removed by
        // comparing before/after counts
        const beforeCount = (original.match(/response\s*\/\s*redirect/g) || []).length;
        const afterCount = (content.match(/response\s*\/\s*redirect/g) || []).length;
        const removed = beforeCount - afterCount;
        if (removed > 0) {
          console.log(`SEQUENCE (${removed}x response/redirect removed): ${normalized}`);
          sequenceResponseRemoved += removed;
        }
      }
      sequenceSuperAdminAdded++;
    }
  } else {
    skipped++;
  }
}

console.log(`\n=== SUMMARY ===`);
console.log(`Activity diagrams fixed (SuperAdmin lane): ${activityFixed}`);
console.log(`Sequence diagrams updated (SuperAdmin actor): ${sequenceSuperAdminAdded}`);
console.log(`Skipped / no change: ${skipped}`);
