import { DatePipe } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { PublicPostSummary, PostApiService } from '../../core/services/post-api.service';
import { resolveMediaUrl } from '../../core/config/api.config';

@Component({
  selector: 'app-news-page',
  imports: [DatePipe, RouterLink],
  templateUrl: './news-page.component.html',
  styleUrl: './news-page.component.scss'
})
export class NewsPageComponent implements OnInit {
  private readonly postApiService = inject(PostApiService);
  private readonly changeDetectorRef = inject(ChangeDetectorRef);
  private readonly title = inject(Title);

  protected readonly resolveMediaUrl = resolveMediaUrl;
  protected posts: PublicPostSummary[] = [];
  protected isLoading = true;
  protected errorMessage = '';

  ngOnInit(): void {
    this.title.setTitle('Tin tức | THE SWAN ATELIERE');
    this.loadPosts();
  }

  private loadPosts(): void {
    this.postApiService.getPosts().subscribe({
      next: (response) => {
        this.posts = response.data;
        this.isLoading = false;
        this.changeDetectorRef.detectChanges();
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage =
          error.error?.message || 'Chưa tải được danh sách tin tức. Vui lòng thử lại.';
        this.changeDetectorRef.detectChanges();
      }
    });
  }
}
