import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged, 
  User, 
  signOut 
} from 'firebase/auth';
import { firebaseConfig } from '../firebase-config';

// 1. Initialize Firebase App
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);

// 2. Configure Google Auth Provider with Google Drive Scopes
export const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('https://www.googleapis.com/auth/drive');
googleProvider.addScope('https://www.googleapis.com/auth/drive.file');

// 3. In-memory access token cache
let cachedAccessToken: string | null = null;
let isSigningIn = false;

// 4. Initialize Auth listener
export const initGoogleAuth = (
  onSuccess: (user: User, token: string) => void,
  onFailure: () => void
) => {
  return onAuthStateChanged(auth, async (user) => {
    if (user) {
      if (cachedAccessToken) {
        onSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        // If there's a user but no cached token (e.g. on page refresh), we need them to sign in again to get the credential
        cachedAccessToken = null;
        onFailure();
      }
    } else {
      cachedAccessToken = null;
      onFailure();
    }
  });
};

// 5. Sign In handler
export const signInWithGoogleDrive = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, googleProvider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential || !credential.accessToken) {
      throw new Error('Failed to retrieve Google OAuth access token');
    }
    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error) {
    console.error('Google Sign-In Error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

// 6. Sign Out handler
export const signOutGoogle = async () => {
  await signOut(auth);
  cachedAccessToken = null;
};

// 7. Get token helper
export const getGoogleAccessToken = (): string | null => {
  return cachedAccessToken;
};

// 8. Google Drive API Interfaces
export interface GoogleDriveFile {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime: string;
  webViewLink?: string;
  size?: string;
}

// 9. Google Drive API functions
const getHeaders = () => {
  if (!cachedAccessToken) {
    throw new Error('No Google OAuth access token available. Please sign in.');
  }
  return {
    Authorization: `Bearer ${cachedAccessToken}`,
    'Content-Type': 'application/json',
  };
};

/**
 * Lists files from Google Drive.
 * Defaults to searching for folders first or files created by this app.
 */
export const listDriveFiles = async (): Promise<GoogleDriveFile[]> => {
  const query = encodeURIComponent("trashed = false");
  const fields = 'files(id, name, mimeType, modifiedTime, webViewLink, size)';
  const url = `https://www.googleapis.com/drive/v3/files?q=${query}&fields=${fields}&orderBy=folder,name,modifiedTime desc&pageSize=50`;

  const response = await fetch(url, {
    method: 'GET',
    headers: getHeaders(),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error?.message || 'Failed to list Google Drive files');
  }

  const data = await response.json();
  return data.files || [];
};

/**
 * Creates a folder in Google Drive and returns the folder metadata.
 */
export const createDriveFolder = async (folderName: string): Promise<GoogleDriveFile> => {
  const url = 'https://www.googleapis.com/drive/v3/files';
  const body = {
    name: folderName,
    mimeType: 'application/vnd.google-apps.folder',
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error?.message || 'Failed to create Google Drive folder');
  }

  return response.json();
};

/**
 * Uploads a text or CSV file to Google Drive (with optional parent folder).
 */
export const uploadFileToDrive = async (
  filename: string,
  content: string,
  mimeType: string = 'text/plain',
  folderId?: string
): Promise<GoogleDriveFile> => {
  const metadataUrl = 'https://www.googleapis.com/drive/v3/files';
  const uploadUrl = 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart';

  // We use the multipart upload mechanism to set both file metadata (like name and parent folder) and the content in one request.
  const boundary = '314159265358979323846';
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  const metadata = {
    name: filename,
    mimeType: mimeType,
    parents: folderId ? [folderId] : undefined,
  };

  const multipartBody = 
    delimiter +
    'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
    JSON.stringify(metadata) +
    delimiter +
    `Content-Type: ${mimeType}\r\n\r\n` +
    content +
    closeDelimiter;

  const response = await fetch(uploadUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${cachedAccessToken}`,
      'Content-Type': `multipart/related; boundary=${boundary}`,
    },
    body: multipartBody,
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error?.message || 'Failed to upload file to Google Drive');
  }

  return response.json();
};

/**
 * Deletes a file from Google Drive.
 * WARNING: The calling component MUST prompt for user confirmation first.
 */
export const deleteDriveFile = async (fileId: string): Promise<void> => {
  const url = `https://www.googleapis.com/drive/v3/files/${fileId}`;

  const response = await fetch(url, {
    method: 'DELETE',
    headers: getHeaders(),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error?.message || 'Failed to delete file from Google Drive');
  }
};
