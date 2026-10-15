import test from 'node:test';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import vm from 'node:vm';
const bundle = await build({entryPoints:['resources/js/Utils/navigationRuntime.js'],bundle:true,write:false,format:'iife',globalName:'nav',plugins:[{name:'router',setup(b){b.onResolve({filter:/^@inertiajs\/react$/},()=>({path:'router',namespace:'mock'}));b.onLoad({filter:/.*/,namespace:'mock'},()=>({contents:'export const router=globalThis.mockRouter;'}));}}]});
const origin='http://localhost:8000';
const routes=Object.fromEntries(['dashboard','kegiatan','kegiatan/{id}','praktikum','praktikum/{id}','praktikan/modul/{id}','praktikan/praktikum/{id}/tugas','praktikan/riwayat-tugas/{id}'].map((uri,i)=>['page'+i,{uri,methods:['GET']}]));
function setup(){
 const handlers={},visits=[],store=new Map();
 const sandbox={URL,console,Ziggy:{routes},window:{location:{origin},addEventListener:()=>{}},document:{referrer:''},sessionStorage:{getItem:k=>store.get(k),setItem:(k,v)=>store.set(k,v)},mockRouter:{on:(name,cb)=>{handlers[name]=cb;},visit:(url,options)=>visits.push({url,options})}};
 vm.createContext(sandbox);vm.runInContext(bundle.outputFiles[0].text,sandbox);
 const page=(url,lab='a')=>({url,props:{auth:{user:{id:'owner'}},navigation_context:{lab_id:lab,kepengurusan_lab_id:'period-'+lab}}});
 const arrive=(url,lab)=>handlers.navigate({detail:{page:page(url,lab)}});
 sandbox.nav.installNavigation(page('/dashboard'));
 return {nav:sandbox.nav,page,arrive,visits,handlers,store};
}
test('actual runtime consumes undo before navigation, ignores rapid repeat clicks, and preserves filters',()=>{
 const {nav,page,arrive,visits}=setup();
 for(const url of ['/praktikum?page=3','/praktikan/modul/lesson','/praktikan/praktikum/practice/tugas','/praktikan/riwayat-tugas/submission'])arrive(url);
 for(const [current,target] of [['/praktikan/riwayat-tugas/submission','/praktikan/praktikum/practice/tugas'],['/praktikan/praktikum/practice/tugas','/praktikan/modul/lesson'],['/praktikan/modul/lesson','/praktikum?page=3'],['/praktikum?page=3','/dashboard']]){
  const before=visits.length;nav.goBack(page(current),'/dashboard');nav.goBack(page(current),'/dashboard');assert.equal(visits.length,before+1);
  const visit=visits.at(-1);assert.equal(visit.url,target);assert.equal(nav.navigationHistory().at(-1).url,target);
  arrive(target);visit.options.onSuccess();visit.options.onFinish();
 }
 assert.equal(nav.navigationHistory().length,1);
});
test('cancelled or failed undo restores the previous stack',()=>{
 const {nav,page,arrive,visits}=setup();arrive('/praktikum');arrive('/kegiatan/item');
 nav.goBack(page('/kegiatan/item'),'/dashboard');visits.at(-1).options.onFinish();
 assert.equal(nav.navigationHistory().at(-1).url,'/kegiatan/item');
 nav.goBack(page('/kegiatan/item'),'/dashboard');assert.equal(visits.at(-1).url,'/praktikum');
});
test('undo uses the old URL context without injecting the current lab and survives a refresh',()=>{
 const {nav,page,arrive,visits,handlers,store}=setup();
 arrive('/praktikum?lab_id=a&kepengurusan_lab_id=period-a');arrive('/kegiatan?lab_id=b&kepengurusan_lab_id=period-b','b');
 nav.goBack(page('/kegiatan?lab_id=b&kepengurusan_lab_id=period-b','b'),'/dashboard');const visit=visits.at(-1);
 assert.equal(visit.url,'/praktikum?lab_id=a&kepengurusan_lab_id=period-a');
 const request={method:'get',url:new URL(visit.url,origin),headers:visit.options.headers};handlers.before({detail:{visit:request}});
 assert.equal(request.url.searchParams.get('lab_id'),'a');
 assert.equal(JSON.parse(store.get('silab.navigation.v1')).history.at(-1).url,visit.url);
 arrive(visit.url);visit.options.onSuccess();visit.options.onFinish();
 assert.equal(nav.navigationHistory().length,2);
});


test('forward visits A to B to A retain B as the next undo target', () => {
 const {nav,page,arrive,visits}=setup();
 for(const url of ['/praktikum', '/kegiatan', '/praktikum'])arrive(url);
 assert.equal(nav.navigationHistory().length,4);
 nav.goBack(page('/praktikum'),'/dashboard');
 assert.equal(visits.at(-1).url,'/kegiatan');
 assert.equal(nav.navigationHistory().length,3);
});
