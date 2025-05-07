import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage'; 

const firebaseConfig = {
  apiKey: "AIzaSyD4JuyXKrkiaNf6v3CoV0raIhi2B9QXujw",
  authDomain: "botanicgrow-758e7.firebaseapp.com", 
  projectId: "botanicgrow-758e7",
  storageBucket: "botanicgrow-758e7.firebasestorage.app", 
  messagingSenderId: "SEU_MESSAGING_SENDER_ID",
  appId: "1:331774366190:android:5cf7a1d5179ee5f6c87eff"
};

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app); 

export { app, auth, db, storage };  
