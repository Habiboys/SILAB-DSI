/**
 * gen_ad.cjs - PlantUML Activity Diagram (.puml) -> Draw.io (.drawio)
 *
 * Layout: branches (if/else, switch/case) rendered vertically sequential
 * so all nodes stay within swimlane columns.
 *
 * Usage:
 *   node gen_ad.cjs <file.puml>
 *   node gen_ad.cjs <folder>
 *   node gen_ad.cjs <file.puml> <out.drawio>
 */

'use strict';
const fs   = require('fs');
const path = require('path');

let _id = 10;
const uid = () => String(_id++);

function xmlEsc(s) {
  return String(s)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;').replace(/'/g,'&apos;');
}

const LANE_W = 260;
const ROW_H  = 70;
const ACT_W  = 210;
const ACT_H  = 44;
const DIA_W  = 160;
const DIA_H  = 60;
const HEAD_H = 30;
const CIRC_R = 15;
const STOP_R = 18;

function cleanText(s) {
  if (!s) return '';
  return String(s)
    .replace(/\uFFFD/g, '')   // Unicode replacement char
    .replace(/\u2013/g, '-')  // en-dash
    .replace(/\u2014/g, '-')  // em-dash
    .replace(/[\x80-\x9F]/g, '') // Windows-1252 control range junk
    .trim();
}


function tokenize(raw) {
  // Clean problematic characters from entire file content upfront
  raw = cleanText(raw.replace(/\r\n/g,'\n').replace(/\r/g,'\n'));
  const lines = raw.split('\n').map(function(l){ return l.trim(); });
  const toks = [];
  for (var i = 0; i < lines.length; i++) {
    var l = lines[i];
    if (!l) continue;
    if (/^(@startuml|@enduml|!pragma|!theme|scale\s|skinparam|'|\/\/)/.test(l)) continue;

    var title = l.match(/^title\s+(.+)/i);
    if (title) { toks.push({type:'TITLE', text:cleanText(title[1].replace(/\\n/g,' ').replace(/\n/g,' '))}); continue; }

    var lane = l.match(/^\|([^|]+)\|(.*)/);
    if (lane) {
      toks.push({type:'LANE', name:lane[1].trim()});
      var rest = lane[2].trim();
      if (rest) {
        var ra = rest.match(/^:(.+);$/);
        if (ra) toks.push({type:'ACTION', text:ra[1].replace(/\\n/g,'\n')});
      }
      continue;
    }

    if (/^start$/i.test(l))  { toks.push({type:'START'});  continue; }
    if (/^stop$/i.test(l))   { toks.push({type:'STOP'});   continue; }
    if (/^end$/i.test(l))    { toks.push({type:'STOP'});   continue; }
    if (/^kill$/i.test(l))   { toks.push({type:'KILL'});   continue; }
    if (/^detach$/i.test(l)) { toks.push({type:'KILL'});   continue; }
    if (/^break$/i.test(l))  { toks.push({type:'BREAK'});  continue; }

    var act = l.match(/^:(.+);$/);
    if (act) { toks.push({type:'ACTION', text:act[1].replace(/\\n/g,'\n')}); continue; }

    var bwd = l.match(/^backward\s*:(.+);$/i);
    if (bwd) { toks.push({type:'BACKWARD', text:bwd[1].replace(/\\n/g,'\n')}); continue; }

    var ifM = l.match(/^if\s*\(([^)]*)\)\s*(?:then\s*\(([^)]*)\)|is\s*\(([^)]*)\)|equals\s*\(([^)]*)\))/i);
    if (ifM) { toks.push({type:'IF', cond:ifM[1].trim(), label:(ifM[2]||ifM[3]||ifM[4]||'ya').trim()}); continue; }

    var elifM = l.match(/^elseif\s*\(([^)]*)\)\s*(?:then\s*\(([^)]*)\)|is\s*\(([^)]*)\))?/i);
    if (elifM) { toks.push({type:'ELSEIF', cond:elifM[1].trim(), label:(elifM[2]||elifM[3]||'ya').trim()}); continue; }

    var elseM = l.match(/^else(?:\s*\(([^)]*)\))?$/i);
    if (elseM) { toks.push({type:'ELSE', label:(elseM[1]||'tidak').trim()}); continue; }

    if (/^endif$/i.test(l)) { toks.push({type:'ENDIF'}); continue; }

    var sw = l.match(/^switch\s*\(([^)]*)\)/i);
    if (sw) { toks.push({type:'SWITCH', cond:sw[1].trim()}); continue; }

    var cs = l.match(/^case\s*\(([^)]*)\)/i);
    if (cs) { toks.push({type:'CASE', label:cs[1].trim()}); continue; }

    if (/^endswitch$/i.test(l)) { toks.push({type:'ENDSWITCH'}); continue; }

    if (/^repeat$/i.test(l)) { toks.push({type:'REPEAT'}); continue; }
    var rw = l.match(/^repeat\s+while\s*\(([^)]*)\)(?:\s+is\s*\(([^)]*)\))?(?:\s+not\s*\(([^)]*)\))?/i);
    if (rw) { toks.push({type:'REPEAT_WHILE', cond:rw[1].trim(), yes:(rw[2]||'Ya').trim(), no:(rw[3]||'Tidak').trim()}); continue; }

    var wh = l.match(/^while\s*\(([^)]*)\)(?:\s+is\s*\(([^)]*)\))?/i);
    if (wh) { toks.push({type:'WHILE', cond:wh[1].trim(), label:(wh[2]||'Ya').trim()}); continue; }
    var ew = l.match(/^endwhile(?:\s*\(([^)]*)\))?/i);
    if (ew) { toks.push({type:'ENDWHILE', label:(ew[1]||'Tidak').trim()}); continue; }

    if (/^fork\s+again$/i.test(l)) { toks.push({type:'FORK_AGAIN'}); continue; }
    if (/^fork$/i.test(l))         { toks.push({type:'FORK'});       continue; }
    if (/^end\s+fork$/i.test(l))   { toks.push({type:'END_FORK'});   continue; }
    if (/^end\s+merge$/i.test(l))  { toks.push({type:'END_FORK'});   continue; }
  }
  return toks;
}

