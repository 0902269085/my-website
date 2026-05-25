import { Component, OnInit, inject } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { companyData } from '../../core/data/company.data';
import { BranchApiService } from '../../core/services/branch-api.service';
import { ContactApiService } from '../../core/services/contact-api.service';

@Component({
  selector: 'app-contact-page',
  imports: [FormsModule],
  templateUrl: './contact-page.component.html',
  styleUrl: './contact-page.component.scss'
})
export class ContactPageComponent implements OnInit {
  private readonly branchApiService = inject(BranchApiService);
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

  ngOnInit(): void {
    this.branchApiService.getBranches().subscribe({
      next: (response) => {
        this.branchAddresses = response.data.map(
          (branch) => `${branch.name}: ${branch.address}`
        );
      },
      error: () => {
        this.branchAddresses = companyData.branchAddresses;
      }
    });
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
          error.error?.message || 'Gửi thông tin chưa thành công. Vui lòng thử lại.';
      }
    });
  }
}
