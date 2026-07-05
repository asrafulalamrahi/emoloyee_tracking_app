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
  Route
} from './types';

// Map configuration
export const MAP_CENTER = { lat: 22.3244, lng: 91.8122 }; // Chittagong, Bangladesh
export const MAP_ZOOM = 13;

export const INITIAL_EMPLOYEES: Employee[] = [
  {
    id: 'emp_new_1',
    name: 'Samuel Jackson',
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150',
    role: 'Trainee Technician',
    team: 'Trainee Pool',
    department: 'Operations',
    phone: '+1 (555) 999-8888',
    status: EmployeeStatus.OFFLINE,
    battery: 100,
    gpsAccuracy: 0,
    currentAddress: 'Pending Location',
    speed: 0,
    coords: { lat: 0, lng: 0 },
    totalWorkingHours: 0,
    totalDistance: 0,
    completedVisits: 0,
    missedVisits: 0,
    deviceName: 'Pending Binding',
    networkType: 'N/A',
    internetStatus: 'offline',
    deviceApprovalStatus: 'NOT_ACTIVATED',
    activationCode: 'ACT-0000',
    devicePlatform: 'iOS',
    deviceImei: '351294857204918',
    appVersion: '2.4.1',
    osVersion: 'iOS 17.2', 
    lastUpdate: new Date().toISOString(),

    // Connectivity & Diagnostics
    gpsEnabled: false,
    batterySaver: false,
    locationPermission: 'DENIED',
    backgroundPermission: 'DENIED',
    appForceClosed: true,
    offlineDurationMinutes: 0,
    lastSuccessfulUpdate: new Date().toISOString(),
    cachedGPSPointsCount: 0,

    // Anti-Tamper
    mockLocationActive: false,
    developerModeActive: false,
    vpnActive: false,
    deviceRooted: false,
    timeManipulationDetected: false,
    deviceRebooted: false,
    backgroundRestricted: false,

    // Outlet Analytics
    nearestOutletName: 'N/A',
    distanceToOutletKm: 0,
    etaMinutes: 0,
    travelDurationMinutes: 0,
    bestRouteName: 'N/A',
    trafficDelayMinutes: 0,
    visitedOutletsCount: 0,
    missedOutletsCount: 0,
    timeSpentAtOutletMinutes: {},

    // Main Office Analytics
    distanceFromHeadOfficeKm: 0,
    timeSinceLeftOfficeMinutes: 0,
    currentTravelDurationMinutes: 0,
    expectedReturnTime: 'N/A',

    // AI Analytics
    productivityScore: 0,
    travelEfficiency: 0,
    idleAnalysisRating: 'Normal',
    routeOptimized: false,
    latePredictionProb: 0,
    missedVisitPrediction: false,
    attendanceInsights: 'Awaiting device provisioning.'
  },
  {
    id: 'emp_1',
    name: 'Alex Rivera',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    role: 'Delivery Rider',
    team: 'Delivery Team Alpha',
    department: 'Logistics',
    phone: '+1 (555) 123-4567',
    status: EmployeeStatus.TRAVELING,
    battery: 84,
    gpsAccuracy: 4.2,
    currentAddress: 'Market St & 4th St, San Francisco, CA',
    speed: 34,
    coords: { lat: 37.7858, lng: -122.4065 },
    totalWorkingHours: 6.5,
    totalDistance: 42.8,
    completedVisits: 8,
    missedVisits: 1,
    deviceName: 'Samsung Galaxy S23 Ultra',
    networkType: '5G Cellular',
    internetStatus: 'online',
    deviceApprovalStatus: 'APPROVED',
    activationCode: 'ACT-9821',
    devicePlatform: 'Android',
    deviceImei: '351294857204918',
    appVersion: '2.4.1',
    osVersion: 'Android 14', 
    lastUpdate: new Date().toISOString(),

    // Connectivity & Diagnostics
    gpsEnabled: true,
    batterySaver: false,
    locationPermission: 'GRANTED',
    backgroundPermission: 'ALWAYS',
    appForceClosed: false,
    offlineDurationMinutes: 0,
    lastSuccessfulUpdate: new Date().toISOString(),
    cachedGPSPointsCount: 0,

    // Anti-Tamper
    mockLocationActive: false,
    developerModeActive: false,
    vpnActive: false,
    deviceRooted: false,
    timeManipulationDetected: false,
    deviceRebooted: false,
    backgroundRestricted: false,

    // Outlet Analytics
    nearestOutletName: 'North SOMA Logistics Hub',
    distanceToOutletKm: 0.8,
    etaMinutes: 3,
    travelDurationMinutes: 14,
    bestRouteName: 'Market St & SOMA Access Rd',
    trafficDelayMinutes: 1,
    visitedOutletsCount: 4,
    missedOutletsCount: 0,
    timeSpentAtOutletMinutes: { 'geo_2': 45, 'geo_1': 15 },

    // Main Office Analytics
    distanceFromHeadOfficeKm: 1.3,
    timeSinceLeftOfficeMinutes: 180,
    currentTravelDurationMinutes: 24,
    expectedReturnTime: '05:30 PM',

    // AI Analytics
    productivityScore: 94,
    travelEfficiency: 91,
    idleAnalysisRating: 'Excellent',
    routeOptimized: true,
    latePredictionProb: 12,
    missedVisitPrediction: false,
    attendanceInsights: 'Highly efficient path selection on Market Street Corridor.'
  },
  {
    id: 'emp_2',
    name: 'Sarah Jenkins',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150',
    role: 'Senior Sales Rep',
    team: 'West Coast Enterprise Sales',
    department: 'Sales',
    phone: '+1 (555) 987-6543',
    status: EmployeeStatus.IDLE,
    battery: 91,
    gpsAccuracy: 5.8,
    currentAddress: 'Mission District, 16th St & Valencia, San Francisco, CA',
    speed: 0,
    coords: { lat: 37.7648, lng: -122.4215 },
    totalWorkingHours: 5.2,
    totalDistance: 14.5,
    completedVisits: 3,
    missedVisits: 0,
    deviceName: 'iPhone 15 Pro Max',
    networkType: 'WiFi (Starbucks)',
    internetStatus: 'online',
    deviceApprovalStatus: 'APPROVED',
    activationCode: 'ACT-9821',
    devicePlatform: 'Android',
    deviceImei: '351294857204918',
    appVersion: '2.4.1',
    osVersion: 'Android 14',
    lastUpdate: new Date(Date.now() - 30000).toISOString(),

    // Connectivity & Diagnostics
    gpsEnabled: true,
    batterySaver: false,
    locationPermission: 'GRANTED',
    backgroundPermission: 'ALWAYS',
    appForceClosed: false,
    offlineDurationMinutes: 0,
    lastSuccessfulUpdate: new Date(Date.now() - 30000).toISOString(),
    cachedGPSPointsCount: 0,

    // Anti-Tamper
    mockLocationActive: false,
    developerModeActive: false,
    vpnActive: false,
    deviceRooted: false,
    timeManipulationDetected: false,
    deviceRebooted: false,
    backgroundRestricted: false,

    // Outlet Analytics
    nearestOutletName: 'Dolores Park Cafe Center',
    distanceToOutletKm: 0.2,
    etaMinutes: 1,
    travelDurationMinutes: 2,
    bestRouteName: '16th St direct to Dolores St',
    trafficDelayMinutes: 0,
    visitedOutletsCount: 2,
    missedOutletsCount: 0,
    timeSpentAtOutletMinutes: { 'geo_1': 30, 'geo_4': 50 },

    // Main Office Analytics
    distanceFromHeadOfficeKm: 3.8,
    timeSinceLeftOfficeMinutes: 310,
    currentTravelDurationMinutes: 42,
    expectedReturnTime: '06:00 PM',

    // AI Analytics
    productivityScore: 88,
    travelEfficiency: 85,
    idleAnalysisRating: 'Normal',
    routeOptimized: true,
    latePredictionProb: 5,
    missedVisitPrediction: false,
    attendanceInsights: 'Stays within expected sales zones. Meeting durations are optimal.'
  },
  {
    id: 'emp_3',
    name: 'Michael Chang',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    role: 'Field Service Engineer',
    team: 'Technical Support West',
    department: 'Operations',
    phone: '+1 (555) 456-7890',
    status: EmployeeStatus.BREAK,
    battery: 42,
    gpsAccuracy: 12.5,
    currentAddress: 'Castro Street Cafe, San Francisco, CA',
    speed: 0,
    coords: { lat: 37.7592, lng: -122.4348 },
    totalWorkingHours: 7.1,
    totalDistance: 28.3,
    completedVisits: 4,
    missedVisits: 0,
    deviceName: 'Google Pixel 8 Pro',
    networkType: '4G LTE',
    internetStatus: 'online',
    deviceApprovalStatus: 'APPROVED',
    activationCode: 'ACT-9821',
    devicePlatform: 'Android',
    deviceImei: '351294857204918',
    appVersion: '2.4.1',
    osVersion: 'Android 14',
    lastUpdate: new Date(Date.now() - 120000).toISOString(),

    // Connectivity & Diagnostics
    gpsEnabled: true,
    batterySaver: true, // Battery Saver on!
    locationPermission: 'GRANTED',
    backgroundPermission: 'ALWAYS',
    appForceClosed: false,
    offlineDurationMinutes: 12,
    lastSuccessfulUpdate: new Date(Date.now() - 120000).toISOString(),
    cachedGPSPointsCount: 0,

    // Anti-Tamper
    mockLocationActive: false,
    developerModeActive: false,
    vpnActive: false,
    deviceRooted: false,
    timeManipulationDetected: false,
    deviceRebooted: false,
    backgroundRestricted: false,

    // Outlet Analytics
    nearestOutletName: 'Twin Peaks Maintenance Hub',
    distanceToOutletKm: 1.1,
    etaMinutes: 6,
    travelDurationMinutes: 12,
    bestRouteName: 'Castro St & 17th St',
    trafficDelayMinutes: 2,
    visitedOutletsCount: 3,
    missedOutletsCount: 0,
    timeSpentAtOutletMinutes: { 'geo_1': 90, 'geo_4': 10 },

    // Main Office Analytics
    distanceFromHeadOfficeKm: 4.2,
    timeSinceLeftOfficeMinutes: 420,
    currentTravelDurationMinutes: 65,
    expectedReturnTime: '05:00 PM',

    // AI Analytics
    productivityScore: 82,
    travelEfficiency: 78,
    idleAnalysisRating: 'Normal',
    routeOptimized: false,
    latePredictionProb: 18,
    missedVisitPrediction: false,
    attendanceInsights: 'Battery saver mode is causing sporadic polling updates.'
  },
  {
    id: 'emp_4',
    name: 'Elena Rostova',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150',
    role: 'Technical Audit Lead',
    team: 'HQ Compliance',
    department: 'Quality Assurance',
    phone: '+1 (555) 789-0123',
    status: EmployeeStatus.ONLINE,
    battery: 98,
    gpsAccuracy: 3.1,
    currentAddress: 'MetroLogix HQ, 500 Sansome St, San Francisco, CA',
    speed: 0,
    coords: { lat: 37.7946, lng: -122.4014 },
    totalWorkingHours: 4.0,
    totalDistance: 0.0,
    completedVisits: 1,
    missedVisits: 0,
    deviceName: 'iPhone 14 Pro',
    networkType: 'WiFi (HQ-Enterprise)',
    internetStatus: 'online',
    deviceApprovalStatus: 'APPROVED',
    activationCode: 'ACT-9821',
    devicePlatform: 'Android',
    deviceImei: '351294857204918',
    appVersion: '2.4.1',
    osVersion: 'Android 14',
    lastUpdate: new Date().toISOString(),

    // Connectivity & Diagnostics
    gpsEnabled: true,
    batterySaver: false,
    locationPermission: 'GRANTED',
    backgroundPermission: 'ALWAYS',
    appForceClosed: false,
    offlineDurationMinutes: 0,
    lastSuccessfulUpdate: new Date().toISOString(),
    cachedGPSPointsCount: 0,

    // Anti-Tamper
    mockLocationActive: false,
    developerModeActive: false,
    vpnActive: false,
    deviceRooted: false,
    timeManipulationDetected: false,
    deviceRebooted: false,
    backgroundRestricted: false,

    // Outlet Analytics
    nearestOutletName: 'MetroLogix HQ Office',
    distanceToOutletKm: 0.0,
    etaMinutes: 0,
    travelDurationMinutes: 0,
    bestRouteName: 'Onsite',
    trafficDelayMinutes: 0,
    visitedOutletsCount: 1,
    missedOutletsCount: 0,
    timeSpentAtOutletMinutes: { 'geo_1': 240 },

    // Main Office Analytics
    distanceFromHeadOfficeKm: 0.0,
    timeSinceLeftOfficeMinutes: 0,
    currentTravelDurationMinutes: 0,
    expectedReturnTime: '06:00 PM',

    // AI Analytics
    productivityScore: 99,
    travelEfficiency: 100,
    idleAnalysisRating: 'Excellent',
    routeOptimized: true,
    latePredictionProb: 1,
    missedVisitPrediction: false,
    attendanceInsights: 'Elena is currently onsite at Main Headquarters. Excellent score.'
  },
  {
    id: 'emp_5',
    name: 'David Kim',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
    role: 'HVAC Technician',
    team: 'SFC Support Team C',
    department: 'Maintenance',
    phone: '+1 (555) 321-7654',
    status: EmployeeStatus.TRAVELING,
    battery: 18, // Low battery!
    gpsAccuracy: 8.4,
    currentAddress: 'Lombard St (Crooked Street), San Francisco, CA',
    speed: 22,
    coords: { lat: 37.8021, lng: -122.4187 },
    totalWorkingHours: 5.8,
    totalDistance: 31.2,
    completedVisits: 5,
    missedVisits: 2,
    deviceName: 'Zebra TC57 Rugged PDA',
    networkType: '4G LTE',
    internetStatus: 'online',
    deviceApprovalStatus: 'APPROVED',
    activationCode: 'ACT-9821',
    devicePlatform: 'Android',
    deviceImei: '351294857204918',
    appVersion: '2.4.1',
    osVersion: 'Android 14',
    lastUpdate: new Date(Date.now() - 15000).toISOString(),

    // Connectivity & Diagnostics
    gpsEnabled: true,
    batterySaver: true,
    locationPermission: 'GRANTED',
    backgroundPermission: 'ALWAYS',
    appForceClosed: false,
    offlineDurationMinutes: 15,
    lastSuccessfulUpdate: new Date(Date.now() - 15000).toISOString(),
    cachedGPSPointsCount: 0,

    // Anti-Tamper
    mockLocationActive: false,
    developerModeActive: false,
    vpnActive: false,
    deviceRooted: false,
    timeManipulationDetected: false,
    deviceRebooted: false,
    backgroundRestricted: false,

    // Outlet Analytics
    nearestOutletName: 'North SOMA Logistics Hub',
    distanceToOutletKm: 2.3,
    etaMinutes: 8,
    travelDurationMinutes: 28,
    bestRouteName: 'Lombard St to Hyde St down',
    trafficDelayMinutes: 3,
    visitedOutletsCount: 3,
    missedOutletsCount: 1,
    timeSpentAtOutletMinutes: { 'geo_1': 40 },

    // Main Office Analytics
    distanceFromHeadOfficeKm: 1.9,
    timeSinceLeftOfficeMinutes: 340,
    currentTravelDurationMinutes: 85,
    expectedReturnTime: '04:30 PM',

    // AI Analytics
    productivityScore: 71,
    travelEfficiency: 68,
    idleAnalysisRating: 'High Idle',
    routeOptimized: false,
    latePredictionProb: 65,
    missedVisitPrediction: true,
    attendanceInsights: 'Low battery and frequent detours have impacted performance scores.'
  },
  {
    id: 'emp_6',
    name: 'Marcus Vance',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
    role: 'Field Logistics Courier',
    team: 'Delivery Team Alpha',
    department: 'Logistics',
    phone: '+1 (555) 234-5678',
    status: EmployeeStatus.OFFLINE,
    battery: 0, // Dead battery / offline
    gpsAccuracy: 0,
    currentAddress: 'Marina District Area, San Francisco, CA',
    speed: 0,
    coords: { lat: 37.8037, lng: -122.4368 },
    totalWorkingHours: 8.0,
    totalDistance: 54.1,
    completedVisits: 11,
    missedVisits: 0,
    deviceName: 'Samsung Galaxy A54',
    networkType: 'None',
    internetStatus: 'offline',
    deviceApprovalStatus: 'NOT_ACTIVATED',
    activationCode: 'ACT-0000',
    devicePlatform: 'iOS',
    deviceImei: '351294857204918',
    appVersion: '2.4.1',
    osVersion: 'iOS 17.2', 
    lastUpdate: new Date(Date.now() - 14400000).toISOString(), // 4 hours ago

    // Connectivity & Diagnostics
    gpsEnabled: false,
    batterySaver: false,
    locationPermission: 'RESTRICTED',
    backgroundPermission: 'DENIED',
    appForceClosed: true,
    offlineDurationMinutes: 240,
    lastSuccessfulUpdate: new Date(Date.now() - 14400000).toISOString(),
    cachedGPSPointsCount: 42, // Points buffered while offline!

    // Anti-Tamper
    mockLocationActive: false,
    developerModeActive: true,
    vpnActive: true,
    deviceRooted: false,
    timeManipulationDetected: false,
    deviceRebooted: false,
    backgroundRestricted: true,

    // Outlet Analytics
    nearestOutletName: 'North SOMA Logistics Hub',
    distanceToOutletKm: 3.5,
    etaMinutes: 15,
    travelDurationMinutes: 45,
    bestRouteName: 'Marina Blvd to Van Ness Ave',
    trafficDelayMinutes: 5,
    visitedOutletsCount: 6,
    missedOutletsCount: 0,
    timeSpentAtOutletMinutes: { 'geo_2': 110 },

    // Main Office Analytics
    distanceFromHeadOfficeKm: 3.1,
    timeSinceLeftOfficeMinutes: 480,
    currentTravelDurationMinutes: 120,
    expectedReturnTime: '04:00 PM',

    // AI Analytics
    productivityScore: 45,
    travelEfficiency: 52,
    idleAnalysisRating: 'Warning',
    routeOptimized: false,
    latePredictionProb: 95,
    missedVisitPrediction: true,
    attendanceInsights: 'Device offline for 4 hours. Suspicious developer settings and VPN active.'
  }
];

