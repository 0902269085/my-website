import { DatePipe } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse, HttpEventType } from '@angular/common/http';
import { Router } from '@angular/router';
import { AdminApiService, AdminPost } from '../../core/services/admin-api.service';
import { AdminSessionService } from '../../core/services/admin-session.service';
import {
  FooterSettings,
  HeaderSettings,
  HeroSettings,
  SiteSettings
} from '../../core/services/site-settings.service';
import { resolveMediaUrl } from '../../core/config/api.config';

type AdminView = 'overview' | 'appearance' | 'posts' | 'account';

@Component({
  selector: 'app-admin-dashboard-page',
  imports: [DatePipe, FormsModule],
  templateUrl: './admin-dashboard-page.component.html',
  styleUrl: './admin-dashboard-page.component.scss'
})
export class AdminDashboardPageComponent implements OnInit {
  private readonly adminApiService = inject(AdminApiService);
  private readonly adminSession = inject(AdminSessionService);
  private readonly router = inject(Router);
  private readonly changeDetectorRef = inject(ChangeDetectorRef);

  protected readonly resolveMediaUrl = resolveMediaUrl;
  protected readonly availableViews: { id: AdminView; label: string }[] = [
    { id: 'overview', label: 'Tổng quan' },
    { id: 'appearance', label: 'Header - Footer - Hero' },
    { id: 'posts', label: 'Bài viết' },
    { id: 'account', label: 'Tài khoản admin' }
  ];
  protected activeView: AdminView = 'overview';
  protected posts: AdminPost[] = [];
  protected filteredPosts: AdminPost[] = [];
  protected currentUser = this.adminSession.getUser();
  protected isBootstrapping = true;
  protected isLoadingPosts = false;
  protected isLoadingSiteSettings = false;
  protected isSavingPost = false;
  protected isSavingSiteSettings = false;
  protected isSavingCredentials = false;
  protected uploadProgress = 0;
  protected postsMessage = '';
  protected postsState: 'idle' | 'success' | 'error' = 'idle';
  protected settingsMessage = '';
  protected settingsState: 'idle' | 'success' | 'error' = 'idle';
  protected credentialsMessage = '';
  protected credentialsState: 'idle' | 'success' | 'error' = 'idle';
  protected editingPostId: number | null = null;
  protected postSearchKeyword = '';
  protected postForm = {
    title: '',
    excerpt: '',
    content: '',
    seoTitle: '',
    seoDescription: '',
    isPublished: true,
    isFeatured: false
  };
  protected selectedImageFile: File | null = null;
  protected selectedVideoFile: File | null = null;
  protected selectedImageFileName = '';
  protected selectedVideoFileName = '';
  protected appearanceForm: SiteSettings = {
    header: {
      logoText: 'TS',
      brandName: 'THE SWAN ATELIERE',
      tagline: 'Thời trang thiết kế nữ thanh lịch, hiện đại và tinh tế cho nhịp sống đô thị'
    },
    footer: {
      title: 'Thông tin liên hệ',
      description: 'Thời trang thiết kế nữ thanh lịch, hiện đại và tinh tế cho nhịp sống đô thị',
      phone: '0909480231',
      email: 'hello@theswanateliere.vn',
      branchAddresses: [
        'Chi nhánh 1: 436 Võ Văn Tần, phường Bàn Cờ, TP.HCM',
        'Chi nhánh 2: 38 Trần Quang Diệu, phường Nhiêu Lộc, TP.HCM'
      ]
    },
    hero: {
      eyebrow: 'Thời trang thiết kế nữ',
      title: 'THE SWAN ATELIERE mang đến những thiết kế dành cho nữ trẻ yêu sự thanh lịch và hiện đại',
      description:
        'Hướng đến khách hàng nữ từ 16 đến 30 tuổi, THE SWAN ATELIERE phát triển các thiết kế dễ mặc, dễ phối và đủ tinh tế để đồng hành cùng nhiều khoảnh khắc trong đời sống hằng ngày.',
      primaryButtonLabel: 'Nhận tư vấn ngay',
      primaryButtonRoute: '/lien-he',
      secondaryButtonLabel: 'Xem dịch vụ',
      secondaryButtonRoute: '/dich-vu',
      cardLabel: 'Tổng quan nhanh',
      cardTitle: 'THE SWAN ATELIERE',
      cardDescription: 'Thời trang thiết kế nữ thanh lịch, hiện đại và tinh tế cho nhịp sống đô thị',
      highlights: [
        'Thành lập từ năm 2020',
        'Bán lẻ thời trang thiết kế nữ',
        '2 chi nhánh tại TP.HCM'
      ]
    }
  };
  protected credentialsForm = {
    currentUsername: this.currentUser?.username || '',
    currentPassword: '',
    newUsername: '',
    newPassword: ''
  };

