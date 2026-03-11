export interface JwtPayload {
  /** User UUID */
  sub: string;
  email: string;
  role: string;
  /** Flat array of permission atoms resolved at login time */
  permissions: string[];
  iat?: number;
  exp?: number;
}
