import { Course, TeeBox, HoleInfo } from '../types';

// Replace with your actual GolfCourseAPI key
const API_KEY = 'YWVWXINIAUWWFIZ6NTKQOHOUNE';
const DIRECT_URL = 'https://api.golfcourseapi.com/v1';

// CORS Proxy wrapper to pass custom headers from browser client-side code
const BASE_URL = `https://corsproxy.io/?${encodeURIComponent(DIRECT_URL)}`;

export interface ApiSearchResult {
  id: string;
  club_name: string;
  course_name: string;
  location: {
    address?: string;
    city?: string;
    state?: string;
    country?: string;
  };
}

/**
 * Search GolfCourseAPI for a course or club by name
 */
export async function searchExternalCourses(query: string): Promise<ApiSearchResult[]> {
  if (!query.trim()) return [];

  try {
    const searchTarget = `${DIRECT_URL}/search?search_query=${encodeURIComponent(query)}&fuzzy_match=true`;
    const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(searchTarget)}`;
    
    const res = await fetch(proxyUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Key ${API_KEY}`,
        'Accept': 'application/json',
      },
    });

    if (!res.ok) {
      if (res.status === 401) throw new Error('Invalid API Key. Please verify your GolfCourseAPI key.');
      if (res.status === 429) throw new Error('Daily API rate limit reached (35 requests/day).');
      throw new Error(`API error (${res.status}): ${res.statusText}`);
    }

    const data = await res.json();
    return data.courses || [];
  } catch (err: any) {
    console.error('Error searching GolfCourseAPI:', err);
    throw err;
  }
}

/**
 * Fetch detailed tee box & hole information for a specific course by ID
 */
export async function fetchExternalCourseDetails(courseId: string): Promise<Course> {
  try {
    const courseTarget = `${DIRECT_URL}/courses/${courseId}`;
    const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(courseTarget)}`;

    const res = await fetch(proxyUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Key ${API_KEY}`,
        'Accept': 'application/json',
      },
    });

    if (!res.ok) throw new Error(`Failed to fetch course details: ${res.statusText}`);

    const data = await res.json();
    const rawCourse = data.course || data;

    // Combine male & female tees
    const rawTees = [
      ...(rawCourse.tees?.male || []),
      ...(rawCourse.tees?.female || []),
    ];

    const mappedTees: TeeBox[] = rawTees.map((t: any, idx: number) => ({
      id: `${courseId}-tee-${idx}`,
      name: t.tee_name || 'Standard',
      color: getTeeHexColor(t.tee_name),
      rating: Number(t.course_rating) || 72.0,
      slope: Number(t.slope_rating) || 113,
      totalYardage: Number(t.total_yards) || 6000,
    }));

    // Find sample tee containing hole details
    const sampleTeeWithHoles = rawTees.find((t: any) => Array.isArray(t.holes) && t.holes.length > 0);

    const mappedHoles: HoleInfo[] = sampleTeeWithHoles
      ? sampleTeeWithHoles.holes.map((h: any, i: number) => ({
          number: i + 1,
          par: Number(h.par) || 4,
          yardage: Number(h.yardage) || 350,
          handicapIndex: Number(h.handicap) || (i + 1),
        }))
      : Array.from({ length: 18 }, (_, i) => ({
          number: i + 1,
          par: 4,
          yardage: 380,
          handicapIndex: i + 1,
        }));

    const cleanName = rawCourse.course_name || rawCourse.club_name || 'Unknown Course';
    const city = rawCourse.location?.city 
      ? `${rawCourse.location.city}${rawCourse.location.state ? `, ${rawCourse.location.state}` : ''}`
      : 'Bay Area, CA';

    return {
      id: courseId,
      name: cleanName,
      city,
      region: deriveRegionFromState(rawCourse.location?.state, city),
      notes: `Imported via GolfCourseAPI (${rawCourse.location?.address || 'Official Directory'}).`,
      tees: mappedTees.length > 0 ? mappedTees : [{
        id: `${courseId}-default`,
        name: 'Main',
        color: '#2563EB',
        rating: 72.0,
        slope: 113,
        totalYardage: 6200
      }],
      holes: mappedHoles,
    };
  } catch (err: any) {
    console.error('Error fetching GolfCourseAPI course details:', err);
    throw err;
  }
}

function getTeeHexColor(name: string = ''): string {
  const lower = name.toLowerCase();
  if (lower.includes('black') || lower.includes('champ')) return '#141413';
  if (lower.includes('blue') || lower.includes('tour')) return '#2563EB';
  if (lower.includes('white') || lower.includes('mem')) return '#E5E7EB';
  if (lower.includes('gold') || lower.includes('yellow')) return '#F59E0B';
  if (lower.includes('red') || lower.includes('forw')) return '#DC2626';
  if (lower.includes('green') || lower.includes('jade')) return '#10B981';
  return '#9CA3AF';
}

function deriveRegionFromState(state?: string, city?: string): 'SF' | 'East Bay' | 'Peninsula' | 'North Bay' | 'South Bay' | 'Other' {
  if (state && state !== 'CA') return 'Other';
  const c = (city || '').toLowerCase();
  if (c.includes('san francisco')) return 'SF';
  if (c.includes('oakland') || c.includes('alameda') || c.includes('livermore') || c.includes('walnut creek') || c.includes('pleasanton') || c.includes('castro valley') || c.includes('san ramon')) return 'East Bay';
  if (c.includes('palo alto') || c.includes('burlingame') || c.includes('half moon bay') || c.includes('pacifica')) return 'Peninsula';
  if (c.includes('san rafael') || c.includes('novato') || c.includes('napa') || c.includes('sonoma')) return 'North Bay';
  if (c.includes('san jose') || c.includes('morgan hill') || c.includes('milpitas') || c.includes('sunnyvale')) return 'South Bay';
  return 'Other';
}
