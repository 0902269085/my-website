import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { apiBaseUrl } from '../config/api.config';

export interface ContactFormPayload {
  fullName: string;
  email: string;
  phone: string;
  message: string;
}

export interface ContactApiResponse {
  ok: boolean;
  message: string;
  data?: {
    id: number;
    fullName: string;
    email: string;
    phone: string;
    message: string;
    submittedAt: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class ContactApiService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${apiBaseUrl}/contact`;

  submitContactForm(payload: ContactFormPayload) {
    return this.http.post<ContactApiResponse>(this.apiUrl, payload);
  }
}
