// firebase.ts
import { initializeApp } from 'firebase/app';
import { initializeAuth } from 'firebase/auth';
import { getReactNativePersistence } from 'firebase/auth/react-native';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';

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
const app = initializeApp(firebaseConfig);

// Initialize Auth with persistence
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage)
});

export { auth };