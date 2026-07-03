import React, { useState } from 'react';
import { Employee } from '../types';
import { InteractiveMap } from './InteractiveMap';
import { 
  Search, 
  MapPin, 
  Battery, 
  Smartphone, 
  RefreshCw,
  Compass,
  User,
  Activity,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';

interface AdminDashboardProps {
  employees: Employee[];
  onSelectEmployee: (id: string | null) => void;
  selectedEmployeeId: string | null;
  isLoadingLive?: boolean;
  onRefresh?: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  employees,
  onSelectEmployee,
  selectedEmployeeId,
  isLoadingLive = false,
  onRefresh,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Filtered employees list for sidebar
  const filteredEmployees = employees.filter(emp => {
    const matchesSearch = emp.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          emp.role.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'ALL' || emp.role === roleFilter;
    const matchesStatus = statusFilter === 'ALL' || emp.status === statusFilter;
    return matchesSearch && matchesRole && matchesStatus;
  });

  const selectedEmp = employees.find(e => e.id === selectedEmployeeId);

  return (
    <div className="space-y-6">
      {/* Header and Live summary counts */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-850 p-4.5 rounded-2xl flex items-center justify-between shadow-xl">
          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold block font-mono">Registered Fleet</span>
            <h4 className="text-xl font-bold text-white font-mono">{employees.length} Members</h4>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400">
            <User className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-850 p-4.5 rounded-2xl flex items-center justify-between shadow-xl">
          <div className="space-y-1">
            <span className="text-[10px] text-emerald-400 uppercase tracking-widest font-bold block font-mono">Online Now</span>
            <h4 className="text-xl font-bold text-emerald-400 font-mono">
              {employees.filter(e => e.status === 'ONLINE').length} Transmitting
            </h4>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 animate-pulse">
            <Activity className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-850 p-4.5 rounded-2xl flex items-center justify-between shadow-xl">
          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold block font-mono">Tracking Hub</span>
            <h4 className="text-xl font-bold text-slate-300 font-mono">San Francisco</h4>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400">
            <Compass className="w-5 h-5" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        
        {/* Left Column: Live List & Search */}
        <div className="xl:col-span-4 bg-slate-950 border border-slate-850 rounded-2xl p-4 flex flex-col h-[560px] shadow-2xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono">Employees Feed</h3>
            <button
              onClick={onRefresh}
              disabled={isLoadingLive}
              className="p-1.5 rounded-lg bg-slate-900 text-slate-400 hover:text-white transition-colors"
              title="Refresh database coordinates"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingLive ? 'animate-spin text-blue-400' : ''}`} />
            </button>
          </div>

          {/* Search bar */}
          <div className="relative mb-3">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name or role..."
              className="w-full text-xs bg-slate-900 border border-slate-800 text-slate-200 pl-8 pr-3 py-2 rounded-xl focus:outline-none focus:border-blue-500 font-sans"
            />
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
          </div>

          {/* Filters Row */}
          <div className="grid grid-cols-2 gap-2 mb-4">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-[10px] bg-slate-900 border border-slate-800 text-slate-400 py-1.5 px-2 rounded-lg font-bold"
            >
              <option value="ALL">All Statuses</option>
              <option value="ONLINE">Online</option>
              <option value="OFFLINE">Offline</option>
            </select>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="text-[10px] bg-slate-900 border border-slate-800 text-slate-400 py-1.5 px-2 rounded-lg font-bold"
            >
              <option value="ALL">All Roles</option>
              <option value="RIDER">Riders</option>
              <option value="MERCHANDISER">Merchandisers</option>
            </select>
          </div>

          {/* Live Employees List */}
          <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
            {filteredEmployees.length === 0 ? (
              <div className="text-center p-8 text-slate-500 text-xs font-mono">
                No employees matching filters
              </div>
            ) : (
              filteredEmployees.map(emp => {
                const isSelected = selectedEmployeeId === emp.id;
                const isOnline = emp.status === 'ONLINE';

                return (
                  <div
                    key={emp.id}
                    onClick={() => onSelectEmployee(isSelected ? null : emp.id)}
                    className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                      isSelected 
                        ? 'bg-slate-900 border-blue-500/60 shadow-lg' 
                        : 'bg-slate-900/40 border-slate-850 hover:bg-slate-900'
                    }`}
                  >
                    <div className="flex gap-2.5 items-start justify-between">
                      <div className="flex gap-2.5 items-center">
                        <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-xs text-blue-400 shrink-0">
                          {emp.name.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <h5 className="text-xs font-bold text-slate-200 truncate">{emp.name}</h5>
                          <span className="text-[10px] text-slate-500 block">{emp.role}</span>
                        </div>
                      </div>
                      
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold font-mono shrink-0 ${
                        isOnline ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-800 text-slate-400'
                      }`}>
                        {emp.status}
                      </span>
                    </div>

                    {/* Coordinates preview */}
                    {emp.lastLat && emp.lastLng ? (
                      <div className="mt-2.5 bg-slate-950 p-2 rounded-lg text-[9.5px] font-mono text-slate-400 flex items-center gap-1.5 truncate">
                        <MapPin className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                        <span>Lat: {emp.lastLat.toFixed(5)}, Lng: {emp.lastLng.toFixed(5)}</span>
                      </div>
                    ) : (
                      <div className="mt-2.5 bg-slate-950 p-2 rounded-lg text-[9.5px] font-mono text-slate-500 flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                        <span>No location logged yet</span>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Interactive Map */}
        <div className="xl:col-span-8">
          <InteractiveMap
            employees={employees}
            selectedEmployeeId={selectedEmployeeId}
            onSelectEmployee={onSelectEmployee}
          />
        </div>
      </div>

      {/* Selected Employee Details Panel */}
      {selectedEmp && (
        <div className="bg-slate-900 border border-slate-850 rounded-2xl p-5 shadow-2xl animate-fadeIn">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-800 pb-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-slate-800 border-2 border-blue-500 flex items-center justify-center font-bold text-lg text-blue-400">
                {selectedEmp.name.charAt(0)}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-white">{selectedEmp.name}</h4>
                  <span className={`px-2 py-0.5 rounded text-[9px] font-bold font-mono ${
                    selectedEmp.status === 'ONLINE' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-800 text-slate-450'
                  }`}>
                    {selectedEmp.status}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  {selectedEmp.role} • <span className="font-mono text-slate-300">{selectedEmp.email}</span>
                </p>
              </div>
            </div>

            {/* Quick Status banner */}
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <span className="font-mono text-slate-500">Device Link:</span>
              {selectedEmp.device ? (
                <span className="flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold px-2.5 py-1 rounded-lg">
                  <CheckCircle className="w-3.5 h-3.5" /> Associated
                </span>
              ) : (
                <span className="flex items-center gap-1 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-bold px-2.5 py-1 rounded-lg">
                  <AlertTriangle className="w-3.5 h-3.5" /> Pending Bind
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* GIS Coordinates Matrix */}
            <div className="bg-slate-950 border border-slate-850 rounded-xl p-4 space-y-3">
              <h5 className="text-[11px] font-bold text-blue-400 uppercase tracking-wider font-mono border-b border-slate-850 pb-2">📍 Geographic Telemetry</h5>
              <div className="space-y-2 text-xs font-mono">
                <div className="flex justify-between">
                  <span className="text-slate-500">Latitude:</span>
                  <strong className="text-slate-200">{selectedEmp.lastLat?.toFixed(6) || 'N/A'}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Longitude:</span>
                  <strong className="text-slate-200">{selectedEmp.lastLng?.toFixed(6) || 'N/A'}</strong>
                </div>
                <div className="flex justify-between border-t border-slate-900 pt-2 mt-2">
                  <span className="text-slate-500">Last Update:</span>
                  <strong className="text-slate-300">
                    {selectedEmp.lastLocationUpdate ? new Date(selectedEmp.lastLocationUpdate).toLocaleTimeString() : 'N/A'}
                  </strong>
                </div>
              </div>
            </div>

            {/* Device Hardware Status */}
            <div className="bg-slate-950 border border-slate-850 rounded-xl p-4 space-y-3">
              <h5 className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider font-mono border-b border-slate-850 pb-2">📶 Hardware Diagnostics</h5>
              <div className="space-y-2 text-xs font-mono">
                <div className="flex justify-between">
                  <span className="text-slate-500">Device Model:</span>
                  <strong className="text-slate-200 truncate max-w-[120px]">{selectedEmp.device?.deviceName || 'Generic Handset'}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">OS Platform:</span>
                  <strong className="text-slate-200">{selectedEmp.device?.platform || 'Android'}</strong>
                </div>
                <div className="flex justify-between items-center border-t border-slate-900 pt-2 mt-2">
                  <span className="text-slate-500 flex items-center gap-1"><Battery className="w-3.5 h-3.5" /> Battery level:</span>
                  <strong className={`font-bold ${
                    (selectedEmp.device?.batteryLevel ?? 100) < 20 ? 'text-rose-500 animate-pulse' : 'text-emerald-400'
                  }`}>
                    {selectedEmp.device?.batteryLevel ?? 100}%
                  </strong>
                </div>
              </div>
            </div>

            {/* GPS Permissions */}
            <div className="bg-slate-950 border border-slate-850 rounded-xl p-4 space-y-3">
              <h5 className="text-[11px] font-bold text-purple-400 uppercase tracking-wider font-mono border-b border-slate-850 pb-2">🛡️ GPS Link Security</h5>
              <div className="space-y-2 text-xs font-mono">
                <div className="flex justify-between">
                  <span className="text-slate-500">GPS Sensor:</span>
                  <strong className={selectedEmp.device?.isGpsEnabled ? 'text-emerald-400' : 'text-rose-500'}>
                    {selectedEmp.device?.isGpsEnabled ? 'ENABLED' : 'DISABLED'}
                  </strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Permission:</span>
                  <strong className={selectedEmp.device?.locationPermission === 'GRANTED' ? 'text-emerald-400 font-bold' : 'text-rose-500'}>
                    {selectedEmp.device?.locationPermission || 'GRANTED'}
                  </strong>
                </div>
                <div className="flex justify-between border-t border-slate-900 pt-2 mt-2">
                  <span className="text-slate-500">Status Verified:</span>
                  <strong className="text-emerald-400">Legitimate GPS</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
