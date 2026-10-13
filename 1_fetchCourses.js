import fs from 'fs/promises';

// 1. YOUR API KEY & TARGET COURSES
const API_KEY = 'YWVWXINIAUWWFIZ6NTKQOHOUNE'; // Paste your fresh API key here

// ⚠️ MAX 17 COURSES PER RUN (2 API calls used per course)
const TARGET_COURSES = [
  "San Ramon",
  "Poplar Creek",
  "Deep Cliff",
  "Los Lagos",
  "Tilden Park",
  "Mission Hills",
  // Add up to 9 more here...
];

const DIRECT_URL = 'https://api.golfcourseapi.com/v1';
const fetchOptions = {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${API_KEY}`,
    'x-api-key': API_KEY, 
    'Accept': 'application/json'
  }
};

// Helper function to create clean IDs (e.g., "Tilden Park Golf Course" -> "tilden-park")
function createSlug(name) {
  return name.toLowerCase()
    .replace(/\s+(golf|course|club|country|links)\b/gi, '') // Strip common words
    .replace(/[^a-z0-9]+/g, '-') // Replace spaces/special chars with hyphens
    .replace(/(^-|-$)/g, ''); // Remove leading/trailing hyphens
}

async function runFetch() {
  console.log(`Starting targeted import for ${TARGET_COURSES.length} courses...`);
  const coursesToSave = [];

  for (const courseName of TARGET_COURSES) {
    try {
      console.log(`\n🔍 Searching for: ${courseName}...`);
      
      const searchUrl = `${DIRECT_URL}/search?search_query=${encodeURIComponent(courseName)}&fuzzy_match=true`;
      const searchRes = await fetch(searchUrl, fetchOptions);
      
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

      const rawName = firstResult.course_name || firstResult.club_name || 'Unknown Course';
      console.log(`📥 Found match: ${rawName}. Fetching details...`);

      const detailsUrl = `${DIRECT_URL}/courses/${firstResult.id}`;
      const detailsRes = await fetch(detailsUrl, fetchOptions);
      
      if (!detailsRes.ok) {
        console.log(`❌ Details fetch failed for ${firstResult.id} (Status: ${detailsRes.status})`);
        continue;
      }

      const detailsData = await detailsRes.json();
      const rawCourse = detailsData.course || detailsData;

      const cleanName = rawCourse.course_name || rawCourse.club_name || 'Unknown Course';
      const city = rawCourse.location?.city || 'Bay Area';
      
      // Generate the clean slug ID
      const customId = createSlug(cleanName);

      // Extract Tees (using the new customId for tee IDs)
      const rawTees = [...(rawCourse.tees?.male || []), ...(rawCourse.tees?.female || [])];
      const mappedTees = rawTees.map((t, idx) => ({
        id: `${customId}-tee-${idx}`,
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

      const formattedCourse = {
        id: customId,
        name: cleanName,
        city: city,
        region: 'Other', 
        notes: `Imported via targeted script on ${new Date().toLocaleDateString()}`,
        tees: mappedTees.length > 0 ? mappedTees : [{ id: `${customId}-default`, name: 'Main', color: '#2563EB', rating: 72, slope: 113, totalYardage: 6200 }],
        holes: mappedHoles,
      };

      coursesToSave.push(formattedCourse);
      console.log(`✅ Successfully queued ${cleanName} as "${customId}"`);

      // Pause for 1.5 seconds to avoid tripping rate limiters
      await new Promise(resolve => setTimeout(resolve, 1500));

    } catch (err) {
      console.error(`🚨 Error processing ${courseName}:`, err);
    }
  }

  // Save everything to a local JSON file
  await fs.writeFile('downloaded_courses.json', JSON.stringify(coursesToSave, null, 2));
  console.log(`\n🎯 Complete! Saved ${coursesToSave.length} courses to downloaded_courses.json`);
  console.log(`Check the file to verify the data before uploading.`);
  process.exit(0);
}

runFetch();