export const INITIAL_GEOFENCES: Geofence[] = [
  {
    id: 'geo_1',
    name: 'MetroLogix HQ Office',
    type: GeofenceType.CIRCLE,
    coords: { lat: 37.7946, lng: -122.4014 },
    radius: 120, // meters
    status: 'ACTIVE',
    targetTeams: ['HQ Compliance', 'Delivery Team Alpha', 'SFC Support Team C'],
    enterCount: 24,
    exitCount: 21,
  },
  {
    id: 'geo_2',
    name: 'North SOMA Logistics Hub',
    type: GeofenceType.CIRCLE,
    coords: { lat: 37.7812, lng: -122.4029 },
    radius: 250, // meters
    status: 'ACTIVE',
    targetTeams: ['Delivery Team Alpha'],
    enterCount: 41,
    exitCount: 39,
  },
  {
    id: 'geo_3',
    name: 'Downtown Financial Restricted Zone',
    type: GeofenceType.POLYGON,
    coords: { lat: 37.7915, lng: -122.4012 }, // Centroid approximation
    polygonPath: [
      { lat: 37.7955, lng: -122.4045 },
      { lat: 37.7968, lng: -122.3995 },
      { lat: 37.7895, lng: -122.3952 },
      { lat: 37.7878, lng: -122.4015 },
    ],
    status: 'ACTIVE',
    targetTeams: ['Delivery Team Alpha', 'West Coast Enterprise Sales'],
    enterCount: 12,
    exitCount: 11,
  },
  {
    id: 'geo_4',
    name: 'Twin Peaks No-Idle Zone',
    type: GeofenceType.POLYGON,
    coords: { lat: 37.7544, lng: -122.4477 },
    polygonPath: [
      { lat: 37.7580, lng: -122.4510 },
      { lat: 37.7580, lng: -122.4430 },
      { lat: 37.7500, lng: -122.4430 },
      { lat: 37.7500, lng: -122.4510 },
    ],
    status: 'ACTIVE',
    targetTeams: ['SFC Support Team C', 'Technical Support West'],
    enterCount: 4,
    exitCount: 4,
  }
];

