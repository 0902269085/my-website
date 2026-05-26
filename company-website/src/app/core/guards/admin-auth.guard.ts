import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AdminSessionService } from '../services/admin-session.service';

export const adminAuthGuard = () => {
  const adminSession = inject(AdminSessionService);
  const router = inject(Router);

  if (adminSession.isLoggedIn()) {
    return true;
  }

  return router.createUrlTree(['/admin/login']);
};
