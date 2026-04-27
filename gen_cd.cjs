const fs=require('fs'),path=require('path');
const dir='d:\\Nouval\\TA\\silab-backup-2-januari-2026\\silab\\app\\Models';

function guessReturn(body,fname){
  if(/return\s+(true|false)\b/.test(body))return 'bool';
  if(/->\s*exists\(\)/.test(body))return 'bool';
  if(/return\s+in_array/.test(body))return 'bool';
  if(/return\s+\$this->has/.test(body))return 'bool';
  if(/return\s+\[\]|\breturn\s+\[/.test(body))return 'array';
  if(/return\s+\(int\)|->count\(\)/.test(body))return 'int';
  if(/return\s+floor\(|return\s+round\(|return\s+min\(/.test(body))return 'float';
  if(/return\s+collect\(/.test(body))return 'Collection';
  if(/return\s+str_replace|return\s+match\(/.test(body))return 'string';
  if(/return\s+\$this->roles/.test(body))return 'string';
  // Check if returning a model relationship result
  const modelRet=body.match(/return\s+\$this->(\w+)\(\)/);
  if(modelRet)return '?object';
  const modelRet2=body.match(/return\s+\$this->(\w+);/);
  if(modelRet2)return '?object';
  // Static method returning model
  if(/return\s+self::where|return\s+self::/.test(body))return '?self';
  if(/return\s+\$query/.test(body))return 'void';
  // Null checks
  if(/return\s+null/.test(body)&&/return\s+\$\w+\s*\?\s*\$\w+->/.test(body))return '?string';
  if(/return\s+null/.test(body)&&/return\s+\$/.test(body))return '?object';
  if(/return\s+null\s*;/.test(body))return 'void';
  if(!/return\s/.test(body))return 'void';
  // Ternary with string
  if(/return\s+\$\w+\s*\?\s*\$\w+->/.test(body))return '?string';
  if(/return\s+\$amount/.test(body))return 'float';
  return 'void';
}

function getAccessorReturn(body){
  if(/->count\(\)|return\s+\(int\)/.test(body))return 'int';
  if(/return\s+round\(|return\s+min\(/.test(body))return 'float';
  if(/return\s+(true|false)|is_null|!\s*is_null/.test(body))return 'bool';
  if(/return\s+\[/.test(body))return 'array';
  if(/return\s+collect\(/.test(body))return 'Collection';
  if(/return\s+match\(|=>\s*'/.test(body))return 'string';
  if(/return\s+\$this->get/.test(body))return '?string';
  return 'string';
}

function extractRelTarget(body){
  const m=body.match(/(?:\\App\\Models\\)?(\w+)::class/);
  return m?m[1]:null;
}

function getBody(code,startPos){
  const si=code.indexOf('{',startPos);
  let d=0,ei=si;
  for(let i=si;i<code.length;i++){
    if(code[i]==='{')d++;
    if(code[i]==='}'){d--;if(d===0){ei=i;break;}}
  }
  return code.substring(si,ei+1);
}

function parseModel(file){
  const code=fs.readFileSync(file,'utf8');
  const nm=code.match(/class\s+(\w+)\s+extends/);
  if(!nm)return null;
  const name=nm[1];

  const fillM=code.match(/\$fillable\s*=\s*\[([\s\S]*?)\];/);
  let attrs=[];
  if(fillM)attrs=[...fillM[1].matchAll(/'([^']+)'/g)].map(m=>m[1]);

  const castMap={};
  const castM=code.match(/\$casts\s*=\s*\[([\s\S]*?)\];/);
  if(castM)[...castM[1].matchAll(/'(\w+)'\s*=>\s*'([^']+)'/g)].forEach(p=>castMap[p[1]]=p[2]);

  const fAttrs=attrs.map(a=>{
    let t=castMap[a]||'string';
    if(a.endsWith('_id'))t='uuid FK';
    return `- ${a}: ${t}`;
  });

  const methods=[];
  const fre=/(?:(public|protected|private)\s+)?(?:(static)\s+)?function\s+(\w+)\s*\(([^)]*)\)(?:\s*:\s*([^\s{]+))?\s*\{/g;
  let fm;
  while((fm=fre.exec(code))!==null){
    const vis=fm[1]||'public';
    const isStatic=!!fm[2];
    const fn=fm[3];
    const params=fm[4].trim();
    const retAnnot=fm[5]||'';
    if(fn==='casts')continue;

    const body=getBody(code,fm.index);
    let rt=retAnnot;

    const isRelType = /^(BelongsTo|HasMany|HasOne|BelongsToMany|HasManyThrough|HasOneThrough)$/i.test(rt);

    if(!rt || isRelType){
      const tgt=extractRelTarget(body);
      if(body.includes('$this->hasOne('))rt=tgt||'Model';
      else if(body.includes('$this->belongsTo('))rt=tgt||'Model';
      else if(body.includes('$this->hasOneThrough('))rt=tgt||'Model';
      else if(body.includes('$this->hasMany('))rt=`Collection<${tgt||'Model'}>`;
      else if(body.includes('$this->belongsToMany('))rt=`Collection<${tgt||'Model'}>`;
      else if(body.includes('$this->hasManyThrough('))rt=`Collection<${tgt||'Model'}>`;
      else if(!rt){
        if(fn.startsWith('scope'))rt='void';
        else if(fn.startsWith('get')&&fn.endsWith('Attribute'))rt=getAccessorReturn(body);
        else if(fn.startsWith('set')&&fn.endsWith('Attribute'))rt='void';
        else rt=guessReturn(body,fn);
      }
    }

    let sym=vis==='protected'?'#':vis==='private'?'-':'+';
    let pStr='';
    if(params){
      pStr=params.split(',').map(p=>{
        p=p.trim();
        const pm=p.match(/(?:(\??\w+)\s+)?(\$\w+)(?:\s*=\s*(.+))?/);
        if(!pm)return p;
        return pm[1]?`${pm[2]}: ${pm[1]}`:pm[2];
      }).join(', ');
    }

    let l=`${sym} `;
    if(isStatic)l+='«static» ';
    l+=`${fn}(${pStr}): ${rt}`;
    methods.push(l);
  }
  return {name,attrs:fAttrs,methods};
}

const files=fs.readdirSync(dir).filter(f=>f.endsWith('.php'));
const models=[];
for(const f of files){
  const fp=path.join(dir,f);
  if(fs.statSync(fp).isDirectory())continue;
  const m=parseModel(fp);
  if(m&&m.name!=='tes')models.push(m);
}

const cols=5,cw=280,gx=30,gy=30;
models.forEach((m,i)=>{m.x=(i%cols)*(cw+gx);m.y=Math.floor(i/cols)*(600+gy);});

const rels=[];
for(const f of files){
  const fp=path.join(dir,f);
  if(fs.statSync(fp).isDirectory())continue;
  const code=fs.readFileSync(fp,'utf8');
  const nm=code.match(/class\s+(\w+)\s+extends/);
  if(!nm||nm[1]==='tes')continue;
  const src=nm[1];
  const rr=/\$this->(belongsTo|hasOne|hasMany|belongsToMany|hasManyThrough|hasOneThrough)\(\s*(?:\\?App\\Models\\)?(\w+)::class/g;
  let rm;
  while((rm=rr.exec(code))!==null){
    if(models.find(m=>m.name===rm[2])&&!rels.find(r=>r[0]===src&&r[1]===rm[2]))
      rels.push([src,rm[2]]);
  }
}

function e(s){return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
let id=2;const ids={};let c='';
for(const m of models){
  const mid=id++;ids[m.name]=mid;
  const h=24+m.attrs.length*13+4+m.methods.length*13+20;
  let l=`<b>${e(m.name)}</b><hr size="1">`;
  for(const a of m.attrs)l+=`${e(a)}<br>`;
  l+=`<hr size="1">`;
  for(const mt of m.methods)l+=`${e(mt)}<br>`;
  c+=`<mxCell id="${mid}" value="${e(l)}" style="shape=mxgraph.er.entity;whiteSpace=wrap;html=1;align=left;verticalAlign=top;fontSize=9;fillColor=#dae8fc;strokeColor=#6c8ebf;overflow=auto;spacingLeft=4;spacingRight=4;" vertex="1" parent="1"><mxGeometry x="${m.x}" y="${m.y}" width="${cw}" height="${h}" as="geometry"/></mxCell>\n`;
}
for(const[s,t]of rels){
  if(!ids[s]||!ids[t])continue;
  c+=`<mxCell id="${id++}" style="edgeStyle=orthogonalEdgeStyle;rounded=1;strokeColor=#6c8ebf;" edge="1" source="${ids[s]}" target="${ids[t]}" parent="1"><mxGeometry relative="1" as="geometry"/></mxCell>\n`;
}
const xml=`<?xml version="1.0" encoding="UTF-8"?>
<mxfile host="app.diagrams.net" type="device">
<diagram id="cd" name="Class Diagram SILAB">
<mxGraphModel dx="4000" dy="3000" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="0" pageScale="1" pageWidth="6000" pageHeight="8000">
<root><mxCell id="0"/><mxCell id="1" parent="0"/>
${c}</root>
</mxGraphModel></diagram></mxfile>`;
fs.writeFileSync('d:\\Nouval\\TA\\silab-backup-2-januari-2026\\silab\\class_diagram_silab.drawio',xml,'utf8');
console.log('Done! '+models.length+' classes, '+rels.length+' relations');
console.log('\n=== User methods ===');
const u=models.find(m=>m.name==='User');
if(u)u.methods.forEach(m=>console.log('  '+m));
