'use strict';
const examples=[["カフェ・リーフ 渋谷店","CAFE LEAF",8.8,"落ち着いた雰囲気で、スタッフ同士の助け合いが多い職場です。","東京都渋谷区"],["バーガーパーク 新宿店","BURGER PARK",7.2,"人間関係は好評。ピーク時間の忙しさには意見が分かれています。","東京都新宿区"],["マルシェ 下北沢店","MARCHE",6.3,"シフトの相談がしやすい一方、覚える業務は多めです。","東京都世田谷区"]];
const stores=examples.map((d,i)=>({id:String(i+1),name:d[0],brand:d[1],summary:d[3],address:d[4],createdAt:'2026-09-01T00:00:00Z'}));
const sampleComments=['初めてのバイトでしたが、先輩が丁寧に教えてくれました。','忙しい時間もありますが、スタッフ同士で声をかけ合って働けました。','シフトの相談はしやすかったです。覚えることは思ったより多めでした。','店舗や時間帯によって雰囲気が変わると感じました。','研修が短く、慣れるまでは大変でした。','人手が少なく、休憩を取りにくい日もありました。'];
const seed=examples.flatMap((d,i)=>{const total=Math.round(d[2]*10);const scores=Array(10).fill(Math.floor(d[2]));for(let j=0;j<total-Math.floor(d[2])*10;j++)scores[j]++;if(scores[0]>0&&scores[9]<10){scores[0]--;scores[9]++;}return scores.map((score,j)=>({id:`seed-${i}-${j}`,storeId:String(i+1),score,comment:j<4?sampleComments[d[2]<4?4+j%2:j%4]:'',createdAt:'2026-09-01T00:00:00Z'}));});
let saved=[],reviews=[...seed],query='',activeStore=null;
let cloud=null,cloudError=null,storesLoaded=false,reviewsLoaded=false;
const app=document.getElementById('app'),dialog=document.getElementById('review-dialog');
const escapeHtml=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function stats(id){const rs=reviews.filter(r=>r.storeId===id);return{reviews:rs,score:rs.length?rs.reduce((a,r)=>a+r.score,0)/rs.length:null,distribution:Array.from({length:11},(_,i)=>rs.filter(r=>r.score===i).length)}}
function scoreText(n){return n===null?"—":n.toFixed(1)}
function colors(n){if(n===null)return "--accent:#bbb;--end:#ddd;--ink:#555;--tint:#f5f5f5";const hue=n*12;return `--accent:hsl(${hue} 63% 58%);--end:hsl(${Math.min(145,hue+20)} 64% 69%);--ink:hsl(${hue} 65% 28%);--tint:hsl(${hue} 65% 95%)`}
function tag(n){if(n===null)return "評価なし";return n>=8?'好意的な声が多い':n>=6?'比較的好評':n>=4?'意見が分かれる':'改善を求める声'}
function card(s){const t=stats(s.id);return `<a class="card" href="#store/${s.id}" style="${colors(t.score)}" aria-label="${escapeHtml(s.name)}、評価${scoreText(t.score)}"><div class="ribbon"></div><div class="card-inner"><span class="brand">${escapeHtml(s.brand)}</span><h3>${escapeHtml(s.name)}</h3><div class="card-score"><div><span class="score">${scoreText(t.score)}</span><span class="denom">/ 10</span></div><div><div class="mini-bars" aria-hidden="true">${t.distribution.map(n=>`<i style="height:${Math.max(3,n/Math.max(...t.distribution,1)*27)}px"></i>`).join('')}</div><span class="count">口コミ ${t.reviews.length}件</span></div></div><p class="summary-short">${escapeHtml(s.summary)}</p><div class="card-bottom"><span class="pill">${tag(t.score)}</span><b>口コミを見る</b></div></div></a>`}
function renderCards(){const result=stores.filter(s=>(s.name+' '+s.brand).normalize('NFKC').toLowerCase().includes(query.normalize('NFKC').trim().toLowerCase()));document.getElementById('result-count').textContent=`${result.length}店舗`;document.getElementById('cards').innerHTML=result.length?result.map(card).join(''):'<div class="empty">該当する店舗がありません。<br>別の店名・会社名で検索してください。</div>';}
function home(){activeStore=null;document.title='バイトの声 | 店舗ごとのアルバイト口コミ';app.innerHTML=`<div class="search"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/></svg><input id="search" type="search" placeholder="店名・会社名で検索" aria-label="店名・会社名で検索" value="${escapeHtml(query)}"></div><span class="demo">初期の3店舗は架空のサンプルです</span><div class="list-head"><h2>店舗を探す</h2><span id="result-count" aria-live="polite"></span></div><div class="grid" id="cards"></div>`;renderCards();document.getElementById('search').addEventListener('input',e=>{query=e.target.value;renderCards()});}
function detail(s){activeStore=s;const t=stats(s.id),max=Math.max(...t.distribution,1);document.title=s.name+' | バイトの声';app.innerHTML=`<a class="back" href="#">‹ 店舗一覧に戻る</a><section class="detail-hero" style="${colors(t.score)}"><div class="hero-content"><div><span class="brand">${escapeHtml(s.brand)}</span><h1>${escapeHtml(s.name)}</h1><span class="address">${escapeHtml(s.address)}${examples.some((_,i)=>String(i+1)===s.id)?" · サンプル店舗":""}</span></div><div><span class="score big-score">${scoreText(t.score)}</span><span class="denom">/ 10</span><div class="count">${t.reviews.length}件の評価</div></div></div></section><div class="detail-grid" style="${colors(t.score)}"><section class="panel"><h2>評価の分布</h2><div class="histogram" role="img" aria-label="${t.distribution.map((n,i)=>`${i}点: ${n}件`).join('、')}">${t.distribution.map((n,i)=>`<div class="bin"><b>${n}</b><div class="bar" style="--height:${n/max*115}px"></div><span>${i}</span></div>`).join('')}</div></section><section class="panel trend"><h2>この店舗の傾向</h2><p>${escapeHtml(s.summary)}</p><button class="primary" id="open-review">この店舗を評価する</button></section></div><div class="reviews-head"><h2>働いた人の声</h2><span>${t.reviews.filter(r=>r.comment.trim()).length}件のコメント</span></div><section>${t.reviews.filter(r=>r.comment.trim()).map(r=>`<article class="review" style="${colors(r.score)}"><div class="review-rating">${r.score}<small> / 10</small></div><p>${escapeHtml(r.comment)}</p></article>`).join('')||'<p class="muted">まだコメントはありません。</p>'}</section>`;document.getElementById('open-review').onclick=openForm;}
function route(){const match=location.hash.match(/^#store\/([A-Za-z0-9_-]+)$/),s=match&&stores.find(s=>s.id===match[1]);s?detail(s):home();}
function openForm(){document.getElementById('review-form').reset();document.getElementById('form-error').textContent='';document.querySelector('.submit').disabled=true;document.getElementById('form-store').textContent=activeStore.name;dialog.showModal();}
document.getElementById('scores').innerHTML=Array.from({length:11},(_,i)=>`<label><input type="radio" name="score" value="${i}" required><span>${i}</span></label>`).join('');document.getElementById('scores').onchange=()=>document.querySelector('.submit').disabled=false;
document.getElementById('review-form').onsubmit=async e=>{
 e.preventDefault();const chosen=new FormData(e.target).get('score');if(chosen===null||!activeStore)return;
 const error=document.getElementById('form-error'),button=e.target.querySelector('.submit');error.textContent='';
 if(!cloud||!storesLoaded||!reviewsLoaded||cloudError){error.textContent='データベースに接続できていません。時間をおいて再度お試しください。';return;}
 const storeId=activeStore.id, review={id:crypto.randomUUID(),storeId,score:Number(chosen),comment:document.getElementById('comment').value.trim()};
 button.disabled=true;button.textContent='投稿中…';
 try {
  await cloud.createReview(review);
  if(!saved.some(r=>r.id===review.id))saved.unshift(review);
  reviews=[...saved,...seed];dialog.close();if(activeStore?.id===storeId){detail(activeStore);document.getElementById('open-review').focus();}
  showToast('投稿しました。評価に反映されました。');
 } catch(err){error.textContent='投稿を保存できませんでした。時間をおいて再度お試しください。';console.error('Review write failed:',err.code);}
 finally{button.disabled=false;button.textContent='投稿する';}
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
  saved=data.filter(r=>typeof r.storeId==='string'&&Number.isInteger(r.score)&&r.score>=0&&r.score<=10&&typeof r.comment==='string');
  reviews=[...saved,...seed];reviewsLoaded=true;refreshDataView();updateConnection();
 },connectionFailed);window.addEventListener('pagehide',stop,{once:true});
}).catch(connectionFailed);