export const INITIAL_CUSTOMERS: Customer[] = [
  {
    id: 'cust_1',
    name: 'Salesforce Tower (Global Tech Inc)',
    address: '415 Mission St, San Francisco, CA',
    coords: { lat: 37.7897, lng: -122.3972 },
    contactPerson: 'Marc Benioff',
    phone: '+1 (555) 444-1111',
    email: 'mbenioff@globaltech.com'
  },
  {
    id: 'cust_2',
    name: 'Uber HQ (RideShare Corp)',
    address: '1515 3rd St, San Francisco, CA',
    coords: { lat: 37.7682, lng: -122.3892 },
    contactPerson: 'Dara Khosrowshahi',
    phone: '+1 (555) 444-2222',
    email: 'dara@rideshare.com'
  },
  {
    id: 'cust_3',
    name: 'UCSF Medical Center',
    address: '505 Parnassus Ave, San Francisco, CA',
    coords: { lat: 37.7631, lng: -122.4578 },
    contactPerson: 'Dr. Elizabeth Blackwell',
    phone: '+1 (555) 444-3333',
    email: 'eblackwell@ucsf.edu'
  },
  {
    id: 'cust_4',
    name: 'Fisherman\'s Wharf Retail Mall',
    address: 'Pier 39, San Francisco, CA',
    coords: { lat: 37.8087, lng: -122.4098 },
    contactPerson: 'Captain John Sterling',
    phone: '+1 (555) 444-4444',
    email: 'jsterling@pier39.com'
  },
  {
    id: 'cust_5',
    name: 'Dolores Park Cafe',
    address: '501 Dolores St, San Francisco, CA',
    coords: { lat: 37.7598, lng: -122.4269 },
    contactPerson: 'Clara Oswald',
    phone: '+1 (555) 444-5555',
    email: 'clara@dolorescafe.com'
  }
];

