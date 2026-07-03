import React from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  AreaChart, Area, LineChart, Line, PieChart, Pie, Cell
} from 'recharts';
import { Employee, EmployeeStatus } from '../types';
import { Sparkles, Calendar, TrendingUp, Compass, Award } from 'lucide-react';

interface AnalyticsChartsProps {
  employees: Employee[];
}

export const AnalyticsCharts: React.FC<AnalyticsChartsProps> = ({ employees }) => {
  // 1. Employee Status Distribution
  const statusCounts = employees.reduce((acc, curr) => {
    acc[curr.status] = (acc[curr.status] || 0) + 1;
    return acc;
  }, {} as Record<EmployeeStatus, number>);

  const statusData = Object.keys(statusCounts).map(status => ({
    name: status,
    value: statusCounts[status as EmployeeStatus],
  }));

  // Map status to slate-color hexes
  const COLORS: Record<string, string> = {
    [EmployeeStatus.ONLINE]: '#3b82f6', // blue
    [EmployeeStatus.TRAVELING]: '#10b981', // green
    [EmployeeStatus.IDLE]: '#eab308', // yellow
    [EmployeeStatus.BREAK]: '#f97316', // orange
    [EmployeeStatus.OFFLINE]: '#64748b', // gray
  };

  // 2. Productivity Data: Distance vs Hours
  const productivityData = employees.map(emp => ({
    name: emp.name.split(' ')[0],
    distance: emp.totalDistance,
    hours: emp.totalWorkingHours,
    speed: emp.speed > 0 ? emp.speed : Math.round(emp.totalDistance / Math.max(1, emp.totalWorkingHours) * 10) / 10,
    visits: emp.completedVisits,
  }));

  // Sort by visits for the leadership award
  const topPerformer = [...employees].sort((a,b) => b.completedVisits - a.completedVisits)[0];

  return (
    <div className="space-y-6">
      {/* Top Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 relative overflow-hidden flex items-center gap-4 shadow-lg">
          <div className="p-3 bg-blue-500/10 rounded-lg text-blue-400">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-400 block mb-1">Company Fleet Mileage</span>
            <span className="text-2xl font-bold font-mono text-white">
              {employees.reduce((sum, e) => sum + e.totalDistance, 0).toFixed(1)} <span className="text-xs text-slate-500">km</span>
            </span>
          </div>
          <div className="absolute right-0 bottom-0 translate-x-3 translate-y-3 opacity-5 pointer-events-none">
            <TrendingUp className="w-32 h-32 text-blue-400" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 relative overflow-hidden flex items-center gap-4 shadow-lg">
          <div className="p-3 bg-emerald-500/10 rounded-lg text-emerald-400">
            <Compass className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-400 block mb-1">Cumulative Active Hours</span>
            <span className="text-2xl font-bold font-mono text-white">
              {employees.reduce((sum, e) => sum + e.totalWorkingHours, 0).toFixed(1)} <span className="text-xs text-slate-500">hrs</span>
            </span>
          </div>
          <div className="absolute right-0 bottom-0 translate-x-3 translate-y-3 opacity-5 pointer-events-none">
            <Compass className="w-32 h-32 text-emerald-400" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 relative overflow-hidden flex items-center gap-4 shadow-lg">
          <div className="p-3 bg-amber-500/10 rounded-lg text-amber-400">
            <Award className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <span className="text-xs text-slate-400 block mb-1">Top Customer Visits</span>
            <span className="text-lg font-bold text-white truncate block">
              {topPerformer ? topPerformer.name : 'N/A'}
            </span>
            <span className="text-xs font-mono text-slate-500">
              {topPerformer ? `${topPerformer.completedVisits} Check-ins today` : ''}
            </span>
          </div>
          <div className="absolute right-0 bottom-0 translate-x-3 translate-y-3 opacity-5 pointer-events-none">
            <Award className="w-32 h-32 text-amber-400" />
          </div>
        </div>
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Distance and Working Hours comparison */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
          <h4 className="text-sm font-bold text-slate-200 mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            Field Performance Log (Distance & Service Hours)
          </h4>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={productivityData}
                margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                  labelStyle={{ fontWeight: 'bold', color: '#f8fafc' }}
                />
                <Legend wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
                <Bar dataKey="distance" name="Distance Covered (km)" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="hours" name="Active Hours (h)" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Customer Visit Counts Area */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
          <h4 className="text-sm font-bold text-slate-200 mb-4 flex items-center gap-2">
            <Award className="w-4 h-4 text-amber-400" />
            Client Site Visits Completed Today
          </h4>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={productivityData}
                margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
              >
                <defs>
                  <linearGradient id="colorVisits" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#eab308" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#eab308" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                  labelStyle={{ fontWeight: 'bold', color: '#f8fafc' }}
                />
                <Area type="monotone" dataKey="visits" name="Visits Logged" stroke="#eab308" fillOpacity={1} fill="url(#colorVisits)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Second Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Status Breakdown Pie */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl lg:col-span-1">
          <h4 className="text-sm font-bold text-slate-200 mb-4 flex items-center gap-2">
            <Compass className="w-4 h-4 text-blue-400" />
            Active Fleet Status
          </h4>
          <div className="h-64 flex items-center justify-center relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[entry.name] || '#94a3b8'} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                />
              </PieChart>
            </ResponsiveContainer>
            
            {/* Center Label */}
            <div className="absolute text-center">
              <span className="text-2xl font-bold font-mono text-white">{employees.length}</span>
              <span className="text-[10px] text-slate-400 block uppercase tracking-wider">Devices</span>
            </div>
          </div>
          
          {/* Custom Status Legend with numbers */}
          <div className="grid grid-cols-2 gap-2 mt-2">
            {statusData.map(entry => (
              <div key={entry.name} className="flex items-center gap-2 bg-slate-950 px-2 py-1 border border-slate-800 rounded-lg">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[entry.name] }} />
                <span className="text-[10px] text-slate-300 font-bold capitalize">{entry.name.toLowerCase()}</span>
                <span className="text-[10px] text-slate-500 font-mono ml-auto">({entry.value})</span>
              </div>
            ))}
          </div>
        </div>

        {/* Speed Analytics line */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl lg:col-span-2">
          <h4 className="text-sm font-bold text-slate-200 mb-4 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-400" />
            Speed & Transit Velocities (km/h)
          </h4>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={productivityData}
                margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                  labelStyle={{ fontWeight: 'bold', color: '#f8fafc' }}
                />
                <Legend wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
                <Line type="monotone" dataKey="speed" name="Current / Est Avg Speed" stroke="#a855f7" strokeWidth={3} dot={{ r: 5 }} activeDot={{ r: 8 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
