import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js';
import { getFirestore, collection, doc, setDoc, serverTimestamp, onSnapshot } from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js';

// Firebase Web設定はブラウザ向けの公開設定です。アクセス制御はfirestore.rulesで行います。
const firebaseConfig = {
  apiKey: 'AIzaSyBZrOyn6ATjkoq1RK5lhsUxn_gXFZy1OAo',
  authDomain: 'baito-73a07.firebaseapp.com',
  projectId: 'baito-73a07',
  storageBucket: 'baito-73a07.firebasestorage.app',
  messagingSenderId: '310435361363',
  appId: '1:310435361363:web:ff5bcb07a265f8b64f4ca6'
};
const db = getFirestore(initializeApp(firebaseConfig));
export function subscribeData(onStores, onReviews, onError) {
  const stopStores = onSnapshot(collection(db, 'stores'), {includeMetadataChanges:true}, snapshot => onStores(snapshot.docs.filter(d=>!d.metadata.hasPendingWrites).map(d => ({...d.data(), id:d.id}))), onError);
  const stopReviews = onSnapshot(collection(db, 'reviews'), {includeMetadataChanges:true}, snapshot => onReviews(snapshot.docs.filter(d=>!d.metadata.hasPendingWrites).map(d => ({...d.data(), id:d.id}))), onError);
  return () => { stopStores(); stopReviews(); };
}
export async function createStore(store) {
  const data = { name:store.name, brand:store.brand, address:store.address, summary:'まだ口コミがありません。', createdAt:serverTimestamp() };
  await setDoc(doc(db, 'stores', store.id), data);
  return {...data, id:store.id};
}
export async function createReview(review) {
  const data = { storeId:review.storeId, type:review.type, createdAt:serverTimestamp() };
  if(review.type==='rating')data.score=review.score;
  else if(review.type==='wage')data.hourlyWage=review.hourlyWage;
  else if(review.type==='period')data.workPeriod=review.workPeriod;
  else if(review.type==='comment')data.comment=review.comment;
  else throw new Error('Unsupported contribution type');
  await setDoc(doc(db, 'reviews', review.id), data);
  return {...data, id:review.id};
}
