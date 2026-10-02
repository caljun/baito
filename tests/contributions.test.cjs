const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
function setup(){
 const elements=new Map();
 const el=id=>{if(!elements.has(id))elements.set(id,{innerHTML:'',textContent:'',value:'',disabled:false,classList:{add(){},remove(){}},addEventListener(){},querySelector(){return el('button-'+id)},querySelectorAll(){return []},checkValidity(){return true},reset(){},showModal(){},close(){},focus(){}});return elements.get(id)};
 let i=0;
 const ctx=vm.createContext({document:{getElementById:el,querySelector:()=>el('submit'),querySelectorAll:()=>[]},window:{addEventListener(){},scrollTo(){}},location:{hash:''},crypto:{randomUUID:()=>String(++i)},console:{error(){}},setTimeout(){},FormData:class{constructor(f){this.f=f.values}get(k){return this.f[k]??null}}});
 let source=fs.readFileSync('dist/app.js','utf8');source=source.slice(0,source.indexOf("import('./firebase.js')"));vm.runInContext(source,ctx);
 return {el,run:code=>vm.runInContext(code,ctx)};
}
test('Each contribution stores only its own field, with zero-score support',()=>{
 const {run}=setup();
 for(const [type,values,field] of [['rating',{score:'0'},'score'],['wage',{hourlyWage:'1280'},'hourlyWage'],['period',{workPeriod:'半年〜1年'},'workPeriod'],['comment',{comment:'  良かった  '},'comment']]){
  const r=run(`buildContribution(${JSON.stringify(type)},'1',{get:k=>(${JSON.stringify(values)})[k]??null})`);
  assert.deepEqual(Object.keys(r).sort(),['id','storeId','type',field].sort());
  assert.equal(r[field],type==='rating'?0:type==='wage'?1280:type==='period'?'半年〜1年':'良かった');
 }
});
test('Invalid input is rejected before writing',()=>{
 const {run}=setup();
 for(const [type,values] of [['rating',{}],['rating',{score:'11'}],['wage',{hourlyWage:''}],['wage',{hourlyWage:'0'}],['wage',{hourlyWage:'1250.5'}],['period',{workPeriod:'invalid'}],['comment',{comment:'   '}],['comment',{comment:'x'.repeat(2001)}]])assert.throws(()=>run(`buildContribution(${JSON.stringify(type)},'1',{get:k=>(${JSON.stringify(values)})[k]??null})`));
});
test('Wage, period and comments never affect score or rating count; legacy reviews count',()=>{
 const {run}=setup();
 run(`saved=[{storeId:'other',type:'rating',score:0},{storeId:'other',score:10,comment:'legacy'},{storeId:'other',type:'wage',hourlyWage:1200},{storeId:'other',type:'wage',hourlyWage:1400},{storeId:'other',type:'period',workPeriod:'半年〜1年'},{storeId:'other',type:'period',workPeriod:'半年〜1年'},{storeId:'other',type:'period',workPeriod:'1年以上'},{storeId:'other',type:'comment',comment:'text'}];reviews=[...saved,...seed]`);
 assert.equal(run('stats("other").score'),5);assert.equal(run('stats("other").reviews.length'),2);
 assert.equal(run('workStats("other").hourlyWage'),1300);assert.equal(run('workStats("other").workPeriod'),'半年〜1年が多い');
});
test('Four section buttons open forms containing only the relevant input',()=>{
 const {run,el}=setup();run('detail(stores[0])');const html=el('app').innerHTML;
 assert.deepEqual([...html.matchAll(/data-contribution="(.*?)"/g)].map(m=>m[1]),['rating','wage','period','comment']);
 assert.ok(!html.includes('detail-actions'));
 for(const [type,field] of [['rating','score'],['wage','hourlyWage'],['period','workPeriod'],['comment','comment']]){
  run(`openForm('${type}')`);const form=el('contribution-fields').innerHTML;
  assert.ok(form.includes(`name="${field}"`));
  for(const other of ['score','hourlyWage','workPeriod','comment'].filter(x=>x!==field))assert.ok(!form.includes(`name="${other}"`));
 }
});
test('Failed saves do not update aggregates; successful independent saves do',async()=>{
 const {run,el}=setup();run(`detail(stores[0]);openForm('wage');cloud={createReview:async()=>{throw new Error('offline')}};storesLoaded=true;reviewsLoaded=true;`);
 const target={values:{hourlyWage:'1600'},querySelector:()=>el('submit')};
 await el('review-form').onsubmit({preventDefault(){},target});assert.equal(run('saved.length'),0);assert.ok(el('form-error').textContent.includes('保存できません'));
 run('cloud.createReview=async()=>{}');await el('review-form').onsubmit({preventDefault(){},target});assert.equal(run('workStats("1").hourlyWage'),1600);assert.equal(run('stats("1").score'),8.8);
});
