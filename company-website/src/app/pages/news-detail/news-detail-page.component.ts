import { DatePipe } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Meta, Title } from '@angular/platform-browser';
import { resolveMediaUrl } from '../../core/config/api.config';
import { PublicPostDetail, PostApiService } from '../../core/services/post-api.service';

@Component({
  selector: 'app-news-detail-page',
  imports: [DatePipe, RouterLink],
  templateUrl: './news-detail-page.component.html',
  styleUrl: './news-detail-page.component.scss'
})
export class NewsDetailPageComponent implements OnInit {
  private readonly activatedRoute = inject(ActivatedRoute);
  private readonly postApiService = inject(PostApiService);
  private readonly changeDetectorRef = inject(ChangeDetectorRef);
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);

  protected readonly resolveMediaUrl = resolveMediaUrl;
  protected post: PublicPostDetail | null = null;
  protected isLoading = true;
  protected errorMessage = '';

  ngOnInit(): void {
    const slug = this.activatedRoute.snapshot.paramMap.get('slug') || '';

    if (!slug) {
      this.isLoading = false;
      this.errorMessage = 'Đường dẫn bài viết chưa hợp lệ.';
      return;
    }

    this.loadPost(slug);
  }

  private loadPost(slug: string): void {
    this.postApiService.getPostBySlug(slug).subscribe({
      next: (response) => {
        this.post = response.data;
        this.isLoading = false;
        this.title.setTitle(`${response.data.seoTitle} | THE SWAN ATELIERE`);
        this.meta.updateTag({
          name: 'description',
          content: response.data.seoDescription
        });
        this.changeDetectorRef.detectChanges();
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage =
          error.error?.message || 'Chưa tải được chi tiết bài viết. Vui lòng thử lại.';
        this.title.setTitle('Tin tức | THE SWAN ATELIERE');
        this.changeDetectorRef.detectChanges();
      }
    });
  }
}
