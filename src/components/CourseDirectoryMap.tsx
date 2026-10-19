import React, { useEffect, useRef } from 'react';
import { Course } from '../types';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Navigation } from 'lucide-react';

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

// Region fallback centers
const REGION_CENTERS: Record<string, [number, number]> = {
  'SF': [37.7749, -122.4194],
  'Peninsula': [37.51, -122.28],
  'East Bay': [37.78, -121.98],
  'South Bay': [37.33, -121.90],
  'North Bay': [38.10, -122.45],
  'Other': [37.70, -122.10],
};

function getDeterministicOffset(id: string): [number, number] {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash << 5) - hash + id.charCodeAt(i);
    hash |= 0;
  }
  const latOffset = ((hash % 100) / 100) * 0.02 - 0.01;
  const lngOffset = (((hash >> 4) % 100) / 100) * 0.02 - 0.01;
  return [latOffset, lngOffset];
}

export function getCourseCoordinates(course: Course): [number, number] {
  if (course.latitude && course.longitude) {
    return [course.latitude, course.longitude];
  }

  const cleanCity = course.city ? course.city.trim().toLowerCase() : '';
  if (CITY_COORDINATES[cleanCity]) {
    const base = CITY_COORDINATES[cleanCity];
    const offset = getDeterministicOffset(course.id || course.name);
    return [base[0] + offset[0], base[1] + offset[1]];
  }

  // Fallback by region
  const regCenter = REGION_CENTERS[course.region] || [37.70, -122.10];
  const offset = getDeterministicOffset(course.id || course.name);
  return [regCenter[0] + offset[0], regCenter[1] + offset[1]];
}

interface CourseDirectoryMapProps {
  courses: Course[];
  onSelectCourse: (course: Course) => void;
  selectedCourseId?: string | null;
}

export const CourseDirectoryMap: React.FC<CourseDirectoryMapProps> = ({
  courses,
  onSelectCourse,
  selectedCourseId,
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      // Default center: Bay Area
      const map = L.map(mapContainerRef.current, {
        center: [37.60, -122.15],
        zoom: 9,
        zoomControl: false,
        attributionControl: false,
      });

      // Add zoom control top-right
      L.control.zoom({ position: 'topright' }).addTo(map);

      // CartoDB Dark Matter tiles (matching dark golf UI theme)
      L.tileLayer(
        'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
        {
          maxZoom: 19,
          subdomains: 'abcd',
        }
      ).addTo(map);

      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;

    // Clear existing markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    if (courses.length === 0) return;

    const bounds = L.latLngBounds([]);

    courses.forEach((course) => {
      const coords = getCourseCoordinates(course);
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

      // Popup Content
      const popupHtml = document.createElement('div');
      popupHtml.className = 'p-1 text-slate-900';
      popupHtml.innerHTML = `
        <div style="font-family: inherit; min-width: 180px;">
          <div style="font-weight: 800; font-size: 13px; line-height: 1.2; margin-bottom: 3px; color: #0f172a;">
            ${course.name}
          </div>
          <div style="font-size: 11px; color: #64748b; margin-bottom: 6px;">
            ${course.city}${course.state ? `, ${course.state}` : ''} · <b>${course.region}</b>
          </div>
          ${course.address ? `<div style="font-size: 10px; color: #94a3b8; margin-bottom: 6px;">${course.address}</div>` : ''}
          <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 6px; padding-top: 6px; border-top: 1px solid #e2e8f0;">
            <span style="font-size: 10px; font-weight: 700; color: #059669;">${course.tees.length} Tees · ${course.holes.length}H</span>
            <button id="view-course-btn-${course.id}" style="
              background: #059669;
              color: white;
              font-size: 10px;
              font-weight: 700;
              padding: 4px 8px;
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

      // If user clicks the marker itself, also trigger course selection or open popup
      marker.on('click', () => {
        marker.openPopup();
      });

      markersRef.current.push(marker);
      bounds.extend(coords);
    });

    if (courses.length > 0) {
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 12 });
    }

    // Force map size refresh after render
    setTimeout(() => {
      map.invalidateSize();
    }, 150);

  }, [courses, selectedCourseId, onSelectCourse]);

  return (
    <div className="relative w-full h-[460px] rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-900 shadow-inner">
      <div ref={mapContainerRef} className="w-full h-full z-0" />
      
      {/* Map Header Floating Overlay */}
      <div className="absolute top-3 left-3 z-10 bg-slate-900/90 backdrop-blur-md border border-slate-700/60 rounded-xl px-3 py-1.5 shadow-lg flex items-center gap-2 pointer-events-none">
        <Navigation className="w-3.5 h-3.5 text-emerald-400" />
        <span className="text-xs font-bold text-white">
          {courses.length} {courses.length === 1 ? 'Course' : 'Courses'} Mapped
        </span>
      </div>

      {/* Helpful Hint Overlay */}
      <div className="absolute bottom-3 left-3 z-10 bg-slate-900/80 backdrop-blur-xs border border-slate-800 rounded-lg px-2.5 py-1 text-[10px] text-slate-400 pointer-events-none flex items-center gap-1.5">
        <MapPin className="w-3 h-3 text-emerald-400" />
        <span>Click pin to view scorecard</span>
      </div>
    </div>
  );
};
