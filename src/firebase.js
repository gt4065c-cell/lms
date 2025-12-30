// 파일 경로: src/firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  // 👇 여기를 본인의 설정값으로 꼭 바꿔주세요!
  apiKey: "AIzaSyBqi1L5qO3V8q2Rx7BoKvIj6rGo9hOldvI",
  authDomain: "lecture-management-aaa55.firebaseapp.com",
  projectId: "lecture-management-aaa55",
  storageBucket: "lecture-management-aaa55.firebasestorage.app",
  messagingSenderId: "329145617708",
  appId: "1:329145617708:web:a62278bdab548eed72f089",
  measurementId: "G-XDB6GYPGDW"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);