export const INITIAL_VISITS: Visit[] = [
  {
    id: 'v_1',
    employeeId: 'emp_2', // Sarah Jenkins
    customerId: 'cust_1', // Salesforce Tower
    date: new Date().toISOString().split('T')[0],
    status: VisitStatus.VISITED,
    arrivalTime: new Date(Date.now() - 14400000).toISOString(), // 4h ago
    departureTime: new Date(Date.now() - 11800000).toISOString(), // 3.3h ago
    duration: 43,
    notes: 'Signed contract renewal for 5,000 corporate accounts. Highly successful meeting.',
    photoUrl: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=400',
    signature: 'S. Jenkins'
  },
  {
    id: 'v_2',
    employeeId: 'emp_2', // Sarah Jenkins
    customerId: 'cust_2', // Uber HQ
    date: new Date().toISOString().split('T')[0],
    status: VisitStatus.ONGOING,
    arrivalTime: new Date(Date.now() - 1800000).toISOString(), // 30m ago
    notes: 'In active discussion regarding custom logistical pipelines. Testing API responses.',
  },
  {
    id: 'v_3',
    employeeId: 'emp_2', // Sarah Jenkins
    customerId: 'cust_5', // Dolores Park Cafe
    date: new Date().toISOString().split('T')[0],
    status: VisitStatus.ASSIGNED,
  },
  {
    id: 'v_4',
    employeeId: 'emp_3', // Michael Chang
    customerId: 'cust_3', // UCSF Medical Center
    date: new Date().toISOString().split('T')[0],
    status: VisitStatus.VISITED,
    arrivalTime: new Date(Date.now() - 7200000).toISOString(), // 2h ago
    departureTime: new Date(Date.now() - 3600000).toISOString(), // 1h ago
    duration: 60,
    notes: 'Completed repair of high-voltage backup chiller controls. Tested safely.',
    photoUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=400',
    signature: 'M. Chang'
  },
  {
    id: 'v_5',
    employeeId: 'emp_5', // David Kim
    customerId: 'cust_4', // Fisherman\'s Wharf
    date: new Date().toISOString().split('T')[0],
    status: VisitStatus.ASSIGNED,
  },
  {
    id: 'v_6',
    employeeId: 'emp_1', // Alex Rivera
    customerId: 'cust_5', // Dolores Park Cafe
    date: new Date().toISOString().split('T')[0],
    status: VisitStatus.VISITED,
    arrivalTime: new Date(Date.now() - 10000000).toISOString(),
    departureTime: new Date(Date.now() - 9200000).toISOString(),
    duration: 13,
    notes: 'Package containing primary thermal sensors delivered to Clara Oswald.',
    photoUrl: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=400',
    signature: 'C. Oswald'
  }
];

