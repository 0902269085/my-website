import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { companyData } from '../../core/data/company.data';

@Component({
  selector: 'app-services-page',
  imports: [RouterLink],
  templateUrl: './services-page.component.html',
  styleUrl: './services-page.component.scss'
})
export class ServicesPageComponent {
  protected readonly company = companyData;
}
