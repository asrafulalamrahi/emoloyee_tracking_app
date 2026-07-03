import React, { useState } from 'react';
import { Database, Server, Terminal, ShieldAlert, Cpu, FileCode, CheckCircle, Copy, HelpCircle } from 'lucide-react';

export const SystemArchitecture: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'prisma' | 'sql' | 'api' | 'docker' | 'native'>('prisma');
  const [copied, setCopied] = useState(false);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const codeSnippets = {
    prisma: `// datasource postgresql setup with PostGIS support
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

enum EmployeeStatus {
  ONLINE
  OFFLINE
  TRAVELING
  IDLE
  BREAK
}

enum GeofenceType {
  CIRCLE
  POLYGON
}

enum AttendanceStatus {
  PRESENT
  LATE
  ABSENT
}

enum VisitStatus {
  ASSIGNED
  ONGOING
  VISITED
  MISSED
}

model User {
  id        String   @id @default(uuid())
  email     String   @unique
  password  String
  role      String   @default("Employee") // Admin, Manager, Employee, Auditor
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  employee  Employee?
}

model Employee {
  id                String         @id @default(uuid())
  userId            String         @unique
  user              User           @relation(fields: [userId], references: [id], onDelete: Cascade)
  name              String
  phone             String
  department        String
  team              String
  status            EmployeeStatus @default(OFFLINE)
  battery           Int            @default(100)
  gpsAccuracy       Float          @default(0.0)
  currentAddress    String?
  speed             Float          @default(0.0)
  
  // PostGIS Latitude and Longitude variables
  latitude          Float
  longitude         Float
  
  // High performance spatial geometry field mapped via raw SQL helper queries
  // location       Unsupported("geometry(Point, 4326)")? 

  createdAt         DateTime       @default(now())
  updatedAt         DateTime       @updatedAt
  
  locations         GPSLocation[]
  attendance        Attendance[]
  visits            Visit[]
  devices           Device[]
  notifications     Notification[]
}

model GPSLocation {
  id          String   @id @default(uuid())
  employeeId  String
  employee    Employee @relation(fields: [employeeId], references: [id], onDelete: Cascade)
  timestamp   DateTime @default(now())
  latitude    Float
  longitude   Float
  accuracy    Float
  speed       Float
  altitude    Float
  battery     Int
  
  @@index([employeeId, timestamp])
}

model Geofence {
  id           String       @id @default(uuid())
  name         String
  type         GeofenceType
  latitude     Float        // Centroid Lat
  longitude    Float        // Centroid Lng
  radius       Float?       // In meters (for Circles)
  polygonPath  Json?        // Coordinates array [{lat, lng}] for Polygons
  
  // PostGIS geometry object representing the circular or polygon boundary
  // geom       Unsupported("geometry(Polygon, 4326)")?

  status       String       @default("ACTIVE") // ACTIVE, INACTIVE
  targetTeams  String[]     // Teams this geofence applies to
  enterCount   Int          @default(0)
  exitCount    Int          @default(0)
  createdAt    DateTime     @default(now())
  updatedAt    DateTime     @updatedAt
}

model Attendance {
  id                 String           @id @default(uuid())
  employeeId         String
  employee           Employee         @relation(fields: [employeeId], references: [id], onDelete: Cascade)
  date               String           // YYYY-MM-DD
  clockIn            DateTime         @default(now())
  clockOut           DateTime?
  status             AttendanceStatus @default(PRESENT)
  workingHours       Float            @default(0.0)
  overtime           Float            @default(0.0)
  validatedGeofence  Boolean          @default(false)
  
  @@unique([employeeId, date])
}

model Customer {
  id            String   @id @default(uuid())
  name          String
  address       String
  latitude      Float
  longitude     Float
  contactPerson String
  phone         String
  email         String
  visits        Visit[]
}

model Visit {
  id            String      @id @default(uuid())
  employeeId    String
  employee      Employee    @relation(fields: [employeeId], references: [id], onDelete: Cascade)
  customerId    String
  customer      Customer    @relation(fields: [customerId], references: [id])
  date          String      // YYYY-MM-DD
  status        VisitStatus @default(ASSIGNED)
  arrivalTime   DateTime?
  departureTime DateTime?
  duration      Int?        // in minutes
  notes         String?     @db.Text
  photoUrl      String?     
  signature     String?     // SVG path or Base64 signature image
}

model Device {
  id                   String   @id @default(uuid())
  employeeId           String   @unique
  employee             Employee @relation(fields: [employeeId], references: [id], onDelete: Cascade)
  deviceName           String
  osVersion            String
  gpsPermission        String   // GRANTED, DENIED, PROMPTED
  highAccuracyEnabled  Boolean  @default(true)
  networkType          String   // WiFi, Cellular, None
  internetStatus       String   @default("online")
  updatedAt            DateTime @updatedAt
}

model Notification {
  id          String   @id @default(uuid())
  employeeId  String
  employee    Employee @relation(fields: [employeeId], references: [id], onDelete: Cascade)
  type        String   // LOW_BATTERY, GEOFENCE_ENTER, etc.
  message     String
  timestamp   DateTime @default(now())
  read        Boolean  @default(false)
}`,

    sql: `-- Enable spatial extension on PostgreSQL
CREATE EXTENSION IF NOT EXISTS postgis;

-- Create Database Schema Tables (PostGIS Optimized)
CREATE TABLE "User" (
  id VARCHAR(36) PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'Employee',
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "Employee" (
  id VARCHAR(36) PRIMARY KEY,
  "userId" VARCHAR(36) UNIQUE NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(50) NOT NULL,
  department VARCHAR(100) NOT NULL,
  team VARCHAR(100) NOT NULL,
  status VARCHAR(20) DEFAULT 'OFFLINE',
  battery INT DEFAULT 100,
  "gpsAccuracy" DOUBLE PRECISION DEFAULT 0.0,
  "currentAddress" TEXT,
  speed DOUBLE PRECISION DEFAULT 0.0,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  location GEOGRAPHY(Point, 4326), -- High speed spatial location query
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexing for GPS point query performance
CREATE INDEX idx_employee_spatial_location ON "Employee" USING GIST(location);

-- Automatically sync latitude/longitude to the spatial geometry geography point
CREATE OR REPLACE FUNCTION sync_employee_spatial_coords()
RETURNS TRIGGER AS $$
BEGIN
  NEW.location := ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326)::geography;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_sync_employee_coords
BEFORE INSERT OR UPDATE ON "Employee"
FOR EACH ROW EXECUTE FUNCTION sync_employee_spatial_coords();

-- Geofences Table (Polygon support)
CREATE TABLE "Geofence" (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(20) NOT NULL, -- CIRCLE, POLYGON
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  radius DOUBLE PRECISION, -- for circles (meters)
  "polygonPath" JSONB, -- Coordinates array
  boundary GEOGRAPHY(Polygon, 4326), -- PostGIS Spatial Area
  status VARCHAR(20) DEFAULT 'ACTIVE',
  "targetTeams" TEXT[],
  "enterCount" INT DEFAULT 0,
  "exitCount" INT DEFAULT 0,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_geofence_spatial_boundary ON "Geofence" USING GIST(boundary);

-- Check if Employee is in a Geofence Query (Spatial SQL)
-- Query to find which active geofences an employee's location currently overlaps
SELECT g.id, g.name, g.type
FROM "Geofence" g
WHERE g.status = 'ACTIVE'
  AND (
    (g.type = 'CIRCLE' AND ST_DWithin(g.boundary, (SELECT location FROM "Employee" WHERE id = 'emp_1'), g.radius))
    OR
    (g.type = 'POLYGON' AND ST_Contains(g.boundary::geometry, (SELECT location::geometry FROM "Employee" WHERE id = 'emp_1')))
  );`,

    api: `=========================================
REST API BLUEPRINTS (NestJS / Express)
=========================================

1. AUTHENTICATION SERVICE
   POST   /api/auth/login            -> Authenticates credentials, issues JWT token
   POST   /api/auth/device-bind      -> Securely binds device to user ID (prevents buddy punching)

2. EMPLOYEE & LOCATION TELEMETRY
   GET    /api/employees             -> List all employees, search & filter by team/status
   GET    /api/employees/:id         -> Get specific employee current status, battery, accuracy
   POST   /api/locations/telemetry   -> Ingest location array from Mobile background service (batch syncing)
                                        Payload: {
                                          employeeId: string,
                                          coords: [{lat, lng, accuracy, speed, altitude, timestamp}],
                                          battery: number, networkType: string, isCharging: boolean
                                        }

3. ROUTE PLAYBACK
   GET    /api/routes/:empId/history -> Replay coordinates for employee on a given ?date=YYYY-MM-DD
                                        Returns: { routeId, totalDistance, duration, path: [{lat,lng}], stops: [...] }

4. GEOFENCING & ATTENDANCE ENGINE
   GET    /api/geofences             -> List all active circular/polygon zones
   POST   /api/geofences             -> Create new circular or polygon boundary
   POST   /api/attendance/clock-in   -> Log clock-in. Overrides automatically if entering office geofence.
   POST   /api/attendance/clock-out  -> Log clock-out. Calculates working hours and overtime.

5. CUSTOMER VISIT DISPATCH
   GET    /api/visits/assigned       -> Mobile fetch current customer visits assigned for today
   POST   /api/visits/:id/check-in   -> Set visit status to ONGOING, starts clock timer
   POST   /api/visits/:id/complete   -> Log completion with notes, photos, and digital signature

=========================================
SOCKET.IO EVENT CONTRACTS (Real-Time Push)
=========================================

Client Emit:
  "join_dashboard"           -> Authenticates socket & registers Admin to listen to live telemetry feeds.
  "join_employee"            -> Mobile register socket with { employeeId }. Enables dedicated dispatch.

Server Broadcast / Emit:
  "telemetry_update"         -> Broadcasts live coordinates to Admins:
                                { employeeId, lat, lng, speed, battery, lastUpdate, status }
  "geofence_trigger"         -> Real-time security alert:
                                { employeeId, employeeName, geofenceId, geofenceName, eventType: "ENTER" | "EXIT" }
  "device_status_alert"      -> Alerts if background service is terminated or GPS turned off:
                                { employeeId, type: "GPS_DISABLED" | "LOW_BATTERY" | "OFFLINE" }`,

    docker: `# Multi-stage Build Dockerfile for Backend NestJS / Express Engine
# --------------------------------------------------------
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --only=production
COPY --from=builder /app/dist ./dist

EXPOSE 3000
CMD ["node", "dist/main.js"]


# docker-compose.yml Local Multi-Service Development environment
# --------------------------------------------------------
version: '3.8'
services:
  postgres:
    image: postgis/postgis:15-3.3-alpine
    container_name: mlogix_postgis
    environment:
      POSTGRES_USER: mlogix_root
      POSTGRES_PASSWORD: SecretPassword123
      POSTGRES_DB: mlogix_db
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    container_name: mlogix_cache
    ports:
      - "6379:6379"

  backend:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://mlogix_root:SecretPassword123@postgres:5432/mlogix_db?schema=public
      - REDIS_URL=redis://redis:6379
      - JWT_SECRET=MetroLogixSecureAccessJWTKey55
    depends_on:
      - postgres
      - redis

volumes:
  pgdata:`,

    native: `/**
 * React Native iOS & Android Background Geolocation Service Implementation
 * Powered by 'transistorsoft' Background Geolocation library (enterprise optimized).
 * 
 * Implements: Background operation, battery saver, off-line coordinate queuing, auto-sync.
 */
import { useEffect, useState } from 'react';
import { Platform, Alert } from 'react-native';
import BackgroundGeolocation, { 
  Location, 
  State 
} from 'react-native-background-geolocation';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const useBackgroundGPS = (employeeId: string, isTrackingActive: boolean) => {
  const [currentLocation, setCurrentLocation] = useState<Location | null>(null);
  const [gpsIndicator, setGpsIndicator] = useState<'EXCELLENT' | 'POOR' | 'DISCONNECTED'>('DISCONNECTED');

  useEffect(() => {
    if (!employeeId || !isTrackingActive) {
      BackgroundGeolocation.stop();
      return;
    }

    // Initialize Background Tracking
    BackgroundGeolocation.ready({
      // Battery Optimized Setup
      desiredAccuracy: BackgroundGeolocation.DESIRED_ACCURACY_HIGH,
      distanceFilter: 10, // Track every 10 meters moved
      stationaryRadius: 25, // Pin location if stationary
      stopOnTerminate: false, // Continue tracking if app is closed
      startOnBoot: true, // Auto-start if phone reboots

      // HTTP Telemetry Pipeline Configuration
      url: "https://api.metrologix.com/api/locations/telemetry",
      headers: {
        "Authorization": "Bearer SYSTEM_ACCESS_TOKEN_JWT",
        "Content-Type": "application/json"
      },
      params: { employeeId },
      autoSync: true, // Instantly POST coordinate batches as soon as GPS triggers
      maxDaysToPersist: 7, // Queue offline if internet drops out

      // Android Foreground Persistent Service Notification
      notification: {
        title: "Logistics Tracking Enabled",
        text: "Sharing your location transparently with Dispatch Office.",
        color: "#10b981",
        smallIcon: "ic_location_service"
      },
      
      // Heartbeat options for periodic pings
      heartbeatInterval: 60,
      preventSuspend: true
    }).then((state: State) => {
      console.log("- BackgroundGeolocation is ready: ", state.enabled);
      if (!state.enabled) {
        BackgroundGeolocation.start(); // Boot the background threads
      }
    });

    // 1. GPS Coordinate Listener
    BackgroundGeolocation.onLocation((location) => {
      setCurrentLocation(location);
      
      // Update accuracy indicator
      const acc = location.coords.accuracy;
      if (acc <= 5) setGpsIndicator('EXCELLENT');
      else if (acc <= 20) setGpsIndicator('POOR');
      else setGpsIndicator('DISCONNECTED');

      // Local storage cache fallback
      AsyncStorage.setItem('last_coordinates', JSON.stringify({
        lat: location.coords.latitude,
        lng: location.coords.longitude,
        speed: location.coords.speed,
        timestamp: location.timestamp
      }));
    });

    // 2. HTTP Server Sync Success Listener
    BackgroundGeolocation.onSync((event) => {
      console.log("[Sync] Offline coordinates synced successfully to API: ", event);
    });

    // 3. User Permission Listener
    BackgroundGeolocation.onProviderChange((event) => {
      console.log("[ProviderChange] GPS Status changed: ", event);
      if (event.status === BackgroundGeolocation.AUTHORIZATION_STATUS_DENIED) {
        Alert.alert(
          "Permission Required",
          "Location services must be enabled in background for automatic client-checkins.",
          [{ text: "Open Settings", onPress: () => BackgroundGeolocation.showSettings() }]
        );
      }
    });

    return () => {
      BackgroundGeolocation.removeListeners();
    };
  }, [employeeId, isTrackingActive]);

  return { currentLocation, gpsIndicator };
};`
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
      <div className="border-b border-slate-800 bg-slate-950 px-6 py-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Cpu className="w-5 h-5 text-blue-500 animate-pulse" />
            Enterprise System Architecture Blueprints
          </h3>
          <p className="text-xs text-slate-400 mt-1">PostgreSQL/PostGIS, Prisma ORM, REST API docs, and Production Background GPS Hooks.</p>
        </div>
        <div className="flex gap-1 bg-slate-900 border border-slate-800 rounded-lg p-1">
          {(['prisma', 'sql', 'api', 'docker', 'native'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`text-xs px-3 py-1.5 rounded-md font-bold transition-all ${
                activeTab === tab 
                  ? 'bg-blue-600 text-white shadow' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {tab === 'prisma' && 'Prisma Schema'}
              {tab === 'sql' && 'PostGIS SQL'}
              {tab === 'api' && 'APIs / Websockets'}
              {tab === 'docker' && 'Docker Setup'}
              {tab === 'native' && 'Mobile Services'}
            </button>
          ))}
        </div>
      </div>

      {/* Code Display Area */}
      <div className="relative">
        <div className="absolute right-4 top-4 z-10 flex gap-2">
          <button
            onClick={() => handleCopy(codeSnippets[activeTab])}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-300 hover:text-white bg-slate-950/80 hover:bg-slate-800 border border-slate-800 px-3 py-1.5 rounded-lg backdrop-blur-sm shadow transition-all active:scale-95"
          >
            {copied ? (
              <>
                <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Blueprint</span>
              </>
            )}
          </button>
        </div>

        <pre className="p-6 h-[500px] overflow-y-auto font-mono text-xs text-slate-300 bg-slate-950/40 leading-relaxed scrollbar-thin">
          <code>{codeSnippets[activeTab]}</code>
        </pre>
      </div>

      {/* Architectural Explainer Footer */}
      <div className="bg-slate-950/80 border-t border-slate-800 p-5 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400 mt-0.5">
            <Database className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-200">PostGIS Spatial Query Layer</h4>
            <p className="text-[11px] text-slate-400 mt-1 leading-normal">Utilizes specialized spatial indices (GIST) on geology geography points to perform high-speed coordinates containment checks (geofences) with sub-millisecond latencies.</p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400 mt-0.5">
            <Server className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-200">Telemetry Ingestion Engine</h4>
            <p className="text-[11px] text-slate-400 mt-1 leading-normal">Express / NestJS endpoint handles batched arrays of queued offline locations from mobile clients. Redis manages in-memory geofence checks and routes WebSocket broadcasts.</p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div className="p-2 bg-purple-500/10 rounded-lg text-purple-400 mt-0.5">
            <ShieldAlert className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-200">Anti-Punch Bounding (Security)</h4>
            <p className="text-[11px] text-slate-400 mt-1 leading-normal">Device ID binding ensures coordinates ingest strictly from registered staff phones. Cryptographical hashing safeguards coordinates at rest to uphold strict privacy standards.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