  ngOnInit(): void {
    this.adminApiService.getSession().subscribe({
      next: (response) => {
        this.currentUser = response.data.user;
        this.credentialsForm.currentUsername = response.data.user.username;
        this.loadDashboardData();
        this.changeDetectorRef.detectChanges();
      },
      error: () => {
        this.handleExpiredSession();
      }
    });
  }

  protected setActiveView(nextView: AdminView): void {
    this.activeView = nextView;
  }

  protected loadDashboardData(): void {
    this.isBootstrapping = true;
    this.loadSiteSettings();
    this.loadPosts(true);
  }

  protected loadSiteSettings(): void {
    this.isLoadingSiteSettings = true;

    this.adminApiService.getSiteSettings().subscribe({
      next: (response) => {
        this.isLoadingSiteSettings = false;
        this.appearanceForm = {
          header: { ...response.data.header },
          footer: {
            ...response.data.footer,
            branchAddresses: [...response.data.footer.branchAddresses]
          },
          hero: {
            ...response.data.hero,
            highlights: [...response.data.hero.highlights]
          }
        };
        this.finishBootstrapIfReady();
        this.changeDetectorRef.detectChanges();
      },
      error: (error: HttpErrorResponse) => {
        this.isLoadingSiteSettings = false;
        this.settingsState = 'error';
        this.settingsMessage =
          error.error?.message || 'Chưa tải được cấu hình giao diện website.';
        this.handleUnauthorizedError(error);
        this.finishBootstrapIfReady();
        this.changeDetectorRef.detectChanges();
      }
    });
  }

  protected loadPosts(isBootstrap = false): void {
    this.isLoadingPosts = true;

    this.adminApiService.getPosts().subscribe({
      next: (response) => {
        this.isLoadingPosts = false;
        this.posts = response.data;
        this.applyPostFilter();
        this.finishBootstrapIfReady();
        this.changeDetectorRef.detectChanges();
      },
      error: (error: HttpErrorResponse) => {
        this.isLoadingPosts = false;
        this.postsState = 'error';
        this.postsMessage =
          error.error?.message || 'Chưa tải được danh sách bài viết.';
        this.handleUnauthorizedError(error);
        if (isBootstrap) {
          this.finishBootstrapIfReady();
        }
        this.changeDetectorRef.detectChanges();
      }
    });
  }

  protected applyPostFilter(): void {
    const normalizedKeyword = this.postSearchKeyword.trim().toLowerCase();

    if (!normalizedKeyword) {
      this.filteredPosts = [...this.posts];
      return;
    }

    this.filteredPosts = this.posts.filter((post) => {
      return (
        post.title.toLowerCase().includes(normalizedKeyword) ||
        post.slug.toLowerCase().includes(normalizedKeyword) ||
        post.content.toLowerCase().includes(normalizedKeyword)
      );
    });
  }

  protected changeBranchAddress(index: number, value: string): void {
    this.appearanceForm.footer.branchAddresses[index] = value;
  }

  protected addBranchAddress(): void {
    this.appearanceForm.footer.branchAddresses = [
      ...this.appearanceForm.footer.branchAddresses,
      ''
    ];
  }

  protected removeBranchAddress(index: number): void {
    this.appearanceForm.footer.branchAddresses = this.appearanceForm.footer.branchAddresses.filter(
      (_, itemIndex) => itemIndex !== index
    );
  }

  protected changeHighlight(index: number, value: string): void {
    this.appearanceForm.hero.highlights[index] = value;
  }

  protected addHighlight(): void {
    this.appearanceForm.hero.highlights = [
      ...this.appearanceForm.hero.highlights,
      ''
    ];
  }

