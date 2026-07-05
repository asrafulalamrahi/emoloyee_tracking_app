import React, { useState, useEffect, useRef } from 'react';
import { 
  Employee, 
  EmployeeStatus, 
  Geofence, 
  GeofenceType, 
  Customer, 
  Visit, 
  VisitStatus, 
  Attendance, 
  AttendanceStatus, 
  Notification, 
  NotificationType,
  Coordinates
} from './types';
import { 
  Compass, 
  LayoutDashboard, 
  TrendingUp, 
  Smartphone, 
  Cpu, 
  Bell, 
  LogOut 
} from 'lucide-react';
import { AdminDashboard } from './components/AdminDashboard';
import { AnalyticsCharts } from './components/AnalyticsCharts';
import { EmployeeMobileApp } from './components/EmployeeMobileApp';
import { SystemArchitecture } from './components/SystemArchitecture';
import { Login } from './components/auth/Login';
import { useAuth } from './contexts/AuthContext';
import { 
  INITIAL_EMPLOYEES, 
  INITIAL_GEOFENCES, 
  INITIAL_CUSTOMERS, 
  INITIAL_VISITS, 
  INITIAL_ATTENDANCE, 
  INITIAL_NOTIFICATIONS,
  HISTORICAL_ROUTES
} from './data';
import { io, Socket } from 'socket.io-client';