export const INITIAL_ATTENDANCE: Attendance[] = [
  {
    id: 'att_1',
    employeeId: 'emp_1', // Alex Rivera
    date: new Date().toISOString().split('T')[0],
    clockIn: new Date(new Date().setHours(8, 15, 0)).toISOString(),
    status: AttendanceStatus.PRESENT,
    workingHours: 6.5,
    overtime: 0,
    validatedByGeofence: true
  },
  {
    id: 'att_2',
    employeeId: 'emp_2', // Sarah Jenkins
    date: new Date().toISOString().split('T')[0],
    clockIn: new Date(new Date().setHours(9, 0, 0)).toISOString(),
    status: AttendanceStatus.PRESENT,
    workingHours: 5.2,
    overtime: 0,
    validatedByGeofence: true
  },
  {
    id: 'att_3',
    employeeId: 'emp_3', // Michael Chang
    date: new Date().toISOString().split('T')[0],
    clockIn: new Date(new Date().setHours(8, 0, 0)).toISOString(),
    status: AttendanceStatus.PRESENT,
    workingHours: 7.1,
    overtime: 0.1,
    validatedByGeofence: true
  },
  {
    id: 'att_4',
    employeeId: 'emp_4', // Elena Rostova
    date: new Date().toISOString().split('T')[0],
    clockIn: new Date(new Date().setHours(9, 45, 0)).toISOString(), // Late!
    status: AttendanceStatus.LATE,
    workingHours: 4.0,
    overtime: 0,
    validatedByGeofence: true
  },
  {
    id: 'att_5',
    employeeId: 'emp_5', // David Kim
    date: new Date().toISOString().split('T')[0],
    clockIn: new Date(new Date().setHours(8, 30, 0)).toISOString(),
    status: AttendanceStatus.PRESENT,
    workingHours: 5.8,
    overtime: 0,
    validatedByGeofence: false
  }
];

