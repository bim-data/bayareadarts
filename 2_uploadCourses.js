import fs from 'fs/promises';
import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc } from "firebase/firestore";

// 1. YOUR FIREBASE CONFIG
const firebaseConfig = {

  apiKey: "AIzaSyAGMV9F-9cW_kb212fsAv6_G77bH2Ruemc",

  authDomain: "bay-area-darts.firebaseapp.com",

  projectId: "bay-area-darts",

  storageBucket: "bay-area-darts.firebasestorage.app",

  messagingSenderId: "218991945584",

  appId: "1:218991945584:web:b53d7af955f98575aad1b5",

  measurementId: "G-KZN2Y31SSE"

};


const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function runUpload() {
  try {
    console.log("📂 Reading downloaded_courses.json...");
    
    // Read the local file
    const fileData = await fs.readFile('downloaded_courses.json', 'utf-8');
    const courses = JSON.parse(fileData);

    if (!Array.isArray(courses) || courses.length === 0) {
      console.log("⚠️ No courses found in the JSON file to upload.");
      process.exit(0);
    }

    console.log(`🚀 Preparing to upload ${courses.length} courses to Firebase...`);

    for (const course of courses) {
      if (!course.id) {
        console.log(`⚠️ Skipping course with missing ID: ${course.name}`);
        continue;
      }

      // Write to Firebase
      await setDoc(doc(db, "courses", String(course.id)), course);
      console.log(`✅ Uploaded to Firestore: ${course.name}`);
    }

    console.log("\n🎯 All courses uploaded successfully!");
    process.exit(0);
    
  } catch (err) {
    console.error("🚨 Error uploading to Firebase:", err);
    process.exit(1);
  }
}

runUpload();