// Helper for distance calculations (haversine)
const getDistanceMeters = (c1: Coordinates, c2: Coordinates) => {
  const R = 6371e3; // metres
  const phi1 = (c1.lat * Math.PI) / 180;
  const phi2 = (c2.lat * Math.PI) / 180;
  const deltaPhi = ((c2.lat - c1.lat) * Math.PI) / 180;
  const deltaLambda = ((c2.lng - c1.lng) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // in metres
};

const App: React.FC = () => {
  const { user, token, loading, logout } = useAuth();

  // Global Database state
  const [employees, setEmployees] = useState<Employee[]>(INITIAL_EMPLOYEES);
  const [geofences, setGeofences] = useState<Geofence[]>(INITIAL_GEOFENCES);
  const [customers, setCustomers] = useState<Customer[]>(INITIAL_CUSTOMERS);
  const [visits, setVisits] = useState<Visit[]>(INITIAL_VISITS);
  const [attendanceLogs, setAttendanceLogs] = useState<Attendance[]>(INITIAL_ATTENDANCE);
  const [notifications, setNotifications] = useState<Notification[]>(INITIAL_NOTIFICATIONS);

  // Connection mode state
  const [useBackend, setUseBackend] = useState<boolean>(false);
  const socketRef = useRef<Socket | null>(null);

  // Active UI Navigation state
  const [currentView, setCurrentView] = useState<'admin' | 'analytics' | 'mobile' | 'architecture'>('admin');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
  const [showNotificationPanel, setShowNotificationPanel] = useState<boolean>(false);

  // Track geofence state transitions to prevent multiple trigger firings
  const employeeInsideGeofences = useRef<Record<string, Set<string>>>({});

  // 1. Fetch data from backend API if available, otherwise fall back to mock data
  useEffect(() => {
    if (!user) return;

    const loadBackendData = async () => {
      try {
        const headers: HeadersInit = { 'Content-Type': 'application/json' };
        if (token && !token.startsWith('demo-token-')) {
          headers['Authorization'] = `Bearer ${token}`;
        }

        // Check backend availability
        const empRes = await fetch('/api/employees', { headers, signal: AbortSignal.timeout(3000) });
        if (empRes.ok) {
          const empsData = await empRes.ok ? await empRes.json() : [];
          if (empsData && empsData.length > 0) {
            // Map DB entities to UI state structure
            const mappedEmps = empsData.map((emp: any) => {
              const matchedMock = INITIAL_EMPLOYEES.find(e => e.email === emp.email) || INITIAL_EMPLOYEES[0];
              return {
                ...matchedMock,
                id: emp.id,
                name: emp.name,
                email: emp.email,
                role: emp.role,
                phone: emp.phone || matchedMock.phone,
                status: emp.status as EmployeeStatus,
                battery: emp.device?.batteryLevel ?? matchedMock.battery,
                gpsAccuracy: emp.device?.isGpsEnabled ? 4.2 : 0,
                coords: emp.lastLat && emp.lastLng ? { lat: emp.lastLat, lng: emp.lastLng } : matchedMock.coords,
                deviceName: emp.device?.deviceName || matchedMock.deviceName,
                devicePlatform: emp.device?.platform || matchedMock.devicePlatform,
                deviceApprovalStatus: 'APPROVED',
                internetStatus: emp.status === 'OFFLINE' ? 'offline' : 'online',
                lastUpdate: emp.lastLocationUpdate || new Date().toISOString(),
                department: emp.department || matchedMock.department,
                designation: emp.designation || matchedMock.designation,
                branch: emp.branch || matchedMock.branch,
                factory: emp.factory || matchedMock.factory,
                region: emp.region || matchedMock.region,
                avatar: emp.photoUrl || emp.avatar || matchedMock.avatar,
                qrCode: emp.qrCode || matchedMock.qrCode,
                employeeCode: emp.employeeCode || matchedMock.employeeCode
              };
            });
            setEmployees(mappedEmps);
          }

          // Customers
          const custRes = await fetch('/api/customers', { headers });
          if (custRes.ok) {
            const custs = await custRes.json();
            if (custs.length > 0) {
              setCustomers(custs.map((c: any) => ({
                id: c.id,
                name: c.name,
                address: c.address,
                coords: { lat: c.lat || 37.7749, lng: c.lng || -122.4194 },
                contactPerson: c.contactPerson || '',
                phone: c.phone || '',
                email: c.email || ''
              })));
            }
          }

          // Geofences
          const geoRes = await fetch('/api/geofences', { headers });
          if (geoRes.ok) {
            const geos = await geoRes.json();
            if (geos.length > 0) {
              setGeofences(geos.map((g: any) => ({
                id: g.id,
                name: g.name,
                type: g.type as GeofenceType,
                coords: { lat: g.centerLat, lng: g.centerLng },
                radius: g.radius,
                polygonPath: g.polygonPath || undefined,
                status: g.status,
                targetTeams: g.targetTeams,
                enterCount: g.enterCount,
                exitCount: g.exitCount
              })));
            }
          }

          // Visits
          const visitRes = await fetch('/api/visits', { headers });
          if (visitRes.ok) {
            const vsts = await visitRes.json();
            if (vsts.length > 0) setVisits(vsts);
          }

          // Attendance
          const attRes = await fetch('/api/attendance', { headers });
          if (attRes.ok) {
            const atts = await attRes.json();
            if (atts.length > 0) setAttendanceLogs(atts);
          }

          // Notifications
          const notifRes = await fetch('/api/notifications', { headers });
          if (notifRes.ok) {
            const notifs = await notifRes.json();
            if (notifs.length > 0) setNotifications(notifs);
          }

          setUseBackend(true);
          console.log('Successfully connected to NestJS backend database API.');
        }
      } catch (err) {
        console.warn('Backend server is offline or database URL is not configured. Running in UI Demo sandbox.', err);
      }
    };

    loadBackendData();
  }, [user, token]);

  // 2. Setup WebSocket connection for live telemetry feeds
  useEffect(() => {
    if (!user || !useBackend) return;

    const socket = io('/', {
      transports: ['websocket', 'polling'],
      autoConnect: true
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('Connected to real-time GIS telemetry WebSocket pipeline.');
      socket.emit('subscribe_locations');
    });

    socket.on('location_update', (data: any) => {
      console.log('WebSocket telemetry point received:', data);
      setEmployees(prev => prev.map(emp => {
        if (emp.id === data.employeeId) {
          return {
            ...emp,
            status: data.status as EmployeeStatus,
            coords: { lat: data.lat, lng: data.lng },
            battery: data.batteryLevel ?? emp.battery,
            lastUpdate: data.timestamp
          };
        }
        return emp;
      }));
    });

    return () => {
      socket.disconnect();
    };
  }, [user, useBackend]);

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
  const triggerNotification = async (type: string, message: string, empId: string) => {
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

    if (useBackend) {
      try {
        const headers: HeadersInit = { 'Content-Type': 'application/json' };
        if (token && !token.startsWith('demo-token-')) {
          headers['Authorization'] = `Bearer ${token}`;
        }
        await fetch('/api/notifications', {
          method: 'POST',
          headers,
          body: JSON.stringify(newNotif)
        });
      } catch (err) {
        console.error('Failed to sync notification to database:', err);
      }
    }
  };

  // Sync state modifications to backend database if active
  const handleUpdateEmployee = async (updated: Employee) => {
    setEmployees(prev => prev.map(e => e.id === updated.id ? updated : e));

    if (useBackend) {
      try {
        const headers: HeadersInit = { 'Content-Type': 'application/json' };
        if (token && !token.startsWith('demo-token-')) {
          headers['Authorization'] = `Bearer ${token}`;
        }
        
        // Log telemetry event
        await fetch('/api/locations', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            employeeId: updated.id,
            lat: updated.coords.lat,
            lng: updated.coords.lng,
            batteryLevel: updated.battery,
            deviceName: updated.deviceName,
            platform: updated.devicePlatform,
            isGpsEnabled: updated.gpsEnabled,
            locationPermission: updated.locationPermission
          })
        });

        // Update employee status and details
        await fetch(`/api/employees/${updated.id}`, {
          method: 'PUT',
          headers,
          body: JSON.stringify({
            status: updated.status,
            phone: updated.phone,
            name: updated.name,
            role: updated.role,
            department: updated.department,
            designation: updated.designation,
            branch: updated.branch,
            factory: updated.factory,
            region: updated.region,
            photoUrl: updated.avatar,
            qrCode: updated.qrCode,
            employeeCode: updated.employeeCode,
            deviceName: updated.deviceName,
            platform: updated.devicePlatform
          })
        });
      } catch (err) {
        console.error('Telemetry logging fail:', err);
      }
    }
  };

  const handleAddEmployee = async (newEmpData: any) => {
    if (useBackend) {
      try {
        const headers: HeadersInit = { 'Content-Type': 'application/json' };
        if (token && !token.startsWith('demo-token-')) {
          headers['Authorization'] = `Bearer ${token}`;
        }
        const res = await fetch('/api/employees', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            name: newEmpData.name,
            email: newEmpData.email,
            password: newEmpData.password || 'rider123',
            phone: newEmpData.phone,
            role: newEmpData.role || 'RIDER',
            employeeCode: newEmpData.employeeCode || newEmpData.code,
            department: newEmpData.department || 'Operations',
            designation: newEmpData.designation || 'Staff',
            branch: newEmpData.branch || 'Chittagong',
            factory: newEmpData.factory || 'Steel Plant',
            region: newEmpData.region || 'Chattogram',
            photoUrl: newEmpData.photoUrl || newEmpData.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
            deviceName: newEmpData.deviceName,
            platform: newEmpData.platform
          })
        });
        if (res.ok) {
          const emp = await res.json();
          const matchedMock = INITIAL_EMPLOYEES[0];
          const newMapped: Employee = {
            ...matchedMock,
            id: emp.id,
            name: emp.name,
            email: emp.email,
            role: emp.role,
            phone: emp.phone || '',
            status: emp.status as EmployeeStatus,
            battery: 100,
            gpsAccuracy: 0,
            coords: { lat: 22.3244, lng: 91.8122 },
            deviceName: emp.device?.deviceName || 'Pending Binding',
            devicePlatform: emp.device?.platform || 'Android',
            deviceApprovalStatus: 'NOT_ACTIVATED',
            internetStatus: 'offline',
            lastUpdate: new Date().toISOString(),
            department: emp.department || 'Operations',
            designation: emp.designation || 'Staff',
            branch: emp.branch || 'Chittagong',
            factory: emp.factory || 'Steel Plant',
            region: emp.region || 'Chattogram',
            avatar: emp.photoUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
            qrCode: emp.qrCode || `AKG-EMP-${emp.employeeCode}`,
            employeeCode: emp.employeeCode,
          };
          setEmployees(prev => [...prev, newMapped]);
        } else {
          const errData = await res.json();
          alert(`Failed to add employee: ${errData.message || 'Unknown error'}`);
        }
      } catch (err) {
        console.error('Failed to add employee:', err);
      }
    } else {
      const demoId = `emp_${Date.now()}`;
      const newMapped: Employee = {
        ...INITIAL_EMPLOYEES[0],
        id: demoId,
        name: newEmpData.name,
        email: newEmpData.email,
        role: newEmpData.role || 'RIDER',
        phone: newEmpData.phone || '',
        department: newEmpData.department || 'Operations',
        designation: newEmpData.designation || 'Staff',
        branch: newEmpData.branch || 'Chittagong',
        factory: newEmpData.factory || 'Steel Plant',
        region: newEmpData.region || 'Chattogram',
        avatar: newEmpData.photoUrl || newEmpData.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
        qrCode: `AKG-EMP-${newEmpData.employeeCode || 'DEMO'}`,
        employeeCode: newEmpData.employeeCode,
        deviceName: newEmpData.deviceName || 'Demo Device',
        devicePlatform: newEmpData.platform || 'Android',
        deviceApprovalStatus: 'NOT_ACTIVATED',
        status: EmployeeStatus.OFFLINE,
        coords: { lat: 22.3244, lng: 91.8122 }
      };
      setEmployees(prev => [...prev, newMapped]);
    }
  };

  const handleDeleteEmployee = async (id: string) => {
    if (useBackend) {
      try {
        const headers: HeadersInit = { 'Content-Type': 'application/json' };
        if (token && !token.startsWith('demo-token-')) {
          headers['Authorization'] = `Bearer ${token}`;
        }
        const res = await fetch(`/api/employees/${id}`, {
          method: 'DELETE',
          headers
        });
        if (res.ok) {
          setEmployees(prev => prev.filter(e => e.id !== id));
        } else {
          const errData = await res.json();
          alert(`Failed to delete employee: ${errData.message || 'Unknown error'}`);
        }
      } catch (err) {
        console.error('Failed to delete employee:', err);
      }
    } else {
      setEmployees(prev => prev.filter(e => e.id !== id));
    }
  };

  const handleAddVisit = async (visit: Visit) => {
    setVisits(prev => [visit, ...prev]);
    if (useBackend) {
      try {
        const headers: HeadersInit = { 'Content-Type': 'application/json' };
        if (token && !token.startsWith('demo-token-')) {
          headers['Authorization'] = `Bearer ${token}`;
        }
        await fetch('/api/visits', {
          method: 'POST',
          headers,
          body: JSON.stringify(visit)
        });
      } catch (err) {
        console.error('Failed to create visit:', err);
      }
    }
  };

  const handleUpdateVisit = async (updated: Visit) => {
    setVisits(prev => prev.map(v => v.id === updated.id ? updated : v));
    if (useBackend) {
      try {
        const headers: HeadersInit = { 'Content-Type': 'application/json' };
        if (token && !token.startsWith('demo-token-')) {
          headers['Authorization'] = `Bearer ${token}`;
        }
        await fetch(`/api/visits/${updated.id}`, {
          method: 'PUT',
          headers,
          body: JSON.stringify(updated)
        });
      } catch (err) {
        console.error('Failed to update visit:', err);
      }
    }
  };

  const handleAddAttendance = async (log: Attendance) => {
    setAttendanceLogs(prev => [log, ...prev]);
    if (useBackend) {
      try {
        const headers: HeadersInit = { 'Content-Type': 'application/json' };
        if (token && !token.startsWith('demo-token-')) {
          headers['Authorization'] = `Bearer ${token}`;
        }
        await fetch('/api/attendance/clock-in', {
          method: 'POST',
          headers,
          body: JSON.stringify({ employeeId: log.employeeId, date: log.date })
        });
      } catch (err) {
        console.error('Failed to sync clock-in:', err);
      }
    }
  };

  const handleUpdateAttendance = async (updated: Attendance) => {
    setAttendanceLogs(prev => prev.map(a => a.id === updated.id ? updated : a));
    if (useBackend) {
      try {
        const headers: HeadersInit = { 'Content-Type': 'application/json' };
        if (token && !token.startsWith('demo-token-')) {
          headers['Authorization'] = `Bearer ${token}`;
        }
        await fetch('/api/attendance/clock-out', {
          method: 'POST',
          headers,
          body: JSON.stringify({ employeeId: updated.employeeId, date: updated.date })
        });
      } catch (err) {
        console.error('Failed to sync clock-out:', err);
      }
    }
  };

  const handleAddGeofence = async (geo: Geofence) => {
    setGeofences(prev => [geo, ...prev]);
    if (useBackend) {
      try {
        const headers: HeadersInit = { 'Content-Type': 'application/json' };
        if (token && !token.startsWith('demo-token-')) {
          headers['Authorization'] = `Bearer ${token}`;
        }
        await fetch('/api/geofences', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            name: geo.name,
            type: geo.type,
            centerLat: geo.coords.lat,
            centerLng: geo.coords.lng,
            radius: geo.radius,
            polygonPath: geo.polygonPath,
            status: geo.status,
            targetTeams: geo.targetTeams
          })
        });
      } catch (err) {
        console.error('Failed to create geofence:', err);
      }
    }
  };

  const handleMarkAllRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    if (useBackend) {
      try {
        const headers: HeadersInit = { 'Content-Type': 'application/json' };
        if (token && !token.startsWith('demo-token-')) {
          headers['Authorization'] = `Bearer ${token}`;
        }
        await fetch('/api/notifications/read-all', { method: 'PUT', headers });
      } catch (err) {
        console.error('Failed to sync notification updates:', err);
      }
    }
  };

  const handleClearNotifications = async () => {
    setNotifications([]);
    if (useBackend) {
      try {
        const headers: HeadersInit = { 'Content-Type': 'application/json' };
        if (token && !token.startsWith('demo-token-')) {
          headers['Authorization'] = `Bearer ${token}`;
        }
        await fetch('/api/notifications/clear', { method: 'DELETE', headers });
      } catch (err) {
        console.error('Failed to clear notifications:', err);
      }
    }
  };

  // Live GPS Simulation Loop
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
                insideSet.add(geo.id);
                employeeInsideGeofences.current[emp.id] = insideSet;
                
                setGeofences(prevGeos => prevGeos.map(g => g.id === geo.id ? { ...g, enterCount: g.enterCount + 1 } : g));

                triggerNotification(
                  'GEOFENCE_ENTER',
                  `GPS verified: ${emp.name} entered corporate geofence "${geo.name}" traveling at ${emp.speed} km/h.`,
                  emp.id
                );
              } else if (!isInside && wasInside) {
                insideSet.delete(geo.id);
                employeeInsideGeofences.current[emp.id] = insideSet;

                setGeofences(prevGeos => prevGeos.map(g => g.id === geo.id ? { ...g, exitCount: g.exitCount + 1 } : g));

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

          const updatedEmp = {
            ...emp,
            coords: newCoords,
            totalDistance: emp.totalDistance + distanceIncrement,
            currentAddress,
            lastUpdate: new Date().toISOString()
          };

          // Auto-sync coordinates to database if running with backend
          if (useBackend) {
            handleUpdateEmployee(updatedEmp);
          }

          return updatedEmp;
        });
      });
    }, 6000);

    return () => clearInterval(simulationInterval);
  }, [geofences, useBackend]);

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
              {useBackend ? (
                <span className="text-[9.5px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-mono uppercase tracking-wider font-bold">Live DB Connected</span>
              ) : (
                <span className="text-[9.5px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-full font-mono uppercase tracking-wider font-bold">UI Sandbox</span>
              )}
            </h1>
            <p className="text-[11px] text-slate-400 mt-0.5">Corporate Field Logistics Telemetry & Audit Engine</p>
          </div>
        </div>

        {/* View Switcher Controls */}
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

        {/* Right Nav Options */}
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
            onAddGeofence={handleAddGeofence}
            onAddNotification={(n) => triggerNotification(n.type, n.message, n.empId)}
            onClearNotifications={handleClearNotifications}
            onUpdateEmployee={handleUpdateEmployee}
            onAddEmployee={handleAddEmployee}
            onDeleteEmployee={handleDeleteEmployee}
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
            onUpdateEmployee={handleUpdateEmployee}
            onAddVisit={handleAddVisit}
            onUpdateVisit={handleUpdateVisit}
            onAddAttendance={handleAddAttendance}
            onUpdateAttendance={handleUpdateAttendance}
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
                onClick={handleClearNotifications}
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