export const INITIAL_NOTIFICATIONS: Notification[] = [
  {
    id: 'not_1',
    employeeId: 'emp_5',
    employeeName: 'David Kim',
    type: NotificationType.LOW_BATTERY,
    message: 'Device battery has dropped below critical level (18%). Location tracking might stop.',
    timestamp: new Date(Date.now() - 300000).toISOString(), // 5m ago
    read: false,
  },
  {
    id: 'not_2',
    employeeId: 'emp_1',
    employeeName: 'Alex Rivera',
    type: NotificationType.GEOFENCE_EXIT,
    message: 'Exited geofence "North SOMA Logistics Hub" traveling at 34 km/h.',
    timestamp: new Date(Date.now() - 600000).toISOString(), // 10m ago
    read: false,
  },
  {
    id: 'not_3',
    employeeId: 'emp_3',
    employeeName: 'Michael Chang',
    type: NotificationType.GPS_DISABLED,
    message: 'GPS precision altered to Low Power Mode. Location tracking accuracy might be compromised.',
    timestamp: new Date(Date.now() - 1200000).toISOString(), // 20m ago
    read: true,
  },
  {
    id: 'not_4',
    employeeId: 'emp_6',
    employeeName: 'Marcus Vance',
    type: NotificationType.OFFLINE,
    message: 'Device offline. Communication lost for over 4 hours.',
    timestamp: new Date(Date.now() - 14400000).toISOString(), // 4h ago
    read: true,
  },
  {
    id: 'not_5',
    employeeId: 'emp_1',
    employeeName: 'Alex Rivera',
    type: NotificationType.SPEED_LIMIT,
    message: 'Exceeded safe speed limit (34 km/h in Downtown SOMA area).',
    timestamp: new Date(Date.now() - 150000).toISOString(), // 2.5m ago
    read: false,
  }
];

