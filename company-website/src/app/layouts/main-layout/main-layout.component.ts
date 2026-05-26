import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { companyData } from '../../core/data/company.data';
import {
  FooterSettings,
  HeaderSettings,
  SiteSettingsService
} from '../../core/services/site-settings.service';

@Component({
  selector: 'app-main-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './main-layout.component.html',
  styleUrl: './main-layout.component.scss'
})
export class MainLayoutComponent implements OnInit {
  private readonly siteSettingsService = inject(SiteSettingsService);
  private readonly changeDetectorRef = inject(ChangeDetectorRef);

  protected readonly company = companyData;
  protected branchAddresses = companyData.branchAddresses;
  protected headerSettings: HeaderSettings = {
    logoText: 'TS',
    brandName: companyData.name,
    tagline: companyData.slogan
  };
  protected footerSettings: FooterSettings = {
    title: 'Thông tin liên hệ',
    description: companyData.slogan,
    phone: companyData.phone,
    email: companyData.email,
    branchAddresses: companyData.branchAddresses
  };

  ngOnInit(): void {
    this.siteSettingsService.getSiteSettings().subscribe({
      next: (response) => {
        this.headerSettings = response.data.header;
        this.footerSettings = response.data.footer;
        this.branchAddresses = response.data.footer.branchAddresses;
        this.changeDetectorRef.detectChanges();
      },
      error: () => {
        this.branchAddresses = companyData.branchAddresses;
        this.changeDetectorRef.detectChanges();
      }
    });
  }
}
