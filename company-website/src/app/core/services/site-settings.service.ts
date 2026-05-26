import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { apiBaseUrl } from '../config/api.config';

export interface HeaderSettings {
  logoText: string;
  brandName: string;
  tagline: string;
}

export interface FooterSettings {
  title: string;
  description: string;
  phone: string;
  email: string;
  branchAddresses: string[];
}

export interface HeroSettings {
  eyebrow: string;
  title: string;
  description: string;
  primaryButtonLabel: string;
  primaryButtonRoute: string;
  secondaryButtonLabel: string;
  secondaryButtonRoute: string;
  cardLabel: string;
  cardTitle: string;
  cardDescription: string;
  highlights: string[];
}

export interface SiteSettings {
  header: HeaderSettings;
  footer: FooterSettings;
  hero: HeroSettings;
}

interface SiteSettingsResponse {
  ok: boolean;
  message: string;
  data: SiteSettings;
}

@Injectable({
  providedIn: 'root'
})
export class SiteSettingsService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${apiBaseUrl}/site-settings`;

  getSiteSettings() {
    return this.http.get<SiteSettingsResponse>(this.apiUrl);
  }
}
