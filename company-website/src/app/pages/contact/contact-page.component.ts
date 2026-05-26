import { Component, inject } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { companyData } from '../../core/data/company.data';
import { ContactApiService } from '../../core/services/contact-api.service';

@Component({
  selector: 'app-contact-page',
  imports: [FormsModule],
  templateUrl: './contact-page.component.html',
  styleUrl: './contact-page.component.scss'
})
export class ContactPageComponent {
  private readonly contactApiService = inject(ContactApiService);

  protected readonly company = companyData;
  protected branchAddresses = companyData.branchAddresses;
  protected isSubmitting = false;
  protected submitState: 'idle' | 'success' | 'error' = 'idle';
  protected submitMessage = '';
  protected formData = {
    fullName: '',
    email: '',
    phone: '',
    message: ''
  };

  private getMissingFields(): string[] {
    const missingFields: string[] = [];

    if (!this.formData.fullName.trim()) {
      missingFields.push('Họ tên');
    }

    if (!this.formData.email.trim()) {
      missingFields.push('Email');
    }

    if (!this.formData.phone.trim()) {
      missingFields.push('Số điện thoại');
    }

    if (!this.formData.message.trim()) {
      missingFields.push('Nội dung liên hệ');
    }

    return missingFields;
  }

  protected submitContactForm(contactForm: NgForm): void {
    if (this.isSubmitting) {
      return;
    }

    const missingFields = this.getMissingFields();

    if (contactForm.invalid || missingFields.length > 0) {
      this.submitState = 'error';
      this.submitMessage = `Vui lòng nhập đầy đủ thông tin: ${missingFields.join(', ')}.`;
      return;
    }

    this.isSubmitting = true;
    this.submitState = 'idle';
    this.submitMessage = 'Đang gửi thông tin liên hệ...';

    this.contactApiService.submitContactForm(this.formData).subscribe({
      next: (response) => {
        this.isSubmitting = false;
        this.submitState = 'success';
        this.submitMessage = response.message;

        contactForm.resetForm();
        this.formData = {
          fullName: '',
          email: '',
          phone: '',
          message: ''
        };
      },
      error: (error: HttpErrorResponse) => {
        this.isSubmitting = false;
        this.submitState = 'error';
        this.submitMessage =
          error.error?.message ||
          'Hệ thống đang bận hoặc chưa kết nối được. Vui lòng thử lại sau ít phút.';
      }
    });
  }
}
