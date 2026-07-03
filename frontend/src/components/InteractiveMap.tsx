import React, { useState, useRef } from 'react';
import { Employee, Coordinates } from '../types';
import { 
  MapPin, 
  Navigation, 
  Layers, 
  Compass, 
  Check, 
  Map as MapIcon,
  Smartphone,
  RefreshCw
} from 'lucide-react';

interface InteractiveMapProps {
  employees: Employee[];
  selectedEmployeeId: string | null;
  onSelectEmployee: (id: string | null) => void;
}

// Bounding box for San Francisco map projection
const LAT_MIN = 37.7350;
const LAT_MAX = 37.8150;
const LNG_MIN = -122.4650;
const LNG_MAX = -122.3850;

export const convertLatLngToXY = (lat: number, lng: number, width = 1000, height = 700) => {
  const x = ((lng - LNG_MIN) / (LNG_MAX - LNG_MIN)) * width;
  // SVG Y is top-to-bottom, Lat is bottom-to-top, so invert Y
  const y = (1 - (lat - LAT_MIN) / (LAT_MAX - LAT_MIN)) * height;
  return { x, y };
};

export const InteractiveMap: React.FC<InteractiveMapProps> = ({
  employees,
  selectedEmployeeId,
  onSelectEmployee,
}) => {
  const [mapMode, setMapMode] = useState<'svg' | 'google'>('svg');
  const [zoom, setZoom] = useState<number>(1.1);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 30, y: -10 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  
  const svgRef = useRef<SVGSVGElement>(null);
  const selectedEmp = employees.find(e => e.id === selectedEmployeeId);

  // Handle map panning
  const handleMouseDown = (e: React.MouseEvent<SVGSVGElement, MouseEvent>) => {
    if (e.button !== 0) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
  };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement, MouseEvent>) => {
    if (isDragging) {
      setPanOffset({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent<SVGSVGElement>) => {
    e.preventDefault();
    const zoomFactor = 1.1;
    let newZoom = zoom;
    if (e.deltaY < 0) {
      newZoom = Math.min(zoom * zoomFactor, 3.5);
    } else {
      newZoom = Math.max(zoom / zoomFactor, 0.7);
    }
    setZoom(newZoom);
  };

  const resetMap = () => {
    setZoom(1.1);
    setPanOffset({ x: 30, y: -10 });
  };

  // Google Maps fallback URL generator
  const getGoogleMapsUrl = () => {
    const defaultCenter = "37.7749,-122.4194";
    const center = selectedEmp && selectedEmp.lastLat && selectedEmp.lastLng
      ? `${selectedEmp.lastLat},${selectedEmp.lastLng}`
      : defaultCenter;
    
    // Check for API key
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    if (apiKey && apiKey !== "YOUR_API_KEY") {
      return `https://www.google.com/maps/embed/v1/search?key=${apiKey}&q=${center}&zoom=14`;
    }
    // Fallback beautiful embed when API key is missing
    return `https://maps.google.com/maps?q=${center}&z=14&output=embed`;
  };

  return (
    <div className="bg-slate-950 border border-slate-850 rounded-2xl overflow-hidden shadow-2xl h-[560px] relative flex flex-col">
      {/* Map Control Toolbar */}
      <div className="bg-slate-900 border-b border-slate-850 px-4 py-3 flex justify-between items-center z-10">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" />
          <span className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono">Live GIS Tracking Screen</span>
        </div>

        <div className="flex items-center gap-2">
          {/* Map Mode Selector */}
          <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setMapMode('svg')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                mapMode === 'svg' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>SF Vector Map</span>
            </button>
            <button
              onClick={() => setMapMode('google')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                mapMode === 'google' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              <MapIcon className="w-3.5 h-3.5" />
              <span>Live Google Map</span>
            </button>
          </div>

          <button 
            onClick={resetMap}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            title="Recenter Map"
          >
            <Compass className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Map Area */}
      <div className="flex-1 relative overflow-hidden select-none cursor-grab active:cursor-grabbing">
        {mapMode === 'google' ? (
          <div className="w-full h-full bg-slate-950">
            <iframe
              title="Google Map"
              src={getGoogleMapsUrl()}
              width="100%"
              height="100%"
              style={{ border: 0, filter: 'invert(90%) hue-rotate(180deg) contrast(120%)' }} // Dark style mapping
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer"
            />
            {/* Overlay detail panel for currently tracked target */}
            {selectedEmp && (
              <div className="absolute bottom-4 left-4 bg-slate-900/90 backdrop-blur border border-slate-800 p-3.5 rounded-xl text-xs max-w-xs shadow-2xl space-y-1">
                <p className="font-bold text-white flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-blue-400" />
                  Currently Tracking: {selectedEmp.name}
                </p>
                <p className="text-[10px] text-slate-400">Role: {selectedEmp.role}</p>
                <p className="text-[10px] text-slate-400 font-mono">
                  Coordinates: {selectedEmp.lastLat?.toFixed(5)}, {selectedEmp.lastLng?.toFixed(5)}
                </p>
                <p className="text-[9px] text-slate-500">
                  Last Updated: {selectedEmp.lastLocationUpdate ? new Date(selectedEmp.lastLocationUpdate).toLocaleTimeString() : 'N/A'}
                </p>
              </div>
            )}
          </div>
        ) : (
          /* SVG Offline/Sandbox Vector Map */
          <svg
            ref={svgRef}
            className="w-full h-full bg-slate-950"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onWheel={handleWheel}
          >
            {/* Ambient Background Grid lines */}
            <g opacity="0.05" stroke="#475569" strokeWidth="0.5">
              {Array.from({ length: 20 }).map((_, i) => (
                <line key={`v-${i}`} x1={i * 50} y1="0" x2={i * 50} y2="700" />
              ))}
              {Array.from({ length: 15 }).map((_, i) => (
                <line key={`h-${i}`} x1="0" y1={i * 50} x2="1000" y2={i * 50} />
              ))}
            </g>

            <g transform={`translate(${panOffset.x}, ${panOffset.y}) scale(${zoom})`}>
              {/* SF Peninsular landmass mockup */}
              <path
                d="M 150 650 Q 150 400 350 250 T 650 150 Q 800 150 850 250 T 900 650 Z"
                fill="#0f172a"
                stroke="#1e293b"
                strokeWidth="2"
              />

              {/* Major Roads/Sectors */}
              <g stroke="#334155" strokeWidth="1" opacity="0.4">
                {/* Market Street */}
                <line x1="300" y1="500" x2="800" y2="250" strokeWidth="3" />
                {/* Mission Street */}
                <line x1="280" y1="530" x2="820" y2="270" strokeWidth="1.5" />
                {/* Geary Blvd */}
                <line x1="200" y1="350" x2="700" y2="350" strokeWidth="2" />
                {/* Van Ness Avenue */}
                <line x1="550" y1="180" x2="550" y2="600" strokeWidth="2" />
                {/* Highway 101 */}
                <path d="M 450 650 Q 480 500 550 450 T 800 280" fill="none" strokeWidth="3" stroke="#475569" />
              </g>

              {/* Waterway / Golden Gate styling */}
              <text x="80" y="250" fill="#334155" fontSize="10" className="font-mono" opacity="0.3">PACIFIC OCEAN</text>
              <text x="750" y="550" fill="#334155" fontSize="10" className="font-mono" opacity="0.3">SAN FRANCISCO BAY</text>

              {/* Employee Markers */}
              {employees.map(emp => {
                if (!emp.lastLat || !emp.lastLng) return null;
                const { x, y } = convertLatLngToXY(emp.lastLat, emp.lastLng);
                const isSelected = selectedEmployeeId === emp.id;
                const isOnline = emp.status === 'ONLINE';

                return (
                  <g
                    key={emp.id}
                    transform={`translate(${x}, ${y})`}
                    className="cursor-pointer group"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectEmployee(emp.id);
                    }}
                  >
                    {/* Animated Pulsing target radar rings */}
                    {isOnline && (
                      <circle
                        r="18"
                        fill="none"
                        stroke={emp.role === 'RIDER' ? '#3b82f6' : '#10b981'}
                        strokeWidth="1"
                        className="animate-ping"
                        opacity="0.5"
                      />
                    )}

                    {/* Outer visual dot border */}
                    <circle
                      r={isSelected ? '9' : '7'}
                      fill={emp.role === 'RIDER' ? '#3b82f6' : '#10b981'}
                      className="transition-all duration-300 shadow-xl"
                      stroke="#0f172a"
                      strokeWidth="2"
                    />

                    {/* Inner glowing core dot */}
                    <circle
                      r="3"
                      fill="#ffffff"
                    />

                    {/* Tooltip & Floating text */}
                    <g transform="translate(0, -18)">
                      {/* Name Label Container */}
                      <rect
                        x="-45"
                        y="-10"
                        width="90"
                        height="18"
                        rx="4"
                        fill="#1e293b"
                        stroke={isSelected ? '#3b82f6' : '#334155'}
                        strokeWidth={isSelected ? '1.5' : '1'}
                        className="shadow-2xl"
                      />
                      <text
                        textAnchor="middle"
                        y="2"
                        fill="#f8fafc"
                        fontSize="8"
                        fontWeight="bold"
                        className="font-sans select-none"
                      >
                        {emp.name.split(' ')[0]} ({emp.role === 'RIDER' ? '🏍️' : '💼'})
                      </text>
                    </g>
                  </g>
                );
              })}
            </g>
          </svg>
        )}
      </div>

      {/* Map Footer status */}
      <div className="bg-slate-900 border-t border-slate-850 px-4 py-2 text-[10px] font-mono text-slate-400 flex justify-between items-center">
        <span>Lat range: [37.735, 37.815] • Lng range: [-122.465, -122.385]</span>
        <span className="flex items-center gap-1">
          <Smartphone className="w-3.5 h-3.5 text-blue-400" />
          {employees.filter(e => e.status === 'ONLINE').length} Active Devices transmitting
        </span>
      </div>
    </div>
  );
};
