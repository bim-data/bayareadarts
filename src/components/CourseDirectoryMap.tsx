import React, { useEffect, useRef, useState } from 'react';
import { Course } from '../types';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Navigation, RefreshCw } from 'lucide-react';
import { normalizeRegionName } from './CourseLibraryModal';

// Exact known coordinates for Northern California / Bay Area golf courses and addresses
const KNOWN_COURSE_COORDINATES: Record<string, [number, number]> = {
  // Santa Teresa
  'santa teresa': [37.21986, -121.77671],
  '260 bernal rd': [37.21986, -121.77671],
  '260 bernal rd, san jose, ca 95119': [37.21986, -121.77671],

  // Baylands
  'baylands': [37.4518, -122.1156],
  '1875 embarcadero rd': [37.4518, -122.1156],

  // Boundary Oak
  'boundary oak': [37.9255, -121.9961],
  '3800 valley vista rd': [37.9255, -121.9961],

  // Callippe Preserve
  'callippe preserve': [37.6256, -121.8687],
  '8500 clubhouse dr': [37.6256, -121.8687],

  // Canyon Lakes
  'canyon lakes': [37.7656, -121.9678],
  '640 bollinger canyon way': [37.7656, -121.9678],

  // Cinnabar Hills
  'cinnabar hills': [37.1685, -121.785],
  '23600 mckean rd': [37.1685, -121.785],

  // Corica Park
  'corica park': [37.741, -122.2475],
  '1 clubhouse memorial dr': [37.741, -122.2475],

  // Metropolitan
  'metropolitan': [37.7145, -122.2085],
  '10051 doolittle dr': [37.7145, -122.2085],

  // Sunken Gardens
  'sunken gardens': [37.3582, -122.0142],
  '1010 s wolfe rd': [37.3582, -122.0142],

  // Sunnyvale
  'sunnyvale golf': [37.3972, -122.0298],
  '605 macara ave': [37.3972, -122.0298],

  // Pruneridge
  'pruneridge': [37.3512, -121.979],
  '400 n saratoga ave': [37.3512, -121.979],

  // Los Lagos
  'los lagos': [37.309, -121.8385],
  '2995 tuers rd': [37.309, -121.8385],

  // San Jose Muni
  'san jose municipal': [37.3685, -121.898],
  '1560 n 4th st': [37.3685, -121.898],

  // Shoreline
  'shoreline golf links': [37.432, -122.088],
  '2940 n shoreline blvd': [37.432, -122.088],

  // Poplar Creek
  'poplar creek': [37.584, -122.321],
  '1700 coyote point dr': [37.584, -122.321],

  // Crystal Springs
  'crystal springs': [37.5458, -122.3615],
  '6650 golf course dr': [37.5458, -122.3615],

  // Presidio
  'presidio golf': [37.7905, -122.4635],
  '300 finley rd': [37.7905, -122.4635],

  // Lincoln Park
  'lincoln park': [37.7852, -122.4988],
  '300 34th ave': [37.7852, -122.4988],

  // TPC Harding Park
  'harding park': [37.7245, -122.4935],
  '99 harding rd': [37.7245, -122.4935],

  // Sharp Park
  'sharp park': [37.6225, -122.4925],

  // Half Moon Bay
  'half moon bay': [37.4335, -122.4385],
  '2 miramontes point rd': [37.4335, -122.4385],

  // Pasatiempo
  'pasatiempo': [37.0005, -122.0285],
  '20 clubhouse rd': [37.0005, -122.0285],

  // Poppy Ridge
  'poppy ridge': [37.6435, -121.7015],
  '4280 greenville rd': [37.6435, -121.7015],

  // The Bridges
  'the bridges': [37.7475, -121.9425],
  '9000 s gale ridge rd': [37.7475, -121.9425],

  // Dublin Ranch
  'dublin ranch': [37.7265, -121.8845],
  '5900 signal hill dr': [37.7265, -121.8845],

  // Monarch Bay
  'monarch bay': [37.697, -122.182],
  '13800 monarch bay dr': [37.697, -122.182],

  // Lake Chabot
  'lake chabot': [37.755, -122.128],
  '11450 golf links rd': [37.755, -122.128],

  // Tilden Park
  'tilden park': [37.8965, -122.247],
  'grizzly peak blvd': [37.8965, -122.247],

  // Redwood Canyon
  'redwood canyon': [37.732, -122.068],
  '17007 redwood rd': [37.732, -122.068],

  // Diablo Creek
  'diablo creek': [37.994, -122.028],
  '4050 port chicago hwy': [37.994, -122.028],

  // Blue Rock Springs
  'blue rock springs': [38.125, -122.215],
  '655 columbus pkwy': [38.125, -122.215],

  // Hiddenbrooke
  'hiddenbrooke': [38.188, -122.185],
  '1095 hiddenbrooke pkwy': [38.188, -122.185],

  // Eagle Vines
  'eagle vines': [38.225, -122.248],
  '580 s kelly rd': [38.225, -122.248],

  // Chardonnay
  'chardonnay': [38.219, -122.235],
  '2555 jameson canyon rd': [38.219, -122.235],

  // Coyote Creek
  'coyote creek': [37.195, -121.688],
  '1 coyote creek golf dr': [37.195, -121.688],

  // Monterey / Pebble Beach / Santa Cruz
  'poppy hills': [36.5878, -121.936],
  'pebble beach': [36.5684, -121.9486],
  'spyglass hill': [36.586, -121.961],
  'del monte': [36.593, -121.868],
  'bayonet': [36.634, -121.815],
  'black horse': [36.634, -121.815],
  'pacific grove': [36.629, -121.932],
  'quail lodge': [36.536, -121.848],
  'carmel valley': [36.518, -121.805],
  'de laveaga': [36.996, -122.001],
  'seascape': [36.966, -121.868],
};

