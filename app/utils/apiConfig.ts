/**
 * API Configuration
 * Centralized API URL management for frontend
 * 
 * Environment variable: VITE_API_URL
 * - Local development: http://localhost:3001
 * - Render production: https://your-backend-api.onrender.com
 */

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

/**
 * Helper to build full API URLs
 * @param endpoint - API endpoint (e.g., '/api/announcements')
 * @returns Full URL
 */
export const getApiUrl = (endpoint: string): string => {
  return `${API_BASE_URL}${endpoint}`;
};

/**
 * Helper to build asset URLs (images, documents, etc.)
 * @param path - Asset path (e.g., '/assets/uploads/image.jpg')
 * @returns Full URL
 */
export const getAssetUrl = (path: string): string => {
  if (path.startsWith('http')) return path; // Already a full URL
  if (path.startsWith('data:')) return path; // Data URL
  return `${API_BASE_URL}${path}`;
};
