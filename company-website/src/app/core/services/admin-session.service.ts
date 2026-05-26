import { Injectable } from '@angular/core';

interface AdminUser {
  id: number;
  username: string;
}

@Injectable({
  providedIn: 'root'
})
export class AdminSessionService {
  private readonly tokenKey = 'admin_token';
  private readonly userKey = 'admin_user';

  getToken(): string {
    return localStorage.getItem(this.tokenKey) || '';
  }

  getUser(): AdminUser | null {
    const rawUser = localStorage.getItem(this.userKey);

    if (!rawUser) {
      return null;
    }

    try {
      return JSON.parse(rawUser) as AdminUser;
    } catch {
      this.clearSession();
      return null;
    }
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  saveSession(token: string, user: AdminUser): void {
    localStorage.setItem(this.tokenKey, token);
    localStorage.setItem(this.userKey, JSON.stringify(user));
  }

  clearSession(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
  }
}