function Ctx() {
  this.lanes   = [];
  this.laneIds = {};
  this.curLane = 0;
  this.row     = 1;
  this.cells   = [];
  this.edges   = [];
  this.titleH  = 0;  // vertical offset for title bar
}

Ctx.prototype.ensureLane = function(name) {
  if (this.lanes.indexOf(name) === -1) {
    this.lanes.push(name);
    this.laneIds[name] = uid();
  }
  return this.lanes.indexOf(name);
};

Ctx.prototype.cx = function(li) {
  if (li === undefined) li = this.curLane;
  return li * LANE_W + LANE_W / 2;
};

Ctx.prototype.ax = function(li) {
  if (li === undefined) li = this.curLane;
  return li * LANE_W + (LANE_W - ACT_W) / 2;
};

Ctx.prototype.y = function(off) {
  off = off || 0;
  return this.titleH + HEAD_H + (this.row + off) * ROW_H;
};

Ctx.prototype.addEdge = function(src, tgt, label) {
  if (label === undefined) label = '';
  if (!src || !tgt) return;
  if (Array.isArray(src)) {
    var self = this;
    src.forEach(function(s) { self.addEdge(s, tgt, label); });
    return;
  }
  this.edges.push(
    '<mxCell id="' + uid() + '" value="' + xmlEsc(label) +
    '" style="edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;" edge="1" source="' +
    src + '" target="' + tgt + '" parent="1"><mxGeometry relative="1" as="geometry"/></mxCell>'
  );
};

Ctx.prototype.mkStart = function() {
  var id = uid(), x = this.cx() - CIRC_R, y = this.y();
  this.cells.push('<mxCell id="' + id + '" value="" style="ellipse;aspect=fixed;fillColor=#000000;strokeColor=#000000;" vertex="1" parent="1"><mxGeometry x="' + x + '" y="' + y + '" width="' + (CIRC_R*2) + '" height="' + (CIRC_R*2) + '" as="geometry"/></mxCell>');
  this.row++; return id;
};

