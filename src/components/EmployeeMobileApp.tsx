import React, { useState } from 'react';
import { 
  Employee, 
  EmployeeStatus, 
  Visit, 
  Customer, 
  VisitStatus, 
  Attendance, 
  AttendanceStatus 
} from '../types';
import { 
  Wifi, 
  WifiOff, 
  Battery, 
  BatteryLow, 
  Play, 
  Square, 
  CheckCircle, 
  Camera, 
  PenTool, 
  MapPin, 
  Clock, 
  ShieldCheck, 
  Sliders,
  CheckSquare
} from 'lucide-react';

interface EmployeeMobileAppProps {
  employees: Employee[];
  visits: Visit[];
  customers: Customer[];
  attendanceLogs: Attendance[];
  onUpdateEmployee: (emp: Employee) => void;
  onAddVisit: (visit: Visit) => void;
  onUpdateVisit: (visit: Visit) => void;
  onAddAttendance: (log: Attendance) => void;
  onUpdateAttendance: (log: Attendance) => void;
  onAddNotification: (notif: { type: string; message: string; empId: string }) => void;
}

export const EmployeeMobileApp: React.FC<EmployeeMobileAppProps> = ({
  employees,
  visits,
  customers,
  attendanceLogs,
  onUpdateEmployee,
  onAddVisit,
  onUpdateVisit,
  onAddAttendance,
  onUpdateAttendance,
  onAddNotification
}) => {
  // Mobile UI States
  const [selectedEmpId, setSelectedEmpId] = useState<string>('emp_1'); // Default Sarah or Alex
  const [gpsConsent, setGpsConsent] = useState<boolean>(true);
  const [consentModal, setConsentModal] = useState<boolean>(false);
  const [, setShowSettings] = useState<boolean>(false);
  
  // Active Visit States
  const [activeVisitId, setActiveVisitId] = useState<string | null>(null);
  const [visitNotes, setVisitNotes] = useState<string>('');
  const [signatureName, setSignatureName] = useState<string>('');
  const [photoUrl, setPhotoUrl] = useState<string>('');
  const [isUploadingPhoto, setIsUploadingPhoto] = useState<boolean>(false);

  const currentEmp = employees.find(e => e.id === selectedEmpId) || employees[0];
  const empVisits = visits.filter(v => v.employeeId === currentEmp.id);
  const todayAttendance = attendanceLogs.find(a => a.employeeId === currentEmp.id && a.date === new Date().toISOString().split('T')[0]);

  // Handle Clock In
  const handleClockIn = () => {
    if (!gpsConsent) {
      setConsentModal(true);
      return;
    }

    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const clockInTime = now.toISOString();

    // Determine status (Late if after 9:00 AM)
    const hours = now.getHours();
    const minutes = now.getMinutes();
    let status = AttendanceStatus.PRESENT;
    if (hours > 9 || (hours === 9 && minutes > 0)) {
      status = AttendanceStatus.LATE;
    }

    const newLog: Attendance = {
      id: `att_new_${Date.now()}`,
      employeeId: currentEmp.id,
      date: todayStr,
      clockIn: clockInTime,
      status,
      workingHours: 0.1,
      overtime: 0,
      validatedByGeofence: true
    };

    onAddAttendance(newLog);

    // Update Employee Status
    onUpdateEmployee({
      ...currentEmp,
      status: EmployeeStatus.ONLINE,
      lastUpdate: now.toISOString(),
      currentAddress: 'Clocked In. Waiting for dispatch.'
    });

    onAddNotification({
      type: 'GEOFENCE_ENTER',
      message: `${currentEmp.name} clocked in successfully from mobile app. Validated via HQ Geofence.`,
      empId: currentEmp.id
    });
  };

  // Handle Clock Out
  const handleClockOut = () => {
    if (!todayAttendance) return;

    const now = new Date();
    const clockInTime = new Date(todayAttendance.clockIn);
    const diffMs = now.getTime() - clockInTime.getTime();
    const workingHours = Math.round((diffMs / (1000 * 60 * 60)) * 10) / 10;
    const overtime = Math.max(0, workingHours - 8);

    onUpdateAttendance({
      ...todayAttendance,
      clockOut: now.toISOString(),
      workingHours,
      overtime
    });

    onUpdateEmployee({
      ...currentEmp,
      status: EmployeeStatus.OFFLINE,
      speed: 0,
      lastUpdate: now.toISOString(),
      currentAddress: 'Clocked Out. Offline.'
    });

    onAddNotification({
      type: 'OFFLINE',
      message: `${currentEmp.name} clocked out. Working hours logged: ${workingHours} hrs.`,
      empId: currentEmp.id
    });
  };

  // Toggle Tracking Settings
  const handleToggleTracking = () => {
    if (currentEmp.status === EmployeeStatus.OFFLINE) {
      handleClockIn();
    } else {
      onUpdateEmployee({
        ...currentEmp,
        status: EmployeeStatus.OFFLINE,
        speed: 0,
        lastUpdate: new Date().toISOString()
      });
      onAddNotification({
        type: 'GPS_DISABLED',
        message: `${currentEmp.name} toggled background GPS service OFF. Tracking paused.`,
        empId: currentEmp.id
      });
    }
  };

  // Simulate Telemetry Changes (Manual Slider Adjustments for testing)
  const handleUpdateTelemetry = (field: keyof Employee, value: any) => {
    const updated = {
      ...currentEmp,
      [field]: value,
      lastUpdate: new Date().toISOString()
    };
    onUpdateEmployee(updated);

    // If battery drops low, fire alert
    if (field === 'battery' && value < 20) {
      onAddNotification({
        type: 'LOW_BATTERY',
        message: `${currentEmp.name} battery is critical (${value}%). Background service at risk.`,
        empId: currentEmp.id
      });
    }
  };

  // Start Customer Visit Check-in
  const handleStartVisit = (visitId: string) => {
    const v = visits.find(v => v.id === visitId);
    if (!v) return;

    onUpdateVisit({
      ...v,
      status: VisitStatus.ONGOING,
      arrivalTime: new Date().toISOString()
    });

    onUpdateEmployee({
      ...currentEmp,
      status: EmployeeStatus.IDLE,
      currentAddress: `Visiting customer site`
    });

    setActiveVisitId(visitId);
    setVisitNotes('');
    setSignatureName('');
    setPhotoUrl('');
  };

  // complete Customer Visit Check-out
  const handleCompleteVisit = () => {
    if (!activeVisitId) return;
    const v = visits.find(v => v.id === activeVisitId);
    if (!v) return;

    const arrival = v.arrivalTime ? new Date(v.arrivalTime) : new Date();
    const durationMin = Math.round((Date.now() - arrival.getTime()) / (1000 * 60));

    onUpdateVisit({
      ...v,
      status: VisitStatus.VISITED,
      departureTime: new Date().toISOString(),
      duration: Math.max(5, durationMin),
      notes: visitNotes || 'Routine visit completed.',
      photoUrl: photoUrl || 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=400',
      signature: signatureName || currentEmp.name
    });

    onUpdateEmployee({
      ...currentEmp,
      completedVisits: currentEmp.completedVisits + 1,
      status: EmployeeStatus.TRAVELING,
      currentAddress: 'Completed client visit. Returning to route.'
    });

    onAddNotification({
      type: 'GEOFENCE_EXIT',
      message: `${currentEmp.name} completed check-out for client site. Visit Duration: ${Math.max(5, durationMin)} mins.`,
      empId: currentEmp.id
    });

    setActiveVisitId(null);
  };

  // Simulate Photo Upload
  const simulatePhotoUpload = () => {
    setIsUploadingPhoto(true);
    setTimeout(() => {
      // Pick a random Unsplash service photo
      const samplePhotos = [
        'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=400',
        'https://images.unsplash.com/photo-1497366216548-37526070297c?w=400',
        'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=400',
        'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=400'
      ];
      setPhotoUrl(samplePhotos[Math.floor(Math.random() * samplePhotos.length)]);
      setIsUploadingPhoto(false);
    }, 1200);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 max-w-6xl mx-auto">
      {/* 1. Simulator Selector Sidebar */}
      <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
        <div className="space-y-6">
          <div>
            <span className="text-[10px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2.5 py-1 rounded-full font-bold uppercase tracking-wider">
              Simulated Node Environment
            </span>
            <h3 className="text-base font-bold text-white mt-3">Staff Device impersonator</h3>
            <p className="text-xs text-slate-400 mt-1 leading-normal">
              Select an employee below to load their virtual smartphone state. You can click-in, trigger geofences, and capture visits to see immediate live admin reactions.
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Active Device Feed</label>
            <div className="space-y-1.5 max-h-[250px] overflow-y-auto pr-1">
              {employees.map(emp => (
                <button
                  key={emp.id}
                  onClick={() => {
                    setSelectedEmpId(emp.id);
                    setActiveVisitId(null);
                  }}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                    selectedEmpId === emp.id 
                      ? 'bg-slate-950 border-blue-500/50 shadow-md' 
                      : 'bg-slate-950/40 border-slate-800/80 hover:bg-slate-950/60 hover:border-slate-800'
                  }`}
                >
                  <img src={emp.avatar} alt={emp.name} className="w-9 h-9 rounded-full object-cover border border-slate-800" referrerPolicy="no-referrer" />
                  <div className="flex-1 min-w-0">
                    <span className="text-xs font-bold text-slate-200 truncate block">{emp.name}</span>
                    <span className="text-[10px] text-slate-500 truncate block">{emp.role}</span>
                  </div>
                  <div className="flex flex-col items-end gap-1 font-mono">
                    <span className={`w-2 h-2 rounded-full ${
                      emp.status === EmployeeStatus.TRAVELING ? 'bg-emerald-500' :
                      emp.status === EmployeeStatus.IDLE ? 'bg-yellow-500' :
                      emp.status === EmployeeStatus.ONLINE ? 'bg-blue-500' :
                      emp.status === EmployeeStatus.BREAK ? 'bg-orange-500' : 'bg-slate-500'
                    }`} />
                    <span className="text-[9px] text-slate-600">{emp.battery}%</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Developer Sandbox Controls (Telemetry Injectors) */}
        <div className="border-t border-slate-800 pt-6 mt-6 space-y-4">
          <h4 className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5 text-blue-400" />
            Live Device Hardware Injector
          </h4>

          <div className="space-y-3.5 text-xs text-slate-400 bg-slate-950 p-4 border border-slate-800 rounded-xl">
            {/* Battery slider */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-[11px]">
                <span className="flex items-center gap-1">🔋 Device Battery</span>
                <span className="font-mono text-white">{currentEmp.battery}%</span>
              </div>
              <input 
                type="range" 
                min="0" 
                max="100" 
                value={currentEmp.battery} 
                onChange={(e) => handleUpdateTelemetry('battery', parseInt(e.target.value))}
                className="w-full accent-blue-500 bg-slate-800 h-1.5 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            {/* GPS speed slider */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-[11px]">
                <span className="flex items-center gap-1">🚴 Transit Speed</span>
                <span className="font-mono text-white">{currentEmp.speed} km/h</span>
              </div>
              <input 
                type="range" 
                min="0" 
                max="80" 
                value={currentEmp.speed} 
                onChange={(e) => {
                  const s = parseInt(e.target.value);
                  let status = currentEmp.status;
                  if (s > 0 && currentEmp.status !== EmployeeStatus.OFFLINE) status = EmployeeStatus.TRAVELING;
                  else if (s === 0 && currentEmp.status === EmployeeStatus.TRAVELING) status = EmployeeStatus.ONLINE;
                  
                  handleUpdateTelemetry('speed', s);
                  handleUpdateTelemetry('status', status);
                }}
                className="w-full accent-emerald-500 bg-slate-800 h-1.5 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            {/* GPS precision toggle */}
            <div className="flex items-center justify-between text-[11px]">
              <span>🎯 GPS Accuracy Mode</span>
              <button 
                onClick={() => handleUpdateTelemetry('gpsAccuracy', currentEmp.gpsAccuracy === 3.1 ? 25.8 : 3.1)}
                className={`px-2.5 py-1 rounded font-bold ${
                  currentEmp.gpsAccuracy < 10 
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                    : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                }`}
              >
                {currentEmp.gpsAccuracy < 10 ? 'High Accuracy' : 'Cell Tower Mode'}
              </button>
            </div>

            {/* Simulating Internet connection status */}
            <div className="flex items-center justify-between text-[11px]">
              <span>🌐 Internet Link</span>
              <button 
                onClick={() => {
                  const state = currentEmp.internetStatus === 'online' ? 'offline' : 'online';
                  handleUpdateTelemetry('internetStatus', state);
                  handleUpdateTelemetry('networkType', state === 'online' ? '5G Cellular' : 'None');
                }}
                className={`px-2.5 py-1 rounded font-bold ${
                  currentEmp.internetStatus === 'online' 
                    ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' 
                    : 'bg-red-500/10 text-red-400 border border-red-500/20'
                }`}
              >
                {currentEmp.internetStatus === 'online' ? 'Online' : 'Offline'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Interactive Phone Container */}
      <div className="lg:col-span-8 flex justify-center">
        <div className="w-full max-w-[390px] h-[780px] bg-slate-950 border-[10px] border-slate-900 rounded-[48px] shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden relative flex flex-col">
          
          {/* Smartphone Notch / Dynamic Island */}
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-32 h-6 bg-slate-900 rounded-b-2xl z-50 flex items-center justify-center">
            <div className="w-2 h-2 rounded-full bg-slate-950 mr-2" />
            <div className="w-10 h-1 bg-slate-850 rounded-full" />
          </div>

          {/* Device Top Status Bar */}
          <div className="h-10 bg-slate-950 px-6 flex justify-between items-end pb-1.5 z-40 text-white font-mono text-xs select-none">
            <span>09:41 AM</span>
            <div className="flex items-center gap-1.5">
              {currentEmp.internetStatus === 'online' ? (
                <Wifi className="w-3.5 h-3.5 text-slate-300" />
              ) : (
                <WifiOff className="w-3.5 h-3.5 text-red-500" />
              )}
              {currentEmp.battery > 20 ? (
                <Battery className="w-4 h-4 text-emerald-400" />
              ) : (
                <BatteryLow className="w-4 h-4 text-red-500 animate-pulse" />
              )}
              <span className="text-[10px] font-bold">{currentEmp.battery}%</span>
            </div>
          </div>

          {/* Smartphone Screen Body */}
          <div className="flex-1 bg-slate-900 overflow-y-auto px-5 py-4 space-y-4">
            
            {currentEmp.deviceApprovalStatus !== 'APPROVED' ? (
              <div className="flex flex-col items-center justify-center h-full text-center space-y-6">
                <div className="w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-[0_0_30px_rgba(37,99,235,0.4)]">
                  <ShieldCheck className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white tracking-tight">Enterprise Setup</h3>
                  <p className="text-[11px] text-slate-400 mt-2 px-4 leading-relaxed">
                    This device is pending authorization. Enter the activation token provided by your MetroLogix admin or scan the QR code.
                  </p>
                </div>

                <div className="w-full space-y-3 mt-4">
                  <input
                    type="text"
                    placeholder="Enter Activation Code"
                    className="w-full bg-slate-950 border border-slate-800 text-center text-white font-mono rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500"
                  />
                  <button className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl text-xs shadow transition-all">
                    Activate Device
                  </button>
                  <button className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 rounded-xl text-xs shadow transition-all flex justify-center items-center gap-2">
                    <Camera className="w-4 h-4" /> Scan QR
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* Header Identity */}
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <img src={currentEmp.avatar} alt={currentEmp.name} className="w-10 h-10 rounded-full object-cover border border-slate-800" referrerPolicy="no-referrer" />
                <div>
                  <h4 className="text-xs font-bold text-white leading-none">{currentEmp.name}</h4>
                  <span className="text-[10px] text-slate-500 font-mono mt-1 block">{currentEmp.role}</span>
                </div>
              </div>
              <button 
                onClick={() => setShowSettings(!showSettings)}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg"
              >
                <Sliders className="w-4 h-4" />
              </button>
            </div>

            {/* Privacy GDPR Permission Indicator (Crucial compliance requirement) */}
            <div className="bg-blue-950/40 border border-blue-900/40 rounded-2xl p-3 flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
              <div className="text-[10px] text-blue-300 leading-normal">
                <p className="font-bold">Transparent GPS Tracking</p>
                <p className="mt-0.5 text-slate-400">Tracking is active strictly during working shifts with explicit user authorization. You can toggle consent below.</p>
                <button 
                  onClick={() => {
                    setGpsConsent(!gpsConsent);
                    if (gpsConsent) {
                      onUpdateEmployee({
                        ...currentEmp,
                        status: EmployeeStatus.OFFLINE,
                        speed: 0
                      });
                    }
                  }}
                  className="mt-2 text-blue-400 hover:text-white font-bold flex items-center gap-1 underline text-[9px]"
                >
                  {gpsConsent ? 'Revoke GPS Authorization' : 'Grant GPS Consent'}
                </button>
              </div>
            </div>

            {/* Shift Tracker Clock Card */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 flex flex-col gap-3">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[9px] text-slate-500 uppercase font-bold tracking-wider">Shift Manager</span>
                  <h5 className="text-xs font-bold text-slate-200 mt-0.5">Today's Attendance</h5>
                </div>
                <div className="flex items-center gap-1 text-[10px] text-slate-400 font-mono bg-slate-900 px-2 py-0.5 rounded">
                  <Clock className="w-3 h-3 text-blue-400" />
                  {todayAttendance ? (todayAttendance.status === AttendanceStatus.LATE ? 'LATE' : 'PRESENT') : 'NOT CLOCKED IN'}
                </div>
              </div>

              {todayAttendance && (
                <div className="grid grid-cols-2 gap-2 text-[10px] bg-slate-900 p-2.5 rounded-xl border border-slate-850 font-mono text-slate-400">
                  <div>
                    <span>Clock In:</span>
                    <span className="text-white block font-bold mt-0.5">
                      {new Date(todayAttendance.clockIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div>
                    <span>Hours Logged:</span>
                    <span className="text-white block font-bold mt-0.5">
                      {todayAttendance.clockOut ? `${todayAttendance.workingHours} hrs` : 'Active Now'}
                    </span>
                  </div>
                </div>
              )}

              {/* Main Button Clock Control */}
              {currentEmp.status === EmployeeStatus.OFFLINE ? (
                <button
                  onClick={handleClockIn}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-1.5 text-xs shadow-lg shadow-emerald-950/20 active:scale-95 transition-all"
                >
                  <Play className="w-4 h-4 fill-current" />
                  Clock In & Start Tracking
                </button>
              ) : (
                <button
                  onClick={handleClockOut}
                  className="w-full bg-rose-600 hover:bg-rose-500 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-1.5 text-xs shadow-lg shadow-rose-950/20 active:scale-95 transition-all"
                >
                  <Square className="w-4 h-4 fill-current" />
                  Clock Out & Stop GPS
                </button>
              )}
            </div>

            {/* GPS Telemetry Indicator */}
            {currentEmp.status !== EmployeeStatus.OFFLINE && (
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3">
                <div className="flex justify-between items-center border-b border-slate-850 pb-2">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Live GPS Telemetry</span>
                  <div className="flex items-center gap-1">
                    <span className={`w-2 h-2 rounded-full ${currentEmp.gpsAccuracy < 10 ? 'bg-emerald-500' : 'bg-yellow-500'}`} />
                    <span className="text-[10px] text-slate-500 font-mono">Acc: {currentEmp.gpsAccuracy}m</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-slate-400 font-mono text-[10px]">
                  <div className="bg-slate-900 p-2 rounded-xl">
                    <span className="text-[9px] text-slate-500 block">Coordinates</span>
                    <span className="text-slate-200 block font-bold mt-0.5 truncate">
                      {currentEmp.coords.lat.toFixed(5)}, {currentEmp.coords.lng.toFixed(5)}
                    </span>
                  </div>
                  <div className="bg-slate-900 p-2 rounded-xl">
                    <span className="text-[9px] text-slate-500 block">Current Velocity</span>
                    <span className="text-slate-200 block font-bold mt-0.5">
                      {currentEmp.speed} km/h
                    </span>
                  </div>
                </div>

                <div className="bg-slate-900 p-2.5 rounded-xl flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-blue-400 shrink-0" />
                  <span className="text-[9px] text-slate-300 leading-tight truncate">{currentEmp.currentAddress}</span>
                </div>
              </div>
            )}

            {/* Assigned Customer Visits Section */}
            <div className="space-y-2.5">
              <h5 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <CheckSquare className="w-3.5 h-3.5 text-blue-500" />
                Customer Visits ({empVisits.length})
              </h5>

              {/* If checking-in (modal style inside phone) */}
              {activeVisitId ? (
                <div className="bg-slate-950 border border-slate-850 rounded-2xl p-4 space-y-3 animate-fadeIn">
                  {(() => {
                    const activeVisit = visits.find(v => v.id === activeVisitId);
                    const cust = activeVisit ? customers.find(c => c.id === activeVisit.customerId) : null;
                    if (!cust) return null;

                    return (
                      <>
                        <div className="flex justify-between items-start border-b border-slate-800 pb-2">
                          <div>
                            <h6 className="text-xs font-bold text-white">{cust.name}</h6>
                            <span className="text-[9px] text-slate-500 block mt-0.5">{cust.address}</span>
                          </div>
                          <button 
                            onClick={() => setActiveVisitId(null)}
                            className="text-[10px] text-rose-400 hover:text-rose-300"
                          >
                            Cancel
                          </button>
                        </div>

                        {/* Notes input */}
                        <div className="space-y-1">
                          <label className="text-[10px] text-slate-400 font-bold block">Visit Summary Notes</label>
                          <textarea
                            value={visitNotes}
                            onChange={(e) => setVisitNotes(e.target.value)}
                            placeholder="Enter delivery status, client feedback, or support completed..."
                            className="w-full text-[11px] bg-slate-900 text-slate-200 border border-slate-800 rounded-lg p-2 h-16 resize-none focus:outline-none focus:border-blue-500"
                          />
                        </div>

                        {/* Photo capture simulation */}
                        <div className="space-y-1">
                          <label className="text-[10px] text-slate-400 font-bold block">Photo Verification</label>
                          <div className="flex items-center gap-3">
                            <button
                              onClick={simulatePhotoUpload}
                              className="bg-slate-900 hover:bg-slate-850 border border-slate-800 text-[10px] text-slate-300 py-1.5 px-3 rounded-lg flex items-center gap-1.5"
                            >
                              <Camera className="w-3.5 h-3.5 text-blue-400" />
                              {isUploadingPhoto ? 'Uploading...' : 'Take Photo'}
                            </button>
                            {photoUrl && (
                              <img src={photoUrl} alt="Visit proof" className="w-10 h-10 object-cover rounded border border-slate-700" />
                            )}
                          </div>
                        </div>

                        {/* Digital Signature */}
                        <div className="space-y-1">
                          <label className="text-[10px] text-slate-400 font-bold block">Recipient Name / Signature</label>
                          <div className="relative">
                            <input
                              type="text"
                              value={signatureName}
                              onChange={(e) => setSignatureName(e.target.value)}
                              placeholder="Type name to sign digitally"
                              className="w-full text-[11px] bg-slate-900 text-slate-200 border border-slate-800 rounded-lg py-1.5 px-3 pl-8 focus:outline-none focus:border-blue-500"
                            />
                            <PenTool className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
                          </div>
                        </div>

                        {/* Complete Checklist button */}
                        <button
                          onClick={handleCompleteVisit}
                          className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 rounded-xl text-[11px] mt-2 flex items-center justify-center gap-1 shadow-md active:scale-95 transition-all"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          Complete Visit Check-out
                        </button>
                      </>
                    );
                  })()}
                </div>
              ) : (
                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                  {empVisits.length === 0 ? (
                    <div className="text-center p-6 bg-slate-950/40 border border-dashed border-slate-800 rounded-2xl text-slate-500 text-xs">
                      No visits assigned for today.
                    </div>
                  ) : (
                    empVisits.map(visit => {
                      const cust = customers.find(c => c.id === visit.customerId);
                      if (!cust) return null;

                      return (
                        <div 
                          key={visit.id}
                          className={`p-3 bg-slate-950 border rounded-xl flex items-start gap-2.5 justify-between ${
                            visit.status === VisitStatus.VISITED ? 'border-slate-850 bg-slate-950/30' : 'border-slate-800'
                          }`}
                        >
                          <div className="min-w-0 flex-1">
                            <span className="text-xs font-bold text-slate-200 block truncate">{cust.name}</span>
                            <span className="text-[9px] text-slate-500 block truncate mt-0.5">{cust.address}</span>
                            
                            {/* status pill */}
                            <div className="flex items-center gap-2 mt-2">
                              <span className={`text-[9px] px-2 py-0.5 rounded font-bold ${
                                visit.status === VisitStatus.VISITED ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                                visit.status === VisitStatus.ONGOING ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                                'bg-slate-900 text-slate-400 border border-slate-800'
                              }`}>
                                {visit.status}
                              </span>
                              {visit.status === VisitStatus.VISITED && visit.duration && (
                                <span className="text-[9px] text-slate-500 font-mono">Duration: {visit.duration}m</span>
                              )}
                            </div>
                          </div>

                          {/* Action Button */}
                          {visit.status === VisitStatus.ASSIGNED && (
                            <button
                              onClick={() => handleStartVisit(visit.id)}
                              className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-[10px] px-2.5 py-1.5 rounded-lg shrink-0 self-center active:scale-95"
                            >
                              Arrived
                            </button>
                          )}
                          {visit.status === VisitStatus.ONGOING && (
                            <button
                              onClick={() => {
                                setActiveVisitId(visit.id);
                                setVisitNotes('');
                                setSignatureName('');
                              }}
                              className="bg-amber-600 hover:bg-amber-500 text-white font-bold text-[10px] px-2.5 py-1.5 rounded-lg shrink-0 self-center active:scale-95"
                            >
                              Check-out
                            </button>
                          )}
                          {visit.status === VisitStatus.VISITED && (
                            <div className="text-emerald-400 p-1 self-center">
                              <CheckCircle className="w-5 h-5 fill-current" />
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
            
            </>
            )}

          </div>

          {/* Device Home Indicator (iPhone style bar) */}
          <div className="h-5 bg-slate-950 flex items-center justify-center pb-1">
            <div className="w-28 h-1 bg-slate-700 rounded-full" />
          </div>
        </div>
      </div>

      {/* Consent GDPR modal (Simulated mobile Alert) */}
      {consentModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-850 rounded-2xl max-w-sm p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-indigo-500/10 rounded-xl text-indigo-400">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-white">Transparent Location Consent</h4>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              This application requires **explicit, transparent consent** to enable background GPS location service for your field operations.
            </p>
            <div className="text-[11px] text-slate-500 leading-normal bg-slate-950 p-3 border border-slate-850 rounded-xl">
              • Coordinates are strictly transmitted during clocked shift hours.<br />
              • Data is encrypted and protected under company security guidelines.<br />
              • You may revoke authorization at any moment directly in phone settings.
            </div>
            <div className="flex gap-2 justify-end">
              <button 
                onClick={() => setConsentModal(false)}
                className="text-xs text-slate-400 hover:text-white px-3 py-1.5 hover:bg-slate-800 rounded-lg"
              >
                Decline
              </button>
              <button 
                onClick={() => {
                  setGpsConsent(true);
                  setConsentModal(false);
                  handleClockIn();
                }}
                className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-4 py-1.5 rounded-lg"
              >
                Accept & Clock In
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
