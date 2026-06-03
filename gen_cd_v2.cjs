/**
 * gen_cd_v2.cjs
 * Class Diagram generator — upgrade dari gen_cd.cjs
 *
 * Perbedaan:
 *  1. Atribut $hidden ditampilkan sebagai «hidden» dengan visibilitas private
 *  2. Timestamp (created_at, updated_at) ditambahkan otomatis (kecuali $timestamps = false)
 *  3. Label multiplicity pada relasi (1, 0..1, 1..*, *)
 *  4. Section relasi dipisah dari method biasa di dalam kotak
 *  5. Lebar kotak adaptif (260–380)
 *  6. Jarak vertikal antar baris kotak lebih lega
 *
 * Jalankan: node gen_cd_v2.cjs
 * Output  : class_diagram_silab_v2.drawio
 */

'use strict';
const fs   = require('fs');
const path = require('path');

const MODELS_DIR  = 'd:\\Nouval\\TA\\silab-backup-2-januari-2026\\silab\\app\\Models';
const OUT_FILE    = 'd:\\Nouval\\TA\\silab-backup-2-januari-2026\\silab\\class_diagram_silab_v2.drawio';

// ─── Helpers ────────────────────────────────────────────────────────────────

function e(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function getBody(code, startPos) {
  const si = code.indexOf('{', startPos);
  let d = 0, ei = si;
  for (let i = si; i < code.length; i++) {
    if (code[i] === '{') d++;
    if (code[i] === '}') { d--; if (d === 0) { ei = i; break; } }
  }
  return code.substring(si, ei + 1);
}

function extractRelTarget(body) {
  const m = body.match(/(?:\\App\\Models\\)?(\w+)::class/);
  return m ? m[1] : null;
}

function getAccessorReturn(body) {
  if (/->count\(\)|return\s+\(int\)/.test(body))            return 'int';
  if (/return\s+round\(|return\s+min\(/.test(body))         return 'float';
  if (/return\s+(true|false)|is_null|!\s*is_null/.test(body)) return 'bool';
  if (/return\s+\[/.test(body))                             return 'array';
  if (/return\s+collect\(/.test(body))                      return 'Collection';
  if (/return\s+match\(|=>\s*'/.test(body))                 return 'string';
  if (/return\s+\$this->get/.test(body))                    return '?string';
  return 'string';
}

function guessReturn(body, fname) {
  if (/return\s+(true|false)\b/.test(body))                           return 'bool';
  if (/->\s*exists\(\)/.test(body))                                   return 'bool';
  if (/return\s+in_array/.test(body))                                 return 'bool';
  if (/return\s+\$this->has/.test(body))                              return 'bool';
  if (/return\s+\[\]|\breturn\s+\[/.test(body))                       return 'array';
  if (/return\s+\(int\)|->count\(\)/.test(body))                      return 'int';
  if (/return\s+floor\(|return\s+round\(|return\s+min\(/.test(body)) return 'float';
  if (/return\s+collect\(/.test(body))                                return 'Collection';
  if (/return\s+str_replace|return\s+match\(/.test(body))            return 'string';
  if (/return\s+\$this->roles/.test(body))                            return 'string';
  const mr1 = body.match(/return\s+\$this->(\w+)\(\)/);
  if (mr1) return '?object';
  const mr2 = body.match(/return\s+\$this->(\w+);/);
  if (mr2) return '?object';
  if (/return\s+self::where|return\s+self::/.test(body))              return '?self';
  if (/return\s+\$query/.test(body))                                  return 'void';
  if (/return\s+null/.test(body) && /return\s+\$\w+\s*\?\s*\$\w+->/.test(body)) return '?string';
  if (/return\s+null/.test(body) && /return\s+\$/.test(body))         return '?object';
  if (/return\s+null\s*;/.test(body))                                 return 'void';
  if (!/return\s/.test(body))                                         return 'void';
  if (/return\s+\$\w+\s*\?\s*\$\w+->/.test(body))                    return '?string';
  if (/return\s+\$amount/.test(body))                                 return 'float';
  return 'void';
}

// ─── Parse model ────────────────────────────────────────────────────────────

const REL_TYPES = {
  hasOne:          { label: '1',    multi: '0..1', style: 'endArrow=open;endFill=0;startArrow=none;' },
  belongsTo:       { label: '1',    multi: '0..1', style: 'endArrow=open;endFill=0;startArrow=none;' },
  hasOneThrough:   { label: '1',    multi: '0..1', style: 'endArrow=open;endFill=0;startArrow=none;' },
  hasMany:         { label: '1..*', multi: '*',    style: 'endArrow=open;endFill=0;startArrow=none;' },
  hasManyThrough:  { label: '1..*', multi: '*',    style: 'endArrow=open;endFill=0;startArrow=none;' },
  belongsToMany:   { label: '*',    multi: '*',    style: 'endArrow=open;endFill=0;startArrow=open;startFill=0;' },
};

function parseModel(file) {
  const code = fs.readFileSync(file, 'utf8');
  const nm   = code.match(/class\s+(\w+)\s+extends/);
  if (!nm) return null;
  const name = nm[1];

  // ── $fillable ──
  const fillM = code.match(/\$fillable\s*=\s*\[([\s\S]*?)\];/);
  let fillable = fillM ? [...fillM[1].matchAll(/'([^']+)'/g)].map(m => m[1]) : [];

  // ── $hidden ──
  const hiddenM = code.match(/\$hidden\s*=\s*\[([\s\S]*?)\];/);
  const hidden  = hiddenM ? [...hiddenM[1].matchAll(/'([^']+)'/g)].map(m => m[1]) : [];

  // ── $casts ──
  const castMap = {};
  const castM   = code.match(/\$casts\s*=\s*\[([\s\S]*?)\];/);
  if (castM) {
    [...castM[1].matchAll(/'(\w+)'\s*=>\s*'([^']+)'/g)].forEach(p => { castMap[p[1]] = p[2]; });
  }

  // ── timestamps ──
  const hasTimestamps = !/public\s+\$timestamps\s*=\s*false/.test(code);

  // ── Bangun daftar atribut ──
  const attrs = [];

  // Atribut fillable
  for (const a of fillable) {
    let t = castMap[a] || 'string';
    if (a.endsWith('_id')) t = 'uuid FK';
    attrs.push(`- ${a}: ${t}`);
  }

  // Atribut hidden (private, ditandai «hidden»)
  for (const a of hidden) {
    // Jangan duplikat kalau sudah masuk fillable
    if (!fillable.includes(a)) {
      const t = castMap[a] || 'string';
      attrs.push(`- ${a}: ${t} «hidden»`);
    } else {
      // Tandai fillable yang hidden
      const idx = attrs.findIndex(l => l.includes(`- ${a}:`));
      if (idx !== -1) attrs[idx] += ' «hidden»';
    }
  }

  // Timestamps standard
  if (hasTimestamps) {
    attrs.push('- created_at: datetime');
    attrs.push('- updated_at: datetime');
  }

  // ── Metode ──
  const relations  = []; // {relType, target, label}
  const methods    = []; // string baris

  const fre = /(?:(public|protected|private)\s+)?(?:(static)\s+)?function\s+(\w+)\s*\(([^)]*)\)(?:\s*:\s*([^\s{]+))?\s*\{/g;
  let fm;
  while ((fm = fre.exec(code)) !== null) {
    const vis       = fm[1] || 'public';
    const isStatic  = !!fm[2];
    const fn        = fm[3];
    const params    = fm[4].trim();
    const retAnnot  = fm[5] || '';
    if (fn === 'casts') continue;

    const body = getBody(code, fm.index);

    // Cek apakah ini metode relasi
    let relType = null;
    for (const rt of Object.keys(REL_TYPES)) {
      if (body.includes(`$this->${rt}(`)) { relType = rt; break; }
    }

    if (relType) {
      const target = extractRelTarget(body) || '?';
      relations.push({ fn, relType, target });
      continue; // relasi masuk section sendiri, bukan methods
    }

    // Hitung return type
    const isRelAnnot = /^(BelongsTo|HasMany|HasOne|BelongsToMany|HasManyThrough|HasOneThrough)$/i.test(retAnnot);
    let rt = (isRelAnnot || !retAnnot) ? '' : retAnnot;
    if (!rt) {
      if (fn.startsWith('scope'))                            rt = 'void';
      else if (fn.startsWith('get') && fn.endsWith('Attribute')) rt = getAccessorReturn(body);
      else if (fn.startsWith('set') && fn.endsWith('Attribute')) rt = 'void';
      else                                                   rt = guessReturn(body, fn);
    }

    let sym = vis === 'protected' ? '#' : vis === 'private' ? '-' : '+';
    let pStr = '';
    if (params) {
      pStr = params.split(',').map(p => {
        p = p.trim();
        const pm = p.match(/(?:(\??\w+)\s+)?(\$\w+)(?:\s*=\s*(.+))?/);
        if (!pm) return p;
        return pm[1] ? `${pm[2]}: ${pm[1]}` : pm[2];
      }).join(', ');
    }

    let l = `${sym} `;
    if (isStatic) l += '«static» ';
    l += `${fn}(${pStr}): ${rt}`;
    methods.push(l);
  }

  return { name, attrs, relations, methods, hasTimestamps };
}

// ─── Kumpulkan semua model ───────────────────────────────────────────────────

const files  = fs.readdirSync(MODELS_DIR).filter(f => f.endsWith('.php'));
const models = [];

for (const f of files) {
  const fp = path.join(MODELS_DIR, f);
  if (fs.statSync(fp).isDirectory()) continue;
  const m = parseModel(fp);
  if (m && m.name !== 'tes') models.push(m);
}

// ─── Layout ─────────────────────────────────────────────────────────────────

const COLS = 5;
const GX   = 40;
const GY   = 50;
const MIN_W = 260;
const MAX_W = 380;

// Estimasi lebar berdasarkan teks terpanjang
function estimateWidth(m) {
  const allLines = [
    m.name,
    ...m.attrs,
    ...m.relations.map(r => `+ ${r.fn}(): ${r.target}`),
    ...m.methods,
  ];
  const maxLen = Math.max(...allLines.map(l => l.length));
  // 7px per karakter estimasi
  return Math.min(MAX_W, Math.max(MIN_W, maxLen * 7));
}

// Tentukan x dengan akumulasi lebar kolom per baris
const colWidths = Array(COLS).fill(0);
models.forEach((m, i) => {
  const col = i % COLS;
  const w   = estimateWidth(m);
  m.w = w;
  if (w > colWidths[col]) colWidths[col] = w;
});

const colX = [];
let cx = 30;
for (let c = 0; c < COLS; c++) {
  colX[c] = cx;
  cx += colWidths[c] + GX;
}

// Tinggi per baris
const rowHeights = [];
models.forEach((m, i) => {
  const row = Math.floor(i / COLS);
  const relCount = m.relations.length;
  const h = Math.max(90,
    30
    + m.attrs.length * 17
    + 14 // hr
    + (relCount > 0 ? relCount * 17 + 14 : 0) // hr + rels
    + m.methods.length * 17
    + 14 // hr
  );
  m.h = h;
  if (!rowHeights[row] || h > rowHeights[row]) rowHeights[row] = h;
});

const rowY = [];
let ry = 30;
for (let r = 0; r < rowHeights.length; r++) {
  rowY[r] = ry;
  ry += rowHeights[r] + GY;
}

models.forEach((m, i) => {
  m.x = colX[i % COLS];
  m.y = rowY[Math.floor(i / COLS)];
});

// ─── Relasi antar model ──────────────────────────────────────────────────────

const rels = []; // {src, tgt, relType}

for (const f of files) {
  const fp   = path.join(MODELS_DIR, f);
  if (fs.statSync(fp).isDirectory()) continue;
  const code = fs.readFileSync(fp, 'utf8');
  const nm   = code.match(/class\s+(\w+)\s+extends/);
  if (!nm || nm[1] === 'tes') continue;
  const src = nm[1];

  const rr = /\$this->(belongsTo|hasOne|hasMany|belongsToMany|hasManyThrough|hasOneThrough)\(\s*(?:\\?App\\Models\\)?(\w+)::class/g;
  let rm;
  while ((rm = rr.exec(code)) !== null) {
    const tgt     = rm[2];
    const relType = rm[1];
    if (
      models.find(m => m.name === tgt) &&
      !rels.find(r => r.src === src && r.tgt === tgt)
    ) {
      rels.push({ src, tgt, relType });
    }
  }
}

// ─── Generate XML ────────────────────────────────────────────────────────────

let id = 2;
const ids = {};
let c = '';

for (const m of models) {
  const mid = id++;
  ids[m.name] = mid;

  // ── Atribut HTML ──
  let attrsHtml = '';
  for (const a of m.attrs) {
    attrsHtml += `<p style="margin:0px;margin-left:4px;font-size:11px;">${e(a)}</p>`;
  }

  // ── Relasi HTML ──
  let relsHtml = '';
  if (m.relations.length > 0) {
    for (const r of m.relations) {
      const info   = REL_TYPES[r.relType];
      const retStr = info.label === '1' || info.label === '0..1'
        ? r.target
        : `Collection&lt;${r.target}&gt;`;
      relsHtml += `<p style="margin:0px;margin-left:4px;font-size:11px;font-style:italic;">+ ${e(r.fn)}(): ${retStr}</p>`;
    }
  }

  // ── Metode HTML ──
  let methodsHtml = '';
  for (const mt of m.methods) {
    methodsHtml += `<p style="margin:0px;margin-left:4px;font-size:11px;">${e(mt)}</p>`;
  }

  // ── Gabungkan ──
  let val =
    `<p style="margin:0px;margin-top:4px;text-align:center;"><b>${e(m.name)}</b></p>` +
    `<hr size="1" style="border-style:solid;"/>` +
    attrsHtml;

  if (m.relations.length > 0) {
    val += `<hr size="1" style="border-style:solid;"/>` + relsHtml;
  }

  if (m.methods.length > 0) {
    val += `<hr size="1" style="border-style:solid;"/>` + methodsHtml;
  }

  const style = 'verticalAlign=top;align=left;overflow=fill;html=1;whiteSpace=wrap;';

  c += `<mxCell id="${mid}" value="${e(val)}" style="${style}" vertex="1" parent="1">` +
       `<mxGeometry x="${m.x}" y="${m.y}" width="${m.w}" height="${m.h}" as="geometry"/>` +
       `</mxCell>\n`;
}

// ── Panah relasi dengan multiplicity ──
for (const r of rels) {
  if (!ids[r.src] || !ids[r.tgt]) continue;
  const info  = REL_TYPES[r.relType];
  const label = e(info.label);
  const srcLabel = r.relType === 'belongsToMany' ? '* ' : '1 ';

  c += `<mxCell id="${id++}" value="${label}" ` +
       `style="${info.style}edgeStyle=orthogonalEdgeStyle;rounded=0;" ` +
       `edge="1" source="${ids[r.src]}" target="${ids[r.tgt]}" parent="1">` +
       `<mxGeometry relative="1" as="geometry"/>` +
       `</mxCell>\n`;
}

// ── XML final ──
const totalW = cx + 200;
const totalH = ry + 200;

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<mxfile host="app.diagrams.net" type="device">
<diagram id="cd-v2" name="Class Diagram SILAB v2">
<mxGraphModel dx="4000" dy="3000" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="0" pageScale="1" pageWidth="${totalW}" pageHeight="${totalH}">
<root>
<mxCell id="0"/>
<mxCell id="1" parent="0"/>
${c}
</root>
</mxGraphModel>
</diagram>
</mxfile>`;

fs.writeFileSync(OUT_FILE, xml, 'utf8');

console.log('==============================================');
console.log(`  gen_cd_v2 selesai!`);
console.log(`  ${models.length} classes, ${rels.length} relations`);
console.log(`  Output: ${OUT_FILE}`);
console.log('==============================================');

// Debug: tampilkan metode User
const u = models.find(m => m.name === 'User');
if (u) {
  console.log('\n=== User — Attributes ===');
  u.attrs.forEach(a => console.log('  ' + a));
  console.log('\n=== User — Relations ===');
  u.relations.forEach(r => console.log(`  + ${r.fn}(): [${r.relType}] -> ${r.target}`));
  console.log('\n=== User — Methods ===');
  u.methods.forEach(m => console.log('  ' + m));
}
