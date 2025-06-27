import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getDatabase } from 'firebase/database';
import { getStorage } from 'firebase/storage';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyD4JuyXKrkiaNf6v3CoV0raIhi2B9QXujw",
  authDomain: "botanicgrow-758e7.firebaseapp.com", 
  projectId: "botanicgrow-758e7",
  storageBucket: "botanicgrow-758e7.firebasestorage.app", 
  messagingSenderId: "331774366190",
  appId: "1:331774366190:android:5cf7a1d5179ee5f6c87eff",
  databaseURL: "https://botanicgrow-758e7-default-rtdb.europe-west1.firebasedatabase.app"
};

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

const auth = getAuth(app);
const db = getDatabase(app);
const storage = getStorage(app);
const firestore = getFirestore(app);

export { app, auth, db, storage, firestore };  
