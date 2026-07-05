import { Injectable, inject } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, Router, UrlTree } from '@angular/router';
import { AuthStateService } from '../store/auth-state.service';

@Injectable({
  providedIn: 'root'
})
export class RoleGuard implements CanActivate {
  private readonly authStateService = inject(AuthStateService);
  private readonly router = inject(Router);

  canActivate(route: ActivatedRouteSnapshot): boolean | UrlTree {
    const expectedRole = route.data['expectedRole'];
    const currentRole = this.authStateService.userRole();

    if (currentRole === expectedRole || currentRole === 'owner') {
      return true;
    }
    return this.router.parseUrl('/dashboard');
  }
}
