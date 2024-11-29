import { Environment } from "../app/interfaces/environment.interface";

export const environment: Environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api',
  frontendUrl: 'http://localhost:4200',
  authCallbackUrl: 'http://localhost:3000/auth/callback'
};
