import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { apiBaseUrl } from '../config/api.config';
import { AdminSessionService } from './admin-session.service';

export interface AdminUser {
  id: number;
  username: string;
}

export interface AdminPost {
  id: number;
  title: string;
  slug: string;
  content: string;
  imagePath: string | null;
  videoPath: string | null;
  createdAt: string;
  updatedAt: string;
}

interface ApiResponse<T> {
  ok: boolean;
  message: string;
  data: T;
}

@Injectable({
  providedIn: 'root'
})
export class AdminApiService {
  private readonly http = inject(HttpClient);
  private readonly adminSession = inject(AdminSessionService);
  private readonly adminApiUrl = `${apiBaseUrl}/admin`;

  private createAuthorizedHeaders(): HttpHeaders {
    return new HttpHeaders({
      Authorization: `Bearer ${this.adminSession.getToken()}`
    });
  }

  login(username: string, password: string) {
    return this.http.post<ApiResponse<{ token: string; user: AdminUser }>>(
      `${this.adminApiUrl}/login`,
      { username, password }
    );
  }

  getSession() {
    return this.http.get<ApiResponse<{ user: AdminUser }>>(
      `${this.adminApiUrl}/session`,
      {
        headers: this.createAuthorizedHeaders()
      }
    );
  }

  getPosts() {
    return this.http.get<ApiResponse<AdminPost[]>>(
      `${this.adminApiUrl}/posts`,
      {
        headers: this.createAuthorizedHeaders()
      }
    );
  }

  createPost(formData: FormData) {
    return this.http.post<ApiResponse<AdminPost>>(
      `${this.adminApiUrl}/posts`,
      formData,
      {
        headers: this.createAuthorizedHeaders()
      }
    );
  }

  updatePost(postId: number, formData: FormData) {
    return this.http.put<ApiResponse<AdminPost>>(
      `${this.adminApiUrl}/posts/${postId}`,
      formData,
      {
        headers: this.createAuthorizedHeaders()
      }
    );
  }

  deletePost(postId: number) {
    return this.http.delete<ApiResponse<never>>(
      `${this.adminApiUrl}/posts/${postId}`,
      {
        headers: this.createAuthorizedHeaders()
      }
    );
  }

  changeCredentials(payload: {
    currentUsername: string;
    currentPassword: string;
    newUsername: string;
    newPassword: string;
  }) {
    return this.http.post<ApiResponse<{ token: string; user: AdminUser }>>(
      `${this.adminApiUrl}/change-credentials`,
      payload,
      {
        headers: this.createAuthorizedHeaders()
      }
    );
  }
}