// City coordinates dictionary covering the Bay Area & Northern California
const CITY_COORDINATES: Record<string, [number, number]> = {
  'palo alto': [37.4419, -122.143],
  'walnut creek': [37.9101, -122.0652],
  'pleasanton': [37.6624, -121.8747],
  'san ramon': [37.7799, -121.978],
  'san jose': [37.3382, -121.8863],
  'sunnyvale': [37.3688, -122.0363],
  'santa clara': [37.3541, -121.9552],
  'mountain view': [37.3861, -122.0839],
  'san mateo': [37.563, -122.3255],
  'redwood city': [37.4852, -122.2364],
  'san francisco': [37.7749, -122.4194],
  'oakland': [37.8044, -122.2712],
  'berkeley': [37.8715, -122.273],
  'alameda': [37.7652, -122.2416],
  'hayward': [37.6688, -122.0808],
  'fremont': [37.5485, -121.9886],
  'livermore': [37.6819, -121.768],
  'dublin': [37.7022, -121.9358],
  'half moon bay': [37.4636, -122.4286],
  'pacifica': [37.6138, -122.4869],
  'santa cruz': [36.9741, -122.0308],
  'monterey': [36.6002, -121.8947],
  'pebble beach': [36.5684, -121.9486],
  'carmel': [36.5552, -121.9233],
  'napa': [38.2975, -122.2869],
  'sonoma': [38.2919, -122.458],
  'vallejo': [38.1041, -122.2566],
  'fairfield': [38.2494, -122.04],
  'concord': [37.978, -122.0311],
  'martinez': [37.9971, -122.1341],
  'danville': [37.8216, -122.0],
  'san rafael': [37.9735, -122.5311],
  'novato': [38.1074, -122.5697],
  'mill valley': [37.906, -122.545],
  'gilroy': [37.0058, -121.5683],
  'morgan hill': [37.1305, -121.6544],
  'brentwood': [37.9319, -121.696],
  'antioch': [37.9974, -121.8058],
  'milpitas': [37.4323, -121.8996],
  'los altos': [37.3852, -122.1141],
  'menlo park': [37.4529, -122.1817],
  'burlingame': [37.5779, -122.3639],
  'south san francisco': [37.6547, -122.4077],
  'daly city': [37.6879, -122.4702],
  'san bruno': [37.6305, -122.4111],
  'foster city': [37.5585, -122.2711],
  'belmont': [37.5202, -122.2758],
  'san carlos': [37.5072, -122.2605],
  'stanford': [37.4241, -122.1661],
  'castro valley': [37.6941, -122.0863],
  'san leandro': [37.7249, -122.1561],
  'union city': [37.5934, -122.0439],
  'newark': [37.5297, -122.04],
  'richmond': [37.9358, -122.3477],
  'el cerrito': [37.9158, -122.3116],
  'pleasant hill': [37.948, -122.0608],
  'moraga': [37.8349, -122.1297],
  'orinda': [37.8771, -122.1797],
  'lafayette': [37.8938, -122.118],
  'vacaville': [38.3566, -121.9877],
  'davis': [38.5449, -121.7405],
  'sacramento': [38.5816, -121.4944],
  'roseville': [38.7521, -121.288],
  'santa rosa': [38.4404, -122.7141],
  'petaluma': [38.2324, -122.6367],
};