Ctx.prototype.mkStop = function() {
  var id = uid(), x = this.cx() - STOP_R, y = this.y();
  this.cells.push('<mxCell id="' + id + '" value="" style="ellipse;aspect=fixed;fillColor=#000000;strokeColor=#000000;strokeWidth=4;" vertex="1" parent="1"><mxGeometry x="' + x + '" y="' + y + '" width="' + (STOP_R*2) + '" height="' + (STOP_R*2) + '" as="geometry"/></mxCell>');
  this.row++; return id;
};

Ctx.prototype.mkAction = function(text) {
  var id = uid(), x = this.ax(), y = this.y();
  var h = Math.max(ACT_H, 20 + text.split('\n').length * 18);
  this.cells.push('<mxCell id="' + id + '" value="' + xmlEsc(text) + '" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#dae8fc;strokeColor=#6c8ebf;arcSize=15;fontSize=11;" vertex="1" parent="1"><mxGeometry x="' + x + '" y="' + y + '" width="' + ACT_W + '" height="' + h + '" as="geometry"/></mxCell>');
  this.row += Math.ceil(h / ROW_H); return id;
};

Ctx.prototype.mkDiamond = function(text) {
  var id = uid(), x = this.cx() - DIA_W/2, y = this.y();
  this.cells.push('<mxCell id="' + id + '" value="' + xmlEsc(text) + '" style="rhombus;whiteSpace=wrap;html=1;fillColor=#fff2cc;strokeColor=#d6b656;fontSize=11;" vertex="1" parent="1"><mxGeometry x="' + x + '" y="' + y + '" width="' + DIA_W + '" height="' + DIA_H + '" as="geometry"/></mxCell>');
  this.row += Math.ceil(DIA_H / ROW_H); return id;
};

Ctx.prototype.mkBar = function(label) {
  if (label === undefined) label = '';
  var id = uid(), x = this.cx() - 60, y = this.y();
  this.cells.push('<mxCell id="' + id + '" value="' + xmlEsc(label) + '" style="shape=mxgraph.flowchart.start_2;fillColor=#000000;strokeColor=#000000;fontColor=#ffffff;fontSize=10;" vertex="1" parent="1"><mxGeometry x="' + x + '" y="' + y + '" width="120" height="14" as="geometry"/></mxCell>');
  this.row++; return id;
};

Ctx.prototype.mkMerge = function() {
  var id = uid(), x = this.cx() - 20, y = this.y();
  this.cells.push('<mxCell id="' + id + '" value="" style="rhombus;whiteSpace=wrap;html=1;fillColor=#d5e8d4;strokeColor=#82b366;fontSize=10;" vertex="1" parent="1"><mxGeometry x="' + x + '" y="' + y + '" width="40" height="30" as="geometry"/></mxCell>');
  this.row++; return id;
};

