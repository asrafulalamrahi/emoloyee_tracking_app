import { Employee } from './types';

export const MAP_CENTER = { lat: 37.7749, lng: -122.4194 }; // San Francisco
export const MAP_ZOOM = 13;

export const INITIAL_EMPLOYEES: Employee[] = [
  {
    id: 'emp-1',
    email: 'rider1@metrologix.com',
    name: 'John Rider',
    role: 'RIDER',
    status: 'OFFLINE',
    lastLat: 37.7749,
    lastLng: -122.4194,
    lastLocationUpdate: new Date().toISOString(),
    device: {
      id: 'dev-1',
      employeeId: 'emp-1',
      deviceName: 'Samsung Galaxy S23',
      batteryLevel: 92,
      isGpsEnabled: true,
      locationPermission: 'GRANTED'
    }
  },
  {
    id: 'emp-2',
    email: 'merch1@metrologix.com',
    name: 'Clara Merchandiser',
    role: 'MERCHANDISER',
    status: 'OFFLINE',
    lastLat: 37.7833,
    lastLng: -122.4167,
    lastLocationUpdate: new Date().toISOString(),
    device: {
      id: 'dev-2',
      employeeId: 'emp-2',
      deviceName: 'iPhone 15 Pro',
      batteryLevel: 88,
      isGpsEnabled: true,
      locationPermission: 'GRANTED'
    }
  }
];