const REGION_CENTERS: Record<string, [number, number]> = {
  'SF': [37.7749, -122.4194],
  'Peninsula': [37.51, -122.28],
  'East Bay': [37.78, -121.98],
  'South Bay': [37.33, -121.9],
  'North Bay': [38.1, -122.45],
  'Santa Cruz': [36.9741, -122.0308],
  'Monterey': [36.6002, -121.8947],
  'Other': [37.7, -122.1],
};

function getDeterministicOffset(id: string): [number, number] {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash << 5) - hash + id.charCodeAt(i);
    hash |= 0;
  }
  const latOffset = ((hash % 100) / 100) * 0.015 - 0.0075;
  const lngOffset = (((hash >> 4) % 100) / 100) * 0.015 - 0.0075;
  return [latOffset, lngOffset];
}

// Check local storage geocode cache
function getCachedGeocode(query: string): [number, number] | null {
  try {
    const raw = localStorage.getItem('bad_geocoded_courses_cache');
    if (!raw) return null;
    const cache = JSON.parse(raw);
    const key = query.trim().toLowerCase();
    if (cache[key]) {
      return [cache[key].lat, cache[key].lng];
    }
  } catch {
    // Ignore cache parse error
  }
  return null;
}

function setCachedGeocode(query: string, lat: number, lng: number) {
  try {
    const raw = localStorage.getItem('bad_geocoded_courses_cache');
    const cache = raw ? JSON.parse(raw) : {};
    const key = query.trim().toLowerCase();
    cache[key] = { lat, lng, time: Date.now() };
    localStorage.setItem('bad_geocoded_courses_cache', JSON.stringify(cache));
  } catch {
    // Ignore storage write error
  }
}

export function getCourseCoordinates(
  course: Course,
  dynamicCoords?: Record<string, [number, number]>
): [number, number] {
  // 1. Explicit course coordinates from database
  if (course.latitude && course.longitude) {
    return [course.latitude, course.longitude];
  }

  // 2. Dynamic geocoded coordinates in memory
  if (dynamicCoords && dynamicCoords[course.id]) {
    return dynamicCoords[course.id];
  }

  // 3. Known Course / Address lookup
  const nameKey = (course.name || '').trim().toLowerCase();
  for (const [key, coords] of Object.entries(KNOWN_COURSE_COORDINATES)) {
    if (nameKey.includes(key)) {
      return coords;
    }
  }

  if (course.address) {
    const addrKey = course.address.trim().toLowerCase();
    for (const [key, coords] of Object.entries(KNOWN_COURSE_COORDINATES)) {
      if (addrKey.includes(key)) {
        return coords;
      }
    }

    // 4. Cached geocode
    const cached = getCachedGeocode(course.address);
    if (cached) return cached;
  }

  // 5. City-level coordinates fallback
  let cleanCity = (course.city || '').trim().toLowerCase();
  // Strip trailing state like ", ca"
  cleanCity = cleanCity.replace(/,\s*ca$/, '').replace(/,\s*california$/, '').trim();

  if (CITY_COORDINATES[cleanCity]) {
    const base = CITY_COORDINATES[cleanCity];
    const offset = getDeterministicOffset(course.id || course.name);
    return [base[0] + offset[0], base[1] + offset[1]];
  }

  // 6. Region fallback
  const regCenter = REGION_CENTERS[course.region] || [37.7, -122.1];
  const offset = getDeterministicOffset(course.id || course.name);
  return [regCenter[0] + offset[0], regCenter[1] + offset[1]];
}