function proc(toks, i, ctx, prevIds, prevLabel, sentinels) {
  if (!sentinels) sentinels = [];
  sentinels = sentinels.map(function(s){ return s.toUpperCase(); });

  while (i < toks.length) {
    var tok = toks[i];
    if (sentinels.indexOf(tok.type) !== -1) break;

    if (tok.type === 'TITLE') { i++; continue; }

    if (tok.type === 'LANE') {
      ctx.ensureLane(tok.name);
      ctx.curLane = ctx.lanes.indexOf(tok.name);
      i++; continue;
    }

    if (tok.type === 'START') {
      var id = ctx.mkStart();
      ctx.addEdge(prevIds, id, prevLabel); prevIds = id; prevLabel = ''; i++; continue;
    }
    if (tok.type === 'STOP' || tok.type === 'KILL') {
      var id = ctx.mkStop();
      ctx.addEdge(prevIds, id, prevLabel); prevIds = id; prevLabel = ''; i++; continue;
    }
    if (tok.type === 'ACTION') {
      var id = ctx.mkAction(tok.text);
      ctx.addEdge(prevIds, id, prevLabel); prevIds = id; prevLabel = ''; i++; continue;
    }
    if (tok.type === 'BACKWARD') {
      var id = ctx.mkAction('[kembali] ' + tok.text);
      ctx.addEdge(prevIds, id, prevLabel); prevIds = id; prevLabel = ''; i++; continue;
    }
    if (tok.type === 'BREAK') { i++; continue; }

    // IF / ELSEIF / ELSE / ENDIF
    if (tok.type === 'IF') {
      var diaId = ctx.mkDiamond(tok.cond);
      ctx.addEdge(prevIds, diaId, prevLabel);
      i++;

      var branches = [];
      var curLabel = tok.label, curToks = [], depth = 1;
      while (i < toks.length) {
        var t = toks[i];
        if (t.type === 'IF') depth++;
        if (t.type === 'ENDIF') {
          depth--;
          if (depth === 0) { branches.push({label:curLabel, toks:curToks}); i++; break; }
        }
        if (depth === 1 && (t.type === 'ELSEIF' || t.type === 'ELSE')) {
          branches.push({label:curLabel, toks:curToks});
          curLabel = t.type === 'ELSEIF' ? t.label : (t.label || 'tidak');
          curToks = []; i++; continue;
        }
        curToks.push(t); i++;
      }

      var baseLane = ctx.curLane;
      var tailIds = [];
      for (var b = 0; b < branches.length; b++) {
        ctx.curLane = baseLane;
        var r = proc(branches[b].toks, 0, ctx, diaId, branches[b].label, []);
        var tail = Array.isArray(r.lastIds) ? r.lastIds : [r.lastIds];
        for (var ti = 0; ti < tail.length; ti++) { if (tail[ti]) tailIds.push(tail[ti]); }
      }

      ctx.curLane = baseLane;
      var mergeId = ctx.mkMerge();
      for (var ti = 0; ti < tailIds.length; ti++) ctx.addEdge(tailIds[ti], mergeId, '');
      prevIds = mergeId; prevLabel = ''; continue;
    }

    // SWITCH / CASE / ENDSWITCH
    if (tok.type === 'SWITCH') {
      var diaId = ctx.mkDiamond(tok.cond);
      ctx.addEdge(prevIds, diaId, prevLabel);
      i++;

      var branches = [];
      var curLabel = '', curToks = [];
      while (i < toks.length) {
        var t = toks[i];
        if (t.type === 'CASE') {
          if (curLabel) branches.push({label:curLabel, toks:curToks});
          curLabel = t.label; curToks = []; i++; continue;
        }
        if (t.type === 'ENDSWITCH') {
          if (curLabel) branches.push({label:curLabel, toks:curToks});
          i++; break;
        }
        curToks.push(t); i++;
      }

      var baseLane = ctx.curLane;
      var tailIds = [];
      for (var b = 0; b < branches.length; b++) {
        ctx.curLane = baseLane;
        var r = proc(branches[b].toks, 0, ctx, diaId, branches[b].label, []);
        var tail = Array.isArray(r.lastIds) ? r.lastIds : [r.lastIds];
        for (var ti = 0; ti < tail.length; ti++) { if (tail[ti]) tailIds.push(tail[ti]); }
      }

      ctx.curLane = baseLane;
      var mergeId = ctx.mkMerge();
      for (var ti = 0; ti < tailIds.length; ti++) ctx.addEdge(tailIds[ti], mergeId, '');
      prevIds = mergeId; prevLabel = ''; continue;
    }

    // REPEAT
    if (tok.type === 'REPEAT') {
      i++;
      var bodyToks = [];
      while (i < toks.length && toks[i].type !== 'REPEAT_WHILE') {
        bodyToks.push(toks[i]); i++;
      }
      var rw = toks[i]; i++;
      var r = proc(bodyToks, 0, ctx, prevIds, prevLabel, []);
      var diaId = ctx.mkDiamond(rw ? rw.cond : 'Ulangi?');
      ctx.addEdge(r.lastIds, diaId, '');
      ctx.addEdge(diaId, Array.isArray(prevIds) ? prevIds[0] : prevIds, rw ? rw.yes : 'Ya');
      prevIds = diaId; prevLabel = rw ? rw.no : 'Tidak'; continue;
    }

    // WHILE
    if (tok.type === 'WHILE') {
      var diaId = ctx.mkDiamond(tok.cond);
      ctx.addEdge(prevIds, diaId, prevLabel);
      i++;
      var bodyToks = [];
      while (i < toks.length && toks[i].type !== 'ENDWHILE') {
        bodyToks.push(toks[i]); i++;
      }
      var ew = toks[i]; i++;
      var r = proc(bodyToks, 0, ctx, diaId, tok.label, []);
      ctx.addEdge(r.lastIds, diaId, '');
      prevIds = diaId; prevLabel = ew ? ew.label : 'Tidak'; continue;
    }

    // FORK
    if (tok.type === 'FORK') {
      var barStart = ctx.mkBar('fork');
      ctx.addEdge(prevIds, barStart, prevLabel);
      i++;
      var branches = [];
      var curToks = [];
      while (i < toks.length) {
        var t = toks[i];
        if (t.type === 'FORK_AGAIN') { branches.push(curToks); curToks = []; i++; continue; }
        if (t.type === 'END_FORK')   { branches.push(curToks); i++; break; }
        curToks.push(t); i++;
      }
      var baseLane = ctx.curLane;
      var tailIds = [];
      for (var b = 0; b < branches.length; b++) {
        ctx.curLane = baseLane;
        var r = proc(branches[b], 0, ctx, barStart, '', []);
        var tail = Array.isArray(r.lastIds) ? r.lastIds : [r.lastIds];
        for (var ti = 0; ti < tail.length; ti++) { if (tail[ti]) tailIds.push(tail[ti]); }
      }
      ctx.curLane = baseLane;
      var barEnd = ctx.mkBar('join');
      for (var ti = 0; ti < tailIds.length; ti++) ctx.addEdge(tailIds[ti], barEnd, '');
      prevIds = barEnd; prevLabel = ''; continue;
    }

    i++;
  }

  return { lastIds: prevIds, nextIdx: i };
}