// Replay paths for employees (Historic Paths)
// We provide a full path through San Francisco for Alex Rivera
export const MOCK_ROUTE_ALEX: Route = {
  id: 'r_alex_today',
  employeeId: 'emp_1',
  date: new Date().toISOString().split('T')[0],
  totalDistance: 12.4,
  duration: 45,
  avgSpeed: 16.5,
  maxSpeed: 42,
  startAddress: 'MetroLogix HQ Office, CA',
  endAddress: 'Dolores Park, CA',
  idleDuration: 8,
  path: [
    { lat: 37.7946, lng: -122.4014 }, // HQ
    { lat: 37.7925, lng: -122.4010 },
    { lat: 37.7895, lng: -122.4015 },
    { lat: 37.7872, lng: -122.4032 },
    { lat: 37.7850, lng: -122.4055 },
    { lat: 37.7812, lng: -122.4029 }, // Logistics Hub
    { lat: 37.7801, lng: -122.4045 },
    { lat: 37.7775, lng: -122.4080 },
    { lat: 37.7735, lng: -122.4112 },
    { lat: 37.7702, lng: -122.4150 },
    { lat: 37.7680, lng: -122.4182 },
    { lat: 37.7651, lng: -122.4221 },
    { lat: 37.7622, lng: -122.4245 },
    { lat: 37.7598, lng: -122.4269 }, // Dolores Park Cafe
  ],
  stops: [
    {
      name: 'MetroLogix HQ Checkout',
      duration: 5,
      arrival: '08:20 AM',
      coords: { lat: 37.7946, lng: -122.4014 }
    },
    {
      name: 'North SOMA Logistics Hub Pickup',
      duration: 10,
      arrival: '08:42 AM',
      coords: { lat: 37.7812, lng: -122.4029 }
    },
    {
      name: 'Dolores Park Delivery Drop',
      duration: 12,
      arrival: '09:15 AM',
      coords: { lat: 37.7598, lng: -122.4269 }
    }
  ]
};

