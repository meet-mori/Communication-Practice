import { Component } from '@angular/core';
import { PracticeComponent } from './components/practice/practice.component';
import { ToastComponent } from './components/toast/toast.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [PracticeComponent, ToastComponent],
  template: `
    <app-toast></app-toast>
    <app-practice></app-practice>
  `,
})
export class AppComponent {}
