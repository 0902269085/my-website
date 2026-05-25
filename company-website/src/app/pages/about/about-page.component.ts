import { Component } from '@angular/core';
import { companyData } from '../../core/data/company.data';

@Component({
  selector: 'app-about-page',
  templateUrl: './about-page.component.html',
  styleUrl: './about-page.component.scss'
})
export class AboutPageComponent {
  protected readonly company = companyData;
}