function buildXml(ctx, title) {
  var TITLE_H = title ? 50 : 0;  // height of title bar above swimlanes
  var totalW = ctx.lanes.length * LANE_W;
  var totalH = (ctx.row + 3) * ROW_H + HEAD_H + TITLE_H;

  // Title text node (full width, above swimlanes)
  var titleCell = '';
  if (title) {
    var tid = uid();
    titleCell = '<mxCell id="' + tid + '" value="' + xmlEsc(title) +
      '" style="text;html=1;strokeColor=none;fillColor=none;align=center;verticalAlign=middle;whiteSpace=wrap;fontSize=14;fontStyle=1;" vertex="1" parent="1">' +
      '<mxGeometry x="0" y="0" width="' + totalW + '" height="' + TITLE_H + '" as="geometry"/></mxCell>';
  }

  // Swimlane cells, shifted down by TITLE_H
  var laneXml = '';
  for (var i = 0; i < ctx.lanes.length; i++) {
    var name = ctx.lanes[i];
    var lid  = ctx.laneIds[name];
    laneXml += '<mxCell id="' + lid + '" value="' + xmlEsc(name) +
      '" style="swimlane;startSize=' + HEAD_H + ';fillColor=#f5f5f5;strokeColor=#666666;fontColor=#333333;fontStyle=1;fontSize=12;" vertex="1" parent="1">' +
      '<mxGeometry x="' + (i * LANE_W) + '" y="' + TITLE_H + '" width="' + LANE_W + '" height="' + (totalH - TITLE_H) + '" as="geometry"/></mxCell>\n        ';
  }

  return '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<mxfile host="app.diagrams.net" type="device">\n' +
    '  <diagram id="ad" name="' + xmlEsc(title || 'Diagram') + '">\n' +
    '    <mxGraphModel dx="1500" dy="1000" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="0" pageScale="1" pageWidth="' + (totalW + 100) + '" pageHeight="' + (totalH + 100) + '">\n' +
    '      <root>\n' +
    '        <mxCell id="0"/>\n' +
    '        <mxCell id="1" parent="0"/>\n' +
    '        ' + (titleCell ? titleCell + '\n        ' : '') +
    laneXml + '\n' +
    '        ' + ctx.cells.join('\n        ') + '\n' +
    '        ' + ctx.edges.join('\n        ') + '\n' +
    '      </root>\n' +
    '    </mxGraphModel>\n' +
    '  </diagram>\n' +
    '</mxfile>';
}

