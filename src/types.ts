export enum EmployeeStatus {
  ONLINE = 'ONLINE',
  OFFLINE = 'OFFLINE',
  TRAVELING = 'TRAVELING',
  IDLE = 'IDLE',
  BREAK = 'BREAK',
}

export enum GeofenceType {
  CIRCLE = 'CIRCLE',
  POLYGON = 'POLYGON',
}

export enum AttendanceStatus {
  PRESENT = 'PRESENT',
  LATE = 'LATE',
  ABSENT = 'ABSENT',
}

export enum VisitStatus {
  ASSIGNED = 'ASSIGNED',
  ONGOING = 'ONGOING',
  VISITED = 'VISITED',
  MISSED = 'MISSED',
}

export enum NotificationType {
  GPS_DISABLED = 'GPS_DISABLED',
  LOW_BATTERY = 'LOW_BATTERY',
  GEOFENCE_ENTER = 'GEOFENCE_ENTER',
  GEOFENCE_EXIT = 'GEOFENCE_EXIT',
  OFFLINE = 'OFFLINE',
  SPEED_LIMIT = 'SPEED_LIMIT',
}

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface Employee {
  id: string;
  name: string;
  email?: string;
  avatar: string;
  role: string;
  team: string;
  department: string;
  designation?: string;
  branch?: string;
  factory?: string;
  region?: string;
  qrCode?: string;
  employeeCode?: string;
  phone: string;
  status: EmployeeStatus;
  battery: number;
  gpsAccuracy: number;
  currentAddress: string;
  speed: number;
  coords: Coordinates;
  totalWorkingHours: number;
  totalDistance: number;
  completedVisits: number;
  missedVisits: number;
  deviceName: string;
  networkType: string;
  internetStatus: 'online' | 'offline';
  lastUpdate: string;

  // --- ONBOARDING & DEVICE MANAGEMENT ---
  deviceApprovalStatus: 'PENDING' | 'APPROVED' | 'REJECTED' | 'NOT_ACTIVATED';
  activationCode: string;
  deviceImei?: string;
  devicePlatform?: 'iOS' | 'Android';
  osVersion?: string;
  appVersion?: string;

  // --- CONNECTIVITY & DIAGNOSTICS ---
  gpsEnabled: boolean;
  batterySaver: boolean;
  locationPermission: 'GRANTED' | 'DENIED' | 'RESTRICTED';
  backgroundPermission: 'GRANTED' | 'DENIED' | 'ALWAYS';
  appForceClosed: boolean;
  offlineDurationMinutes: number;
  lastSuccessfulUpdate: string;
  cachedGPSPointsCount: number;

  // --- ANTI-TAMPER DETECTIONS ---
  mockLocationActive: boolean;
  developerModeActive: boolean;
  vpnActive: boolean;
  deviceRooted: boolean;
  timeManipulationDetected: boolean;
  deviceRebooted: boolean;
  backgroundRestricted: boolean;

  // --- OUTLET ANALYTICS ---
  nearestOutletName: string;
  distanceToOutletKm: number;
  etaMinutes: number;
  travelDurationMinutes: number;
  bestRouteName: string;
  trafficDelayMinutes: number;
  visitedOutletsCount: number;
  missedOutletsCount: number;
  timeSpentAtOutletMinutes: Record<string, number>;

  // --- MAIN OFFICE ANALYTICS ---
  distanceFromHeadOfficeKm: number;
  timeSinceLeftOfficeMinutes: number;
  currentTravelDurationMinutes: number;
  expectedReturnTime: string;

  // --- AI ANALYTICS ---
  productivityScore: number;
  travelEfficiency: number;
  idleAnalysisRating: 'Excellent' | 'Normal' | 'High Idle' | 'Warning';
  routeOptimized: boolean;
  latePredictionProb: number; // percentage
  missedVisitPrediction: boolean;
  attendanceInsights: string;
}

export interface GPSLocation {
  id: string;
  employeeId: string;
  timestamp: string;
  lat: number;
  lng: number;
  accuracy: number;
  speed: number;
  altitude: number;
  battery: number;
}

export interface Route {
  id: string;
  employeeId: string;
  date: string;
  path: Coordinates[];
  totalDistance: number; // in km
  duration: number; // in minutes
  avgSpeed: number; // in km/h
  maxSpeed: number; // in km/h
  startAddress: string;
  endAddress: string;
  idleDuration: number; // in minutes
  stops: {
    name: string;
    duration: number;
    arrival: string;
    coords: Coordinates;
  }[];
}

export interface Geofence {
  id: string;
  name: string;
  type: GeofenceType;
  coords: Coordinates; // center for Circle, or representative centroid
  radius?: number; // meters (for Circle)
  polygonPath?: Coordinates[]; // (for Polygon)
  status: 'ACTIVE' | 'INACTIVE';
  targetTeams: string[];
  enterCount: number;
  exitCount: number;
}

export interface Attendance {
  id: string;
  employeeId: string;
  date: string;
  clockIn: string;
  clockOut?: string;
  status: AttendanceStatus;
  workingHours: number;
  overtime: number;
  validatedByGeofence: boolean;
}

export interface Customer {
  id: string;
  name: string;
  address: string;
  coords: Coordinates;
  contactPerson: string;
  phone: string;
  email: string;
}

export interface Visit {
  id: string;
  employeeId: string;
  customerId: string;
  date: string;
  status: VisitStatus;
  arrivalTime?: string;
  departureTime?: string;
  duration?: number; // in minutes
  notes?: string;
  photoUrl?: string;
  signature?: string;
}

export interface DeviceHealth {
  employeeId: string;
  deviceName: string;
  osVersion: string;
  battery: number;
  isCharging: boolean;
  gpsPermission: 'GRANTED' | 'DENIED' | 'PROMPTED';
  highAccuracyEnabled: boolean;
  networkType: 'WiFi' | 'Cellular' | 'None';
  internetStatus: 'online' | 'offline';
}

export interface Notification {
  id: string;
  employeeId: string;
  employeeName: string;
  type: NotificationType;
  message: string;
  timestamp: string;
  read: boolean;
}
