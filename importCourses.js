import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc } from "firebase/firestore";

// 1. YOUR CREDENTIALS & TARGET COURSES
const API_KEY = 'YWVWXINIAUWWFIZ6NTKQOHOUNE';
const firebaseConfig = {

  apiKey: "AIzaSyAGMV9F-9cW_kb212fsAv6_G77bH2Ruemc",

  authDomain: "bay-area-darts.firebaseapp.com",

  projectId: "bay-area-darts",

  storageBucket: "bay-area-darts.firebasestorage.app",

  messagingSenderId: "218991945584",

  appId: "1:218991945584:web:b53d7af955f98575aad1b5",

  measurementId: "G-KZN2Y31SSE"

};


// ⚠️ MAX 17 COURSES PER DAY (2 API calls used per course)
const TARGET_COURSES = [
  "San Ramon Golf Club",
  "Redwood Canyon Golf Course",
  "Shoreline Golf Links",
  "Canyon Lakes Golf Course",
  "Poplar Creek Golf Course",
  "Deep Cliff Golf Course",
  "Los Lagos Golf Course",
  "Tilden Park Golf Course",
  // Add up to 12 more here...
];

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const DIRECT_URL = 'https://api.golfcourseapi.com/v1';

async function runImport() {
  console.log(`Starting targeted import for ${TARGET_COURSES.length} courses...`);

  for (const courseName of TARGET_COURSES) {
    try {
      console.log(`\n🔍 Searching for: ${courseName}...`);
      
      // Step 1: Search for the specific course (1 API Call)
      const searchUrl = `${DIRECT_URL}/search?search_query=${encodeURIComponent(courseName)}&fuzzy_match=true&api_key=${API_KEY}`;
      const searchRes = await fetch(searchUrl);
      
      if (!searchRes.ok) {
        console.log(`❌ Search failed for ${courseName} (Status: ${searchRes.status})`);
        continue;
      }
      
      const searchData = await searchRes.json();
      const firstResult = (searchData.courses || [])[0];
      
      if (!firstResult) {
        console.log(`⚠️ No matches found for "${courseName}". Skipping.`);
        continue;
      }

      console.log(`📥 Found match: ${firstResult.course_name || firstResult.club_name}. Fetching scorecard details...`);

      // Step 2: Fetch the full details (1 API Call)
      const detailsUrl = `${DIRECT_URL}/courses/${firstResult.id}?api_key=${API_KEY}`;
      const detailsRes = await fetch(detailsUrl);
      
      if (!detailsRes.ok) {
        console.log(`❌ Details fetch failed for ${firstResult.id} (Status: ${detailsRes.status})`);
        continue;
      }

      const detailsData = await detailsRes.json();
      const rawCourse = detailsData.course || detailsData;

      // Extract Tees
      const rawTees = [...(rawCourse.tees?.male || []), ...(rawCourse.tees?.female || [])];
      const mappedTees = rawTees.map((t, idx) => ({
        id: `${firstResult.id}-tee-${idx}`,
        name: t.tee_name || 'Standard',
        color: '#2563EB',
        rating: Number(t.course_rating) || 72.0,
        slope: Number(t.slope_rating) || 113,
        totalYardage: Number(t.total_yards) || 6000,
      }));

      // Extract Holes
      const sampleTeeWithHoles = rawTees.find(t => Array.isArray(t.holes) && t.holes.length > 0);
      const mappedHoles = sampleTeeWithHoles
        ? sampleTeeWithHoles.holes.map((h, i) => ({
            number: i + 1,
            par: Number(h.par) || 4,
            yardage: Number(h.yardage) || 350,
            handicapIndex: Number(h.handicap) || (i + 1),
          }))
        : Array.from({ length: 18 }, (_, i) => ({ number: i + 1, par: 4, yardage: 380, handicapIndex: i + 1 }));

      const cleanName = rawCourse.course_name || rawCourse.club_name || 'Unknown Course';
      const city = rawCourse.location?.city || 'Bay Area';

      const firestoreCourse = {
        id: firstResult.id,
        name: cleanName,
        city: city,
        region: 'Other', 
        notes: `Imported via targeted script on ${new Date().toLocaleDateString()}`,
        tees: mappedTees.length > 0 ? mappedTees : [{ id: `${firstResult.id}-default`, name: 'Main', color: '#2563EB', rating: 72, slope: 113, totalYardage: 6200 }],
        holes: mappedHoles,
      };

      // Step 3: Write to Firestore
      await setDoc(doc(db, "courses", firstResult.id), firestoreCourse);
      console.log(`✅ Successfully saved ${cleanName} to Firestore.`);

      // Pause for 1 second to avoid tripping rate limiters
      await new Promise(resolve => setTimeout(resolve, 1000));

    } catch (err) {
      console.error(`🚨 Error processing ${courseName}:`, err);
    }
  }

  console.log("\n🎯 Import complete!");
  process.exit(0);
}

runImport();
