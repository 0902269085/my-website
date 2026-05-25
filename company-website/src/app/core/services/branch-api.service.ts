import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { apiBaseUrl } from '../config/api.config';

export interface Branch {
  id: number;
  name: string;
  address: string;
  phone: string;
}

interface BranchApiResponse {
  message: string;
  data: Branch[];
}

@Injectable({
  providedIn: 'root'
})
export class BranchApiService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${apiBaseUrl}/branches`;

  getBranches() {
    return this.http.get<BranchApiResponse>(this.apiUrl);
  }
}
