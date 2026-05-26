import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { apiBaseUrl } from '../config/api.config';

export interface PublicPostSummary {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  imagePath: string | null;
  publishedAt: string | null;
  isFeatured: boolean;
}

export interface PublicPostDetail extends PublicPostSummary {
  content: string;
  videoPath: string | null;
  seoTitle: string;
  seoDescription: string;
}

interface PostApiResponse<T> {
  ok: boolean;
  message: string;
  data: T;
}

@Injectable({
  providedIn: 'root'
})
export class PostApiService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${apiBaseUrl}/posts`;

  getPosts(options?: { limit?: number; featured?: boolean }) {
    let params = new HttpParams();

    if (options?.limit) {
      params = params.set('limit', options.limit);
    }

    if (options?.featured) {
      params = params.set('featured', 'true');
    }

    return this.http.get<PostApiResponse<PublicPostSummary[]>>(this.apiUrl, {
      params
    });
  }

  getPostBySlug(slug: string) {
    return this.http.get<PostApiResponse<PublicPostDetail>>(
      `${this.apiUrl}/${slug}`
    );
  }
}
