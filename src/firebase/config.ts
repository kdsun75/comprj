import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';
import { getDatabase, Database } from 'firebase/database';

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.REACT_APP_FIREBASE_DATABASE_URL,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID
};

// 디버깅을 위한 설정 확인
console.log('Firebase Config:', {
  ...firebaseConfig,
  apiKey: firebaseConfig.apiKey ? '설정됨' : '미설정',
  databaseURL: firebaseConfig.databaseURL || '미설정'
});

// 이미 초기화된 앱이 있으면 재사용, 없으면 새로 초기화
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);

// Realtime Database 초기화
let realtimeDb: Database;
try {
  realtimeDb = getDatabase(app);
  console.log('Firebase Realtime Database 초기화 성공');
} catch (error) {
  console.error('Firebase Realtime Database 초기화 실패:', error);
  console.error('databaseURL이 올바르게 설정되어 있는지 확인하세요:', firebaseConfig.databaseURL);
  throw error;
}

export { realtimeDb }; 