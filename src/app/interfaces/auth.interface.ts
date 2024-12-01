export interface AuthStorage {
  auth_state: string;
  auth_time: string;
  storage_type: 'local' | 'session';
  oauth_state?: string;
} 