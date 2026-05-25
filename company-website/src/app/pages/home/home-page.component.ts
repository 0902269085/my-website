import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { companyData } from '../../core/data/company.data';

@Component({
  selector: 'app-home-page',
  imports: [RouterLink],
  templateUrl: './home-page.component.html',
  styleUrl: './home-page.component.scss'
})
export class HomePageComponent {
  protected readonly company = companyData;
}
