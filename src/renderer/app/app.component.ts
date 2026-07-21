import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToastContainer } from './shared/components/toast-container/toast-container';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, ToastContainer],
  template: '<router-outlet></router-outlet><app-toast-container/>',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppComponent { }
