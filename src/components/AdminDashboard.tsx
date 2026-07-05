import React, { useState, useEffect } from 'react';
import { 
  Employee, 
  Geofence, 
  Customer, 
  Visit, 
  Attendance, 
  Notification, 
  EmployeeStatus, 
  GeofenceType, 
  VisitStatus,
  Coordinates,
  AttendanceStatus
} from '../types';
import { InteractiveMap } from './InteractiveMap';
import { 
  Map, 
  History, 
  Shield, 
  FileText, 
  CheckSquare, 
  Bell, 
  Search, 
  Filter, 
  RefreshCw, 
  Plus, 
  Download, 
  TrendingUp, 
  Compass, 
  User, 
  Battery, 
  AlertCircle,
  Play,
  Pause,
  ArrowRight,
  Sparkles,
  MapPin,
  ClipboardList,
  Briefcase,
  Info,
  ShieldAlert,
  Users,
  Smartphone,
  QrCode,
  Key,
  Edit,
  Trash2
} from 'lucide-react';
import { HISTORICAL_ROUTES } from '../data';

interface AdminDashboardProps {
  employees: Employee[];
  geofences: Geofence[];
  customers: Customer[];
  visits: Visit[];
  attendanceLogs: Attendance[];
  notifications: Notification[];
  onSelectEmployee: (id: string | null) => void;
  selectedEmployeeId: string | null;
  onAddGeofence: (geo: Geofence) => void;
  onAddNotification: (notif: { type: string; message: string; empId: string }) => void;
  onClearNotifications: () => void;
  onUpdateEmployee: (emp: Employee) => void;
  onAddEmployee: (emp: any) => Promise<void>;
  onDeleteEmployee: (id: string) => Promise<void>;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  employees,
  geofences,
  customers,
  visits,
  attendanceLogs,
  notifications,
  onSelectEmployee,
  selectedEmployeeId,
  onAddGeofence,
  onAddNotification,
  onClearNotifications,
  onUpdateEmployee,
  onAddEmployee,
  onDeleteEmployee,
}) => {
  // Navigation Tabs
  const [activeTab, setActiveTab] = useState<'map' | 'replay' | 'geofence' | 'attendance' | 'visits' | 'reports' | 'employees'>('map');

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [teamFilter, setTeamFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Route Replay States
  const [replayEmpId, setReplayEmpId] = useState<string>('emp_1');
  const [replayIndex, setReplayIndex] = useState<number>(0);
  const [isReplaying, setIsReplaying] = useState<boolean>(false);
  const [replaySpeed, setReplaySpeed] = useState<number>(1); // Interval multiplier

  // Geofence builder states
  const [isAddingGeofence, setIsAddingGeofence] = useState<boolean>(false);
  const [newGeoName, setNewGeoName] = useState<string>('');
  const [newGeoType, setNewGeoType] = useState<GeofenceType>(GeofenceType.CIRCLE);
  const [newGeoRadius, setNewGeoRadius] = useState<number>(150);
  const [newGeoCoords, setNewGeoCoords] = useState<Coordinates | null>(null);

  // Active notification count
  const unreadNotifCount = notifications.filter(n => !n.read).length;

  // Selected Employee Control Sub-tabs
  const [empDetailsTab, setEmpDetailsTab] = useState<'gis' | 'security' | 'ai'>('gis');

  // Employee CRUD Modal states
  const [isEmployeeModalOpen, setIsEmployeeModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [selectedQrCode, setSelectedQrCode] = useState<string | null>(null);

  // Form Fields
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formRole, setFormRole] = useState('RIDER');
  const [formCode, setFormCode] = useState('');
  const [formDepartment, setFormDepartment] = useState('Operations');
  const [formDesignation, setFormDesignation] = useState('Staff');
  const [formBranch, setFormBranch] = useState('Chittagong');
  const [formFactory, setFormFactory] = useState('Steel Plant');
  const [formRegion, setFormRegion] = useState('Chattogram');
  const [formPhotoUrl, setFormPhotoUrl] = useState('');
  const [formDeviceName, setFormDeviceName] = useState('');
  const [formDevicePlatform, setFormDevicePlatform] = useState('Android');

  // Employee Tab Filters
  const [deptFilter, setDeptFilter] = useState('ALL');
  const [branchFilter, setBranchFilter] = useState('ALL');
  const [factoryFilter, setFactoryFilter] = useState('ALL');
  const [regionFilter, setRegionFilter] = useState('ALL');

  // Filtered employees list for sidebar and personnel directory
  const filteredEmployees = employees.filter(emp => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = emp.name.toLowerCase().includes(searchLower) || 
                          emp.role.toLowerCase().includes(searchLower) ||
                          (emp.email && emp.email.toLowerCase().includes(searchLower)) ||
                          (emp.employeeCode && emp.employeeCode.toLowerCase().includes(searchLower));
                          
    const matchesTeam = teamFilter === 'ALL' || (emp.team && emp.team.includes(teamFilter));
    const matchesStatus = statusFilter === 'ALL' || emp.status === statusFilter;
    const matchesDept = deptFilter === 'ALL' || emp.department === deptFilter;
    const matchesBranch = branchFilter === 'ALL' || emp.branch === branchFilter;
    const matchesFactory = factoryFilter === 'ALL' || emp.factory === factoryFilter;
    const matchesRegion = regionFilter === 'ALL' || emp.region === regionFilter;
    
    return matchesSearch && matchesTeam && matchesStatus && matchesDept && matchesBranch && matchesFactory && matchesRegion;
  });

  // Get teams listed in company
  const uniqueTeams = Array.from(new Set(employees.map(e => e.team.split(' ')[0])));

  // Route History Replay Player Hook
  useEffect(() => {
    let timer: any;
    if (isReplaying) {
      const activeRoutes = HISTORICAL_ROUTES[replayEmpId] || [];
      const activeRoute = activeRoutes[0];
      if (activeRoute && activeRoute.path) {
        timer = setInterval(() => {
          setReplayIndex(prev => {
            if (prev >= activeRoute.path.length - 1) {
              setIsReplaying(false);
              return prev;
            }
            const nextIdx = prev + 1;
            // Update the employee position in simulated database to match playback!
            const emp = employees.find(e => e.id === replayEmpId);
            if (emp) {
              const currentCoord = activeRoute.path[nextIdx];
              onUpdateEmployee({
                ...emp,
                coords: currentCoord,
                speed: Math.round(activeRoute.avgSpeed + (Math.random() * 10 - 5)),
                currentAddress: `Driving through Route Playback`
              });
            }
            return nextIdx;
          });
        }, 1200 / replaySpeed);
      }
    }
    return () => clearInterval(timer);
  }, [isReplaying, replayEmpId, replaySpeed, employees]);

  const handleCreateClick = () => {
    setEditingEmployee(null);
    setFormName('');
    setFormEmail('');
    setFormPassword('');
    setFormPhone('');
    setFormRole('RIDER');
    setFormCode('');
    setFormDepartment('Operations');
    setFormDesignation('Staff');
    setFormBranch('Chittagong');
    setFormFactory('Steel Plant');
    setFormRegion('Chattogram');
    setFormPhotoUrl('https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150');
    setFormDeviceName('');
    setFormDevicePlatform('Android');
    setIsEmployeeModalOpen(true);
  };

  const handleEditClick = (emp: Employee) => {
    setEditingEmployee(emp);
    setFormName(emp.name);
    setFormEmail(emp.email || '');
    setFormPassword('');
    setFormPhone(emp.phone || '');
    setFormRole(emp.role || 'RIDER');
    setFormCode(emp.employeeCode || '');
    setFormDepartment(emp.department || 'Operations');
    setFormDesignation(emp.designation || 'Staff');
    setFormBranch(emp.branch || 'Chittagong');
    setFormFactory(emp.factory || 'Steel Plant');
    setFormRegion(emp.region || 'Chattogram');
    setFormPhotoUrl(emp.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150');
    setFormDeviceName(emp.deviceName || '');
    setFormDevicePlatform(emp.devicePlatform || 'Android');
    setIsEmployeeModalOpen(true);
  };

  const handleSaveEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      name: formName,
      email: formEmail,
      password: formPassword || undefined,
      phone: formPhone,
      role: formRole,
      employeeCode: formCode,
      department: formDepartment,
      designation: formDesignation,
      branch: formBranch,
      factory: formFactory,
      region: formRegion,
      photoUrl: formPhotoUrl,
      deviceName: formDeviceName || `${formName}'s Device`,
      platform: formDevicePlatform
    };

    if (editingEmployee) {
      await onUpdateEmployee({
        ...editingEmployee,
        ...data,
        avatar: formPhotoUrl,
      });
    } else {
      await onAddEmployee(data);
    }
    setIsEmployeeModalOpen(false);
  };

  const handleDeleteClick = async (id: string) => {
    if (confirm("Are you sure you want to delete this employee?")) {
      await onDeleteEmployee(id);
    }
  };

  // Handle map click to place new geofence
  const handleMapAddGeofence = (coords: Coordinates) => {
    setNewGeoCoords(coords);
  };

  // Save new geofence
  const handleSaveGeofence = () => {
    if (!newGeoName || !newGeoCoords) return;

    const newGeo: Geofence = {
      id: `geo_new_${Date.now()}`,
      name: newGeoName,
      type: newGeoType,
      coords: newGeoCoords,
      status: 'ACTIVE',
      targetTeams: ['Delivery Team Alpha', 'SFC Support Team C'],
      enterCount: 0,
      exitCount: 0,
      radius: newGeoType === GeofenceType.CIRCLE ? newGeoRadius : undefined,
      polygonPath: newGeoType === GeofenceType.POLYGON ? [
        { lat: newGeoCoords.lat + 0.003, lng: newGeoCoords.lng - 0.003 },
        { lat: newGeoCoords.lat + 0.003, lng: newGeoCoords.lng + 0.003 },
        { lat: newGeoCoords.lat - 0.003, lng: newGeoCoords.lng + 0.003 },
        { lat: newGeoCoords.lat - 0.003, lng: newGeoCoords.lng - 0.003 },
      ] : undefined
    };

    onAddGeofence(newGeo);
    setIsAddingGeofence(false);
    setNewGeoCoords(null);
    setNewGeoName('');

    onAddNotification({
      type: 'GEOFENCE_ENTER',
      message: `System Geofence "${newGeoName}" created at coordinates ${newGeoCoords.lat.toFixed(4)}, ${newGeoCoords.lng.toFixed(4)}. Boundary triggers active.`,
      empId: 'system'
    });
  };

  // Helper to trigger CSV download
  const handleExportCSV = (dataType: 'gps' | 'attendance' | 'visits') => {
    let headers = '';
    let rows = '';
    let filename = '';

    if (dataType === 'gps') {
      filename = 'mlogix_gps_daily_report.csv';
      headers = 'Employee Name,Team,Role,Speed (km/h),Battery %,GPS Accuracy (m),Latitude,Longitude,Last Update,Address\n';
      rows = employees.map(e => 
        `"${e.name}","${e.team}","${e.role}",${e.speed},${e.battery},${e.gpsAccuracy},${e.coords.lat},${e.coords.lng},"${e.lastUpdate}","${e.currentAddress}"`
      ).join('\n');
    } else if (dataType === 'attendance') {
      filename = 'mlogix_attendance_report.csv';
      headers = 'Employee Name,Date,Clock In,Clock Out,Status,Working Hours,Overtime (hrs),Geofence Validated\n';
      rows = attendanceLogs.map(log => {
        const emp = employees.find(e => e.id === log.employeeId);
        return `"${emp?.name || 'Unknown'}","${log.date}","${log.clockIn}","${log.clockOut || 'Active'}","${log.status}",${log.workingHours},${log.overtime},${log.validatedByGeofence}`;
      }).join('\n');
    } else if (dataType === 'visits') {
      filename = 'mlogix_visits_report.csv';
      headers = 'Employee Name,Customer Site,Date,Status,Arrival,Departure,Duration (mins),Notes\n';
      rows = visits.map(v => {
        const emp = employees.find(e => e.id === v.employeeId);
        const cust = customers.find(c => c.id === v.customerId);
        return `"${emp?.name || 'Unknown'}","${cust?.name || 'Unknown'}","${v.date}","${v.status}","${v.arrivalTime || ''}","${v.departureTime || ''}",${v.duration || 0},"${v.notes || ''}"`;
      }).join('\n');
    }

    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl min-h-[750px] flex flex-col md:flex-row">
      
      {/* Sidebar Navigation */}
      <div className="w-full md:w-64 bg-slate-950 border-r border-slate-850 p-5 flex flex-col justify-between">
        <div className="space-y-6">
          <div className="flex items-center gap-2 px-1">
            <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold text-sm shadow shadow-blue-500/20">
              M
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight">MetroLogix SaaS</h3>
              <span className="text-[10px] text-slate-500 font-bold block uppercase tracking-wider">Fleet Hub Control</span>
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-600 px-2 block uppercase tracking-wider mb-2">Tracking Views</span>
            
            <button
              onClick={() => setActiveTab('map')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'map' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Map className="w-4 h-4" />
              <span>Live Fleet Tracking</span>
            </button>

            <button
              onClick={() => setActiveTab('replay')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'replay' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <History className="w-4 h-4" />
              <span>Route History Playback</span>
            </button>

            <button
              onClick={() => setActiveTab('geofence')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'geofence' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Shield className="w-4 h-4" />
              <span>Geofencing Engine</span>
            </button>

            <span className="text-[10px] font-bold text-slate-600 px-2 block uppercase tracking-wider my-3 pt-2">Office Records</span>

            <button
              onClick={() => setActiveTab('employees')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'employees' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Employee Management</span>
            </button>

            <button
              onClick={() => setActiveTab('attendance')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'attendance' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <ClipboardList className="w-4 h-4" />
              <span>Attendance Integration</span>
            </button>

            <button
              onClick={() => setActiveTab('visits')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'visits' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <CheckSquare className="w-4 h-4" />
              <span>Customer Visit Logs</span>
            </button>

            <button
              onClick={() => setActiveTab('reports')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'reports' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Reports & Downloads</span>
            </button>
          </div>
        </div>

        {/* Device Sync Status Badge */}
        <div className="border-t border-slate-850 pt-5 mt-5 space-y-3.5">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1.5 font-bold"><RefreshCw className="w-3.5 h-3.5 text-blue-400 animate-spin" /> Live Data link</span>
            <span className="font-mono text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded text-[10px]">Active</span>
          </div>
        </div>
      </div>

      {/* Main Panel Content */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        
        {/* Top Navbar */}
        <div className="bg-slate-900 border-b border-slate-850 px-6 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider">
              {activeTab === 'map' && 'Live GIS Telemetry Center'}
              {activeTab === 'replay' && 'Historical GPS Playback Engine'}
              {activeTab === 'geofence' && 'Boundary Geofencing Console'}
              {activeTab === 'attendance' && 'Office Clock & Shift Audit'}
              {activeTab === 'visits' && 'Customer Site dispatches'}
              {activeTab === 'reports' && 'Corporate Reports Hub'}
            </h4>
            <span className="text-xs text-slate-400 block mt-0.5">
              {activeTab === 'map' && 'Auditing device status, batteries, and live routes across San Francisco.'}
              {activeTab === 'replay' && 'Select an employee to run second-by-second playback arrays.'}
              {activeTab === 'geofence' && 'Configure spatial zones and set active target teams.'}
              {activeTab === 'attendance' && 'Review shift validation logs, overtime calculations, and geofence verification.'}
              {activeTab === 'visits' && 'Inspect notes, digital client signatures, and verified photos.'}
              {activeTab === 'reports' && 'Export custom audit matrices to Microsoft Excel, PDF, or CSV.'}
            </span>
          </div>

          {/* Quick Stats Summary */}
          <div className="flex gap-4 self-stretch sm:self-auto bg-slate-950 p-2.5 border border-slate-850 rounded-xl text-xs font-mono text-slate-400">
            <div>
              <span className="text-[10px] text-slate-500 block">FLT ONLINE</span>
              <span className="text-white font-bold">{employees.filter(e => e.status !== EmployeeStatus.OFFLINE).length} / {employees.length}</span>
            </div>
            <div className="w-px bg-slate-800 self-stretch" />
            <div>
              <span className="text-[10px] text-slate-500 block">PENDING VERIFICATION</span>
              <span className="text-amber-400 font-bold">{visits.filter(v => v.status === VisitStatus.ONGOING).length} Site</span>
            </div>
          </div>
        </div>

        {/* Core Tab Interfaces */}
        <div className="p-6 flex-1 overflow-y-auto">
          
          {/* A. MAP MODE */}
          {activeTab === 'map' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
              
              {/* Left Column: Live List & Search */}
              <div className="xl:col-span-4 bg-slate-950 border border-slate-850 rounded-2xl p-4 flex flex-col h-[600px] shadow-xl">
                
                {/* Search */}
                <div className="relative mb-3">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search name or role..."
                    className="w-full text-xs bg-slate-900 border border-slate-800 text-slate-200 pl-8 pr-3 py-2 rounded-xl focus:outline-none focus:border-blue-500"
                  />
                  <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
                </div>

                {/* Filters Row */}
                <div className="grid grid-cols-2 gap-2 mb-4">
                  <div className="relative">
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="w-full text-[10px] bg-slate-900 border border-slate-800 text-slate-400 py-1.5 px-2 rounded-lg font-bold"
                    >
                      <option value="ALL">All Statuses</option>
                      <option value="TRAVELING">Traveling</option>
                      <option value="ONLINE">Clocked In</option>
                      <option value="IDLE">Idle / Onsite</option>
                      <option value="BREAK">On Break</option>
                      <option value="OFFLINE">Offline</option>
                    </select>
                  </div>
                  <div className="relative">
                    <select
                      value={teamFilter}
                      onChange={(e) => setTeamFilter(e.target.value)}
                      className="w-full text-[10px] bg-slate-900 border border-slate-800 text-slate-400 py-1.5 px-2 rounded-lg font-bold"
                    >
                      <option value="ALL">All Teams</option>
                      {uniqueTeams.map(t => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Live Employees List */}
                <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                  {filteredEmployees.map(emp => {
                    const isSelected = selectedEmployeeId === emp.id;
                    return (
                      <div
                        key={emp.id}
                        onClick={() => onSelectEmployee(isSelected ? null : emp.id)}
                        className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                          isSelected 
                            ? 'bg-slate-900 border-blue-500/60 shadow-lg' 
                            : 'bg-slate-900/40 border-slate-800 hover:bg-slate-900'
                        }`}
                      >
                        <div className="flex gap-3 items-start justify-between">
                          <div className="flex gap-2.5 items-center">
                            <img src={emp.avatar} alt={emp.name} className="w-8 h-8 rounded-full object-cover border border-slate-800" referrerPolicy="no-referrer" />
                            <div className="min-w-0">
                              <h5 className="text-xs font-bold text-slate-200 truncate">{emp.name}</h5>
                              <span className="text-[10px] text-slate-500 truncate block">{emp.role}</span>
                            </div>
                          </div>
                          
                          {/* Battery status */}
                          <div className="flex items-center gap-1 text-[10px] font-mono text-slate-500">
                            <Battery className={`w-3.5 h-3.5 ${emp.battery < 20 ? 'text-red-500 animate-pulse' : 'text-slate-500'}`} />
                            <span>{emp.battery}%</span>
                          </div>
                        </div>

                        {/* Location address preview */}
                        {emp.status !== EmployeeStatus.OFFLINE && (
                          <div className="mt-2.5 bg-slate-950 p-2 rounded-lg text-[9.5px] font-mono text-slate-400 flex items-center gap-2 truncate">
                            <MapPin className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                            <span>{emp.currentAddress}</span>
                          </div>
                        )}

                        {/* Bottom stats row */}
                        <div className="flex justify-between items-center mt-2.5 pt-2 border-t border-slate-850 text-[10px] font-mono text-slate-500">
                          <span className={`px-2 py-0.5 rounded font-bold ${
                            emp.status === EmployeeStatus.TRAVELING ? 'bg-emerald-500/10 text-emerald-400' :
                            emp.status === EmployeeStatus.IDLE ? 'bg-yellow-500/10 text-yellow-400' :
                            emp.status === EmployeeStatus.ONLINE ? 'bg-blue-500/10 text-blue-400' :
                            emp.status === EmployeeStatus.BREAK ? 'bg-orange-500/10 text-orange-400' : 'bg-slate-800 text-slate-400'
                          }`}>
                            {emp.status}
                          </span>
                          <span>{emp.speed} km/h</span>
                          <span>{emp.totalDistance.toFixed(1)} km</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Right Column: interactive Map */}
              <div className="xl:col-span-8">
                <InteractiveMap
                  employees={employees}
                  geofences={geofences}
                  customers={customers}
                  selectedEmployeeId={selectedEmployeeId}
                  onSelectEmployee={onSelectEmployee}
                />
              </div>
            </div>

            {/* Selected Employee Control Room & Real-Time Diagnostics Panel */}
            {(() => {
              if (!selectedEmployeeId) return null;
              const selEmp = employees.find(e => e.id === selectedEmployeeId);
              if (!selEmp) return null;

              // Helper for status badge styling
              const getStatusBadgeClass = (status: string) => {
                switch(status) {
                  case 'TRAVELING': return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
                  case 'ONLINE': return 'bg-blue-500/10 text-blue-400 border border-blue-500/20';
                  case 'IDLE': return 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20';
                  case 'BREAK': return 'bg-orange-500/10 text-orange-400 border border-orange-500/20';
                  default: return 'bg-slate-850 text-slate-400 border border-slate-800';
                }
              };

              // Tamper simulator helpers
              const toggleGpsState = () => {
                const nextState = !selEmp.gpsEnabled;
                const updated = { ...selEmp, gpsEnabled: nextState };
                onUpdateEmployee(updated);
                onAddNotification({
                  type: nextState ? 'SECURITY' : 'CRITICAL',
                  message: `${selEmp.name}'s device GPS was ${nextState ? 'restored' : 'DISABLED'}!`,
                  empId: selEmp.id
                });
              };

              const toggleVpnState = () => {
                const nextState = !selEmp.vpnActive;
                const updated = { ...selEmp, vpnActive: nextState };
                onUpdateEmployee(updated);
                onAddNotification({
                  type: nextState ? 'WARNING' : 'SECURITY',
                  message: `${selEmp.name}'s device VPN shield was ${nextState ? 'ACTIVATED' : 'deactivated'}.`,
                  empId: selEmp.id
                });
              };

              const toggleMockLocationState = () => {
                const nextState = !selEmp.mockLocationActive;
                const updated = { ...selEmp, mockLocationActive: nextState };
                onUpdateEmployee(updated);
                onAddNotification({
                  type: nextState ? 'CRITICAL' : 'SECURITY',
                  message: `${selEmp.name} ${nextState ? 'TRIGGERED MOCK GPS ALERT (Developer fake provider detected!)' : 'restored legitimate GPS positioning.'}`,
                  empId: selEmp.id
                });
              };

              const togglePermissionState = () => {
                const nextState: "GRANTED" | "DENIED" | "RESTRICTED" = selEmp.locationPermission === 'GRANTED' ? 'RESTRICTED' : 'GRANTED';
                const updated = { ...selEmp, locationPermission: nextState };
                onUpdateEmployee(updated);
                onAddNotification({
                  type: nextState === 'GRANTED' ? 'SECURITY' : 'CRITICAL',
                  message: `${selEmp.name} ${nextState === 'GRANTED' ? 'granted location access' : 'REVOKED location permission!' }`,
                  empId: selEmp.id
                });
              };

              return (
                <div className="mt-6 bg-slate-950 border border-slate-850 rounded-2xl p-5 shadow-2xl animate-fadeIn">
                  
                  {/* Panel Header */}
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-850 pb-4 mb-4">
                    <div className="flex items-center gap-3">
                      <img src={selEmp.avatar} alt={selEmp.name} className="w-12 h-12 rounded-full object-cover border-2 border-blue-500/40" />
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-white">{selEmp.name}</h4>
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold font-mono ${getStatusBadgeClass(selEmp.status)}`}>
                            {selEmp.status}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-0.5 font-mono">
                          {selEmp.role} • {selEmp.team} • <strong className="text-slate-300">{selEmp.deviceName}</strong> ({selEmp.networkType})
                        </p>
                      </div>
                    </div>

                    {/* Horizontal sub-tabs selector */}
                    <div className="flex bg-slate-900 border border-slate-800 p-1 rounded-xl">
                      {[
                        { id: 'gis', label: '📍 GIS & Outlet Analytics', icon: Compass },
                        { id: 'security', label: '🛡️ Device & Anti-Tamper', icon: Shield },
                        { id: 'ai', label: '🤖 AI Fleet Predictions', icon: Sparkles }
                      ].map(t => (
                        <button
                          key={t.id}
                          onClick={() => setEmpDetailsTab(t.id as any)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                            empDetailsTab === t.id 
                              ? 'bg-blue-600 text-white shadow' 
                              : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          <t.icon className="w-3.5 h-3.5" />
                          <span>{t.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Panel Sub-Views */}
                  {empDetailsTab === 'gis' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Nearest Assigned Outlet */}
                      <div className="bg-slate-900/60 border border-slate-850 rounded-xl p-4 space-y-3">
                        <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                          <h5 className="text-[11px] font-bold text-blue-400 uppercase tracking-wider font-mono">📍 Outlet Dispatch Analytics</h5>
                          <span className="text-[10px] text-slate-500 font-mono">Active Target Zone</span>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-xs">
                          <div>
                            <span className="text-[9px] text-slate-500 block">NEAREST ASSIGNED OUTLET</span>
                            <span className="font-bold text-slate-200">{selEmp.nearestOutletName}</span>
                          </div>
                          <div>
                            <span className="text-[9px] text-slate-500 block">CURRENT DISTANCE</span>
                            <span className="font-mono font-bold text-emerald-400">{selEmp.distanceToOutletKm} km</span>
                          </div>
                          <div>
                            <span className="text-[9px] text-slate-500 block">ESTIMATED ARRIVAL (ETA)</span>
                            <span className="font-mono font-bold text-white">{selEmp.etaMinutes} mins</span>
                          </div>
                          <div>
                            <span className="text-[9px] text-slate-500 block">ROUTE DELAY (TRAFFIC-ADJUSTED)</span>
                            <span className="font-mono text-amber-400 font-bold">+{selEmp.trafficDelayMinutes} mins delay</span>
                          </div>
                          <div className="col-span-2">
                            <span className="text-[9px] text-slate-500 block">RECOMMENDED TRAVEL PATHWAY</span>
                            <span className="font-bold text-slate-300 font-mono text-[11px] flex items-center gap-1">
                              <Compass className="w-3.5 h-3.5 text-blue-400" />
                              {selEmp.bestRouteName}
                            </span>
                          </div>
                        </div>

                        <div className="pt-2 border-t border-slate-800 grid grid-cols-2 gap-4 text-[10px] text-slate-400">
                          <div className="flex justify-between">
                            <span>Visited Outlets:</span>
                            <strong className="text-emerald-400 font-mono">{selEmp.visitedOutletsCount}</strong>
                          </div>
                          <div className="flex justify-between">
                            <span>Missed Outlets:</span>
                            <strong className="text-red-400 font-mono">{selEmp.missedOutletsCount}</strong>
                          </div>
                        </div>
                      </div>

                      {/* Head Office Travel Tracker */}
                      <div className="bg-slate-900/60 border border-slate-850 rounded-xl p-4 space-y-3">
                        <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                          <h5 className="text-[11px] font-bold text-purple-400 uppercase tracking-wider font-mono">🏢 Headquarters Fleet Tracker</h5>
                          <span className="text-[10px] text-slate-500 font-mono">Base Operations</span>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-xs">
                          <div>
                            <span className="text-[9px] text-slate-500 block">DISTANCE FROM METROLOGIX HQ</span>
                            <span className="font-mono font-bold text-white">{selEmp.distanceFromHeadOfficeKm.toFixed(2)} km</span>
                          </div>
                          <div>
                            <span className="text-[9px] text-slate-500 block">TIME SINCE LEFT HQ OFFICE</span>
                            <span className="font-mono font-bold text-slate-300">{selEmp.timeSinceLeftOfficeMinutes} mins ago</span>
                          </div>
                          <div>
                            <span className="text-[9px] text-slate-500 block">TOTAL CUMULATIVE ODOMETER</span>
                            <span className="font-mono font-bold text-emerald-400">{selEmp.totalDistance.toFixed(1)} km travelled</span>
                          </div>
                          <div>
                            <span className="text-[9px] text-slate-500 block">EXPECTED RETURN / CLOCK-OUT</span>
                            <span className="font-mono font-bold text-amber-500">{selEmp.expectedReturnTime}</span>
                          </div>
                        </div>

                        <div className="bg-slate-950 p-2.5 border border-slate-850 rounded-lg text-[10px] text-slate-400 leading-normal flex items-start gap-2">
                          <Info className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
                          <span>Calculated travel values are refreshed via satellite telemetry every 30 seconds. Compliance status is auto-archived.</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {empDetailsTab === 'security' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Device Diagnostics Mat */}
                      <div className="bg-slate-900/60 border border-slate-850 rounded-xl p-4 space-y-3">
                        <h5 className="text-[11px] font-bold text-blue-400 uppercase tracking-wider font-mono border-b border-slate-800 pb-2">
                          📶 Hardware Diagnostics Matrix
                        </h5>
                        
                        <div className="grid grid-cols-2 gap-3 text-[11px] font-mono">
                          <div className="flex justify-between bg-slate-950 p-2 rounded border border-slate-850">
                            <span className="text-slate-500">GPS Link:</span>
                            <strong className={selEmp.gpsEnabled ? 'text-emerald-400' : 'text-red-500 animate-pulse'}>
                              {selEmp.gpsEnabled ? 'ACTIVE GPS' : 'OFFLINE'}
                            </strong>
                          </div>
                          <div className="flex justify-between bg-slate-950 p-2 rounded border border-slate-850">
                            <span className="text-slate-500">Power Saver:</span>
                            <strong className={selEmp.batterySaver ? 'text-amber-500' : 'text-slate-400'}>
                              {selEmp.batterySaver ? 'SAVER ON' : 'INACTIVE'}
                            </strong>
                          </div>
                          <div className="flex justify-between bg-slate-950 p-2 rounded border border-slate-850">
                            <span className="text-slate-500">Location Perms:</span>
                            <strong className={selEmp.locationPermission === 'GRANTED' ? 'text-emerald-400' : 'text-red-500 font-bold'}>
                              {selEmp.locationPermission}
                            </strong>
                          </div>
                          <div className="flex justify-between bg-slate-950 p-2 rounded border border-slate-850">
                            <span className="text-slate-500">Background GPS:</span>
                            <strong className={selEmp.backgroundPermission === 'ALWAYS' ? 'text-emerald-400' : 'text-red-400'}>
                              {selEmp.backgroundPermission}
                            </strong>
                          </div>
                          <div className="flex justify-between bg-slate-950 p-2 rounded border border-slate-850">
                            <span className="text-slate-500">App Closed:</span>
                            <strong className={selEmp.appForceClosed ? 'text-red-500 animate-bounce font-bold' : 'text-emerald-400'}>
                              {selEmp.appForceClosed ? 'FORCE CLOSED' : 'ACTIVE IN BG'}
                            </strong>
                          </div>
                          <div className="flex justify-between bg-slate-950 p-2 rounded border border-slate-850">
                            <span className="text-slate-500">Offline Duration:</span>
                            <strong className={selEmp.offlineDurationMinutes > 0 ? 'text-red-400' : 'text-emerald-400'}>
                              {selEmp.offlineDurationMinutes} mins
                            </strong>
                          </div>
                          <div className="col-span-2 flex justify-between bg-slate-950 p-2 rounded border border-slate-850">
                            <span className="text-slate-500">Offline Local Buffer Queue:</span>
                            <strong className="text-blue-400">
                              {selEmp.cachedGPSPointsCount} points stored locally (auto-sync on connection)
                            </strong>
                          </div>
                        </div>

                        {/* Real-time Tamper Detections */}
                        <div className="pt-2 border-t border-slate-800 space-y-2">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block font-mono">Anti-Tamper Live Sensors</span>
                          <div className="flex flex-wrap gap-1.5">
                            {[
                              { label: 'Mock Location', active: selEmp.mockLocationActive },
                              { label: 'Developer Options', active: selEmp.developerModeActive },
                              { label: 'VPN Detected', active: selEmp.vpnActive },
                              { label: 'Rooted Device', active: selEmp.deviceRooted },
                              { label: 'Clock Tampering', active: selEmp.timeManipulationDetected },
                              { label: 'Background Restricted', active: selEmp.backgroundRestricted }
                            ].map((sensor, sIdx) => (
                              <span
                                key={sIdx}
                                className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                                  sensor.active 
                                    ? 'bg-rose-950 text-rose-400 border border-rose-900/40 animate-pulse' 
                                    : 'bg-slate-950 text-slate-500 border border-slate-850'
                                }`}
                              >
                                {sensor.active ? '⚠️' : '✓'} {sensor.label}: {sensor.active ? 'TRIGGERED' : 'SECURE'}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Anti-Tamper Simulation Panel */}
                      <div className="bg-slate-900/60 border border-slate-850 rounded-xl p-4 space-y-3.5">
                        <div className="flex items-center gap-1.5 border-b border-slate-800 pb-2">
                          <ShieldAlert className="w-4 h-4 text-red-500 animate-pulse" />
                          <h5 className="text-[11px] font-bold text-red-400 uppercase tracking-wider font-mono">
                            🛠️ Enterprise Security Simulator (Trigger Alerts)
                          </h5>
                        </div>
                        
                        <p className="text-[10px] text-slate-400 leading-normal">
                          MetroLogix enforces compliance standards. Use the buttons below to **simulate real hardware events** on {selEmp.name}'s device. These will immediately trigger real-time critical alarms in the dashboard logging system.
                        </p>

                        <div className="grid grid-cols-2 gap-2">
                          <button
                            onClick={toggleGpsState}
                            className={`py-2 px-2.5 rounded-lg text-[10px] font-mono font-bold border transition-all text-left ${
                              !selEmp.gpsEnabled 
                                ? 'bg-red-500/10 border-red-500 text-red-400' 
                                : 'bg-slate-950 border-slate-800 text-slate-300 hover:text-white'
                            }`}
                          >
                            {!selEmp.gpsEnabled ? '✓ Enable Device GPS' : '❌ Disable Device GPS'}
                          </button>

                          <button
                            onClick={toggleVpnState}
                            className={`py-2 px-2.5 rounded-lg text-[10px] font-mono font-bold border transition-all text-left ${
                              selEmp.vpnActive 
                                ? 'bg-red-500/10 border-red-500 text-red-400' 
                                : 'bg-slate-950 border-slate-800 text-slate-300 hover:text-white'
                            }`}
                          >
                            {selEmp.vpnActive ? '✓ Deactivate VPN' : '❌ Activate Fake VPN Shield'}
                          </button>

                          <button
                            onClick={toggleMockLocationState}
                            className={`py-2 px-2.5 rounded-lg text-[10px] font-mono font-bold border transition-all text-left ${
                              selEmp.mockLocationActive 
                                ? 'bg-red-500/10 border-red-500 text-red-400' 
                                : 'bg-slate-950 border-slate-800 text-slate-300 hover:text-white'
                            }`}
                          >
                            {selEmp.mockLocationActive ? '✓ Clear Mock GPS' : '❌ Trigger Fake/Mock GPS Provider'}
                          </button>

                          <button
                            onClick={togglePermissionState}
                            className={`py-2 px-2.5 rounded-lg text-[10px] font-mono font-bold border transition-all text-left ${
                              selEmp.locationPermission !== 'GRANTED' 
                                ? 'bg-red-500/10 border-red-500 text-red-400' 
                                : 'bg-slate-950 border-slate-800 text-slate-300 hover:text-white'
                            }`}
                          >
                            {selEmp.locationPermission !== 'GRANTED' ? '✓ Grant Location Permission' : '❌ Revoke Location Permission'}
                          </button>
                        </div>

                        <div className="p-2 bg-slate-950 border border-slate-850 rounded-lg text-[9.5px] text-slate-500 leading-normal font-mono">
                          * GDPR Compliance: All GPS position logs are encrypted at rest with AES-256 and stored inside security-isolated containers. Explicit user consent has been granted.
                        </div>
                      </div>
                    </div>
                  )}

                  {empDetailsTab === 'ai' && (
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                      {/* Productivity & efficiency parameters */}
                      <div className="md:col-span-5 bg-slate-900/60 border border-slate-850 rounded-xl p-4 space-y-4">
                        <h5 className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider font-mono border-b border-slate-800 pb-2">
                          📊 AI Efficiency Scorecard
                        </h5>

                        {/* Productivity meter */}
                        <div className="space-y-1.5">
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-slate-400 font-bold">Productivity Rating:</span>
                            <span className="font-mono font-bold text-emerald-400">{selEmp.productivityScore}%</span>
                          </div>
                          <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
                            <div 
                              className={`h-full rounded-full transition-all duration-500 ${
                                selEmp.productivityScore > 85 ? 'bg-emerald-500' :
                                selEmp.productivityScore > 65 ? 'bg-yellow-500' : 'bg-red-500'
                              }`}
                              style={{ width: `${selEmp.productivityScore}%` }}
                            />
                          </div>
                        </div>

                        {/* Travel efficiency */}
                        <div className="space-y-1.5">
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-slate-400 font-bold">Route & Travel Efficiency:</span>
                            <span className="font-mono font-bold text-blue-400">{selEmp.travelEfficiency}%</span>
                          </div>
                          <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
                            <div 
                              className="h-full rounded-full bg-blue-500 transition-all duration-500"
                              style={{ width: `${selEmp.travelEfficiency}%` }}
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 pt-2 text-[10px] font-mono">
                          <div className="bg-slate-950 p-2.5 rounded border border-slate-850 text-center">
                            <span className="text-slate-500 block">IDLE RATING</span>
                            <strong className={`block text-xs mt-1 ${
                              selEmp.idleAnalysisRating === 'Excellent' ? 'text-emerald-400' :
                              selEmp.idleAnalysisRating === 'Normal' ? 'text-blue-400' : 'text-amber-500'
                            }`}>{selEmp.idleAnalysisRating}</strong>
                          </div>
                          <div className="bg-slate-950 p-2.5 rounded border border-slate-850 text-center">
                            <span className="text-slate-500 block">PATH OPTIMIZED</span>
                            <strong className="block text-xs text-white mt-1">{selEmp.routeOptimized ? 'YES (AI Active)' : 'NO (Manual)'}</strong>
                          </div>
                        </div>
                      </div>

                      {/* Late & Missed Prediction Alerts */}
                      <div className="md:col-span-7 bg-slate-900/60 border border-slate-850 rounded-xl p-4 space-y-4">
                        <h5 className="text-[11px] font-bold text-amber-400 uppercase tracking-wider font-mono border-b border-slate-800 pb-2">
                          🤖 Smart Risk & Delayed Arrival Forecasts
                        </h5>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {/* Probability gauge */}
                          <div className="bg-slate-950 p-3 rounded-xl border border-slate-850 flex items-center gap-3">
                            <div className="relative w-12 h-12 rounded-full border-4 border-slate-800 flex items-center justify-center font-bold font-mono text-xs text-white">
                              {selEmp.latePredictionProb}%
                              <svg className="absolute inset-x-0 inset-y-0 w-12 h-12 -rotate-90">
                                <circle 
                                  cx="24" cy="24" r="20" 
                                  fill="none" stroke="#f59e0b" strokeWidth="4" 
                                  strokeDasharray="125.6" 
                                  strokeDashoffset={125.6 - (125.6 * selEmp.latePredictionProb) / 100} 
                                />
                              </svg>
                            </div>
                            <div>
                              <span className="text-[10px] text-slate-500 block font-mono">LATE PREDICTION</span>
                              <p className="text-xs text-slate-200 font-bold leading-tight">
                                {selEmp.latePredictionProb > 50 ? 'High Delay Risk' : 'Low On-Time Risk'}
                              </p>
                            </div>
                          </div>

                          {/* Missed visit predictions */}
                          <div className={`p-3 rounded-xl border flex items-center gap-3 ${
                            selEmp.missedVisitPrediction 
                              ? 'bg-rose-950/20 border-rose-900/40 text-rose-400' 
                              : 'bg-slate-950 border-slate-850 text-slate-400'
                          }`}>
                            <AlertCircle className={`w-6 h-6 ${selEmp.missedVisitPrediction ? 'text-rose-500' : 'text-slate-600'}`} />
                            <div>
                              <span className="text-[10px] text-slate-500 block font-mono">MISSED VISIT FORECAST</span>
                              <p className="text-xs font-bold leading-tight text-white">
                                {selEmp.missedVisitPrediction ? 'Warning: Miss Risk!' : 'Visits Secure'}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* LLM Recommendation Block */}
                        <div className="bg-slate-950 p-3 border border-slate-850 rounded-xl space-y-1.5">
                          <span className="text-[9px] font-bold text-purple-400 font-mono uppercase tracking-wider block">AI Fleet Dispatcher Copilot Recommendations:</span>
                          <p className="text-xs text-slate-200 italic leading-relaxed">
                            "{selEmp.attendanceInsights}"
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                </div>
              );
            })()}
            </div>
          )}

          {/* B. REPLAY MODE */}
          {activeTab === 'replay' && (
            <div className="space-y-6">
              <div className="bg-slate-950 border border-slate-850 rounded-2xl p-6 shadow-xl grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                
                {/* Employee Selector & Player Controls */}
                <div className="lg:col-span-4 space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-400 uppercase">Select Staff Member</label>
                    <select
                      value={replayEmpId}
                      onChange={(e) => {
                        setReplayEmpId(e.target.value);
                        setReplayIndex(0);
                        setIsReplaying(false);
                      }}
                      className="w-full text-xs bg-slate-900 border border-slate-800 text-slate-200 p-2.5 rounded-xl font-bold"
                    >
                      {employees.filter(e => HISTORICAL_ROUTES[e.id]).map(e => (
                        <option key={e.id} value={e.id}>{e.name} ({e.role})</option>
                      ))}
                    </select>
                  </div>

                  {/* Playback Controls */}
                  <div className="flex gap-2 items-center bg-slate-900 p-3 rounded-xl border border-slate-850 justify-between">
                    <div className="flex gap-2">
                      {isReplaying ? (
                        <button
                          onClick={() => setIsReplaying(false)}
                          className="bg-amber-600 hover:bg-amber-500 text-white font-bold p-2.5 rounded-xl text-xs active:scale-95"
                          title="Pause"
                        >
                          <Pause className="w-4 h-4 fill-current" />
                        </button>
                      ) : (
                        <button
                          onClick={() => setIsReplaying(true)}
                          className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold p-2.5 rounded-xl text-xs active:scale-95"
                          title="Play"
                        >
                          <Play className="w-4 h-4 fill-current" />
                        </button>
                      )}
                      
                      <button
                        onClick={() => {
                          setReplayIndex(0);
                          setIsReplaying(false);
                        }}
                        className="bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-white px-3 rounded-xl border border-slate-850 text-xs font-bold"
                      >
                        Reset
                      </button>
                    </div>

                    <div className="flex gap-1">
                      {[1, 2, 4].map(s => (
                        <button
                          key={s}
                          onClick={() => setReplaySpeed(s)}
                          className={`text-[10px] font-bold px-2 py-1 rounded ${
                            replaySpeed === s ? 'bg-blue-600 text-white' : 'bg-slate-950 text-slate-400 hover:text-white'
                          }`}
                        >
                          {s}x
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Route details list */}
                  {(() => {
                    const activeRoute = (HISTORICAL_ROUTES[replayEmpId] || [])[0];
                    if (!activeRoute) return null;
                    return (
                      <div className="text-[11px] text-slate-400 space-y-2.5 bg-slate-900 p-4 border border-slate-850 rounded-xl font-mono">
                        <div className="flex justify-between"><span>Distance Covered:</span><span className="text-white font-bold">{activeRoute.totalDistance} km</span></div>
                        <div className="flex justify-between"><span>Drive Duration:</span><span className="text-white font-bold">{activeRoute.duration} mins</span></div>
                        <div className="flex justify-between"><span>Avg Speed:</span><span className="text-white font-bold">{activeRoute.avgSpeed} km/h</span></div>
                        <div className="flex justify-between"><span>Max speed limit:</span><span className="text-white font-bold">{activeRoute.maxSpeed} km/h</span></div>
                        <div className="flex justify-between"><span>Idle Period:</span><span className="text-white font-bold text-amber-500">{activeRoute.idleDuration} mins</span></div>
                      </div>
                    );
                  })()}
                </div>

                {/* Right Column: Route timeline stops progress */}
                <div className="lg:col-span-8 bg-slate-900 border border-slate-850 rounded-xl p-4 h-[250px] overflow-y-auto">
                  <h5 className="text-xs font-bold text-slate-300 mb-4 uppercase">Timeline stops and logs</h5>
                  {(() => {
                    const activeRoute = (HISTORICAL_ROUTES[replayEmpId] || [])[0];
                    if (!activeRoute) return null;

                    return (
                      <div className="relative border-l-2 border-slate-800 ml-4 space-y-5">
                        {activeRoute.stops.map((stop, idx) => (
                          <div key={idx} className="relative pl-6">
                            {/* Circle dot on line */}
                            <span className="absolute -left-2.5 top-1 w-5 h-5 rounded-full bg-slate-950 border-2 border-blue-500 flex items-center justify-center text-[9px] text-white font-bold">
                              {idx + 1}
                            </span>
                            <div>
                              <span className="text-xs font-bold text-slate-200">{stop.name}</span>
                              <p className="text-[10px] text-slate-500 mt-0.5 font-mono">{stop.arrival} • Idle Duration: {stop.duration} mins</p>
                              <button 
                                onClick={() => {
                                  // Jump to this location on map
                                  const coordinateIndex = activeRoute.path.findIndex(p => 
                                    Math.abs(p.lat - stop.coords.lat) < 0.001 && Math.abs(p.lng - stop.coords.lng) < 0.001
                                  );
                                  if (coordinateIndex >= 0) {
                                    setReplayIndex(coordinateIndex);
                                  }
                                }}
                                className="text-[9px] text-blue-400 hover:text-white underline font-mono mt-1"
                              >
                                Jump to checkpoint coords
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* Dynamic Interactive Timeline Slider & Speed Graph */}
              {(() => {
                const activeRoute = (HISTORICAL_ROUTES[replayEmpId] || [])[0];
                if (!activeRoute) return null;

                const pathLength = activeRoute.path.length;
                
                // Simulate point-by-point velocities to render in the custom graph
                const speeds = activeRoute.path.map((_, idx) => {
                  const factor = Math.sin(idx / 4) * 15 + Math.cos(idx / 12) * 8;
                  const randomBump = (idx % 7 === 0) ? 12 : 0;
                  const base = activeRoute.avgSpeed;
                  return Math.max(0, Math.min(activeRoute.maxSpeed, Math.round(base + factor + randomBump)));
                });

                const currentSpeed = speeds[replayIndex] || 0;

                // SVG Path calculation for the speed chart
                const chartWidth = 800;
                const chartHeight = 60;
                const pointsStr = speeds.map((speed, idx) => {
                  const x = (idx / (pathLength - 1)) * chartWidth;
                  const y = chartHeight - (speed / activeRoute.maxSpeed) * chartHeight;
                  return `${x},${y}`;
                }).join(' L ');

                // Closed polygon path for shaded gradient fill
                const closedPathStr = `M 0,${chartHeight} L ${pointsStr} L ${chartWidth},${chartHeight} Z`;

                return (
                  <div className="bg-slate-950 border border-slate-850 rounded-2xl p-5 shadow-xl space-y-4">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div>
                        <h5 className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono">⚡ Telemetry Timeline & Speed Analysis (Samsara-Grade GIS)</h5>
                        <p className="text-[11px] text-slate-500 mt-1">Scrub the timeline range below to audit second-by-second vehicle velocity, coordinates, and geofence overlaps.</p>
                      </div>
                      <div className="flex items-center gap-4 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl font-mono text-[10px]">
                        <div>
                          <span className="text-slate-500 block">CURRENT INDEX</span>
                          <span className="text-white font-bold">Pt {replayIndex + 1} / {pathLength}</span>
                        </div>
                        <div className="w-px bg-slate-800 h-6" />
                        <div>
                          <span className="text-slate-500 block">POLLED VELOCITY</span>
                          <span className={`font-bold ${currentSpeed > 40 ? 'text-rose-400' : 'text-emerald-400'}`}>
                            {currentSpeed} km/h
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Glowing Speed Wave Chart */}
                    <div className="relative bg-slate-900/40 border border-slate-850 rounded-xl p-3 h-20 overflow-hidden">
                      <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-full" preserveAspectRatio="none">
                        <defs>
                          <linearGradient id="speed_area_grad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#10b981" stopOpacity="0.2" />
                            <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                          </linearGradient>
                        </defs>
                        {/* Shaded Area */}
                        <path d={closedPathStr} fill="url(#speed_area_grad)" />
                        {/* Outline stroke */}
                        <path d={`M ${pointsStr}`} fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" />
                        
                        {/* Vertical Progress Indicator Needle */}
                        {(() => {
                          const needleX = (replayIndex / (pathLength - 1)) * chartWidth;
                          return (
                            <g>
                              <line x1={needleX} y1="0" x2={needleX} y2={chartHeight} stroke="#3b82f6" strokeWidth="1.5" strokeDasharray="2,2" />
                              <circle cx={needleX} cy={chartHeight - (currentSpeed / activeRoute.maxSpeed) * chartHeight} r="4" fill="#3b82f6" stroke="#ffffff" strokeWidth="1" />
                            </g>
                          );
                        })()}
                      </svg>
                    </div>

                    {/* Range Progress Slider */}
                    <div className="space-y-1">
                      <input 
                        type="range" 
                        min="0" 
                        max={pathLength - 1} 
                        value={replayIndex} 
                        onChange={(e) => setReplayIndex(parseInt(e.target.value))} 
                        className="w-full h-1.5 bg-slate-850 rounded-lg appearance-none cursor-pointer accent-blue-500" 
                      />
                      <div className="flex justify-between text-[9px] font-mono text-slate-500">
                        <span>START (08:00 AM)</span>
                        <span>Shift Playback Timeline Slider</span>
                        <span>END (05:00 PM)</span>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Vector Map Container */}
              <div className="bg-slate-950 border border-slate-850 rounded-2xl p-2 shadow-xl">
                {(() => {
                  const activeRoute = (HISTORICAL_ROUTES[replayEmpId] || [])[0];
                  return (
                    <InteractiveMap
                      employees={employees.filter(e => e.id === replayEmpId)}
                      geofences={geofences}
                      customers={customers}
                      selectedEmployeeId={replayEmpId}
                      onSelectEmployee={() => {}}
                      activeRoutePath={activeRoute?.path}
                      playbackIndex={replayIndex}
                    />
                  );
                })()}
              </div>
            </div>
          )}

          {/* C. GEOFENCING MODE */}
          {activeTab === 'geofence' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Left Column: Geofences list & create tool */}
              <div className="lg:col-span-4 bg-slate-950 border border-slate-850 rounded-2xl p-5 h-[600px] flex flex-col justify-between shadow-xl">
                <div className="space-y-5">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Configure Boundaries</span>
                    <button
                      onClick={() => setIsAddingGeofence(!isAddingGeofence)}
                      className={`text-[10px] font-bold py-1.5 px-3 rounded-lg border transition-all flex items-center gap-1 ${
                        isAddingGeofence 
                          ? 'bg-rose-600 border-rose-500 text-white' 
                          : 'bg-blue-600 border-blue-500 text-white'
                      }`}
                    >
                      <Plus className="w-3.5 h-3.5" />
                      {isAddingGeofence ? 'Cancel Builder' : 'New Geofence'}
                    </button>
                  </div>

                  {isAddingGeofence ? (
                    <div className="bg-slate-900 border border-slate-850 rounded-xl p-4 space-y-3.5 animate-fadeIn">
                      <h5 className="text-xs font-bold text-white">Interactive Geofence Builder</h5>
                      
                      {/* Name input */}
                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-400 font-bold block uppercase">Geofence Name</label>
                        <input
                          type="text"
                          value={newGeoName}
                          onChange={(e) => setNewGeoName(e.target.value)}
                          placeholder="e.g. East-Bay Storage Depot"
                          className="w-full text-xs bg-slate-950 border border-slate-800 text-slate-200 py-1.5 px-2.5 rounded-lg focus:outline-none focus:border-blue-500"
                        />
                      </div>

                      {/* Type input */}
                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-400 font-bold block uppercase font-mono">Geofence Type</label>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            onClick={() => setNewGeoType(GeofenceType.CIRCLE)}
                            className={`text-[10px] font-bold py-1.5 rounded-lg border ${
                              newGeoType === GeofenceType.CIRCLE 
                                ? 'bg-blue-500/10 border-blue-500/50 text-blue-400' 
                                : 'bg-slate-950 border-slate-800 text-slate-500'
                            }`}
                          >
                            Circular (Radius)
                          </button>
                          <button
                            onClick={() => setNewGeoType(GeofenceType.POLYGON)}
                            className={`text-[10px] font-bold py-1.5 rounded-lg border ${
                              newGeoType === GeofenceType.POLYGON 
                                ? 'bg-purple-500/10 border-purple-500/50 text-purple-400' 
                                : 'bg-slate-950 border-slate-800 text-slate-500'
                            }`}
                          >
                            Polygon (Vertices)
                          </button>
                        </div>
                      </div>

                      {/* Radius Slider if circle */}
                      {newGeoType === GeofenceType.CIRCLE && (
                        <div className="space-y-1">
                          <div className="flex justify-between text-[10px] text-slate-400">
                            <span>Radius (meters)</span>
                            <span className="font-mono text-white">{newGeoRadius}m</span>
                          </div>
                          <input
                            type="range"
                            min="50"
                            max="500"
                            value={newGeoRadius}
                            onChange={(e) => setNewGeoRadius(parseInt(e.target.value))}
                            className="w-full accent-blue-500 bg-slate-950 h-1 rounded-lg appearance-none cursor-pointer"
                          />
                        </div>
                      )}

                      {/* Coordinates notice */}
                      <div className="bg-slate-950 border border-slate-850 p-2.5 rounded-lg text-[9.5px] leading-normal text-slate-400">
                        {newGeoCoords ? (
                          <span className="text-emerald-400 font-bold">
                            ✓ Anchor Coords: {newGeoCoords.lat.toFixed(5)}, {newGeoCoords.lng.toFixed(5)}
                          </span>
                        ) : (
                          <span>⚠️ Click anywhere on the map on the right to set the center point coords.</span>
                        )}
                      </div>

                      {/* Save button */}
                      <button
                        onClick={handleSaveGeofence}
                        disabled={!newGeoName || !newGeoCoords}
                        className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-600 disabled:border-slate-850 text-white font-bold py-2 rounded-lg text-xs mt-2 flex items-center justify-center gap-1 shadow-md"
                      >
                        Create Boundary
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1">
                      {geofences.map(geo => (
                        <div key={geo.id} className="p-3 bg-slate-900 border border-slate-850 rounded-xl flex items-center justify-between">
                          <div className="min-w-0">
                            <span className="text-xs font-bold text-slate-200 block truncate">{geo.name}</span>
                            <span className="text-[10px] text-slate-500 font-mono mt-0.5">
                              {geo.type} {geo.radius ? `(${geo.radius}m)` : 'Polygon'}
                            </span>
                            <span className="text-[9px] text-slate-400 block mt-1">Detections: Enters: {geo.enterCount} | Exits: {geo.exitCount}</span>
                          </div>
                          <span className="text-[9px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded font-mono shrink-0">
                            {geo.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="bg-slate-900 p-3 border border-slate-850 rounded-xl flex items-center gap-2.5 text-[10px] leading-normal text-slate-400">
                  <Shield className="w-4 h-4 text-purple-400 shrink-0" />
                  <span>Geofences automatically trigger alerts when assigned team devices enter or exit boundaries.</span>
                </div>
              </div>

              {/* Right Column: interactive map with addition handler */}
              <div className="lg:col-span-8">
                <InteractiveMap
                  employees={employees}
                  geofences={geofences}
                  customers={customers}
                  selectedEmployeeId={selectedEmployeeId}
                  onSelectEmployee={onSelectEmployee}
                  isAddingGeofence={isAddingGeofence}
                  onAddGeofenceClick={handleMapAddGeofence}
                />
              </div>
            </div>
          )}

          {/* D. ATTENDANCE INTEGRATION */}
          {activeTab === 'attendance' && (
            <div className="bg-slate-950 border border-slate-850 rounded-3xl p-6 shadow-xl space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h4 className="text-sm font-bold text-slate-200 uppercase tracking-wider">Clock log register</h4>
                  <p className="text-xs text-slate-500 mt-1">Review coordinates-validated shift check-ins, delays, and hours summaries.</p>
                </div>
                <button
                  onClick={() => handleExportCSV('attendance')}
                  className="bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-300 hover:text-white px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all"
                >
                  <Download className="w-4 h-4 text-blue-400" />
                  Export Sheet to CSV
                </button>
              </div>

              {/* Attendance Table */}
              <div className="overflow-x-auto border border-slate-850 rounded-2xl">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-900/60 border-b border-slate-850 text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                    <tr>
                      <th className="p-4">Employee</th>
                      <th className="p-4">Date</th>
                      <th className="p-4">Clock In</th>
                      <th className="p-4">Clock Out</th>
                      <th className="p-4">Shift Status</th>
                      <th className="p-4">Working Hours</th>
                      <th className="p-4">Overtime (h)</th>
                      <th className="p-4">Validated via Geofence</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850 font-mono">
                    {attendanceLogs.map(log => {
                      const emp = employees.find(e => e.id === log.employeeId);
                      return (
                        <tr key={log.id} className="hover:bg-slate-900/40">
                          <td className="p-4 flex items-center gap-2 font-sans font-bold text-slate-200">
                            <img src={emp?.avatar} alt={emp?.name} className="w-6 h-6 rounded-full object-cover border border-slate-850" referrerPolicy="no-referrer" />
                            <span>{emp?.name || 'Unknown Staff'}</span>
                          </td>
                          <td className="p-4 text-slate-400">{log.date}</td>
                          <td className="p-4 text-slate-400">
                            {new Date(log.clockIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </td>
                          <td className="p-4 text-slate-400">
                            {log.clockOut 
                              ? new Date(log.clockOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
                              : <span className="text-emerald-400 font-bold">Active Shift</span>
                            }
                          </td>
                          <td className="p-4">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              log.status === AttendanceStatus.PRESENT ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
                            }`}>
                              {log.status}
                            </span>
                          </td>
                          <td className="p-4 text-slate-400">{log.workingHours} hrs</td>
                          <td className="p-4 text-slate-400">{log.overtime} hrs</td>
                          <td className="p-4">
                            {log.validatedByGeofence ? (
                              <span className="text-emerald-400 font-bold flex items-center gap-1"><Shield className="w-3.5 h-3.5 text-emerald-400" /> Auto-Verified</span>
                            ) : (
                              <span className="text-slate-500 flex items-center gap-1">Manual Login</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* E. CUSTOMER VISITS */}
          {activeTab === 'visits' && (
            <div className="bg-slate-950 border border-slate-850 rounded-3xl p-6 shadow-xl space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h4 className="text-sm font-bold text-slate-200 uppercase tracking-wider">Site dispatches Checklist</h4>
                  <p className="text-xs text-slate-500 mt-1">Review active routes tasks, completed service feedback, signatures, and photographic proof.</p>
                </div>
                <button
                  onClick={() => handleExportCSV('visits')}
                  className="bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-300 hover:text-white px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all"
                >
                  <Download className="w-4 h-4 text-blue-400" />
                  Export Sheet to CSV
                </button>
              </div>

              {/* Grid of visits with detailed summaries */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {visits.map(visit => {
                  const emp = employees.find(e => e.id === visit.employeeId);
                  const cust = customers.find(c => c.id === visit.customerId);
                  if (!cust) return null;

                  return (
                    <div key={visit.id} className="bg-slate-900 border border-slate-850 rounded-2xl overflow-hidden p-5 flex flex-col justify-between space-y-4">
                      <div className="space-y-3">
                        <div className="flex justify-between items-start">
                          <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                            visit.status === VisitStatus.VISITED ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                            visit.status === VisitStatus.ONGOING ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                            'bg-slate-950 text-slate-500 border border-slate-850'
                          }`}>
                            {visit.status}
                          </span>
                          <span className="text-[10px] font-mono text-slate-500">{visit.date}</span>
                        </div>

                        <div>
                          <h5 className="text-xs font-bold text-slate-200">{cust.name}</h5>
                          <span className="text-[10px] text-slate-400 block mt-0.5">{cust.address}</span>
                        </div>

                        {/* Assigned Employee profile */}
                        <div className="flex items-center gap-2 bg-slate-950 p-2 rounded-xl border border-slate-850">
                          <img src={emp?.avatar} alt={emp?.name} className="w-6 h-6 rounded-full object-cover border border-slate-850" referrerPolicy="no-referrer" />
                          <div className="min-w-0">
                            <span className="text-[10px] font-bold text-slate-300 block truncate">{emp?.name}</span>
                            <span className="text-[9px] text-slate-500 block truncate">{emp?.role}</span>
                          </div>
                        </div>

                        {/* If visited show duration and feedback notes */}
                        {visit.status === VisitStatus.VISITED && (
                          <div className="space-y-2 text-[10px] leading-relaxed">
                            <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-850 text-slate-400">
                              <span className="text-[9px] font-bold text-blue-400 block mb-0.5">Check-out Notes:</span>
                              "{visit.notes}"
                            </div>
                            {visit.signature && (
                              <div className="flex items-center gap-1.5 font-mono text-slate-500 text-[9.5px]">
                                <Briefcase className="w-3.5 h-3.5 text-blue-400" />
                                <span>Signed: <strong className="text-slate-300">{visit.signature}</strong></span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Photo verification block */}
                      {visit.status === VisitStatus.VISITED && visit.photoUrl && (
                        <div className="relative h-28 w-full bg-slate-950 rounded-xl overflow-hidden border border-slate-850">
                          <img src={visit.photoUrl} alt="Drop verification proof" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 to-transparent flex items-end p-2.5">
                            <span className="text-[9px] font-mono text-white flex items-center gap-1"><Compass className="w-3.5 h-3.5 text-emerald-400" /> Photo Verified Check-in</span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* F. REPORTS & DOWNLOADS */}
          {activeTab === 'reports' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Report 1: GPS daily tracker */}
              <div className="bg-slate-950 border border-slate-850 rounded-2xl p-5 shadow-xl flex flex-col justify-between space-y-4">
                <div>
                  <div className="w-10 h-10 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
                    <Map className="w-5 h-5" />
                  </div>
                  <h4 className="text-xs font-bold text-white uppercase mt-4">Daily GPS Travel Log</h4>
                  <p className="text-xs text-slate-400 mt-2 leading-relaxed">Contains every employee's geographic location coordinates, total travel mileage, vehicle driving speeds, and batteries.</p>
                </div>
                <button
                  onClick={() => handleExportCSV('gps')}
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow transition-all"
                >
                  <Download className="w-4 h-4" />
                  Generate CSV File
                </button>
              </div>

              {/* Report 2: Shift sheets */}
              <div className="bg-slate-950 border border-slate-850 rounded-2xl p-5 shadow-xl flex flex-col justify-between space-y-4">
                <div>
                  <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                    <ClipboardList className="w-5 h-5" />
                  </div>
                  <h4 className="text-xs font-bold text-white uppercase mt-4">Clock Sheets Ledger</h4>
                  <p className="text-xs text-slate-400 mt-2 leading-relaxed">Shift rosters, including clock-in and check-out timestamps, validated working hours, overtime, and automatic geofence checks.</p>
                </div>
                <button
                  onClick={() => handleExportCSV('attendance')}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow transition-all"
                >
                  <Download className="w-4 h-4" />
                  Generate CSV File
                </button>
              </div>

              {/* Report 3: visits completions */}
              <div className="bg-slate-950 border border-slate-850 rounded-2xl p-5 shadow-xl flex flex-col justify-between space-y-4">
                <div>
                  <div className="w-10 h-10 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
                    <CheckSquare className="w-5 h-5" />
                  </div>
                  <h4 className="text-xs font-bold text-white uppercase mt-4">Customer Visits Dispatch matrix</h4>
                  <p className="text-xs text-slate-400 mt-2 leading-relaxed">Historical spreadsheet record mapping all client dispatches, task completions, specific arrival timings, and recipient signatures.</p>
                </div>
                <button
                  onClick={() => handleExportCSV('visits')}
                  className="w-full bg-amber-600 hover:bg-amber-500 text-white font-bold py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow transition-all"
                >
                  <Download className="w-4 h-4" />
                  Generate CSV File
                </button>
              </div>
            </div>
          )}

          {/* G. EMPLOYEE MANAGEMENT & ENROLLMENT */}
          {activeTab === 'employees' && (
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
              
              {/* Left Column: Device Enrollments & Pending */}
              <div className="xl:col-span-8 space-y-6">
                
                {/* Header Banner */}
                <div className="bg-slate-950 border border-slate-850 rounded-2xl p-6 shadow-xl flex justify-between items-center relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2" />
                  <div className="relative z-10">
                    <h3 className="text-xl font-bold text-white font-sans tracking-tight">Enterprise Onboarding & Devices</h3>
                    <p className="text-xs text-slate-400 mt-1 font-mono">Provision accounts, generate hardware activation codes, and review pending fleet authorizations.</p>
                  </div>
                  <button onClick={handleCreateClick} className="relative z-10 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-lg shadow-blue-900/50">
                    <Plus className="w-4 h-4" />
                    Provision New Employee
                  </button>
                </div>

                {/* Employees List */}
                <div className="bg-slate-950 border border-slate-850 rounded-2xl shadow-xl overflow-hidden flex flex-col h-[600px]">
                  <div className="p-4 border-b border-slate-850 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                    <h4 className="text-sm font-bold text-slate-200 uppercase tracking-wider font-mono">Personnel Roster & Activation Status</h4>
                    <div className="flex flex-wrap gap-2 w-full lg:w-auto">
                      <div className="relative flex-1 lg:flex-initial">
                        <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          placeholder="Search directory..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="w-full lg:w-48 bg-slate-900 border border-slate-800 text-white rounded-lg pl-9 pr-4 py-1.5 text-xs focus:outline-none focus:border-blue-500 font-mono"
                        />
                      </div>
                      <select
                        value={deptFilter}
                        onChange={(e) => setDeptFilter(e.target.value)}
                        className="bg-slate-900 border border-slate-800 text-slate-300 rounded-lg px-2.5 py-1.5 text-[11px] font-mono focus:outline-none focus:border-blue-500"
                      >
                        <option value="ALL">All Depts</option>
                        <option value="HR">HR</option>
                        <option value="Logistics">Logistics</option>
                        <option value="Sales">Sales</option>
                        <option value="Maintenance">Maintenance</option>
                        <option value="Quality Assurance">Quality Assurance</option>
                      </select>
                      <select
                        value={branchFilter}
                        onChange={(e) => setBranchFilter(e.target.value)}
                        className="bg-slate-900 border border-slate-800 text-slate-300 rounded-lg px-2.5 py-1.5 text-[11px] font-mono focus:outline-none focus:border-blue-500"
                      >
                        <option value="ALL">All Branches</option>
                        <option value="Chittagong">Chittagong</option>
                        <option value="Dhaka">Dhaka</option>
                        <option value="Sylhet">Sylhet</option>
                        <option value="Rajshahi">Rajshahi</option>
                      </select>
                      <select
                        value={factoryFilter}
                        onChange={(e) => setFactoryFilter(e.target.value)}
                        className="bg-slate-900 border border-slate-800 text-slate-300 rounded-lg px-2.5 py-1.5 text-[11px] font-mono focus:outline-none focus:border-blue-500"
                      >
                        <option value="ALL">All Factories</option>
                        <option value="Steel Plant">Steel Plant</option>
                        <option value="Cement Plant">Cement Plant</option>
                        <option value="Foods Plant">Foods Plant</option>
                      </select>
                      <select
                        value={regionFilter}
                        onChange={(e) => setRegionFilter(e.target.value)}
                        className="bg-slate-900 border border-slate-800 text-slate-300 rounded-lg px-2.5 py-1.5 text-[11px] font-mono focus:outline-none focus:border-blue-500"
                      >
                        <option value="ALL">All Regions</option>
                        <option value="Chattogram">Chattogram</option>
                        <option value="Dhaka">Dhaka</option>
                      </select>
                    </div>
                  </div>

                  <div className="overflow-y-auto p-4 space-y-3 flex-1 custom-scrollbar">
                    {filteredEmployees.map(emp => (
                      <div key={emp.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-slate-900/60 p-4 rounded-xl border border-slate-850 hover:border-blue-500/30 transition-all gap-4">
                        
                        <div className="flex items-center gap-4">
                          <img src={emp.avatar} alt={emp.name} className="w-12 h-12 rounded-full object-cover border-2 border-slate-800" referrerPolicy="no-referrer" />
                          <div>
                            <div className="flex items-center gap-2">
                              <h5 className="text-sm font-bold text-white">{emp.name}</h5>
                              <span className="px-2 py-0.5 rounded text-[9px] font-bold font-mono bg-slate-800 text-slate-400">
                                {emp.id}
                              </span>
                            </div>
                            <p className="text-[10px] text-slate-500 mt-0.5 font-mono">
                              {emp.role} • {emp.department}
                            </p>
                            <p className="text-[10px] text-slate-500 mt-0.5 font-mono flex items-center gap-1">
                              <Smartphone className="w-3 h-3 text-slate-400" />
                              {emp.deviceName} ({emp.devicePlatform || 'Unknown'}) {emp.deviceImei ? `• IMEI: ${emp.deviceImei}` : ''}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => setSelectedQrCode(emp.qrCode || `AKG-EMP-${emp.employeeCode || emp.id}`)}
                            className="bg-slate-800 hover:bg-slate-700 text-blue-400 hover:text-white px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1"
                            title="Show QR Code"
                          >
                            <QrCode className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">QR Code</span>
                          </button>
                          
                          <button 
                            onClick={() => handleEditClick(emp)}
                            className="bg-slate-800 hover:bg-slate-700 text-amber-400 hover:text-white px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1"
                            title="Edit Personnel"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>

                          <button 
                            onClick={() => handleDeleteClick(emp.id)}
                            className="bg-slate-800 hover:bg-rose-950 text-rose-400 hover:text-white px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1"
                            title="Delete Personnel"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Column: Activation Kiosk */}
              <div className="xl:col-span-4 space-y-6">
                <div className="bg-slate-950 border border-slate-850 rounded-2xl p-5 shadow-xl">
                  <div className="flex items-center gap-2 border-b border-slate-850 pb-3 mb-4">
                    <Key className="w-4 h-4 text-blue-400" />
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono">Generate Onboarding Credential</h4>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-slate-400 font-mono uppercase font-bold">Select Unassigned Employee</label>
                      <select className="w-full bg-slate-900 border border-slate-800 text-white rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-blue-500 font-mono">
                        <option>Choose employee...</option>
                        {filteredEmployees.filter(e => e.deviceApprovalStatus === 'NOT_ACTIVATED').map(e => (
                          <option key={e.id}>{e.name} ({e.id})</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] text-slate-400 font-mono uppercase font-bold">Generated PIN / Auth Code</label>
                      <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 flex items-center justify-between">
                        <span className="font-mono text-2xl font-bold tracking-widest text-emerald-400">----</span>
                        <button className="text-blue-400 hover:text-white transition-all"><RefreshCw className="w-4 h-4" /></button>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] text-slate-400 font-mono uppercase font-bold">Device Binding Type</label>
                      <select className="w-full bg-slate-900 border border-slate-800 text-white rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-blue-500 font-mono">
                        <option>Standard (Approve Later)</option>
                        <option>Strict (Require IMEI Match)</option>
                        <option>Kiosk Mode (Zero-Touch)</option>
                      </select>
                    </div>

                    <button className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 rounded-xl text-xs shadow transition-all mt-4">
                      Deploy Activation Token
                    </button>
                  </div>
                </div>

                <div className="bg-slate-900/60 border border-slate-850 rounded-2xl p-5 shadow-xl">
                   <div className="flex items-center justify-between mb-2">
                     <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">System Integrity</span>
                     <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                   </div>
                   <p className="text-[10px] text-slate-500 leading-relaxed font-mono">
                     All devices undergo automated cryptographic verification. Mobile apps communicate strictly over TLS 1.3 using JWT bearer tokens and rotating refresh logic. Any mock location, rooting, or app tampering will immediately unbind the device and alert the admin.
                   </p>
                </div>
              </div>
            </div>
          )}

          {/* Employee CRUD Modal */}
          {isEmployeeModalOpen && (
            <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-xl p-6 shadow-2xl overflow-y-auto max-h-[90vh] animate-fadeIn">
                <div className="flex justify-between items-center border-b border-slate-850 pb-4 mb-4">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                    {editingEmployee ? 'Edit Employee Profile' : 'Provision New Personnel'}
                  </h3>
                  <button 
                    onClick={() => setIsEmployeeModalOpen(false)}
                    className="text-slate-400 hover:text-white font-bold text-xs font-mono"
                  >
                    CLOSE [X]
                  </button>
                </div>

                <form onSubmit={handleSaveEmployee} className="space-y-4 text-xs">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-400 font-mono uppercase font-bold">Full Name</label>
                      <input 
                        type="text" 
                        required 
                        value={formName} 
                        onChange={e => setFormName(e.target.value)} 
                        className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg p-2 focus:outline-none focus:border-blue-500"
                        placeholder="e.g. Tanvir Ahmed"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-400 font-mono uppercase font-bold">Email Address</label>
                      <input 
                        type="email" 
                        required 
                        value={formEmail} 
                        onChange={e => setFormEmail(e.target.value)} 
                        className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg p-2 focus:outline-none focus:border-blue-500"
                        placeholder="e.g. tanvir@abulkhairgroup.com"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-400 font-mono uppercase font-bold">Password {editingEmployee && '(leave blank to keep)'}</label>
                      <input 
                        type="password" 
                        required={!editingEmployee}
                        value={formPassword} 
                        onChange={e => setFormPassword(e.target.value)} 
                        className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg p-2 focus:outline-none focus:border-blue-500"
                        placeholder={editingEmployee ? "••••••••" : "Min 6 characters"}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-400 font-mono uppercase font-bold">Phone Number</label>
                      <input 
                        type="text" 
                        value={formPhone} 
                        onChange={e => setFormPhone(e.target.value)} 
                        className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg p-2 focus:outline-none focus:border-blue-500"
                        placeholder="e.g. 01712345678"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-400 font-mono uppercase font-bold">Employee Code / ID</label>
                      <input 
                        type="text" 
                        required
                        value={formCode} 
                        onChange={e => setFormCode(e.target.value)} 
                        className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg p-2 focus:outline-none focus:border-blue-500"
                        placeholder="e.g. EMP-101"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-400 font-mono uppercase font-bold">Access Role</label>
                      <select 
                        value={formRole} 
                        onChange={e => setFormRole(e.target.value)}
                        className="w-full bg-slate-955 border border-slate-800 text-white rounded-lg p-2 focus:outline-none focus:border-blue-500"
                      >
                        <option value="RIDER">Delivery Rider</option>
                        <option value="MERCHANDISER">Merchandiser</option>
                        <option value="SUPERVISOR">Supervisor</option>
                        <option value="HR">HR Specialist</option>
                        <option value="ADMIN">System Admin</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-400 font-mono uppercase font-bold">Department</label>
                      <input 
                        type="text" 
                        value={formDepartment} 
                        onChange={e => setFormDepartment(e.target.value)} 
                        className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg p-2 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-400 font-mono uppercase font-bold">Designation</label>
                      <input 
                        type="text" 
                        value={formDesignation} 
                        onChange={e => setFormDesignation(e.target.value)} 
                        className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg p-2 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-400 font-mono uppercase font-bold">Branch</label>
                      <input 
                        type="text" 
                        value={formBranch} 
                        onChange={e => setFormBranch(e.target.value)} 
                        className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg p-2 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-400 font-mono uppercase font-bold">Factory / Location</label>
                      <input 
                        type="text" 
                        value={formFactory} 
                        onChange={e => setFormFactory(e.target.value)} 
                        className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg p-2 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-400 font-mono uppercase font-bold">Region</label>
                      <input 
                        type="text" 
                        value={formRegion} 
                        onChange={e => setFormRegion(e.target.value)} 
                        className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg p-2 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 font-mono uppercase font-bold">Photo URL / Avatar</label>
                    <input 
                      type="text" 
                      value={formPhotoUrl} 
                      onChange={e => setFormPhotoUrl(e.target.value)} 
                      className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg p-2 focus:outline-none focus:border-blue-500"
                      placeholder="e.g. https://images.unsplash.com/..."
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4 border-t border-slate-850 pt-4 mt-2">
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-400 font-mono uppercase font-bold">Device Name</label>
                      <input 
                        type="text" 
                        value={formDeviceName} 
                        onChange={e => setFormDeviceName(e.target.value)} 
                        className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg p-2 focus:outline-none focus:border-blue-500"
                        placeholder="e.g. Samsung Galaxy S23"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-400 font-mono uppercase font-bold">Device Platform</label>
                      <select 
                        value={formDevicePlatform} 
                        onChange={e => setFormDevicePlatform(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg p-2 focus:outline-none focus:border-blue-500"
                      >
                        <option value="Android">Android</option>
                        <option value="iOS">iOS</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex gap-3 justify-end pt-4 border-t border-slate-850 mt-4">
                    <button 
                      type="button" 
                      onClick={() => setIsEmployeeModalOpen(false)}
                      className="bg-slate-850 hover:bg-slate-800 text-slate-350 font-bold px-4 py-2 rounded-xl"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-5 py-2 rounded-xl shadow-lg shadow-blue-900/30"
                    >
                      {editingEmployee ? 'Save Changes' : 'Provision Account'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* QR Code Modal */}
          {selectedQrCode && (
            <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-sm p-6 shadow-2xl flex flex-col items-center space-y-4 animate-fadeIn">
                <div className="w-full flex justify-between items-center border-b border-slate-850 pb-3">
                  <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">Employee Activation Code</span>
                  <button 
                    onClick={() => setSelectedQrCode(null)}
                    className="text-slate-400 hover:text-white font-bold text-xs font-mono"
                  >
                    [X]
                  </button>
                </div>
                
                <div className="bg-white p-4 rounded-2xl shadow-inner flex items-center justify-center border-4 border-blue-500/20">
                  <img 
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(selectedQrCode)}`} 
                    alt="Employee QR Activation Code" 
                    className="w-40 h-40 object-contain"
                  />
                </div>

                <div className="text-center space-y-1">
                  <span className="font-mono text-sm font-bold text-emerald-400 tracking-widest">{selectedQrCode}</span>
                  <p className="text-[10px] text-slate-400 leading-relaxed max-w-[240px]">
                    Scan this QR code using the Abul Khair Group tracker mobile client app to register and bind this device.
                  </p>
                </div>

                <button 
                  onClick={() => setSelectedQrCode(null)}
                  className="w-full bg-slate-800 hover:bg-slate-750 text-white font-bold py-2 rounded-xl text-xs"
                >
                  Dismiss Card
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
