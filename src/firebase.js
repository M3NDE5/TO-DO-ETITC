// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyA8420VljO2AEMaXw8BKEiYyb8lWq4uR7w",
  authDomain: "to-do-etitc.firebaseapp.com",
  projectId: "to-do-etitc",
  storageBucket: "to-do-etitc.firebasestorage.app",
  messagingSenderId: "401013203367",
  appId: "1:401013203367:web:bc96ba8ddb33e733981682",
  measurementId: "G-GQRLKE6EB9"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

export const auth = getAuth(app);
export const db = getFirestore(app);
