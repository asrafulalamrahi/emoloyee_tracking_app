export interface Coordinates {
  lat: number;
  lng: number;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

export interface Device {
  id: string;
  employeeId: string;
  imei?: string | null;
  platform?: string | null;
  deviceName?: string | null;
  batteryLevel?: number | null;
  isGpsEnabled: boolean;
  locationPermission?: string | null;
  lastSeen?: string | null;
}

export interface Employee {
  id: string;
  employeeCode?: string | null;
  email: string;
  name: string;
  role: string; // "RIDER" or "MERCHANDISER"
  phone?: string | null;
  status: string; // "ONLINE" or "OFFLINE"
  lastLat?: number | null;
  lastLng?: number | null;
  lastLocationUpdate?: string | null;
  device?: Device | null;
}

export interface GPSLocation {
  id: string;
  employeeId: string;
  lat: number;
  lng: number;
  batteryLevel?: number | null;
  timestamp: string;
}
