import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { AdminApiService } from '../../core/services/admin-api.service';
import { AdminSessionService } from '../../core/services/admin-session.service';

@Component({
  selector: 'app-admin-login-page',
  imports: [FormsModule],
  templateUrl: './admin-login-page.component.html',
  styleUrl: './admin-login-page.component.scss'
})
export class AdminLoginPageComponent {
  private readonly adminApiService = inject(AdminApiService);
  private readonly adminSession = inject(AdminSessionService);
  private readonly router = inject(Router);

  protected isSubmitting = false;
  protected submitMessage = '';
  protected submitState: 'idle' | 'error' = 'idle';
  protected loginData = {
    username: '',
    password: ''
  };

  protected submitLogin(): void {
    if (this.isSubmitting) {
      return;
    }

    if (!this.loginData.username.trim() || !this.loginData.password.trim()) {
      this.submitState = 'error';
      this.submitMessage = 'Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu.';
      return;
    }

    this.isSubmitting = true;
    this.submitState = 'idle';
    this.submitMessage = '';

    this.adminApiService.login(
      this.loginData.username.trim(),
      this.loginData.password.trim()
    ).subscribe({
      next: (response) => {
        this.isSubmitting = false;
        this.adminSession.saveSession(response.data.token, response.data.user);
        this.router.navigateByUrl('/admin');
      },
      error: (error: HttpErrorResponse) => {
        this.isSubmitting = false;
        this.submitState = 'error';
        this.submitMessage =
          error.error?.message || 'Chưa đăng nhập được khu vực quản trị.';
      }
    });
  }
}
