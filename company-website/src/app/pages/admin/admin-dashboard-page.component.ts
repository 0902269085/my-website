import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { AdminApiService, AdminPost } from '../../core/services/admin-api.service';
import { AdminSessionService } from '../../core/services/admin-session.service';
import { resolveMediaUrl } from '../../core/config/api.config';

@Component({
  selector: 'app-admin-dashboard-page',
  imports: [FormsModule],
  templateUrl: './admin-dashboard-page.component.html',
  styleUrl: './admin-dashboard-page.component.scss'
})
export class AdminDashboardPageComponent implements OnInit {
  private readonly adminApiService = inject(AdminApiService);
  private readonly adminSession = inject(AdminSessionService);
  private readonly router = inject(Router);

  protected readonly resolveMediaUrl = resolveMediaUrl;
  protected posts: AdminPost[] = [];
  protected currentUser = this.adminSession.getUser();
  protected isLoadingPosts = false;
  protected isSavingPost = false;
  protected isSavingCredentials = false;
  protected postsMessage = '';
  protected postsState: 'idle' | 'success' | 'error' = 'idle';
  protected credentialsMessage = '';
  protected credentialsState: 'idle' | 'success' | 'error' = 'idle';
  protected editingPostId: number | null = null;
  protected postForm = {
    title: '',
    content: ''
  };
  protected selectedImageFile: File | null = null;
  protected selectedVideoFile: File | null = null;
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
        this.loadPosts();
      },
      error: () => {
        this.handleExpiredSession();
      }
    });
  }

  protected loadPosts(): void {
    this.isLoadingPosts = true;

    this.adminApiService.getPosts().subscribe({
      next: (response) => {
        this.isLoadingPosts = false;
        this.posts = response.data;
      },
      error: (error: HttpErrorResponse) => {
        this.isLoadingPosts = false;
        this.postsState = 'error';
        this.postsMessage =
          error.error?.message || 'Chưa tải được danh sách bài viết.';
        this.handleUnauthorizedError(error);
      }
    });
  }

  protected chooseImageFile(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.selectedImageFile = target.files?.[0] || null;
  }

  protected chooseVideoFile(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.selectedVideoFile = target.files?.[0] || null;
  }

  protected startCreatePost(): void {
    this.editingPostId = null;
    this.postForm = {
      title: '',
      content: ''
    };
    this.selectedImageFile = null;
    this.selectedVideoFile = null;
    this.postsMessage = '';
    this.postsState = 'idle';
  }

  protected startEditPost(post: AdminPost): void {
    this.editingPostId = post.id;
    this.postForm = {
      title: post.title,
      content: post.content
    };
    this.selectedImageFile = null;
    this.selectedVideoFile = null;
    this.postsMessage = `Đang sửa bài: ${post.title}`;
    this.postsState = 'idle';
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
    formData.append('content', this.postForm.content.trim());

    if (this.selectedImageFile) {
      formData.append('image', this.selectedImageFile);
    }

    if (this.selectedVideoFile) {
      formData.append('video', this.selectedVideoFile);
    }

    this.isSavingPost = true;
    this.postsState = 'idle';
    this.postsMessage = '';

    const request = this.editingPostId
      ? this.adminApiService.updatePost(this.editingPostId, formData)
      : this.adminApiService.createPost(formData);

    request.subscribe({
      next: (response) => {
        this.isSavingPost = false;
        this.postsState = 'success';
        this.postsMessage = response.message;
        this.startCreatePost();
        this.postsState = 'success';
        this.postsMessage = response.message;
        this.loadPosts();
      },
      error: (error: HttpErrorResponse) => {
        this.isSavingPost = false;
        this.postsState = 'error';
        this.postsMessage =
          error.error?.message || 'Chưa lưu được bài viết.';
        this.handleUnauthorizedError(error);
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
      },
      error: (error: HttpErrorResponse) => {
        this.postsState = 'error';
        this.postsMessage =
          error.error?.message || 'Chưa xóa được bài viết.';
        this.handleUnauthorizedError(error);
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
      },
      error: (error: HttpErrorResponse) => {
        this.isSavingCredentials = false;
        this.credentialsState = 'error';
        this.credentialsMessage =
          error.error?.message || 'Chưa đổi được tài khoản quản trị.';
        this.handleUnauthorizedError(error);
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
}
