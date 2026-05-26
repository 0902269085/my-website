import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { companyData } from '../../core/data/company.data';
import { HeroSettings, SiteSettingsService } from '../../core/services/site-settings.service';

@Component({
  selector: 'app-home-page',
  imports: [RouterLink],
  templateUrl: './home-page.component.html',
  styleUrl: './home-page.component.scss'
})
export class HomePageComponent implements OnInit {
  private readonly siteSettingsService = inject(SiteSettingsService);
  private readonly changeDetectorRef = inject(ChangeDetectorRef);

  protected readonly company = companyData;
  protected heroSettings: HeroSettings = {
    eyebrow: 'Thời trang thiết kế nữ',
    title: 'THE SWAN ATELIERE mang đến những thiết kế dành cho nữ trẻ yêu sự thanh lịch và hiện đại',
    description:
      'Hướng đến khách hàng nữ từ 16 đến 30 tuổi, THE SWAN ATELIERE phát triển các thiết kế dễ mặc, dễ phối và đủ tinh tế để đồng hành cùng nhiều khoảnh khắc trong đời sống hằng ngày.',
    primaryButtonLabel: 'Nhận tư vấn ngay',
    primaryButtonRoute: '/lien-he',
    secondaryButtonLabel: 'Xem dịch vụ',
    secondaryButtonRoute: '/dich-vu',
    cardLabel: 'Tổng quan nhanh',
    cardTitle: companyData.name,
    cardDescription: companyData.slogan,
    highlights: companyData.highlights
  };

  ngOnInit(): void {
    this.siteSettingsService.getSiteSettings().subscribe({
      next: (response) => {
        this.heroSettings = response.data.hero;
        this.changeDetectorRef.detectChanges();
      }
    });
  }
}