function cleanText(s) {
  // Remove Unicode replacement character (U+FFFD) and common Latin-1 dash variants
  return s
    .replace(/\uFFFD/g, '')           // remove replacement char entirely
    .replace(/\xE2\x80\x93/g, '-')   // en-dash (UTF-8 bytes in latin1 string)
    .replace(/\u2013/g, '-')          // en-dash unicode
    .replace(/\u2014/g, '-')          // em-dash unicode
    .trim();
}

function convert(inputPath) {
  // Read as latin1 to avoid UTF-8 replacement chars on files saved with other encodings
  var raw = fs.readFileSync(inputPath, 'latin1');
  // Strip replacement characters at the byte level
  raw = raw.replace(/\uFFFD/g, '');
  var toks  = tokenize(raw);
  var titleTok = null;
  for (var i = 0; i < toks.length; i++) { if (toks[i].type === 'TITLE') { titleTok = toks[i]; break; } }
  var title = titleTok ? titleTok.text : path.basename(inputPath, '.puml');
  _id = 10;
  var ctx = new Ctx();
  ctx.titleH = title ? 50 : 0;  // shift nodes down to make room for title
  for (var i = 0; i < toks.length; i++) { if (toks[i].type === 'LANE') ctx.ensureLane(toks[i].name); }
  if (ctx.lanes.length === 0) ctx.ensureLane('Activity');
  ctx.curLane = 0;
  proc(toks, 0, ctx, null, '');
  return buildXml(ctx, title);
}

function main() {
  var args = process.argv.slice(2);
  if (!args.length) {
    console.log('Penggunaan:');
    console.log('  node gen_ad.cjs <file.puml>');
    console.log('  node gen_ad.cjs <folder>');
    console.log('  node gen_ad.cjs <file.puml> <out.drawio>');
    process.exit(0);
  }

  var input = args[0];
  var stat  = fs.statSync(input);

  if (stat.isDirectory()) {
    var n = 0;
    function walk(dir) {
      var entries = fs.readdirSync(dir);
      for (var i = 0; i < entries.length; i++) {
        var full = path.join(dir, entries[i]);
        if (fs.statSync(full).isDirectory()) { walk(full); continue; }
        if (!entries[i].endsWith('.puml')) continue;
        var out = path.join(path.dirname(full), path.basename(full, '.puml') + '.drawio');
        try {
          fs.writeFileSync(out, convert(full), 'utf8');
          console.log('[OK] ' + full);
          console.log('  -> ' + out);
          n++;
        } catch (e2) { console.error('[ERR] ' + full + ': ' + e2.message); }
      }
    }
    walk(input);
    console.log('\nSelesai! ' + n + ' file dikonversi.');
  } else {
    var inputAbs = path.resolve(input);
    var out = args[1]
      ? path.resolve(args[1])
      : path.join(path.dirname(inputAbs), path.basename(inputAbs, '.puml') + '.drawio');
    try {
      fs.writeFileSync(out, convert(inputAbs), 'utf8');
      console.log('[OK] ' + out);
    } catch (e2) { console.error('[ERR] ' + e2.message); process.exit(1); }
  }
}

main();
