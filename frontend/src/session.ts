// This file shares the signed-in user with frontend components.
// It exposes the existing user context without storing credentials.
// The app shell supplies the user after a successful session check.
import { createContext, useContext } from 'react';
import type { User } from './api';
export const UserContext = createContext<User | null>(null);
export function useUser() {
  const user = useContext(UserContext);
  if (!user) throw new Error('Authenticated user context is required.');
  return user;
}
