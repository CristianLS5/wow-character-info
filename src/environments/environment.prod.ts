import { Environment } from '../app/interfaces/environment.interface';

export const environment: Environment = {
  production: true,
  apiUrl: 'https://api.wowcharacterviewer.com',
  frontendUrl: 'https://wowcharacterviewer.com',
  authCallbackUrl: 'https://api.wowcharacterviewer.com/auth/callback',
};
