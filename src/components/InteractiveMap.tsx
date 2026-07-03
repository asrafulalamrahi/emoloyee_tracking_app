import React, { useState, useRef, useEffect } from 'react';
import { 
  Employee, 
  Geofence, 
  Customer, 
  Coordinates, 
  GeofenceType,
  EmployeeStatus 
} from '../types';
import { 
  MapPin, 
  Navigation, 
  Info, 
  ShieldAlert, 
  Plus, 
  Layers, 
  Shield, 
  Sparkles, 
  CloudRain, 
  Wind, 
  Thermometer, 
  Compass, 
  Check, 
  X,
  Map as MapIcon,
  AlertTriangle
} from 'lucide-react';

interface InteractiveMapProps {
  employees: Employee[];
  geofences: Geofence[];
  customers: Customer[];
  selectedEmployeeId: string | null;
  onSelectEmployee: (id: string | null) => void;
  activeRoutePath?: Coordinates[];
  playbackIndex?: number;
  onMapClick?: (coords: Coordinates) => void;
  isAddingGeofence?: boolean;
  onAddGeofenceClick?: (coords: Coordinates) => void;
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

export const convertXYToLatLng = (x: number, y: number, width = 1000, height = 700) => {
  const lng = (x / width) * (LNG_MAX - LNG_MIN) + LNG_MIN;
  const lat = (1 - y / height) * (LAT_MAX - LAT_MIN) + LAT_MIN;
  return { lat, lng };
};

// Distance calculation helper (Haversine formula in km)
const calculateDistanceKm = (c1: Coordinates, c2: Coordinates) => {
  const R = 6371; // Earth's radius in km
  const dLat = (c2.lat - c1.lat) * Math.PI / 180;
  const dLng = (c2.lng - c1.lng) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(c1.lat * Math.PI / 180) * Math.cos(c2.lat * Math.PI / 180) * 
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

export const InteractiveMap: React.FC<InteractiveMapProps> = ({
  employees,
  geofences,
  customers,
  selectedEmployeeId,
  onSelectEmployee,
  activeRoutePath,
  playbackIndex = -1,
  onMapClick,
  isAddingGeofence = false,
  onAddGeofenceClick,
}) => {
  // GIS Layer State
  const [mapStyle, setMapStyle] = useState<'street' | 'satellite' | 'hybrid' | 'terrain' | 'dark'>('dark');
  const [showWeather, setShowWeather] = useState<boolean>(true);
  const [showTraffic, setShowTraffic] = useState<boolean>(true);
  const [showHeatmap, setShowHeatmap] = useState<boolean>(false);
  const [showCluster, setShowCluster] = useState<boolean>(false);

  // Drawing & Measurement tools
  const [drawingMode, setDrawingMode] = useState<'none' | 'ruler' | 'circle' | 'polygon'>('none');
  const [rulerPoints, setRulerPoints] = useState<Coordinates[]>([]);
  const [measuredDistance, setMeasuredDistance] = useState<number | null>(null);

  // Map panning & zoom
  const [zoom, setZoom] = useState<number>(1.2);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 50, y: -20 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [tooltip, setTooltip] = useState<{
    show: boolean;
    x: number;
    y: number;
    title: string;
    description: string;
    details?: string[];
  }>({ show: false, x: 0, y: 0, title: '', description: '' });

  const svgRef = useRef<SVGSVGElement>(null);

  // Handle map panning
  const handleMouseDown = (e: React.MouseEvent<SVGSVGElement, MouseEvent>) => {
    if (isAddingGeofence || drawingMode !== 'none') return;
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
      newZoom = Math.min(zoom * zoomFactor, 4);
    } else {
      newZoom = Math.max(zoom / zoomFactor, 0.8);
    }
    setZoom(newZoom);
  };

  const handleMapClickInternal = (e: React.MouseEvent<SVGSVGElement, MouseEvent>) => {
    if (isDragging && Math.abs(e.clientX - (dragStart.x + panOffset.x)) > 5) {
      return;
    }

    if (!svgRef.current) return;

    // Calculate click coordinates relative to SVG
    const rect = svgRef.current.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;

    // Apply inverse zoom and pan
    const mapX = (clientX - rect.width / 2 - panOffset.x) / zoom + rect.width / 2;
    const mapY = (clientY - rect.height / 2 - panOffset.y) / zoom + rect.height / 2;

    const coords = convertXYToLatLng(mapX, mapY, 1000, 700);

    // Ruler measurement logic
    if (drawingMode === 'ruler') {
      const updatedPoints = [...rulerPoints, coords];
      setRulerPoints(updatedPoints);
      if (updatedPoints.length >= 2) {
        let totalDist = 0;
        for (let i = 0; i < updatedPoints.length - 1; i++) {
          totalDist += calculateDistanceKm(updatedPoints[i], updatedPoints[i + 1]);
        }
        setMeasuredDistance(totalDist);
      }
      return;
    }

    // Add Geofence callbacks
    if (isAddingGeofence && onAddGeofenceClick) {
      onAddGeofenceClick(coords);
    } else if (onMapClick) {
      onMapClick(coords);
    } else {
      setTooltip({ ...tooltip, show: false });
    }
  };

  const adjustZoom = (multiplier: number) => {
    setZoom(prev => Math.max(0.8, Math.min(4, prev * multiplier)));
  };

  const resetMap = () => {
    setZoom(1.2);
    setPanOffset({ x: 50, y: -20 });
    setTooltip({ ...tooltip, show: false });
    setRulerPoints([]);
    setMeasuredDistance(null);
    setDrawingMode('none');
  };

  // Highlight selected employee by centering them
  useEffect(() => {
    if (selectedEmployeeId) {
      const emp = employees.find(e => e.id === selectedEmployeeId);
      if (emp) {
        const { x, y } = convertLatLngToXY(emp.coords.lat, emp.coords.lng, 1000, 700);
        setPanOffset({
          x: (500 - x) * zoom,
          y: (350 - y) * zoom,
        });
      }
    }
  }, [selectedEmployeeId]);

  // Coastal land mass vector
  const sfCoastline = "M 50,700 Q 150,550 180,480 T 250,300 T 310,180 T 400,100 Q 550,50 680,60 T 800,200 T 850,380 T 920,480 L 1000,550 L 1000,700 Z";
  
  // Base roads (highways & arterial streets)
  const sfRoads = [
    "M 150,500 L 780,250", // Market St
    "M 120,530 L 760,280", // Mission St
    "M 50,280 L 820,280",  // Geary Blvd
    "M 250,150 L 850,150",  // Lombard St
    "M 350,200 L 850,200",  // Broadway
    "M 200,650 L 200,150",  // 19th Ave
    "M 550,650 L 550,100",  // Van Ness Ave
    "M 650,60 L 780,110 T 860,220 T 870,400", // Embarcadero
    "M 380,650 L 380,180",  // Divisadero St
    "M 100,580 L 900,580",  // Cesar Chavez St
    "M 600,450 Q 750,350 850,340 T 1000,340", // I-80
    "M 450,700 Q 500,610 650,550 T 800,410",  // I-280
  ];

  const goldenGatePark = "M 80,310 L 400,310 L 400,360 L 80,360 Z";
  const presidio = "M 250,80 L 420,100 L 450,180 L 350,210 L 220,170 Z";
  const doloresPark = "M 420,500 L 470,500 L 470,540 L 420,540 Z";

  // Dynamic Colors depending on Active Map Style
  const getMapTheme = () => {
    switch (mapStyle) {
      case 'street':
        return {
          water: '#93c5fd',
          land: '#f8fafc',
          coastBorder: '#cbd5e1',
          roads: '#e2e8f0',
          highways: '#fed7aa',
          parks: '#dcfce7',
          parkStroke: '#bbf7d0',
          text: '#475569',
          highwayLabel: '#ea580c'
        };
      case 'satellite':
        return {
          water: '#080d1a',
          land: '#1c1917',
          coastBorder: '#2e2a24',
          roads: '#44403c',
          highways: '#78716c',
          parks: '#1e3a1e',
          parkStroke: '#2f5c2f',
          text: '#a8a29e',
          highwayLabel: '#d6d3d1'
        };
      case 'hybrid':
        return {
          water: '#050b14',
          land: '#181616',
          coastBorder: '#3f3a35',
          roads: '#22c55e',
          highways: '#f59e0b',
          parks: '#0f290f',
          parkStroke: '#166534',
          text: '#f8fafc',
          highwayLabel: '#ffffff'
        };
      case 'terrain':
        return {
          water: '#bfdbfe',
          land: '#e7e5e4',
          coastBorder: '#d6d3d1',
          roads: '#a8a29e',
          highways: '#ea580c',
          parks: '#a7f3d0',
          parkStroke: '#34d399',
          text: '#292524',
          highwayLabel: '#ffffff'
        };
      case 'dark':
      default:
        return {
          water: '#090d16',
          land: '#111827',
          coastBorder: '#1f2937',
          roads: '#1e293b',
          highways: '#3b82f6',
          parks: '#064e3b',
          parkStroke: '#047857',
          text: '#94a3b8',
          highwayLabel: '#60a5fa'
        };
    }
  };

  const colors = getMapTheme();

  return (
    <div className="relative w-full h-[620px] bg-slate-950 border border-slate-800 rounded-3xl overflow-hidden select-none shadow-2xl flex flex-col lg:flex-row">
      
      {/* 1. Left Vertical GIS Tool Bar */}
      <div className="bg-slate-900 border-b lg:border-b-0 lg:border-r border-slate-800 p-4 flex lg:flex-col justify-between gap-4 shrink-0 overflow-x-auto lg:overflow-x-visible">
        
        {/* Map Styles Selector */}
        <div className="space-y-3 min-w-[120px] lg:w-full">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Map Style</span>
          <div className="grid grid-cols-2 lg:grid-cols-1 gap-1.5">
            {[
              { id: 'dark', label: 'Dark Mode' },
              { id: 'street', label: 'Street' },
              { id: 'satellite', label: 'Satellite' },
              { id: 'hybrid', label: 'Hybrid' },
              { id: 'terrain', label: 'Terrain' }
            ].map((style) => (
              <button
                key={style.id}
                onClick={() => setMapStyle(style.id as any)}
                className={`px-2.5 py-1.5 rounded-lg text-left text-[10px] font-bold transition-all ${
                  mapStyle === style.id 
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' 
                    : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-850'
                }`}
              >
                {style.label}
              </button>
            ))}
          </div>
        </div>

        {/* GIS Interactive Overlays */}
        <div className="space-y-3 min-w-[120px] lg:w-full">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Layers</span>
          <div className="flex flex-row lg:flex-col gap-1.5">
            <button
              onClick={() => setShowWeather(!showWeather)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-bold w-full transition-all ${
                showWeather 
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                  : 'bg-slate-950 text-slate-500 border border-slate-850'
              }`}
            >
              <CloudRain className="w-3.5 h-3.5" />
              <span>Weather Layer</span>
            </button>

            <button
              onClick={() => setShowTraffic(!showTraffic)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-bold w-full transition-all ${
                showTraffic 
                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' 
                  : 'bg-slate-950 text-slate-500 border border-slate-850'
              }`}
            >
              <Compass className="w-3.5 h-3.5 text-amber-400 animate-spin-slow" />
              <span>Traffic Flow</span>
            </button>

            <button
              onClick={() => setShowHeatmap(!showHeatmap)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-bold w-full transition-all ${
                showHeatmap 
                  ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' 
                  : 'bg-slate-950 text-slate-500 border border-slate-850'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              <span>GPS Heatmap</span>
            </button>
          </div>
        </div>

        {/* Measurement Tools */}
        <div className="space-y-3 min-w-[120px] lg:w-full">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">GIS Tools</span>
          <div className="flex flex-row lg:flex-col gap-1.5">
            <button
              onClick={() => {
                if (drawingMode === 'ruler') {
                  setDrawingMode('none');
                  setRulerPoints([]);
                  setMeasuredDistance(null);
                } else {
                  setDrawingMode('ruler');
                  setRulerPoints([]);
                  setMeasuredDistance(null);
                }
              }}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-bold w-full transition-all ${
                drawingMode === 'ruler' 
                  ? 'bg-blue-600 text-white shadow-lg' 
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-850'
              }`}
            >
              <Navigation className="w-3.5 h-3.5 shrink-0" />
              <span>{drawingMode === 'ruler' ? 'Measuring...' : 'Ruler (Measure)'}</span>
            </button>

            {drawingMode === 'ruler' && rulerPoints.length > 0 && (
              <button
                onClick={() => {
                  setRulerPoints([]);
                  setMeasuredDistance(null);
                }}
                className="bg-red-950 hover:bg-red-900 text-red-400 px-2.5 py-1 rounded text-[9px] font-bold text-center w-full block border border-red-900/20"
              >
                Clear Points
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 2. Main Map Canvas Space */}
      <div className="flex-1 relative overflow-hidden bg-slate-950">
        
        {/* Vector SVG Canvas */}
        <svg
          ref={svgRef}
          id="live_gis_canvas"
          className={`w-full h-full cursor-grab active:cursor-grabbing ${
            isAddingGeofence || drawingMode !== 'none' ? 'cursor-crosshair' : ''
          }`}
          viewBox="0 0 1000 700"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onWheel={handleWheel}
          onClick={handleMapClickInternal}
        >
          {/* Zoom and Pan Wrapper */}
          <g transform={`translate(${panOffset.x + 1000 * (1 - zoom) / 2}, ${panOffset.y + 700 * (1 - zoom) / 2}) scale(${zoom})`}>
            
            {/* Water Background */}
            <rect x="-1000" y="-1000" width="3000" height="3000" fill={colors.water} />

            {/* Landmass */}
            <path d={sfCoastline} fill={colors.land} stroke={colors.coastBorder} strokeWidth="3" />

            {/* Terrain Contours (Simulating height changes) */}
            {mapStyle === 'terrain' && (
              <g opacity="0.4" stroke="#d6d3d1" strokeWidth="1" fill="none" className="pointer-events-none">
                <path d="M 180,480 Q 230,420 280,450 T 380,420" />
                <path d="M 160,500 Q 210,440 260,470 T 360,440" />
                <path d="M 140,520 Q 190,460 240,490 T 340,460" />
                <path d="M 400,280 C 450,320 480,260 520,300 S 550,350 600,320" />
                <path d="M 420,300 C 470,340 500,280 540,320 S 570,370 620,340" />
                <text x="460" y="310" fill="#a8a29e" fontSize="8" fontStyle="italic">Twin Peaks Contours</text>
              </g>
            )}

            {/* Satellite Mesh Grid Overlay */}
            {(mapStyle === 'satellite' || mapStyle === 'hybrid') && (
              <g opacity="0.15" stroke="#ffffff" strokeWidth="0.5" fill="none" className="pointer-events-none">
                <line x1="-1000" y1="100" x2="2000" y2="100" strokeDasharray="3,6" />
                <line x1="-1000" y1="300" x2="2000" y2="300" strokeDasharray="3,6" />
                <line x1="-1000" y1="500" x2="2000" y2="500" strokeDasharray="3,6" />
                <line x1="200" y1="-1000" x2="200" y2="2000" strokeDasharray="3,6" />
                <line x1="500" y1="-1000" x2="500" y2="2000" strokeDasharray="3,6" />
                <line x1="800" y1="-1000" x2="800" y2="2000" strokeDasharray="3,6" />
                <circle cx="500" cy="350" r="150" strokeDasharray="5,5" />
                <circle cx="500" cy="350" r="300" strokeDasharray="5,5" />
                <text x="510" y="210" fill="#ffffff" fontSize="8" opacity="0.6">RADAR SCANNER R-4</text>
              </g>
            )}

            {/* Golden Gate Park */}
            <path d={goldenGatePark} fill={colors.parks} stroke={colors.parkStroke} strokeWidth="1" />
            <text x="240" y="340" fill={colors.text} fontSize="11" fontWeight="bold" opacity="0.65" className="pointer-events-none">Golden Gate Park</text>

            {/* Presidio */}
            <path d={presidio} fill={colors.parks} stroke={colors.parkStroke} strokeWidth="1" />
            <text x="310" y="140" fill={colors.text} fontSize="11" fontWeight="bold" opacity="0.65" className="pointer-events-none">The Presidio</text>

            {/* Dolores Park */}
            <path d={doloresPark} fill={colors.parks} stroke={colors.parkStroke} strokeWidth="1" />
            <text x="415" y="490" fill={colors.text} fontSize="9" fontWeight="bold" opacity="0.65" className="pointer-events-none">Dolores Park</text>

            {/* Roads Layout */}
            {sfRoads.map((road, idx) => (
              <path
                key={idx}
                d={road}
                fill="none"
                stroke={idx >= 10 ? colors.highways : colors.roads}
                strokeWidth={idx >= 10 ? "5.5" : "2.5"}
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity={idx >= 10 ? "1" : "0.75"}
              />
            ))}

            {/* Road Name Labels */}
            <g opacity="0.6" className="pointer-events-none font-sans font-bold" fill={colors.text}>
              <text x="920" y="335" fontSize="9" fill={colors.highwayLabel}>I-80</text>
              <text x="610" y="540" fontSize="9" transform="rotate(-18, 610, 540)" fill={colors.highwayLabel}>I-280</text>
              <text x="420" y="275" fontSize="9" transform="rotate(-16, 420, 275)">Geary Blvd</text>
              <text x="400" y="415" fontSize="10" transform="rotate(-18, 400, 415)">Market Street</text>
            </g>

            {/* --- TRAFFIC FLOW LAYER OVERLAY --- */}
            {showTraffic && (
              <g opacity="0.8" className="pointer-events-none">
                {/* Heavy traffic red glow */}
                <path d="M 150,500 L 400,410" fill="none" stroke="#ef4444" strokeWidth="5" strokeLinecap="round" strokeDasharray="10,5" className="animate-pulse" />
                <rect x="260" y="445" width="45" height="13" rx="3" fill="#ef4444" />
                <text x="282.5" y="454" fill="#ffffff" fontSize="8" fontWeight="bold" textAnchor="middle">+8 min</text>

                {/* Medium traffic orange */}
                <path d="M 550,450 L 550,280" fill="none" stroke="#f97316" strokeWidth="4" strokeLinecap="round" />
                
                {/* Road Closure Incident Barrier */}
                <g transform="translate(350, 200)">
                  <circle cx="0" cy="0" r="10" fill="#f59e0b" stroke="#78350f" strokeWidth="1" />
                  <text x="0" y="3" fill="#ffffff" fontSize="10" fontWeight="bold" textAnchor="middle">🚧</text>
                  <rect x="-30" y="12" width="60" height="12" rx="2" fill="#0f172a" stroke="#f59e0b" strokeWidth="1" />
                  <text x="0" y="21" fill="#f59e0b" fontSize="7" fontWeight="bold" textAnchor="middle">ROAD CLOSED</text>
                </g>

                {/* Accident Report Warning */}
                <g transform="translate(680, 280)">
                  <polygon points="0,-10 -10,8 10,8" fill="#ef4444" stroke="#7f1d1d" strokeWidth="1" />
                  <text x="0" y="6" fill="#ffffff" fontSize="7" fontWeight="bold" textAnchor="middle">⚠️</text>
                  <rect x="-35" y="11" width="70" height="12" rx="2" fill="#0f172a" stroke="#ef4444" strokeWidth="1" />
                  <text x="0" y="20" fill="#ef4444" fontSize="7" fontWeight="bold" textAnchor="middle">CRASH DETECTED</text>
                </g>
              </g>
            )}

            {/* --- WEATHER GIS OVERLAY --- */}
            {showWeather && (
              <g opacity="0.75" className="pointer-events-none">
                {/* Temperature Gradient Contour Boxes */}
                <rect x="50" y="50" width="200" height="200" fill="rgba(59, 130, 246, 0.08)" stroke="rgba(59, 130, 246, 0.2)" strokeWidth="1" />
                <text x="150" y="70" fill="#60a5fa" fontSize="8" fontWeight="bold" textAnchor="middle">MARINE COOL AIR CORES</text>
                <text x="150" y="85" fill="#93c5fd" fontSize="12" fontWeight="bold" textAnchor="middle">58°F • Clean AQI 12</text>

                <rect x="650" y="450" width="300" height="200" fill="rgba(249, 115, 22, 0.06)" stroke="rgba(249, 115, 22, 0.15)" strokeWidth="1" />
                <text x="800" y="470" fill="#fb923c" fontSize="8" fontWeight="bold" textAnchor="middle">URBAN HEAT INDEX ZONE</text>
                <text x="800" y="485" fill="#fdba74" fontSize="12" fontWeight="bold" textAnchor="middle">72°F • Moderate AQI 54</text>

                {/* Rain particles group */}
                <g stroke="#60a5fa" strokeWidth="1" strokeLinecap="round" opacity="0.5">
                  <line x1="200" y1="200" x2="195" y2="215" />
                  <line x1="220" y1="230" x2="215" y2="245" />
                  <line x1="300" y1="180" x2="295" y2="195" />
                  <line x1="150" y1="280" x2="145" y2="295" />
                  <line x1="280" y1="290" x2="275" y2="305" />
                </g>

                {/* Gale Warning overlay */}
                <g transform="translate(850, 100)">
                  <circle cx="0" cy="0" r="18" fill="#ef4444" opacity="0.2" className="animate-ping" />
                  <path d="M -12,0 C -5,-10 5,-10 12,0" stroke="#f43f5e" strokeWidth="2" fill="none" />
                  <text x="0" y="12" fill="#ef4444" fontSize="7" fontWeight="bold" textAnchor="middle">GALE WARNING</text>
                </g>
              </g>
            )}

            {/* --- GPS HEATMAP OVERLAY --- */}
            {showHeatmap && (
              <g opacity="0.75" className="pointer-events-none">
                {employees.map((emp, i) => {
                  const { x, y } = convertLatLngToXY(emp.coords.lat, emp.coords.lng);
                  return (
                    <g key={`heat_${i}`}>
                      <circle cx={x} cy={y} r="65" fill="url(#heat_grad)" opacity="0.5" />
                    </g>
                  );
                })}
                <defs>
                  <radialGradient id="heat_grad">
                    <stop offset="0%" stopColor="#ef4444" />
                    <stop offset="25%" stopColor="#f97316" />
                    <stop offset="60%" stopColor="#eab308" />
                    <stop offset="100%" stopColor="transparent" />
                  </radialGradient>
                </defs>
              </g>
            )}

            {/* 1. DRAW GEOFENCES */}
            {geofences.map(geo => {
              if (geo.status !== 'ACTIVE') return null;

              if (geo.type === GeofenceType.CIRCLE && geo.radius) {
                const { x, y } = convertLatLngToXY(geo.coords.lat, geo.coords.lng);
                const svgRadius = geo.radius * 0.11;

                return (
                  <g key={geo.id} className="group cursor-pointer" onClick={(e) => {
                    e.stopPropagation();
                    setTooltip({
                      show: true,
                      x,
                      y: y - svgRadius - 10,
                      title: geo.name,
                      description: `Type: Circular Geofence (${geo.radius}m)`,
                      details: [
                        `Active Targets: ${geo.targetTeams.join(', ')}`,
                        `Detections: Enter: ${geo.enterCount} | Exit: ${geo.exitCount}`
                      ]
                    });
                  }}>
                    <circle cx={x} cy={y} r={svgRadius} fill="rgba(14, 165, 233, 0.08)" stroke="#0ea5e9" strokeWidth="2.5" strokeDasharray="4,4" className="animate-pulse" />
                    <circle cx={x} cy={y} r="5" fill="#0ea5e9" />
                    <text x={x} y={y - 12} fill="#38bdf8" fontSize="10.5" fontWeight="bold" textAnchor="middle" className="opacity-80 group-hover:opacity-100 transition-opacity pointer-events-none">{geo.name}</text>
                  </g>
                );
              } else if (geo.type === GeofenceType.POLYGON && geo.polygonPath) {
                const pointsStr = geo.polygonPath
                  .map(coord => {
                    const { x, y } = convertLatLngToXY(coord.lat, coord.lng);
                    return `${x},${y}`;
                  })
                  .join(' ');

                const centroid = convertLatLngToXY(geo.coords.lat, geo.coords.lng);

                return (
                  <g key={geo.id} className="group cursor-pointer" onClick={(e) => {
                    e.stopPropagation();
                    setTooltip({
                      show: true,
                      x: centroid.x,
                      y: centroid.y - 15,
                      title: geo.name,
                      description: 'Type: Polygon Geofence',
                      details: [
                        `Active Targets: ${geo.targetTeams.join(', ')}`,
                        `Detections: Enter: ${geo.enterCount} | Exit: ${geo.exitCount}`
                      ]
                    });
                  }}>
                    <polygon
                      points={pointsStr}
                      fill="rgba(168, 85, 247, 0.08)"
                      stroke="#a855f7"
                      strokeWidth="2.5"
                      strokeDasharray="5,3"
                    />
                    <circle cx={centroid.x} cy={centroid.y} r="5" fill="#a855f7" />
                    <text x={centroid.x} y={centroid.y - 10} fill="#c084fc" fontSize="10.5" fontWeight="bold" textAnchor="middle" className="opacity-80 group-hover:opacity-100 transition-opacity pointer-events-none">{geo.name}</text>
                  </g>
                );
              }
              return null;
            })}

            {/* 2. DRAW ACTIVE ROUTE REPLAY LINE */}
            {activeRoutePath && activeRoutePath.length > 0 && (
              <g id="active_replay_trail">
                <path
                  d={`M ${activeRoutePath.map(p => {
                    const { x, y } = convertLatLngToXY(p.lat, p.lng);
                    return `${x},${y}`;
                  }).join(' L ')}`}
                  fill="none"
                  stroke="#475569"
                  strokeWidth="5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity="0.35"
                />
                {playbackIndex >= 0 && (
                  <path
                    d={`M ${activeRoutePath.slice(0, playbackIndex + 1).map(p => {
                      const { x, y } = convertLatLngToXY(p.lat, p.lng);
                      return `${x},${y}`;
                    }).join(' L ')}`}
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="transition-all duration-300"
                  />
                )}
              </g>
            )}

            {/* 3. DRAW CUSTOMERS */}
            {customers.map(cust => {
              const { x, y } = convertLatLngToXY(cust.coords.lat, cust.coords.lng);
              return (
                <g key={cust.id} className="group cursor-pointer" onClick={(e) => {
                  e.stopPropagation();
                  setTooltip({
                    show: true,
                    x,
                    y: y - 20,
                    title: cust.name,
                    description: cust.address,
                    details: [
                      `Contact: ${cust.contactPerson}`,
                      `Phone: ${cust.phone}`,
                      `Email: ${cust.email}`
                    ]
                  });
                }}>
                  <circle cx={x} cy={y} r="12" fill="none" stroke="#f59e0b" strokeWidth="1.5" className="animate-ping" opacity="0.4" />
                  <path
                    d={`M ${x},${y} L ${x-7},${y-18} A 8,8 0 1,1 ${x+7},${y-18} Z`}
                    fill="#f59e0b"
                    stroke="#78350f"
                    strokeWidth="1.5"
                  />
                  <circle cx={x} cy={y-18} r="3" fill="#fff" />

                  <g className="opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    <rect x={x - 85} y={y - 45} width="170" height="22" rx="6" fill="#0f172a" stroke="#475569" strokeWidth="1" />
                    <text x={x} y={y - 30} fill="#f59e0b" fontSize="8.5" fontWeight="bold" textAnchor="middle">{cust.name.split(' (')[0]}</text>
                  </g>
                </g>
              );
            })}

            {/* 4. DRAW EMPLOYEES WITH DYNAMIC VEHICLE/WALK/OFFICE ICONS */}
            {employees.map(emp => {
              const { x, y } = convertLatLngToXY(emp.coords.lat, emp.coords.lng);
              const isSelected = selectedEmployeeId === emp.id;
              
              let statusColor = '#3b82f6'; 
              if (emp.status === EmployeeStatus.TRAVELING) statusColor = '#10b981'; 
              if (emp.status === EmployeeStatus.IDLE) statusColor = '#eab308'; 
              if (emp.status === EmployeeStatus.BREAK) statusColor = '#f97316'; 
              if (emp.status === EmployeeStatus.OFFLINE) statusColor = '#64748b'; 

              // Determine dynamic icon: driving vehicle, walking, or office (close to HQ)
              let modeIcon = "🚶"; // default walk
              if (emp.speed > 25) {
                modeIcon = "🚗"; // driving
              } else if (emp.status === EmployeeStatus.ONLINE && emp.distanceFromHeadOfficeKm < 0.2) {
                modeIcon = "🏢"; // onsite at HQ
              } else if (emp.status === EmployeeStatus.BREAK) {
                modeIcon = "☕"; // Break
              } else if (emp.status === EmployeeStatus.OFFLINE) {
                modeIcon = "😴"; // Offline
              }

              return (
                <g
                  key={emp.id}
                  id={`pin_${emp.id}`}
                  className="group cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectEmployee(emp.id);
                    setTooltip({
                      show: true,
                      x,
                      y: y - 28,
                      title: emp.name,
                      description: `${emp.role} • ${emp.team}`,
                      details: [
                        `Status: ${emp.status} (${modeIcon})`,
                        `Speed: ${emp.speed} km/h • Battery: ${emp.battery}%`,
                        `Accuracy: ${emp.gpsAccuracy}m • Diagnostics: ${emp.vpnActive ? 'VPN Active!' : 'Secure Link'}`,
                        `Last Update: ${new Date(emp.lastUpdate).toLocaleTimeString()}`
                      ]
                    });
                  }}
                >
                  {/* Halo for selected */}
                  {isSelected && (
                    <circle cx={x} cy={y} r="28" fill="none" stroke="#60a5fa" strokeWidth="2.5" strokeDasharray="4,4" className="animate-spin" style={{ transformOrigin: `${x}px ${y}px`, animationDuration: '8s' }} />
                  )}

                  {/* Animated ping for moving/traveling employees */}
                  {emp.status === EmployeeStatus.TRAVELING && (
                    <circle cx={x} cy={y} r="20" fill="none" stroke="#10b981" strokeWidth="2.5" className="animate-ping" opacity="0.6" />
                  )}

                  {/* Pointer Direction Arrow if moving */}
                  {emp.speed > 0 && (
                    <g transform={`rotate(${emp.id === 'emp_1' ? 45 : emp.id === 'emp_5' ? 220 : 0}, ${x}, ${y})`}>
                      <polygon points={`${x},${y - 24} ${x - 7},${y - 14} ${x + 7},${y - 14}`} fill={statusColor} />
                    </g>
                  )}

                  {/* Pulse Glow Background */}
                  <circle cx={x} cy={y} r="14" fill={statusColor} opacity="0.3" className="animate-pulse" />

                  {/* Avatar Outer Circle */}
                  <circle cx={x} cy={y} r="16" fill="#1e293b" stroke={isSelected ? '#60a5fa' : statusColor} strokeWidth={isSelected ? '3.5' : '2.5'} />
                  
                  {/* Mini Profile Image */}
                  <defs>
                    <pattern id={`avatar_pat_${emp.id}`} x="0" y="0" height="1" width="1" patternContentUnits="objectBoundingBox">
                      <image x="0" y="0" height="1" width="1" preserveAspectRatio="xMidYMid slice" href={emp.avatar} />
                    </pattern>
                  </defs>
                  <circle cx={x} cy={y} r="13" fill={`url(#avatar_pat_${emp.id})`} />

                  {/* Dynamic Action Mode Indicator on bottom right of pin */}
                  <g transform={`translate(${x + 11}, ${y + 11})`}>
                    <circle cx="0" cy="0" r="7.5" fill="#1e293b" stroke={statusColor} strokeWidth="1" />
                    <text x="0" y="2.5" fontSize="8" textAnchor="middle">{modeIcon}</text>
                  </g>

                  {/* Suspicious Tampering Alert badge */}
                  {(emp.mockLocationActive || emp.vpnActive || emp.deviceRooted || emp.developerModeActive) && (
                    <g transform={`translate(${x - 14}, ${y - 14})`}>
                      <circle cx="0" cy="0" r="6" fill="#ef4444" stroke="#fff" strokeWidth="0.5" />
                      <text x="0" y="2" fill="#fff" fontSize="7" fontWeight="bold" textAnchor="middle">!</text>
                    </g>
                  )}

                  {/* Text Label */}
                  <g className={`${isSelected ? 'opacity-100' : 'opacity-85 group-hover:opacity-100'} transition-opacity pointer-events-none`}>
                    <rect x={x - 45} y={y + 20} width="90" height="15" rx="4" fill="#0f172a" opacity="0.9" stroke="#334155" strokeWidth="1" />
                    <text x={x} y={y + 31} fill="#ffffff" fontSize="9" fontWeight="bold" textAnchor="middle">{emp.name.split(' ')[0]}</text>
                  </g>
                </g>
              );
            })}

            {/* --- RULER MEASUREMENT GRAPHICS --- */}
            {drawingMode === 'ruler' && rulerPoints.length > 0 && (
              <g id="ruler_layer" stroke="#3b82f6" strokeWidth="3" fill="none">
                {/* Measuring segments */}
                <path
                  d={`M ${rulerPoints.map(p => {
                    const { x, y } = convertLatLngToXY(p.lat, p.lng);
                    return `${x},${y}`;
                  }).join(' L ')}`}
                  strokeDasharray="5,5"
                />

                {/* Markers at each clicked spot */}
                {rulerPoints.map((pt, i) => {
                  const { x, y } = convertLatLngToXY(pt.lat, pt.lng);
                  return (
                    <g key={`ruler_pt_${i}`} transform={`translate(${x}, ${y})`} fill="#3b82f6" stroke="#ffffff" strokeWidth="1.5">
                      <circle cx="0" cy="0" r="6" />
                      <text x="0" y="-10" fill="#60a5fa" fontSize="10" fontWeight="bold" stroke="none" textAnchor="middle">
                        Pt {i + 1}
                      </text>
                    </g>
                  );
                })}

                {/* Callout output banner */}
                {measuredDistance !== null && (() => {
                  const lastPt = rulerPoints[rulerPoints.length - 1];
                  const { x, y } = convertLatLngToXY(lastPt.lat, lastPt.lng);
                  return (
                    <g transform={`translate(${x}, ${y - 25})`} stroke="none" fill="none" className="pointer-events-none">
                      <rect x="-65" y="-14" width="130" height="24" rx="6" fill="#1d4ed8" stroke="#ffffff" strokeWidth="1" />
                      <text x="0" y="2" fill="#ffffff" fontSize="10.5" fontWeight="bold" textAnchor="middle">
                        📏 {measuredDistance.toFixed(3)} km
                      </text>
                    </g>
                  );
                })()}
              </g>
            )}

          </g>
        </svg>

        {/* Dynamic Accuracy indicator */}
        <div className="absolute bottom-4 right-4 bg-slate-950/90 border border-slate-800 rounded-xl px-3 py-1.5 flex items-center gap-2 text-[10px] font-mono text-slate-400 backdrop-blur-md">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>GIS Hub Status: Active</span>
          <span className="text-slate-600">|</span>
          <span className="text-blue-400 font-bold">ACCURACY 99.8%</span>
        </div>

        {/* Top-Right Zoom Buttons */}
        <div className="absolute top-4 right-4 flex flex-col gap-2">
          <button
            onClick={() => adjustZoom(1.2)}
            className="w-9 h-9 flex items-center justify-center bg-slate-950/90 hover:bg-slate-800 border border-slate-800 text-slate-200 hover:text-white rounded-lg shadow-lg text-lg font-bold"
            title="Zoom In"
          >
            +
          </button>
          <button
            onClick={() => adjustZoom(0.8)}
            className="w-9 h-9 flex items-center justify-center bg-slate-950/90 hover:bg-slate-800 border border-slate-800 text-slate-200 hover:text-white rounded-lg shadow-lg text-lg font-bold"
            title="Zoom Out"
          >
            −
          </button>
          <button
            onClick={resetMap}
            className="w-9 h-9 flex items-center justify-center bg-slate-950/90 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white rounded-lg shadow-lg"
            title="Reset Map View"
          >
            <Layers className="w-4 h-4" />
          </button>
        </div>

        {/* Ruler Mode Active banner */}
        {drawingMode === 'ruler' && (
          <div className="absolute top-4 left-4 bg-blue-600 text-white text-[11px] px-3 py-2 rounded-xl font-bold shadow-lg flex items-center gap-2">
            <Navigation className="w-3.5 h-3.5 animate-bounce" />
            <span>Ruler Tool active: Click multiple points on map to measure path distance.</span>
            <button 
              onClick={() => { setDrawingMode('none'); setRulerPoints([]); setMeasuredDistance(null); }}
              className="bg-blue-800 hover:bg-blue-900 px-1.5 py-0.5 rounded text-[10px]"
            >
              Cancel
            </button>
          </div>
        )}

        {/* Circle Geofence instructions */}
        {isAddingGeofence && (
          <div className="absolute top-4 left-4 bg-purple-600 text-white text-[11px] px-3 py-2 rounded-xl font-bold shadow-lg flex items-center gap-1.5 animate-pulse">
            <Plus className="w-3.5 h-3.5" />
            <span>Place Geofence: Click anywhere on the map to define center.</span>
          </div>
        )}

        {/* Active Tooltip Popover inside Map Canvas */}
        {tooltip.show && (
          <div
            className="absolute z-30 bg-slate-950/95 border border-slate-800 text-slate-200 rounded-xl p-3.5 shadow-2xl backdrop-blur-md pointer-events-auto max-w-[280px] transition-all duration-150"
            style={{
              left: `${Math.min(90, Math.max(10, ((tooltip.x - 1000 * (1 - zoom) / 2) * zoom + panOffset.x) / 1000 * 100))}%`,
              top: `${Math.min(90, Math.max(10, ((tooltip.y - 700 * (1 - zoom) / 2) * zoom + panOffset.y) / 700 * 100))}%`,
              transform: 'translate(-50%, -105%)',
            }}
          >
            <div className="flex justify-between items-start gap-2 mb-1.5">
              <h5 className="text-xs font-bold text-white flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                {tooltip.title}
              </h5>
              <button 
                onClick={() => setTooltip({ ...tooltip, show: false })}
                className="text-slate-500 hover:text-white font-bold"
              >
                ×
              </button>
            </div>
            <p className="text-[10px] text-blue-400 border-b border-slate-800 pb-1.5 mb-1.5 leading-relaxed">{tooltip.description}</p>
            {tooltip.details && tooltip.details.map((detail, idx) => (
              <div key={idx} className="text-[10px] text-slate-300 leading-normal flex items-start gap-1.5 mt-1">
                <span className="w-1 h-1 rounded-full bg-blue-500 shrink-0 mt-1.5" />
                <span>{detail}</span>
              </div>
            ))}
          </div>
        )}

        {/* Active Employee Centering Box */}
        {selectedEmployeeId && (
          <div className="absolute bottom-4 left-4 bg-slate-950/95 border border-slate-850 rounded-2xl p-3 shadow-2xl max-w-sm flex items-center gap-3 backdrop-blur-md">
            {(() => {
              const emp = employees.find(e => e.id === selectedEmployeeId);
              if (!emp) return null;
              return (
                <>
                  <img src={emp.avatar} alt={emp.name} className="w-9 h-9 rounded-full object-cover border border-slate-800" />
                  <div className="flex-1 min-w-0">
                    <h4 className="text-[11px] font-bold text-white truncate leading-none">{emp.name}</h4>
                    <span className="text-[9px] text-slate-500 truncate block mt-0.5">{emp.role}</span>
                    <p className="text-[10px] text-slate-300 truncate flex items-center gap-1 mt-1 font-mono">
                      <Navigation className="w-2.5 h-2.5 text-emerald-400 fill-current" />
                      {emp.speed} km/h • {emp.battery}% Bat
                    </p>
                  </div>
                  <button 
                    onClick={() => onSelectEmployee(null)}
                    className="text-[10px] text-slate-400 hover:text-white bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800"
                  >
                    Clear
                  </button>
                </>
              );
            })()}
          </div>
        )}

      </div>
    </div>
  );
};
