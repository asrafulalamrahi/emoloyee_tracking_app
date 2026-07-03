import React, { useState, useEffect, useRef } from 'react';
import { Employee } from '../types';
import { 
  Wifi, 
  WifiOff, 
  Battery, 
  BatteryLow, 
  Play, 
  Square, 
  MapPin, 
  Compass,
  CheckCircle,
  AlertTriangle,
  Smartphone,
  LogIn,
  LogOut,
  Sliders,
  ShieldCheck,
  Send,
  Loader2
} from 'lucide-react';

interface EmployeeMobileAppProps {
  onAddNotification?: (notif: { type: string; message: string; empId: string }) => void;
}

export const EmployeeMobileApp: React.FC<EmployeeMobileAppProps> = ({
  onAddNotification
}) => {
  // Authentication states
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [email, setEmail] = useState('rider1@metrologix.com');
  const [password, setPassword] = useState('rider123');
  const [authError, setAuthError] = useState<string | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  
  // Handset Identity (loaded from login response)
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [token, setToken] = useState<string | null>(null);

  // Simulated GPS Coordinates (starts in downtown San Francisco)
  const [lat, setLat] = useState(37.7749);
  const [lng, setLng] = useState(-122.4194);
  const [batteryLevel, setBatteryLevel] = useState(88);
  const [isOnline, setIsOnline] = useState(true); // Internet connection switch
  const [deviceName, setDeviceName] = useState('Samsung Galaxy S23');
  
  // Permissions & Background Location Tracker
  const [gpsEnabled, setGpsEnabled] = useState(true);
  const [bgTracking, setBgTracking] = useState(false);
  const [trackingTimer, setTrackingTimer] = useState<number>(15);
  const [offlineBuffer, setOfflineBuffer] = useState<Array<{ lat: number, lng: number, battery: number, timestamp: string }>>([]);

  const trackingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);
  const [secondsToNextSend, setSecondsToNextSend] = useState(15);

  // Simulated coordinate movement increments (Walk, Drive, Rider)
  const adjustSimulatedLocation = (latOffset: number, lngOffset: number) => {
    setLat(prev => parseFloat((prev + latOffset).toFixed(6)));
    setLng(prev => parseFloat((prev + lngOffset).toFixed(6)));
  };

  // Perform backend login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAuthenticating(true);
    setAuthError(null);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      if (!response.ok) {
        throw new Error('Invalid credentials or unauthorized login role');
      }

      const data = await response.json();
      
      // Save details
      setToken(data.accessToken);
      setEmployee(data.employee);
      setIsLoggedIn(true);

      // Seed coordinate simulation from saved last values
      if (data.employee.lastLat && data.employee.lastLng) {
        setLat(data.employee.lastLat);
        setLng(data.employee.lastLng);
      }

      if (onAddNotification) {
        onAddNotification({
          type: 'SECURITY',
          message: `${data.employee.name} authenticated and linked device securely.`,
          empId: data.employee.id
        });
      }
    } catch (err: any) {
      setAuthError(err.message || 'Authentication failed');
    } finally {
      setIsAuthenticating(false);
    }
  };

  // Logout routine
  const handleLogout = async () => {
    // Turn off tracking
    if (bgTracking) {
      toggleTrackingService(false);
    }

    if (employee && token) {
      // Notify backend we are offline
      try {
        await fetch(`/api/locations`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            employeeId: employee.id,
            lat,
            lng,
            isGpsEnabled: false,
            locationPermission: 'DENIED',
            batteryLevel,
            deviceName,
            platform: 'Android'
          })
        });
      } catch (e) {
        // ignore offline request errors
      }
    }

    setIsLoggedIn(false);
    setEmployee(null);
    setToken(null);
  };

  // Core transmission logic
  const transmitLocationUpdate = async (coords: { lat: number, lng: number, battery: number }) => {
    if (!employee) return;

    const payload = {
      employeeId: employee.id,
      lat: coords.lat,
      lng: coords.lng,
      batteryLevel: coords.battery,
      deviceName,
      platform: 'Android',
      isGpsEnabled: gpsEnabled,
      locationPermission: gpsEnabled ? 'GRANTED' : 'DENIED'
    };

    // If offline, save to buffer queue
    if (!isOnline) {
      setOfflineBuffer(prev => [
        ...prev, 
        { lat: coords.lat, lng: coords.lng, battery: coords.battery, timestamp: new Date().toISOString() }
      ]);
      return;
    }

    try {
      const response = await fetch('/api/locations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error('Sync failed');
      }
    } catch (e) {
      // Save to buffer queue if failed
      setOfflineBuffer(prev => [
        ...prev, 
        { lat: coords.lat, lng: coords.lng, battery: coords.battery, timestamp: new Date().toISOString() }
      ]);
    }
  };

  // Handle Flush / Auto-Reconnect Sync
  useEffect(() => {
    if (isOnline && offlineBuffer.length > 0 && employee) {
      // Flush buffer queue to backend sequentially
      const flushQueue = async () => {
        const queue = [...offlineBuffer];
        setOfflineBuffer([]); // Clear quickly

        for (const pt of queue) {
          try {
            await fetch('/api/locations', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                employeeId: employee.id,
                lat: pt.lat,
                lng: pt.lng,
                batteryLevel: pt.battery,
                deviceName,
                platform: 'Android',
                isGpsEnabled: gpsEnabled,
                locationPermission: 'GRANTED'
              })
            });
          } catch (err) {
            // Re-add to queue if still failing
            setOfflineBuffer(prev => [...prev, pt]);
          }
        }
      };

      flushQueue();
    }
  }, [isOnline, offlineBuffer, employee]);

  // Handle recursive tracking timer loop
  const toggleTrackingService = (start: boolean) => {
    setBgTracking(start);

    if (start) {
      setSecondsToNextSend(trackingTimer);

      // Clear existing
      if (trackingIntervalRef.current) clearInterval(trackingIntervalRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);

      // Start Countdown
      countdownRef.current = setInterval(() => {
        setSecondsToNextSend(prev => {
          if (prev <= 1) {
            return trackingTimer;
          }
          return prev - 1;
        });
      }, 1000);

      // Start periodic transmitters
      trackingIntervalRef.current = setInterval(() => {
        transmitLocationUpdate({ lat, lng, battery: batteryLevel });
      }, trackingTimer * 1000);

      // Fire immediate update
      transmitLocationUpdate({ lat, lng, battery: batteryLevel });
    } else {
      if (trackingIntervalRef.current) {
        clearInterval(trackingIntervalRef.current);
        trackingIntervalRef.current = null;
      }
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
        countdownRef.current = null;
      }
    }
  };

  // Synchronize interval length if changed
  useEffect(() => {
    if (bgTracking) {
      toggleTrackingService(true);
    }
  }, [trackingTimer, lat, lng, batteryLevel, gpsEnabled]);

  // Clean-up on unmount
  useEffect(() => {
    return () => {
      if (trackingIntervalRef.current) clearInterval(trackingIntervalRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, []);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 max-w-5xl mx-auto">
      {/* Left panel: Simulator & Tweak controls */}
      <div className="lg:col-span-5 bg-slate-900 border border-slate-850 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
        <div className="space-y-6">
          <div>
            <span className="text-[10px] bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2.5 py-1 rounded-full font-bold uppercase tracking-wider font-mono">
              Staff Node Simulator
            </span>
            <h3 className="text-base font-bold text-white mt-3 font-mono">Telemetry Injector Board</h3>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Enforce background coordinates, simulate signal drops/buffers, and steer the delivery rider around San Francisco using the direction controls.
            </p>
          </div>

          <div className="space-y-4 border-t border-slate-800 pt-4.5">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono">Manual GPS Steering</h4>
            <p className="text-[11px] text-slate-500 leading-normal">
              Click the cardinal compass buttons to walk or drive the handset. Watch the coordinates shift live!
            </p>

            <div className="flex flex-col items-center gap-2">
              <button 
                onClick={() => adjustSimulatedLocation(0.0015, 0)}
                className="w-12 h-12 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center text-slate-200 hover:text-white hover:bg-slate-850 transition-all font-bold text-xs"
              >
                ▲ N
              </button>
              <div className="flex gap-4">
                <button 
                  onClick={() => adjustSimulatedLocation(0, -0.0015)}
                  className="w-12 h-12 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center text-slate-200 hover:text-white hover:bg-slate-850 transition-all font-bold text-xs"
                >
                  ◀ W
                </button>
                <div className="w-12 h-12 rounded-xl bg-slate-900/40 border border-slate-850/60 flex items-center justify-center text-[10px] font-mono text-slate-500">
                  SF
                </div>
                <button 
                  onClick={() => adjustSimulatedLocation(0, 0.0015)}
                  className="w-12 h-12 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center text-slate-200 hover:text-white hover:bg-slate-850 transition-all font-bold text-xs"
                >
                  E ▶
                </button>
              </div>
              <button 
                onClick={() => adjustSimulatedLocation(-0.0015, 0)}
                className="w-12 h-12 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center text-slate-200 hover:text-white hover:bg-slate-850 transition-all font-bold text-xs"
              >
                ▼ S
              </button>
            </div>
          </div>

          {/* Sliders & Parameters */}
          <div className="space-y-4 border-t border-slate-800 pt-4.5">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono">Handset Hardware Parameters</h4>
            
            <div className="space-y-3 bg-slate-950 p-3.5 border border-slate-850 rounded-xl">
              {/* Battery slide */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-[11px] font-mono">
                  <span className="text-slate-400">⚡ Battery Charge:</span>
                  <span className="text-white font-bold">{batteryLevel}%</span>
                </div>
                <input 
                  type="range" 
                  min="5" 
                  max="100" 
                  value={batteryLevel} 
                  onChange={(e) => setBatteryLevel(parseInt(e.target.value))}
                  className="w-full accent-blue-500 bg-slate-800 h-1 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              {/* Ping speed selection */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-[11px] font-mono">
                  <span className="text-slate-400">⏱️ Coordinate Send Interval:</span>
                  <span className="text-white font-bold">{trackingTimer} seconds</span>
                </div>
                <div className="grid grid-cols-3 gap-1">
                  {[5, 15, 30].map(sec => (
                    <button
                      key={sec}
                      onClick={() => setTrackingTimer(sec)}
                      className={`py-1 text-[10px] font-bold rounded font-mono ${
                        trackingTimer === sec 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-slate-900 text-slate-400 hover:bg-slate-850'
                      }`}
                    >
                      {sec}s
                    </button>
                  ))}
                </div>
              </div>

              {/* Network tunnel drop simulator */}
              <div className="flex items-center justify-between text-[11px] border-t border-slate-900 pt-2.5">
                <span className="text-slate-400 font-mono">📡 Internet Antenna Status:</span>
                <button 
                  onClick={() => setIsOnline(!isOnline)}
                  className={`px-3 py-1 rounded font-bold text-[10px] font-mono ${
                    isOnline 
                      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20' 
                      : 'bg-red-500/15 text-red-400 border border-red-500/20 animate-pulse'
                  }`}
                >
                  {isOnline ? 'Online (Connected)' : 'Offline (Disconnected)'}
                </button>
              </div>

              {/* Buffer indicators */}
              {offlineBuffer.length > 0 && (
                <div className="text-[10px] text-amber-400 font-mono flex items-center gap-1.5 mt-2">
                  <AlertTriangle className="w-3.5 h-3.5 animate-bounce" />
                  <span>{offlineBuffer.length} location reports buffered locally</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="text-[10px] text-slate-500 font-mono mt-4 leading-normal bg-slate-950 p-2.5 rounded-lg border border-slate-900">
          * Compliance standard: Local buffers automatically flush to PostgreSQL once 5G/WiFi handshake restores.
        </div>
      </div>

      {/* Right panel: Phone simulator frame */}
      <div className="lg:col-span-7 flex justify-center">
        <div className="w-full max-w-[340px] h-[670px] bg-slate-950 border-[8px] border-slate-900 rounded-[42px] shadow-[0_0_40px_rgba(0,0,0,0.8)] overflow-hidden relative flex flex-col">
          
          {/* Smartphone Island Notch */}
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-28 h-5.5 bg-slate-900 rounded-b-xl z-50 flex items-center justify-center">
            <div className="w-1.5 h-1.5 rounded-full bg-slate-950 mr-1.5" />
            <div className="w-8 h-0.5 bg-slate-850 rounded-full" />
          </div>

          {/* Handset top indicators */}
          <div className="h-8.5 bg-slate-950 px-5 flex justify-between items-end pb-1 z-40 text-slate-300 font-mono text-[10px] select-none">
            <span>12:00 PM</span>
            <div className="flex items-center gap-1">
              {isOnline ? (
                <Wifi className="w-3 h-3 text-slate-400" />
              ) : (
                <WifiOff className="w-3 h-3 text-rose-500" />
              )}
              {batteryLevel > 20 ? (
                <Battery className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <BatteryLow className="w-3.5 h-3.5 text-red-500 animate-pulse" />
              )}
              <span>{batteryLevel}%</span>
            </div>
          </div>

          {/* Smartphone screen body */}
          <div className="flex-1 bg-slate-900 overflow-y-auto px-4 py-3 space-y-4">
            {!isLoggedIn ? (
              /* A. LOGIN CARD SCREEN */
              <div className="flex flex-col justify-center h-full space-y-4">
                <div className="text-center space-y-2">
                  <div className="w-11 h-11 rounded-xl bg-blue-600 flex items-center justify-center text-white mx-auto shadow shadow-blue-500/20">
                    <Smartphone className="w-5 h-5" />
                  </div>
                  <h4 className="text-sm font-bold text-white tracking-tight">MetroLogix Field Tracking</h4>
                  <p className="text-[10px] text-slate-400">Authenticating employee session</p>
                </div>

                {authError && (
                  <div className="p-2.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[10px] rounded-lg flex items-start gap-1.5 leading-normal">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    <span>{authError}</span>
                  </div>
                )}

                <form onSubmit={handleLogin} className="space-y-3.5">
                  <div className="space-y-1">
                    <label className="text-[9px] text-slate-400 uppercase font-bold tracking-wider block font-mono">Rider / Staff Email</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="rider1@metrologix.com"
                      className="w-full text-xs bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500 font-mono"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] text-slate-400 uppercase font-bold tracking-wider block font-mono">Secured Password</label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full text-xs bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500 font-mono"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isAuthenticating}
                    className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 text-white font-bold py-2.5 rounded-xl text-[11px] flex items-center justify-center gap-1.5 shadow transition-all active:scale-95 cursor-pointer mt-2"
                  >
                    {isAuthenticating ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      <>
                        <LogIn className="w-3.5 h-3.5" />
                        Log In Handset
                      </>
                    )}
                  </button>
                </form>

                <div className="bg-slate-950 border border-slate-850 p-2.5 rounded-lg text-[8.5px] text-slate-500 text-center font-mono leading-normal">
                  Demo Credentials:<br/>
                  Email: <span className="text-slate-350">rider1@metrologix.com</span><br/>
                  Pass: <span className="text-slate-350">rider123</span>
                </div>
              </div>
            ) : (
              /* B. LIVE TRACKER SCREEN */
              <div className="space-y-4">
                {/* Header Identity */}
                <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-slate-850 border border-slate-700 flex items-center justify-center text-xs text-blue-400 font-bold shrink-0">
                      {employee?.name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="text-[11px] font-bold text-white leading-none">{employee?.name}</h4>
                      <span className="text-[9px] text-slate-500 font-mono block mt-1">{employee?.role}</span>
                    </div>
                  </div>
                  <button 
                    onClick={handleLogout}
                    className="p-1 text-slate-400 hover:text-rose-400 hover:bg-slate-850 rounded-lg transition-colors"
                    title="Log out from mobile app"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Consent & Compliance banner */}
                <div className="bg-slate-950 border border-slate-850 rounded-xl p-2.5 flex items-start gap-2">
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
                  <div className="text-[9px] text-slate-400 leading-normal">
                    <p className="font-bold text-slate-300">Transparent GPS Tracking</p>
                    <p className="mt-0.5">Tracking coordinates is active during your logged operations under user-authorized standards.</p>
                  </div>
                </div>

                {/* GPS Sensor Perms Toggle */}
                <div className="bg-slate-950 border border-slate-850 rounded-xl p-3 flex justify-between items-center">
                  <div className="space-y-0.5">
                    <span className="text-[10px] text-white font-bold font-mono block">GPS Satellites Link</span>
                    <span className="text-[8.5px] text-slate-500 block font-sans">Toggle core GPS hardware</span>
                  </div>
                  <button
                    onClick={() => setGpsEnabled(!gpsEnabled)}
                    className={`px-2.5 py-1 text-[9px] font-bold rounded font-mono ${
                      gpsEnabled 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-rose-500/10 text-rose-400 border border-rose-500/20 animate-pulse'
                    }`}
                  >
                    {gpsEnabled ? 'CONNECTED' : 'DISABLED'}
                  </button>
                </div>

                {/* Tracking Service Toggle */}
                <div className="bg-slate-950 border border-slate-850 rounded-xl p-3.5 flex flex-col gap-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[9px] text-slate-500 uppercase font-bold tracking-wider font-mono">Service Status</span>
                      <h5 className="text-[11px] font-bold text-slate-200 mt-0.5">Background Tracking</h5>
                    </div>
                    {bgTracking && (
                      <div className="flex items-center gap-1 text-[9px] text-blue-400 font-mono bg-blue-500/10 px-2 py-0.5 rounded">
                        PING IN {secondsToNextSend}S
                      </div>
                    )}
                  </div>

                  {bgTracking ? (
                    <button
                      onClick={() => toggleTrackingService(false)}
                      className="w-full bg-rose-600 hover:bg-rose-500 text-white font-bold py-2 rounded-xl flex items-center justify-center gap-1.5 text-[10px] shadow active:scale-95 transition-all cursor-pointer"
                    >
                      <Square className="w-3.5 h-3.5 fill-current" />
                      Pause Background Service
                    </button>
                  ) : (
                    <button
                      onClick={() => toggleTrackingService(true)}
                      className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 rounded-xl flex items-center justify-center gap-1.5 text-[10px] shadow active:scale-95 transition-all cursor-pointer"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      Start Background Service
                    </button>
                  )}
                </div>

                {/* Live GPS Diagnostics telemetry screen */}
                <div className="bg-slate-950 border border-slate-850 rounded-xl p-3.5 space-y-3">
                  <div className="flex justify-between items-center border-b border-slate-850 pb-1.5">
                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider font-mono">Active Coordinates</span>
                    <span className="text-[9px] text-slate-500 font-mono">Handset Feed</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-slate-400 font-mono text-[9px]">
                    <div className="bg-slate-900 p-2 rounded-lg">
                      <span className="text-slate-500 block">Latitude</span>
                      <span className="text-slate-200 block font-bold mt-0.5">{lat.toFixed(6)}</span>
                    </div>
                    <div className="bg-slate-900 p-2 rounded-lg">
                      <span className="text-slate-500 block">Longitude</span>
                      <span className="text-slate-200 block font-bold mt-0.5">{lng.toFixed(6)}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => transmitLocationUpdate({ lat, lng, battery: batteryLevel })}
                    disabled={!bgTracking}
                    className="w-full bg-slate-900 hover:bg-slate-850 disabled:bg-slate-950 border border-slate-800 disabled:border-slate-900 text-slate-300 disabled:text-slate-600 font-bold py-1.5 rounded-xl text-[9.5px] flex items-center justify-center gap-1 cursor-pointer transition-all active:scale-95"
                  >
                    <Send className="w-3 h-3" />
                    Transmit GPS Ping Manual
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Device Home Indicator */}
          <div className="h-4 bg-slate-950 flex items-center justify-center pb-0.5">
            <div className="w-24 h-1 bg-slate-700 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
};
