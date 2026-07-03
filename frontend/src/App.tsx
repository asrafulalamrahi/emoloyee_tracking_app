import React, { useState, useEffect, useRef } from 'react';
import { Employee } from './types';
import { INITIAL_EMPLOYEES } from './data';
import { AdminDashboard } from './components/AdminDashboard';
import { EmployeeMobileApp } from './components/EmployeeMobileApp';
import { Login } from './components/auth/Login';
import { useAuth } from './contexts/AuthContext';
import { 
  Compass,
  Smartphone,
  LayoutDashboard,
  LogOut,
  Wifi,
  Loader2
} from 'lucide-react';
import { io, Socket } from 'socket.io-client';

const App: React.FC = () => {
  const { user, loading, logout } = useAuth();

  // Employee Fleet State
  const [employees, setEmployees] = useState<Employee[]>(INITIAL_EMPLOYEES);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
  
  // Navigation tabs
  const [currentView, setCurrentView] = useState<'admin' | 'mobile'>('admin');
  const [isLoadingLive, setIsLoadingLive] = useState(false);
  
  // Real-Time Socket Reference
  const socketRef = useRef<Socket | null>(null);

  // Fetch live fleet details from DB
  const fetchLiveFleet = async () => {
    setIsLoadingLive(true);
    try {
      const response = await fetch('/api/locations/live');
      if (response.ok) {
        const data = await response.json();
        
        // Map any missing device structure so React safely binds details
        const mappedData = data.map((emp: any) => ({
          ...emp,
          device: emp.device || {
            deviceName: 'Handset Model Generic',
            platform: 'Android',
            batteryLevel: 90,
            isGpsEnabled: true,
            locationPermission: 'GRANTED'
          }
        }));

        setEmployees(mappedData);
      }
    } catch (err) {
      console.error('Failed to query live coordinates:', err);
    } finally {
      setIsLoadingLive(false);
    }
  };

  // 1. Initial Load Fetch
  useEffect(() => {
    if (user) {
      fetchLiveFleet();
    }
  }, [user]);

  // 2. Real-Time Socket.IO Synchronization Pipeline
  useEffect(() => {
    if (!user) return;

    // Connect to the WebSocket Host (Proxies safely in Dev and Production modes)
    const socket = io();
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('Real-Time WebSockets linked to NestJS gateway!');
    });

    // Listen to real-time coordinate broadcasts
    socket.on('location_update', (data: {
      employeeId: string;
      name: string;
      role: string;
      status: string;
      lat: number;
      lng: number;
      batteryLevel?: number;
      timestamp: string;
    }) => {
      setEmployees(prevEmployees => {
        return prevEmployees.map(emp => {
          if (emp.id === data.employeeId) {
            return {
              ...emp,
              status: data.status,
              lastLat: data.lat,
              lastLng: data.lng,
              lastLocationUpdate: data.timestamp,
              device: emp.device ? {
                ...emp.device,
                batteryLevel: data.batteryLevel ?? emp.device.batteryLevel,
              } : {
                id: `dev-${data.employeeId}`,
                employeeId: data.employeeId,
                deviceName: 'Generic Handset',
                platform: 'Android',
                batteryLevel: data.batteryLevel ?? 80,
                isGpsEnabled: true,
                locationPermission: 'GRANTED'
              }
            };
          }
          return emp;
        });
      });
    });

    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-4" />
        <span className="text-slate-400 font-mono text-sm tracking-widest uppercase">INITIALIZING METROLOGIX...</span>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col font-sans text-slate-100">
      
      {/* Navigation Header */}
      <header className="bg-slate-900/90 border-b border-slate-850 sticky top-0 z-40 backdrop-blur-md px-6 py-4 flex flex-col md:flex-row justify-between items-center gap-4">
        
        {/* Logo and metadata status */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-blue-500/20">
            <Compass className="w-5.5 h-5.5" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-white tracking-tight flex items-center gap-1.5 font-mono">
              MetroLogix Telemetry Hub
              <span className="text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full uppercase tracking-wider font-bold">Secure</span>
            </h1>
            <p className="text-[11px] text-slate-400 mt-0.5">Corporate Field Logistics Live Location System</p>
          </div>
        </div>

        {/* View Switche segment layout */}
        <div className="flex bg-slate-950 border border-slate-800 rounded-xl p-1 shrink-0">
          <button
            onClick={() => { setCurrentView('admin'); setSelectedEmployeeId(null); }}
            className={`flex items-center gap-2 text-xs font-bold px-4 py-2 rounded-lg transition-all cursor-pointer ${
              currentView === 'admin' 
                ? 'bg-slate-850 text-white shadow' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <LayoutDashboard className="w-4 h-4 text-blue-400" />
            <span>Admin Live Map</span>
          </button>

          <button
            onClick={() => setCurrentView('mobile')}
            className={`flex items-center gap-2 text-xs font-bold px-4 py-2 rounded-lg transition-all cursor-pointer ${
              currentView === 'mobile' 
                ? 'bg-slate-850 text-white shadow' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Smartphone className="w-4 h-4 text-purple-400" />
            <span>Rider Phone Simulator</span>
          </button>
        </div>

        {/* Right user metadata options */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 mr-2 border-r border-slate-850 pr-4">
            <div className="flex flex-col items-end hidden md:flex">
              <span className="text-xs font-bold text-white">{user?.name}</span>
              <span className="text-[10px] text-slate-400 font-mono">{user?.role}</span>
            </div>
            <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-slate-300">
              {user?.name?.charAt(0) || 'A'}
            </div>
          </div>
          
          <button
            onClick={logout}
            className="w-10 h-10 flex items-center justify-center bg-slate-950 hover:bg-rose-500/10 hover:border-rose-500/30 border border-slate-850 text-slate-400 hover:text-rose-400 rounded-xl transition-all cursor-pointer"
            title="Log out of system"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Panel Operations Area */}
      <main className="flex-1 px-6 py-8">
        {currentView === 'admin' ? (
          <AdminDashboard
            employees={employees}
            selectedEmployeeId={selectedEmployeeId}
            onSelectEmployee={setSelectedEmployeeId}
            isLoadingLive={isLoadingLive}
            onRefresh={fetchLiveFleet}
          />
        ) : (
          <EmployeeMobileApp />
        )}
      </main>

      {/* Global compliance footer */}
      <footer className="bg-slate-950 border-t border-slate-850 px-6 py-4 flex flex-col md:flex-row justify-between items-center text-[10px] font-mono text-slate-500 gap-2">
        <span>© 2026 MetroLogix Systems. GPS Transmission active strictly during shift hours.</span>
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <Wifi className="w-3.5 h-3.5 text-emerald-500" /> WebSockets pipeline: ACTIVE
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Telemetry: SECURE
          </span>
        </div>
      </footer>
    </div>
  );
};

export default App;
