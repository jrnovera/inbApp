// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";
// Note: In Firebase v11+, we don't need getReactNativePersistence anymore
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCLuAFnfJiFsmE0-SJsqAgLbHjmcR5nSX8",
  authDomain: "ecommerse-app-82338.firebaseapp.com",
  projectId: "ecommerse-app-82338",
  storageBucket: "ecommerse-app-82338.firebasestorage.app",
  messagingSenderId: "315571657905",
  appId: "1:315571657905:web:fda85fdb35f66a2bb39690",
  measurementId: "G-W12YZFY9CF"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication
export const auth = getAuth(app);

// Set persistence to IndexedDB/AsyncStorage implicitly
// Firebase v11+ automatically uses the appropriate persistence for the platform
