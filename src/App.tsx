import React, { useState, useEffect, useRef } from 'react';
import { 
  Employee, 
  Geofence, 
  Customer, 
  Visit, 
  Attendance, 
  Notification, 
  EmployeeStatus, 
  NotificationType,
  Coordinates,
  GeofenceType
} from './types';
import { 
  INITIAL_EMPLOYEES, 
  INITIAL_GEOFENCES, 
  INITIAL_CUSTOMERS, 
  INITIAL_VISITS, 
  INITIAL_ATTENDANCE, 
  INITIAL_NOTIFICATIONS 
} from './data';
import { AdminDashboard } from './components/AdminDashboard';
import { AnalyticsCharts } from './components/AnalyticsCharts';
import { EmployeeMobileApp } from './components/EmployeeMobileApp';
import { SystemArchitecture } from './components/SystemArchitecture';
import { Login } from './components/auth/Login';
import { useAuth } from './contexts/AuthContext';
import { 
  Sparkles, 
  ShieldAlert, 
  Smartphone, 
  LayoutDashboard, 
  TrendingUp, 
  Cpu, 
  MapPin, 
  Bell, 
  Check, 
  Trash2, 
  Compass,
  AlertTriangle,
  LogOut
} from 'lucide-react';

// Distance utility mapping (flat projection for SF size)
const getDistanceMeters = (c1: Coordinates, c2: Coordinates) => {
  const dLat = (c1.lat - c2.lat) * 111139; // approx meters per degree lat
  const dLng = (c1.lng - c2.lng) * 111139 * Math.cos(c1.lat * Math.PI / 180);
  return Math.sqrt(dLat * dLat + dLng * dLng);
};