interface CourseDirectoryMapProps {
  courses: Course[];
  onSelectCourse: (course: Course) => void;
  selectedCourseId?: string | null;
  onUpdateCourseCoords?: (courseId: string, lat: number, lng: number) => void;
}

export const CourseDirectoryMap: React.FC<CourseDirectoryMapProps> = ({
  courses,
  onSelectCourse,
  selectedCourseId,
  onUpdateCourseCoords,
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const [dynamicCoords, setDynamicCoords] = useState<Record<string, [number, number]>>({});
  const [isGeocoding, setIsGeocoding] = useState(false);

  // Background geocoding for courses with addresses that don't have exact coordinates yet
  useEffect(() => {
    let isCancelled = false;

    const geocodeAddresses = async () => {
      const coursesToGeocode = courses.filter((c) => {
        if (c.latitude && c.longitude) return false;
        if (!c.address || c.address.trim().length < 5) return false;
        if (dynamicCoords[c.id]) return false;
        return true;
      });

      if (coursesToGeocode.length === 0) return;

      setIsGeocoding(true);

      for (const course of coursesToGeocode) {
        if (isCancelled) break;

        const fullQuery = `${course.address}, ${course.city}, ${course.state || 'CA'}`;
        const cached = getCachedGeocode(fullQuery) || getCachedGeocode(course.address!);

        if (cached) {
          setDynamicCoords((prev) => ({ ...prev, [course.id]: cached }));
          if (onUpdateCourseCoords) {
            onUpdateCourseCoords(course.id, cached[0], cached[1]);
          }
          continue;
        }

        try {
          // Query our backend Nominatim proxy
          const res = await fetch(`/api/geocode?q=${encodeURIComponent(fullQuery)}`);
          if (res.ok) {
            const data = await res.json();
            if (data.lat && data.lng) {
              setCachedGeocode(fullQuery, data.lat, data.lng);
              setCachedGeocode(course.address!, data.lat, data.lng);
              setDynamicCoords((prev) => ({ ...prev, [course.id]: [data.lat, data.lng] }));
              if (onUpdateCourseCoords) {
                onUpdateCourseCoords(course.id, data.lat, data.lng);
              }
            }
          }
        } catch (err) {
          console.warn(`Could not geocode ${course.name}:`, err);
        }

        // Small delay to respect Nominatim rate limit (1 req/sec)
        await new Promise((r) => setTimeout(r, 600));
      }

      if (!isCancelled) setIsGeocoding(false);
    };

    geocodeAddresses();

    return () => {
      isCancelled = true;
    };
  }, [courses]);

  // Render & update Leaflet markers
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      // Default center: Bay Area
      const map = L.map(mapContainerRef.current, {
        center: [37.6, -122.15],
        zoom: 9,
        zoomControl: false,
        attributionControl: false,
      });

      // Add zoom control top-right
      L.control.zoom({ position: 'topright' }).addTo(map);

      // OpenStreetMap standard tiles (open, free, no API key required)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(map);

      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;

    // Clear existing markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    if (courses.length === 0) return;

    const bounds = L.latLngBounds([]);

    courses.forEach((course) => {
      const coords = getCourseCoordinates(course, dynamicCoords);
      const isSelected = course.id === selectedCourseId;

      // Custom HTML Pin icon
      const customIcon = L.divIcon({
        className: 'custom-course-marker',
        html: `
          <div style="
            display: flex;
            align-items: center;
            justify-content: center;
            width: ${isSelected ? '36px' : '28px'};
            height: ${isSelected ? '36px' : '28px'};
            background: ${isSelected ? '#10b981' : '#0f4d33'};
            color: #ffffff;
            border-radius: 9999px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.45);
            border: 2px solid ${isSelected ? '#ffffff' : '#34d399'};
            cursor: pointer;
            transition: all 0.2s ease;
          ">
            <svg width="${isSelected ? '18' : '14'}" height="${isSelected ? '18' : '14'}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/>
              <line x1="4" x2="4" y1="22" y2="15"/>
            </svg>
          </div>
        `,
        iconSize: [isSelected ? 36 : 28, isSelected ? 36 : 28],
        iconAnchor: [isSelected ? 18 : 14, isSelected ? 18 : 14],
        popupAnchor: [0, isSelected ? -20 : -16],
      });

      const marker = L.marker(coords, { icon: customIcon }).addTo(map);

      // Clean city and state formatting (prevents "San Jose, CA, CA")
      const cleanCity = (course.city || '').trim();
      const cleanState = (course.state || 'CA').trim();
      const cityDisplay = cleanCity.toLowerCase().includes(cleanState.toLowerCase())
        ? cleanCity
        : `${cleanCity}, ${cleanState}`;

      // Popup Content
      const popupHtml = document.createElement('div');
      popupHtml.className = 'p-1 text-slate-900';
      popupHtml.innerHTML = `
        <div style="font-family: inherit; min-width: 190px;">
          <div style="font-weight: 800; font-size: 13px; line-height: 1.25; margin-bottom: 3px; color: #0f172a;">
            ${course.name}
          </div>
          <div style="font-size: 11px; color: #64748b; margin-bottom: 4px;">
            ${cityDisplay} · <b>${normalizeRegionName(course.region)}</b>
          </div>
          ${
            course.address
              ? `<div style="font-size: 10px; color: #475569; margin-bottom: 6px; line-height: 1.3;">📍 ${course.address}</div>`
              : ''
          }
          <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 6px; padding-top: 6px; border-top: 1px solid #e2e8f0;">
            <span style="font-size: 10px; font-weight: 700; color: #059669;">${course.tees.length} Tees · ${course.holes.length}H</span>
            <button id="view-course-btn-${course.id}" style="
              background: #059669;
              color: white;
              font-size: 10px;
              font-weight: 700;
              padding: 4px 10px;
              border-radius: 6px;
              border: none;
              cursor: pointer;
            ">View Course</button>
          </div>
        </div>
      `;

      // Bind click on view button inside popup
      popupHtml.querySelector(`#view-course-btn-${course.id}`)?.addEventListener('click', (e) => {
        e.stopPropagation();
        onSelectCourse(course);
      });

      marker.bindPopup(popupHtml);

      // If user clicks the marker itself, open popup
      marker.on('click', () => {
        marker.openPopup();
      });

      markersRef.current.push(marker);
      bounds.extend(coords);
    });

    if (courses.length > 0) {
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 13 });
    }

    setTimeout(() => {
      map.invalidateSize();
    }, 150);
  }, [courses, selectedCourseId, onSelectCourse, dynamicCoords]);

  return (
    <div className="relative w-full h-[460px] rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-900 shadow-inner">
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Map Header Floating Overlay */}
      <div className="absolute top-3 left-3 z-10 bg-slate-900/90 backdrop-blur-md border border-slate-700/60 rounded-xl px-3 py-1.5 shadow-lg flex items-center gap-2 pointer-events-none">
        <Navigation className="w-3.5 h-3.5 text-emerald-400" />
        <span className="text-xs font-bold text-white">
          {courses.length} {courses.length === 1 ? 'Course' : 'Courses'} Mapped
        </span>
        {isGeocoding && (
          <span className="flex items-center gap-1 text-[10px] text-emerald-400/90 pl-1 border-l border-slate-700">
            <RefreshCw className="w-2.5 h-2.5 animate-spin" />
            <span>Resolving pins...</span>
          </span>
        )}
      </div>

      {/* Helpful Hint Overlay */}
      <div className="absolute bottom-3 left-3 z-10 bg-slate-900/80 backdrop-blur-xs border border-slate-800 rounded-lg px-2.5 py-1 text-[10px] text-slate-400 pointer-events-none flex items-center gap-1.5">
        <MapPin className="w-3 h-3 text-emerald-400" />
        <span>Click pin to view scorecard</span>
      </div>

      {/* Subtle OSM attribution in corner */}
      <div className="absolute bottom-2 right-2 z-10 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xs rounded px-1.5 py-0.5 text-[9px] text-slate-500 pointer-events-none">
        © OpenStreetMap contributors
      </div>
    </div>
  );
};
