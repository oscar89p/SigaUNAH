export interface AuthUser {
  username: string;
  displayName: string;
  initials: string;
  profiles: string[];
  permissions: string[];
}

export interface AuthSession {
  authenticated: true;
  csrfToken: string;
  user: AuthUser;
}