const App: React.FC = () => {
  const { user, loading, logout } = useAuth();

  // Global Database state
  const [employees, setEmployees] = useState<Employee[]>(INITIAL_EMPLOYEES);

  const [geofences, setGeofences] = useState<Geofence[]>(INITIAL_GEOFENCES);
  const [customers, setCustomers] = useState<Customer[]>(INITIAL_CUSTOMERS);
  const [visits, setVisits] = useState<Visit[]>(INITIAL_VISITS);
  const [attendanceLogs, setAttendanceLogs] = useState<Attendance[]>(INITIAL_ATTENDANCE);
  const [notifications, setNotifications] = useState<Notification[]>(INITIAL_NOTIFICATIONS);

  // Active UI Navigation state
  const [currentView, setCurrentView] = useState<'admin' | 'analytics' | 'mobile' | 'architecture'>('admin');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
  const [showNotificationPanel, setShowNotificationPanel] = useState<boolean>(false);

  // Track geofence state transitions to prevent multiple trigger firings
  // Map of EmployeeId -> Set of GeofenceIds they are currently inside
  const employeeInsideGeofences = useRef<Record<string, Set<string>>>({});

  // Initialize tracking inside sets on start
  useEffect(() => {
    const tracker: Record<string, Set<string>> = {};
    employees.forEach(emp => {
      tracker[emp.id] = new Set<string>();
      geofences.forEach(geo => {
        if (geo.type === GeofenceType.CIRCLE && geo.radius) {
          const dist = getDistanceMeters(emp.coords, geo.coords);
          if (dist <= geo.radius) {
            tracker[emp.id].add(geo.id);
          }
        }
      });
    });
    employeeInsideGeofences.current = tracker;
  }, []);

  // System notification builder helper
  const triggerNotification = (type: string, message: string, empId: string) => {
    const emp = employees.find(e => e.id === empId);
    const newNotif: Notification = {
      id: `notif_${Date.now()}`,
      employeeId: empId,
      employeeName: emp ? emp.name : 'System Core',
      type: type as NotificationType,
      message,
      timestamp: new Date().toISOString(),
      read: false
    };
    setNotifications(prev => [newNotif, ...prev]);
  };

  // Live GPS Simulation Loop
  // Updates traveling employees every 6 seconds to show dynamic dashboard updates
  useEffect(() => {
    const simulationInterval = setInterval(() => {
      setEmployees(prevEmployees => {
        return prevEmployees.map(emp => {
          if (emp.status !== EmployeeStatus.TRAVELING) return emp;

          // Generate slight coordinate change along a random heading
          const angle = Math.random() * Math.PI * 2;
          const latDelta = Math.sin(angle) * 0.0012; // about 130 meters
          const lngDelta = Math.cos(angle) * 0.0012;

          const newCoords = {
            lat: Math.max(37.7400, Math.min(37.8100, emp.coords.lat + latDelta)),
            lng: Math.max(-122.4600, Math.min(-122.3900, emp.coords.lng + lngDelta))
          };

          // Update total distance covered
          const distanceIncrement = getDistanceMeters(emp.coords, newCoords) / 1000; // in km

          // Geofence check inside the simulation step
          geofences.forEach(geo => {
            if (geo.type === GeofenceType.CIRCLE && geo.radius) {
              const distance = getDistanceMeters(newCoords, geo.coords);
              const insideSet = employeeInsideGeofences.current[emp.id] || new Set<string>();
              const wasInside = insideSet.has(geo.id);
              const isInside = distance <= geo.radius;

              if (isInside && !wasInside) {
                // Entered!
                insideSet.add(geo.id);
                employeeInsideGeofences.current[emp.id] = insideSet;
                
                // Increment enter counts
                setGeofences(prevGeos => prevGeos.map(g => g.id === geo.id ? { ...g, enterCount: g.enterCount + 1 } : g));

                // Notification
                triggerNotification(
                  'GEOFENCE_ENTER',
                  `GPS verified: ${emp.name} entered corporate geofence "${geo.name}" traveling at ${emp.speed} km/h.`,
                  emp.id
                );
              } else if (!isInside && wasInside) {
                // Exited!
                insideSet.delete(geo.id);
                employeeInsideGeofences.current[emp.id] = insideSet;

                // Increment exit counts
                setGeofences(prevGeos => prevGeos.map(g => g.id === geo.id ? { ...g, exitCount: g.exitCount + 1 } : g));

                // Notification
                triggerNotification(
                  'GEOFENCE_EXIT',
                  `GPS verified: ${emp.name} left corporate geofence "${geo.name}" heading downtown.`,
                  emp.id
                );
              }
            }
          });

          // Address approximation based on grid location
          let currentAddress = emp.currentAddress;
          if (newCoords.lat > 37.7900) currentAddress = 'Fisherman\'s Wharf Area, San Francisco, CA';
          else if (newCoords.lat > 37.7700) currentAddress = 'Market Street Corridor, San Francisco, CA';
          else currentAddress = 'Mission District Corridor, San Francisco, CA';

          return {
            ...emp,
            coords: newCoords,
            totalDistance: emp.totalDistance + distanceIncrement,
            currentAddress,
            lastUpdate: new Date().toISOString()
          };
        });
      });
    }, 6000);

    return () => clearInterval(simulationInterval);
  }, [geofences]);

  // Mark all notifications as read
  const handleMarkAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center">
        <span className="w-8 h-8 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mb-4" />
        <span className="text-slate-400 font-mono text-sm tracking-widest uppercase">INITIALIZING TELEMETRY...</span>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col font-sans text-slate-100">
      
      {/* 1. Global Navigation Navbar */}
      <header className="bg-slate-900/80 border-b border-slate-850 sticky top-0 z-40 backdrop-blur-md px-6 py-4 flex flex-col md:flex-row justify-between items-center gap-4">

        
        {/* Logo and title */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-blue-500/20">
            <Compass className="w-5.5 h-5.5 animate-pulse" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-white tracking-tight flex items-center gap-1.5">
              MetroLogix GIS GPS Hub
              <span className="text-[9.5px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-mono uppercase tracking-wider font-bold">Secure</span>
            </h1>
            <p className="text-[11px] text-slate-400 mt-0.5">Corporate Field Logistics Telemetry & Audit Engine</p>
          </div>
        </div>

        {/* View Switcher Controls (Segments) */}
        <div className="flex bg-slate-950 border border-slate-800 rounded-xl p-1 shrink-0">
          <button
            onClick={() => { setCurrentView('admin'); setSelectedEmployeeId(null); }}
            className={`flex items-center gap-2 text-xs font-bold px-4 py-2 rounded-lg transition-all ${
              currentView === 'admin' 
                ? 'bg-slate-850 text-white shadow' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <LayoutDashboard className="w-4 h-4 text-blue-400" />
            <span className="hidden sm:inline">Admin Live GIS</span>
          </button>

          <button
            onClick={() => setCurrentView('analytics')}
            className={`flex items-center gap-2 text-xs font-bold px-4 py-2 rounded-lg transition-all ${
              currentView === 'analytics' 
                ? 'bg-slate-850 text-white shadow' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            <span className="hidden sm:inline">Fleet Analytics</span>
          </button>

          <button
            onClick={() => setCurrentView('mobile')}
            className={`flex items-center gap-2 text-xs font-bold px-4 py-2 rounded-lg transition-all ${
              currentView === 'mobile' 
                ? 'bg-slate-850 text-white shadow' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Smartphone className="w-4 h-4 text-purple-400" />
            <span className="hidden sm:inline">Staff Mobile App</span>
          </button>

          <button
            onClick={() => setCurrentView('architecture')}
            className={`flex items-center gap-2 text-xs font-bold px-4 py-2 rounded-lg transition-all ${
              currentView === 'architecture' 
                ? 'bg-slate-850 text-white shadow' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Cpu className="w-4 h-4 text-amber-400" />
            <span className="hidden sm:inline">Architecture Docs</span>
          </button>
        </div>

        {/* Right Nav Options: Notification bell & health */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 mr-2 border-r border-slate-800 pr-4">
            <div className="flex flex-col items-end hidden md:flex">
              <span className="text-xs font-bold text-white">{user?.name}</span>
              <span className="text-[10px] text-slate-400 font-mono">{user?.role}</span>
            </div>
            <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-slate-300">
              {user?.name?.charAt(0) || 'U'}
            </div>
          </div>
          
          <button
            onClick={() => setShowNotificationPanel(!showNotificationPanel)}
            className="w-10 h-10 flex items-center justify-center bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-xl relative hover:text-white transition-all"
            title="Real-Time Alerts"
          >
            <Bell className="w-4 h-4" />
            {notifications.filter(n => !n.read).length > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-slate-900">
                {notifications.filter(n => !n.read).length}
              </span>
            )}
          </button>
          
          <button
            onClick={logout}
            className="w-10 h-10 flex items-center justify-center bg-slate-950 hover:bg-rose-500/10 hover:border-rose-500/30 border border-slate-800 text-slate-300 hover:text-rose-400 rounded-xl transition-all"
            title="Secure Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* 2. Main Dashboard Layout Area */}
      <main className="flex-1 px-6 py-8">
        {currentView === 'admin' && (
          <AdminDashboard
            employees={employees}
            geofences={geofences}
            customers={customers}
            visits={visits}
            attendanceLogs={attendanceLogs}
            notifications={notifications}
            selectedEmployeeId={selectedEmployeeId}
            onSelectEmployee={setSelectedEmployeeId}
            onAddGeofence={(geo) => setGeofences(prev => [geo, ...prev])}
            onAddNotification={(n) => triggerNotification(n.type, n.message, n.empId)}
            onClearNotifications={() => setNotifications([])}
            onUpdateEmployee={(updated) => setEmployees(prev => prev.map(e => e.id === updated.id ? updated : e))}
          />
        )}

        {currentView === 'analytics' && (
          <div className="bg-slate-950 p-6 border border-slate-850 rounded-3xl">
            <h3 className="text-base font-bold text-white mb-6">Fleet Telematics Analytics Dashboard</h3>
            <AnalyticsCharts employees={employees} />
          </div>
        )}

        {currentView === 'mobile' && (
          <EmployeeMobileApp
            employees={employees}
            visits={visits}
            customers={customers}
            attendanceLogs={attendanceLogs}
            onUpdateEmployee={(updated) => setEmployees(prev => prev.map(e => e.id === updated.id ? updated : e))}
            onAddVisit={(visit) => setVisits(prev => [visit, ...prev])}
            onUpdateVisit={(updated) => setVisits(prev => prev.map(v => v.id === updated.id ? updated : v))}
            onAddAttendance={(log) => setAttendanceLogs(prev => [log, ...prev])}
            onUpdateAttendance={(updated) => setAttendanceLogs(prev => prev.map(a => a.id === updated.id ? updated : a))}
            onAddNotification={(n) => triggerNotification(n.type, n.message, n.empId)}
          />
        )}

        {currentView === 'architecture' && (
          <SystemArchitecture />
        )}
      </main>

      {/* Floating Real-Time System Notification Slide-out */}
      {showNotificationPanel && (
        <div className="fixed top-24 right-6 z-50 bg-slate-950 border border-slate-800 rounded-2xl w-96 max-h-[500px] overflow-hidden flex flex-col shadow-2xl animate-fadeIn">
          <div className="bg-slate-900 px-5 py-3.5 border-b border-slate-850 flex justify-between items-center">
            <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <Bell className="w-3.5 h-3.5 text-blue-400" /> Live Security Logs
            </span>
            <div className="flex gap-2">
              <button 
                onClick={handleMarkAllRead}
                className="text-[10px] text-blue-400 hover:text-white underline font-bold"
              >
                Mark all read
              </button>
              <button 
                onClick={() => setNotifications([])}
                className="text-[10px] text-rose-400 hover:text-rose-300 font-bold"
              >
                Clear all
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-850 p-3 bg-slate-950">
            {notifications.length === 0 ? (
              <div className="text-center p-8 text-slate-500 text-xs font-mono">
                No active tracking alerts.
              </div>
            ) : (
              notifications.map(notif => (
                <div key={notif.id} className={`p-3 text-[11px] leading-relaxed transition-colors ${notif.read ? 'text-slate-400' : 'bg-slate-900/30 text-slate-200 font-medium'}`}>
                  <div className="flex justify-between items-start gap-2">
                    <span className="font-bold flex items-center gap-1">
                      {notif.type === 'GEOFENCE_ENTER' && <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />}
                      {notif.type === 'GEOFENCE_EXIT' && <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />}
                      {notif.type === 'LOW_BATTERY' && <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />}
                      {notif.employeeName}
                    </span>
                    <span className="text-[9px] text-slate-500 font-mono shrink-0">
                      {new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                  </div>
                  <p className="mt-1 font-sans text-slate-400 text-[10px] leading-normal">{notif.message}</p>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Global Bottom Status Bar */}
      <footer className="bg-slate-950 border-t border-slate-850 px-6 py-4 flex flex-col md:flex-row justify-between items-center text-[10px] font-mono text-slate-500 gap-2">
        <span>© 2026 MetroLogix Technologies, Inc. GDPR Privacy Authorized.</span>
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Telemetry pipeline: SECURE</span>
          <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> PostGIS GIST Indexing: ON</span>
        </div>
      </footer>
    </div>
  );
};

export default App;
