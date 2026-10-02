'use strict';
const examples=[["カフェ・リーフ 渋谷店","CAFE LEAF",8.8,"落ち着いた雰囲気で、スタッフ同士の助け合いが多い職場です。","東京都渋谷区"],["バーガーパーク 新宿店","BURGER PARK",7.2,"人間関係は好評。ピーク時間の忙しさには意見が分かれています。","東京都新宿区"],["マルシェ 下北沢店","MARCHE",6.3,"シフトの相談がしやすい一方、覚える業務は多めです。","東京都世田谷区"]];
const stores=examples.map((d,i)=>({id:String(i+1),name:d[0],brand:d[1],summary:d[3],address:d[4],createdAt:'2026-09-01T00:00:00Z'}));
const sampleComments=['初めてのバイトでしたが、先輩が丁寧に教えてくれました。','忙しい時間もありますが、スタッフ同士で声をかけ合って働けました。','シフトの相談はしやすかったです。覚えることは思ったより多めでした。','店舗や時間帯によって雰囲気が変わると感じました。','研修が短く、慣れるまでは大変でした。','人手が少なく、休憩を取りにくい日もありました。'];
const seed=examples.flatMap((d,i)=>{const total=Math.round(d[2]*10);const scores=Array(10).fill(Math.floor(d[2]));for(let j=0;j<total-Math.floor(d[2])*10;j++)scores[j]++;if(scores[0]>0&&scores[9]<10){scores[0]--;scores[9]++;}return scores.map((score,j)=>({id:`seed-${i}-${j}`,storeId:String(i+1),score,comment:j<4?sampleComments[d[2]<4?4+j%2:j%4]:'',createdAt:'2026-09-01T00:00:00Z'}));});
let saved=[],reviews=[...seed],query='',activeStore=null;
let cloud=null,cloudError=null,storesLoaded=false,reviewsLoaded=false;
const app=document.getElementById('app'),dialog=document.getElementById('review-dialog');
const escapeHtml=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function stats(id){const rs=reviews.filter(r=>r.storeId===id&&Number.isInteger(r.score));return{reviews:rs,score:rs.length?rs.reduce((a,r)=>a+r.score,0)/rs.length:null,distribution:Array.from({length:11},(_,i)=>rs.filter(r=>r.score===i).length)}}
function scoreText(n){return n===null?"—":n.toFixed(1)}
function colors(n){if(n===null)return "--accent:#bbb;--end:#ddd;--ink:#555;--tint:#f5f5f5";const hue=n*12;return `--accent:hsl(${hue} 63% 58%);--end:hsl(${Math.min(145,hue+20)} 64% 69%);--ink:hsl(${hue} 65% 28%);--tint:hsl(${hue} 65% 95%)`}
function card(s) {
 const t=stats(s.id), contributed=workStats(s.id), sample=sampleWorkInfo[s.id];
 const wage=contributed.hourlyWage??sample?.hourlyWage, period=contributed.workPeriod??sample?.workPeriod;
 const sampleFields=[];
 if(sample&&contributed.hourlyWage===null)sampleFields.push('時給');
 if(sample&&!contributed.workPeriod)sampleFields.push('期間');
 return `<a class="card" href="#store/${s.id}" style="${colors(t.score)}" aria-label="${escapeHtml(s.name)}、評価${scoreText(t.score)}">
  <div class="ribbon"></div><div class="card-inner">
   <h3>${escapeHtml(s.name)}</h3><span class="brand">${escapeHtml(s.brand)}</span>
   <dl class="card-facts">
    <div class="card-rating"><dt>総合評価</dt><dd><span class="score">${scoreText(t.score)}</span><span class="denom">/ 10</span><span class="count">${t.reviews.length}人</span></dd></div>
    <div><dt>時給</dt><dd>${wage!=null?`平均 ${wage.toLocaleString('ja-JP')}円`:'未登録'}</dd></div>
    <div><dt>働いた期間</dt><dd>${period?escapeHtml(period):'未登録'}</dd></div>
   </dl>
   <div class="card-voices"><span class="card-label">みんなの声</span><p class="summary-short">${escapeHtml(s.summary)}</p></div>
   ${sampleFields.length?`<small class="card-sample-note">${sampleFields.join('・')}はサンプル値</small>`:''}
  </div></a>`;
}
function renderCards(){const result=stores.filter(s=>(s.name+' '+s.brand).normalize('NFKC').toLowerCase().includes(query.normalize('NFKC').trim().toLowerCase()));document.getElementById('result-count').textContent=`${result.length}店舗`;document.getElementById('cards').innerHTML=result.length?result.map(card).join(''):'<div class="empty">該当する店舗がありません。<br>別の店名・会社名で検索してください。</div>';}
function home(){app.classList.remove('store-detail');activeStore=null;document.title='バイトの声 | 店舗ごとのアルバイト口コミ';app.innerHTML=`<div class="search"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/></svg><input id="search" type="search" placeholder="店名・会社名で検索" aria-label="店名・会社名で検索" value="${escapeHtml(query)}"></div><span class="demo">初期の3店舗は架空のサンプルです</span><div class="list-head"><h2>店舗を探す</h2><span id="result-count" aria-live="polite"></span></div><div class="grid" id="cards"></div>`;renderCards();document.getElementById('search').addEventListener('input',e=>{query=e.target.value;renderCards()});}
const sampleWorkInfo = {
 '1': { hourlyWage: 1280, workPeriod: '半年〜1年が多い' },
 '2': { hourlyWage: 1200, workPeriod: '3か月〜半年が多い' },
 '3': { hourlyWage: 1250, workPeriod: '1年以上が多い' }
};
const periods = ['3か月未満', '3か月〜半年', '半年〜1年', '1年以上'];
const contributionLabels = {rating:'総合評価を投稿する', wage:'時給を投稿する', period:'働いた期間を投稿する', comment:'声を投稿する'};
let contributionMode = null, contributionStoreId = null, contributionBusy = false;
const currentWorkYear = Number(new Intl.DateTimeFormat('en', {year:'numeric', timeZone:'Asia/Tokyo'}).format(new Date()));
function validWorkYear(r) {
 return (r.currentlyWorking===true && r.lastWorkedYear===null)
  || (r.currentlyWorking===false && Number.isInteger(r.lastWorkedYear) && r.lastWorkedYear>=currentWorkYear-9 && r.lastWorkedYear<=currentWorkYear);
}
function validContribution(r) {
 if(!r || typeof r.storeId!=='string')return false;
 // 過去の投稿は時期不明のまま読み込み、新規投稿には時期を必須にする。
 if(!r.type)return Number.isInteger(r.score)&&r.score>=0&&r.score<=10&&typeof r.comment==='string';
 if(r.type==='rating')return Number.isInteger(r.score)&&r.score>=0&&r.score<=10;
 if(r.type==='wage')return Number.isInteger(r.hourlyWage)&&r.hourlyWage>=1&&r.hourlyWage<=100000;
 if(r.type==='period')return periods.includes(r.workPeriod);
 if(r.type==='comment')return typeof r.comment==='string'&&r.comment.trim().length>0&&r.comment.length<=2000;
 return false;
}
function workStats(id) {
 const wages=saved.filter(r=>r.storeId===id&&r.type==='wage').map(r=>r.hourlyWage);
 const responses=saved.filter(r=>r.storeId===id&&r.type==='period');
 const counts=periods.map(p=>responses.filter(r=>r.workPeriod===p).length);
 const most=Math.max(...counts);
 return {hourlyWage:wages.length?Math.round(wages.reduce((a,n)=>a+n,0)/wages.length):null,
  workPeriod:most?periods.filter((_,i)=>counts[i]===most).join('・')+'が多い':null};
}
function buildContribution(type,storeId,form) {
 const selected=form.get('lastWorkedYear');
 if(selected===null||selected==='')throw new Error('最後に働いていた年を選択してください。');
 const result={id:crypto.randomUUID(),storeId,type,currentlyWorking:selected==='current',lastWorkedYear:selected==='current'?null:Number(selected)};
 if(!validWorkYear(result))throw new Error('働いていた年を確認してください。');
 if(type==='rating'){const value=form.get('score');if(value===null||value==='')throw new Error('評価を選択してください。');result.score=Number(value);}
 else if(type==='wage'){const value=form.get('hourlyWage');if(value===null||!String(value).trim())throw new Error('時給を入力してください。');result.hourlyWage=Number(value);}
 else if(type==='period')result.workPeriod=form.get('workPeriod');
 else if(type==='comment')result.comment=String(form.get('comment')||'').trim();
 if(!validContribution(result))throw new Error('入力内容を確認してください。');
 return result;
}
function yearGroups(id,type) {
 const relevant=reviews.filter(r=>r.storeId===id&&(type==='rating'?Number.isInteger(r.score):type==='comment'?typeof r.comment==='string'&&r.comment.trim():r.type===type));
 const groups=[{label:'現在も勤務中',rows:relevant.filter(r=>r.currentlyWorking===true)},
  ...Array.from({length:10},(_,i)=>({label:`${currentWorkYear-i}年`,rows:relevant.filter(r=>r.currentlyWorking===false&&r.lastWorkedYear===currentWorkYear-i)}))];
 const unknown=relevant.filter(r=>r.currentlyWorking!==true&&!(r.currentlyWorking===false&&Number.isInteger(r.lastWorkedYear)));
 if(unknown.length)groups.push({label:'時期不明',rows:unknown});
 const olderYears=[...new Set(relevant.filter(r=>r.currentlyWorking===false&&Number.isInteger(r.lastWorkedYear)&&r.lastWorkedYear<currentWorkYear-9).map(r=>r.lastWorkedYear))].sort((a,b)=>b-a);
 for(const year of olderYears)groups.push({label:`${year}年`,rows:relevant.filter(r=>r.currentlyWorking===false&&r.lastWorkedYear===year)});
 return groups;
}
function yearCards(id,type) {
 const populated=yearGroups(id,type).filter(group=>group.rows.length>0);
 if(!populated.length)return '<p class="year-empty-state">年別データはまだありません</p>';
 const cards=populated.map(({label,rows})=>{
  let content='<p class="year-empty">データなし</p>',style='';
  if(rows.length){
   if(type==='rating'){const value=rows.reduce((sum,r)=>sum+r.score,0)/rows.length;style=colors(value);content=`<p class="year-value year-score">${value.toFixed(1)}<small> / 10</small></p><small class="year-count">${rows.length}件</small>`;}
   if(type==='wage'){const value=Math.round(rows.reduce((sum,r)=>sum+r.hourlyWage,0)/rows.length);content=`<p class="year-value">${value.toLocaleString('ja-JP')}<small>円</small></p><small class="year-count">${rows.length}件</small>`;}
   if(type==='period'){const counts=periods.map(p=>rows.filter(r=>r.workPeriod===p).length),max=Math.max(...counts);content=`<p class="year-period">${escapeHtml(periods.filter((_,i)=>counts[i]===max).join('・'))}</p><small class="year-count">${rows.length}件</small>`;}
   if(type==='comment')content=`<div class="year-comments">${rows.map(r=>`<p>${escapeHtml(r.comment)}</p>`).join('')}</div><small class="year-count">${rows.length}件</small>`;
  }
  return `<article class="year-card${rows.length?'':' is-empty'}" style="${style}"><h3>${label}</h3>${content}</article>`;
 }).join('');
 return `<div class="year-cards" tabindex="0" role="region" aria-label="${{rating:'総合評価',wage:'時給',period:'働いた期間',comment:'みんなの声'}[type]}の年別データ">${cards}</div>`;
}
function detail(s) {
 activeStore = s;
 app.classList.add('store-detail');
 const t = stats(s.id), work = sampleWorkInfo[s.id], contributed = workStats(s.id);
 const wage = contributed.hourlyWage ?? work?.hourlyWage, period = contributed.workPeriod ?? work?.workPeriod;
 document.title = s.name + ' | バイトの声';
 app.innerHTML = `
  <a class="back" href="#">‹ 店舗一覧に戻る</a>
  <div class="store-heading">
   <h1>${escapeHtml(s.name)}</h1>
   <span class="brand">${escapeHtml(s.brand)}</span>
  </div>
  <div class="store-information" style="${colors(t.score)}">
   <section class="detail-section overall-rating" aria-labelledby="overall-heading">
    <div class="section-heading"><h2 id="overall-heading">総合評価</h2><button class="section-post" data-contribution="rating" aria-label="総合評価を投稿する">評価する</button></div>
    <div class="overall-value"><span class="score big-score">${scoreText(t.score)}</span><span class="denom">/ 10</span><span class="rating-count">${t.reviews.length}人</span></div>
    ${yearCards(s.id,'rating')}
   </section>
   <section class="detail-section" aria-labelledby="wage-heading">
    <div class="section-heading"><h2 id="wage-heading">時給</h2><button class="section-post" data-contribution="wage" aria-label="時給を投稿する">投稿する</button></div>
    ${wage != null ? `<p class="wage-value"><span>平均</span> ${wage.toLocaleString('ja-JP')}<span>円</span></p>${contributed.hourlyWage === null ? '<small class="sample-note">サンプル値</small>' : ''}` : '<p class="information-value">未登録</p>'}
    ${yearCards(s.id,'wage')}
   </section>
   <section class="detail-section" aria-labelledby="period-heading">
    <div class="section-heading"><h2 id="period-heading">働いた期間</h2><button class="section-post" data-contribution="period" aria-label="働いた期間を投稿する">投稿する</button></div>
    <p class="information-value">${period ? escapeHtml(period) : '未登録'}</p>
    ${!contributed.workPeriod && work ? '<small class="sample-note">サンプル値</small>' : ''}
    ${yearCards(s.id,'period')}
   </section>
   <section class="detail-section" aria-labelledby="voices-heading">
    <div class="section-heading"><h2 id="voices-heading">みんなの声</h2><button class="section-post" data-contribution="comment" aria-label="みんなの声を投稿する">投稿する</button></div>
    <p class="voices-summary">${escapeHtml(s.summary)}</p>
    ${yearCards(s.id,'comment')}
   </section>
  </div>`;
 app.querySelectorAll('[data-contribution]').forEach(button=>button.onclick=()=>openForm(button.dataset.contribution));
}
function route(){const match=location.hash.match(/^#store\/([A-Za-z0-9_-]+)$/),s=match&&stores.find(s=>s.id===match[1]);s?detail(s):home();}
function openForm(type) {
 if(!activeStore||contributionBusy||!contributionLabels[type])return;
 contributionMode=type;contributionStoreId=activeStore.id;
 const form=document.getElementById('review-form');form.reset();
 document.getElementById('contribution-title').textContent=contributionLabels[type];
 document.getElementById('form-error').textContent='';
 document.getElementById('form-store').textContent=activeStore.name;
 const fields=document.getElementById('contribution-fields');
 if(type==='rating')fields.innerHTML=`<fieldset><legend>この職場を0〜10で評価すると？</legend><div class="scores">${Array.from({length:11},(_,i)=>`<label><input type="radio" name="score" value="${i}" required><span>${i}</span></label>`).join('')}</div><div class="scale-label"><span>よくなかった</span><span>とてもよかった</span></div></fieldset>`;
 if(type==='wage')fields.innerHTML='<label for="hourly-wage">時給（円）</label><input class="contribution-input" id="hourly-wage" name="hourlyWage" type="number" inputmode="numeric" min="1" max="100000" step="1" placeholder="例：1280" required>';
 if(type==='period')fields.innerHTML=`<fieldset><legend>働いた期間</legend><div class="period-options">${periods.map((p,i)=>`<label><input type="radio" name="workPeriod" value="${p}" required><span>${p}</span></label>`).join('')}</div></fieldset>`;
 if(type==='comment')fields.innerHTML='<label for="comment">コメント</label><textarea id="comment" name="comment" rows="4" maxlength="2000" placeholder="働いてみてどうでしたか？自由に書いてください" required></textarea><p class="privacy">個人を特定できる情報は書かないでください。</p>';
 fields.innerHTML += `<div class="work-year-field"><label for="last-worked-year">最後に働いていた年</label><select class="contribution-input" id="last-worked-year" name="lastWorkedYear" required><option value="">選択してください</option><option value="current">現在も勤務中</option>${Array.from({length:10},(_,i)=>`<option value="${currentWorkYear-i}">${currentWorkYear-i}年</option>`).join('')}</select></div>`;
 form.querySelector('.submit').disabled=true;dialog.showModal();
}
const contributionForm=document.getElementById('review-form');
contributionForm.addEventListener('input',()=>{contributionForm.querySelector('.submit').disabled=contributionBusy||!contributionForm.checkValidity();});
contributionForm.onsubmit=async e=>{
 e.preventDefault();if(contributionBusy||!contributionStoreId)return;
 const error=document.getElementById('form-error'),button=e.target.querySelector('.submit');error.textContent='';
 if(!cloud||!storesLoaded||!reviewsLoaded||cloudError){error.textContent='データベースに接続できていません。時間をおいて再度お試しください。';return;}
 let review;try{review=buildContribution(contributionMode,contributionStoreId,new FormData(e.target));}catch(err){error.textContent=err.message;return;}
 contributionBusy=true;button.disabled=true;button.textContent='投稿中…';
 const mode=contributionMode;
 try {
  await cloud.createReview(review);
  if(!saved.some(r=>r.id===review.id))saved.unshift(review);
  reviews=[...saved,...seed];dialog.close();
  if(activeStore?.id===review.storeId){detail(activeStore);app.querySelector(`[data-contribution="${mode}"]`)?.focus();}
  showToast('投稿しました。');
 } catch(err){error.textContent='投稿を保存できませんでした。時間をおいて再度お試しください。';console.error('Review write failed:',err.code);}
 finally{contributionBusy=false;button.disabled=false;button.textContent='投稿する';}
};
document.querySelectorAll('dialog').forEach(d=>{d.querySelector('.close').onclick=()=>d.close();d.addEventListener('click',e=>{if(e.target===d){const r=d.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)d.close();}})});document.getElementById('about').onclick=()=>document.getElementById('about-dialog').showModal();window.addEventListener('hashchange',()=>{route();window.scrollTo(0,0)});route();
if(document.modelContext?.registerTool){try{document.modelContext.registerTool({name:'search_stores',description:'店名・会社名から店舗を検索し、一覧を表示する。',inputSchema:{type:'object',properties:{query:{type:'string'}},required:['query'],additionalProperties:false},annotations:{readOnlyHint:true},execute(input){if(!input||typeof input.query!=='string')throw new Error('query must be a string');query=input.query;if(location.hash)location.hash='';home();return stores.filter(s=>(s.name+' '+s.brand).toLowerCase().includes(query.toLowerCase())).map(s=>({id:s.id,name:s.name,score:stats(s.id).score}));}});}catch{}}

const storeDialog=document.getElementById('store-dialog');
document.getElementById('add-store').onclick=()=>{document.getElementById('store-form').reset();document.getElementById('store-error').textContent='';storeDialog.showModal();};
document.getElementById('store-form').onsubmit=async e=>{
 e.preventDefault();const form=new FormData(e.target),name=form.get('name').trim(),brand=form.get('brand').trim(),address=form.get('address').trim();
 const error=document.getElementById('store-error'),button=e.target.querySelector('[type="submit"]');error.textContent='';
 if(!name||!brand){error.textContent='店舗名とブランド・会社名を入力してください。';return;}
 if(!cloud||!storesLoaded||cloudError){error.textContent='データベースに接続できていません。時間をおいて再度お試しください。';return;}
 if(stores.some(s=>s.name===name&&s.brand===brand)){error.textContent='同じ店舗がすでに登録されています。';return;}
 const store={id:crypto.randomUUID(),name,brand,address,summary:'まだ口コミがありません。'};
 button.disabled=true;button.textContent='追加中…';
 try {
  await cloud.createStore(store);if(!stores.some(s=>s.id===store.id))stores.push(store);
  storeDialog.close();query='';location.hash='store/'+store.id;showToast('店舗を追加しました。');
 } catch(err){error.textContent='店舗を保存できませんでした。時間をおいて再度お試しください。';console.error('Store write failed:',err.code);}
 finally{button.disabled=false;button.textContent='追加する';}
};
function showToast(message){const toast=document.getElementById('toast');toast.textContent=message;toast.classList.add('show');setTimeout(()=>toast.classList.remove('show'),3500);}
function refreshDataView(){if(activeStore){const store=stores.find(s=>s.id===activeStore.id);if(store)detail(store);}else if(location.hash.startsWith('#store/'))route();else renderCards();}
function updateConnection(){const status=document.getElementById('connection-status');status.textContent=cloudError?'共有データを読み込めませんでした。再読み込みしてください。':storesLoaded&&reviewsLoaded?'':'データを読み込み中…';status.hidden=storesLoaded&&reviewsLoaded&&!cloudError;}
function connectionFailed(err){cloudError=err;console.error('Firestore connection failed:',err.code||err.message);updateConnection();}
updateConnection();
import('./firebase.js').then(api=>{
 cloud=api;const stop=api.subscribeData(data=>{
  const sample=examples.map((d,i)=>({id:String(i+1),name:d[0],brand:d[1],summary:d[3],address:d[4],createdAt:'2026-09-01T00:00:00Z'}));
  const valid=data.filter(s=>typeof s.name==='string'&&typeof s.brand==='string').map(s=>({...s,summary:typeof s.summary==='string'?s.summary:'まだ口コミがありません。',address:typeof s.address==='string'?s.address:''}));
  stores.splice(0,stores.length,...sample,...valid.filter(s=>!sample.some(x=>x.id===s.id)));storesLoaded=true;refreshDataView();updateConnection();
 },data=>{
  saved=data.filter(validContribution);
  reviews=[...saved,...seed];reviewsLoaded=true;refreshDataView();updateConnection();
 },connectionFailed);window.addEventListener('pagehide',stop,{once:true});
}).catch(connectionFailed);