  protected removeHighlight(index: number): void {
    this.appearanceForm.hero.highlights = this.appearanceForm.hero.highlights.filter(
      (_, itemIndex) => itemIndex !== index
    );
  }

  protected saveAppearance(): void {
    if (this.isSavingSiteSettings) {
      return;
    }

    this.isSavingSiteSettings = true;
    this.settingsState = 'idle';
    this.settingsMessage = '';

    const payload: SiteSettings = {
      header: { ...this.appearanceForm.header },
      footer: {
        ...this.appearanceForm.footer,
        branchAddresses: this.appearanceForm.footer.branchAddresses
          .map((item) => item.trim())
          .filter(Boolean)
      },
      hero: {
        ...this.appearanceForm.hero,
        highlights: this.appearanceForm.hero.highlights
          .map((item) => item.trim())
          .filter(Boolean)
      }
    };

    this.adminApiService.saveSiteSettings(payload).subscribe({
      next: (response) => {
        this.isSavingSiteSettings = false;
        this.settingsState = 'success';
        this.settingsMessage = response.message;
        this.appearanceForm = {
          header: { ...response.data.header },
          footer: {
            ...response.data.footer,
            branchAddresses: [...response.data.footer.branchAddresses]
          },
          hero: {
            ...response.data.hero,
            highlights: [...response.data.hero.highlights]
          }
        };
        this.changeDetectorRef.detectChanges();
      },
      error: (error: HttpErrorResponse) => {
        this.isSavingSiteSettings = false;
        this.settingsState = 'error';
        this.settingsMessage =
          error.error?.message || 'Chưa lưu được cấu hình giao diện website.';
        this.handleUnauthorizedError(error);
        this.changeDetectorRef.detectChanges();
      }
    });
  }

  protected chooseImageFile(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.selectedImageFile = target.files?.[0] || null;
    this.selectedImageFileName = this.selectedImageFile?.name || '';
  }

  protected chooseVideoFile(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.selectedVideoFile = target.files?.[0] || null;
    this.selectedVideoFileName = this.selectedVideoFile?.name || '';
  }

  protected startCreatePost(): void {
    this.editingPostId = null;
    this.postForm = {
      title: '',
      excerpt: '',
      content: '',
      seoTitle: '',
      seoDescription: '',
      isPublished: true,
      isFeatured: false
    };
    this.selectedImageFile = null;
    this.selectedVideoFile = null;
    this.selectedImageFileName = '';
    this.selectedVideoFileName = '';
    this.postsMessage = '';
    this.postsState = 'idle';
    this.uploadProgress = 0;
  }

  protected startEditPost(post: AdminPost): void {
    this.activeView = 'posts';
    this.editingPostId = post.id;
    this.postForm = {
      title: post.title,
      excerpt: post.excerpt,
      content: post.content,
      seoTitle: post.seoTitle || '',
      seoDescription: post.seoDescription || '',
      isPublished: post.isPublished,
      isFeatured: post.isFeatured
    };
    this.selectedImageFile = null;
    this.selectedVideoFile = null;
    this.selectedImageFileName = '';
    this.selectedVideoFileName = '';
    this.postsMessage = `Đang sửa bài: ${post.title}`;
    this.postsState = 'idle';
    this.uploadProgress = 0;
  }

