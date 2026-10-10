export interface AuthUser {
  username: string;
  displayName: string;
  initials: string;
}

export interface AuthSession {
  authenticated: true;
  user: AuthUser;
}
