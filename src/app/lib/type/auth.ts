// src/types/auth.ts
export type UserRole = 'admin' | 'manager' | 'user';

export interface CustomJWTClaims {
  role: UserRole;
}