  protected savePost(): void {
    if (this.isSavingPost) {
      return;
    }

    if (!this.postForm.title.trim() || !this.postForm.content.trim()) {
      this.postsState = 'error';
      this.postsMessage = 'Vui lòng nhập đầy đủ tiêu đề và nội dung bài viết.';
      return;
    }

    const formData = new FormData();
    formData.append('title', this.postForm.title.trim());
    formData.append('excerpt', this.postForm.excerpt.trim());
    formData.append('content', this.postForm.content.trim());
    formData.append('seoTitle', this.postForm.seoTitle.trim());
    formData.append('seoDescription', this.postForm.seoDescription.trim());
    formData.append('isPublished', String(this.postForm.isPublished));
    formData.append('isFeatured', String(this.postForm.isFeatured));

    if (this.selectedImageFile) {
      formData.append('image', this.selectedImageFile);
    }

    if (this.selectedVideoFile) {
      formData.append('video', this.selectedVideoFile);
    }

    this.isSavingPost = true;
    this.postsState = 'idle';
    this.postsMessage = 'Đang xử lý bài viết...';
    this.uploadProgress = 0;

    const request = this.editingPostId
      ? this.adminApiService.updatePost(this.editingPostId, formData)
      : this.adminApiService.createPost(formData);

    request.subscribe({
      next: (event) => {
        if (event.type === HttpEventType.UploadProgress) {
          this.uploadProgress = event.total
            ? Math.round((event.loaded / event.total) * 100)
            : 0;
          this.postsMessage = `Đang tải file lên... ${this.uploadProgress}%`;
          return;
        }

        if (event.type === HttpEventType.Response) {
          this.isSavingPost = false;
          this.postsState = 'success';
          this.uploadProgress = 100;
          this.postsMessage = event.body?.message || 'Đã lưu bài viết.';
          this.startCreatePost();
          this.postsState = 'success';
          this.postsMessage = event.body?.message || 'Đã lưu bài viết.';
          this.loadPosts();
          this.changeDetectorRef.detectChanges();
        }
      },
      error: (error: HttpErrorResponse) => {
        this.isSavingPost = false;
        this.uploadProgress = 0;
        this.postsState = 'error';
        this.postsMessage =
          error.error?.message || 'Chưa lưu được bài viết.';
        this.handleUnauthorizedError(error);
        this.changeDetectorRef.detectChanges();
      }
    });
  }

  protected deletePost(post: AdminPost): void {
    if (!confirm(`Bạn có chắc muốn xóa bài "${post.title}" không?`)) {
      return;
    }

    this.adminApiService.deletePost(post.id).subscribe({
      next: (response) => {
        this.postsState = 'success';
        this.postsMessage = response.message;
        this.loadPosts();
        this.changeDetectorRef.detectChanges();
      },
      error: (error: HttpErrorResponse) => {
        this.postsState = 'error';
        this.postsMessage =
          error.error?.message || 'Chưa xóa được bài viết.';
        this.handleUnauthorizedError(error);
        this.changeDetectorRef.detectChanges();
      }
    });
  }

  protected saveCredentials(): void {
    if (this.isSavingCredentials) {
      return;
    }

    if (
      !this.credentialsForm.currentUsername.trim() ||
      !this.credentialsForm.currentPassword.trim() ||
      !this.credentialsForm.newUsername.trim() ||
      !this.credentialsForm.newPassword.trim()
    ) {
      this.credentialsState = 'error';
      this.credentialsMessage = 'Vui lòng nhập đầy đủ thông tin tài khoản quản trị.';
      return;
    }

    this.isSavingCredentials = true;
    this.credentialsState = 'idle';
    this.credentialsMessage = '';

    this.adminApiService.changeCredentials({
      currentUsername: this.credentialsForm.currentUsername.trim(),
      currentPassword: this.credentialsForm.currentPassword.trim(),
      newUsername: this.credentialsForm.newUsername.trim(),
      newPassword: this.credentialsForm.newPassword.trim()
    }).subscribe({
      next: (response) => {
        this.isSavingCredentials = false;
        this.credentialsState = 'success';
        this.credentialsMessage = response.message;
        this.adminSession.saveSession(response.data.token, response.data.user);
        this.currentUser = response.data.user;
        this.credentialsForm = {
          currentUsername: response.data.user.username,
          currentPassword: '',
          newUsername: '',
          newPassword: ''
        };
        this.changeDetectorRef.detectChanges();
      },
      error: (error: HttpErrorResponse) => {
        this.isSavingCredentials = false;
        this.credentialsState = 'error';
        this.credentialsMessage =
          error.error?.message || 'Chưa đổi được tài khoản quản trị.';
        this.handleUnauthorizedError(error);
        this.changeDetectorRef.detectChanges();
      }
    });
  }

  protected logout(): void {
    this.adminSession.clearSession();
    this.router.navigateByUrl('/admin/login');
  }

  private handleUnauthorizedError(error: HttpErrorResponse): void {
    if (error.status === 401) {
      this.handleExpiredSession();
    }
  }

  private handleExpiredSession(): void {
    this.adminSession.clearSession();
    this.router.navigateByUrl('/admin/login');
  }

  private finishBootstrapIfReady(): void {
    if (!this.isLoadingPosts && !this.isLoadingSiteSettings) {
      this.isBootstrapping = false;
    }
  }
}