export const MOCK_ROUTE_SARAH: Route = {
  id: 'r_sarah_today',
  employeeId: 'emp_2',
  date: new Date().toISOString().split('T')[0],
  totalDistance: 4.8,
  duration: 25,
  avgSpeed: 11.5,
  maxSpeed: 25,
  startAddress: 'Salesforce Tower, CA',
  endAddress: 'Uber HQ, CA',
  idleDuration: 15,
  path: [
    { lat: 37.7897, lng: -122.3972 }, // Salesforce Tower
    { lat: 37.7855, lng: -122.3940 },
    { lat: 37.7812, lng: -122.3912 },
    { lat: 37.7770, lng: -122.3888 },
    { lat: 37.7725, lng: -122.3875 },
    { lat: 37.7682, lng: -122.3892 }, // Uber HQ
  ],
  stops: [
    {
      name: 'Salesforce Tower Meeting',
      duration: 43,
      arrival: '10:15 AM',
      coords: { lat: 37.7897, lng: -122.3972 }
    },
    {
      name: 'Uber HQ Meeting',
      duration: 30,
      arrival: '11:45 AM',
      coords: { lat: 37.7682, lng: -122.3892 }
    }
  ]
};

// Map of all preloaded routes for history replay
export const HISTORICAL_ROUTES: Record<string, Route[]> = {
  'emp_1': [MOCK_ROUTE_ALEX],
  'emp_2': [MOCK_ROUTE_SARAH],
};
