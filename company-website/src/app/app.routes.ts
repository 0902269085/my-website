import { Routes } from '@angular/router';
import { adminAuthGuard } from './core/guards/admin-auth.guard';
import { MainLayoutComponent } from './layouts/main-layout/main-layout.component';
import { AdminDashboardPageComponent } from './pages/admin/admin-dashboard-page.component';
import { AdminLoginPageComponent } from './pages/admin/admin-login-page.component';
import { AboutPageComponent } from './pages/about/about-page.component';
import { ContactPageComponent } from './pages/contact/contact-page.component';
import { ServicesPageComponent } from './pages/services/services-page.component';
import { HomePageComponent } from './pages/home/home-page.component';

export const routes: Routes = [
  {
    path: '',
    component: MainLayoutComponent,
    children: [
      {
        path: '',
        component: HomePageComponent
      },
      {
        path: 'gioi-thieu',
        component: AboutPageComponent
      },
      {
        path: 'dich-vu',
        component: ServicesPageComponent
      },
      {
        path: 'lien-he',
        component: ContactPageComponent
      }
    ]
  },
  {
    path: 'admin/login',
    component: AdminLoginPageComponent
  },
  {
    path: 'admin',
    component: AdminDashboardPageComponent,
    canActivate: [adminAuthGuard]
  },
  {
    path: '**',
    redirectTo: ''
  }
];
