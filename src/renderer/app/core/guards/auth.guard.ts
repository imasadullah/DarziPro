import { Injectable, inject } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';
import { Observable, from, of } from 'rxjs';
import { switchMap, map, catchError } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';
import { AuthStateService } from '../store/auth-state.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  private readonly authService = inject(AuthService);
  private readonly authStateService = inject(AuthStateService);
  private readonly router = inject(Router);

  canActivate(): Observable<boolean | UrlTree> {
    return this.authService.hasUsers().pipe(
      switchMap((res) => {
        if (res.success && res.data === false) {
          return of(this.router.parseUrl('/setup'));
        }
        return from(this.authStateService.initializeSession()).pipe(
          map((isAuthenticated) => {
            if (isAuthenticated) {
              return true;
            }
            return this.router.parseUrl('/login');
          })
        );
      }),
      catchError(() => of(this.router.parseUrl('/login')))
    );
  }
}
