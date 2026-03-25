import { Component } from '@angular/core';
import { PracticeComponent } from './components/practice/practice.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [PracticeComponent],
  template: '<app-practice></app-practice>',
})
export class AppComponent {}
