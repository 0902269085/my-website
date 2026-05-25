import { Component, OnInit, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { companyData } from '../../core/data/company.data';
import { BranchApiService } from '../../core/services/branch-api.service';

@Component({
  selector: 'app-main-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './main-layout.component.html',
  styleUrl: './main-layout.component.scss'
})
export class MainLayoutComponent implements OnInit {
  private readonly branchApiService = inject(BranchApiService);
  protected readonly company = companyData;
  protected branchAddresses = companyData.branchAddresses;

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
}
