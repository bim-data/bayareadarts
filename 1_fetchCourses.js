import fs from 'fs/promises';

// 1. YOUR API KEY & TARGET COURSES
const API_KEY = 'YWVWXINIAUWWFIZ6NTKQOHOUNE'; // Paste your fresh API key here

// ⚠️ MAX 17 COURSES PER RUN (2 API calls used per course)
const TARGET_COURSES = [
  { name: "Los Lagos", location: "San Jose" },
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

// Helper: Create clean IDs (e.g., "Tilden Park Golf Course" -> "tilden-park")
function createSlug(name) {
  return name.toLowerCase()
    .replace(/\s+(golf|course|club|country|links)\b/gi, '') // Strip common words
    .replace(/[^a-z0-9]+/g, '-') // Replace spaces/special chars with hyphens
    .replace(/(^-|-$)/g, ''); // Remove leading/trailing hyphens
}

// Helper: Map tee names to Hex Colors
function getTeeColor(name) {
  const n = name.toLowerCase();
  if (n.includes('black')) return '#1E293B'; // Slate 800
  if (n.includes('blue')) return '#2563EB';  // Blue 600
  if (n.includes('white')) return '#F8FAFC'; // Slate 50
  if (n.includes('red')) return '#DC2626';   // Red 600
  if (n.includes('gold')) return '#D97706';  // Amber 600
  if (n.includes('yellow')) return '#FACC15';// Yellow 400
  if (n.includes('silver')) return '#94A3B8';// Slate 400
  if (n.includes('green')) return '#16A34A'; // Green 600
  if (n.includes('orange')) return '#EA580C';// Orange 600
  if (n.includes('purple')) return '#9333EA';// Purple 600
  if (n.includes('burgundy')) return '#881337'; // Rose 900
  if (n.includes('brown')) return '#78350F'; // Amber 900
  return '#94A3B8'; // Default Slate
}

async function runFetch() {
  console.log(`Starting targeted import for ${TARGET_COURSES.length} courses...`);
  const coursesToSave = [];

  for (const target of TARGET_COURSES) {
    try {
      // Check if it's an object or a plain string
      const isObject = typeof target === 'object';
      const targetName = isObject ? target.name : target;
      const targetCity = isObject && target.location ? target.location.toLowerCase().trim() : null;

      console.log(`\n🔍 Searching for: ${targetName}...`);
      
      // SEARCH API USING ONLY THE COURSE NAME
      const searchUrl = `${DIRECT_URL}/search?search_query=${encodeURIComponent(targetName)}&fuzzy_match=true`;
      const searchRes = await fetch(searchUrl, fetchOptions);
      
      if (!searchRes.ok) {
        console.log(`❌ Search failed for ${targetName} (Status: ${searchRes.status})`);
        continue;
      }
      
      const searchData = await searchRes.json();
      let match = null;

      // Filter by city if a location was provided
      if (targetCity && searchData.courses && searchData.courses.length > 0) {
        match = searchData.courses.find(c => 
          (c.location?.city || '').toLowerCase() === targetCity
        );
      } 
      
      // If no location was provided or we couldn't find an exact city match, fallback to the first result
      if (!match) {
        match = (searchData.courses || [])[0];
      }
      
      if (!match) {
        console.log(`⚠️ No matches found for "${targetName}". Skipping.`);
        continue;
      }

      const rawName = match.course_name || match.club_name || 'Unknown Course';
      console.log(`📥 Found match: ${rawName} (${match.location?.city || 'Unknown City'}). Fetching details...`);

      const detailsUrl = `${DIRECT_URL}/courses/${match.id}`;
      const detailsRes = await fetch(detailsUrl, fetchOptions);
      
      if (!detailsRes.ok) {
        console.log(`❌ Details fetch failed for ${match.id} (Status: ${detailsRes.status})`);
        continue;
      }

      const detailsData = await detailsRes.json();
      const rawCourse = detailsData.course || detailsData;

      const cleanName = rawCourse.course_name || rawCourse.club_name || 'Unknown Course';
      const city = rawCourse.location?.city || 'Bay Area';
      const customId = createSlug(cleanName);

      // Extract & Deduplicate Tees
      // The API returns men's and women's ratings separately. This Map ensures we only keep one entry per physical tee box.
      const rawTees = [...(rawCourse.tees?.male || []), ...(rawCourse.tees?.female || [])];
      const uniqueTeesMap = new Map();
      
      rawTees.forEach(t => {
        const tName = t.tee_name || 'Standard';
        if (!uniqueTeesMap.has(tName)) {
          uniqueTeesMap.set(tName, t);
        }
      });

      const uniqueTees = Array.from(uniqueTeesMap.values());
      
      const mappedTees = uniqueTees.map((t, idx) => ({
        id: `${customId}-tee-${idx}`,
        name: t.tee_name || 'Standard',
        color: getTeeColor(t.tee_name || ''),
        rating: Number(t.course_rating) || 72.0,
        slope: Number(t.slope_rating) || 113,
        totalYardage: Number(t.total_yards) || 6000,
      }));

      // Extract Holes
      const sampleTeeWithHoles = uniqueTees.find(t => Array.isArray(t.holes) && t.holes.length > 0);
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
      console.error(`🚨 Error processing ${target}:`, err);
    }
  }

  // Save everything to a local JSON file
  await fs.writeFile('downloaded_courses.json', JSON.stringify(coursesToSave, null, 2));
  console.log(`\n🎯 Complete! Saved ${coursesToSave.length} courses to downloaded_courses.json`);
  console.log(`Check the file to verify the data before uploading.`);
  process.exit(0);
}

runFetch();