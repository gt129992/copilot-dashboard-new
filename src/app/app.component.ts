import { Component } from '@angular/core';
import { RouterOutlet, RouterModule } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { TopNavComponent } from './top-nav/top-nav.component';
import { SideNavComponent } from './side-nav/side-nav.component';
import { BehaviorSubject } from 'rxjs';
import { AsyncPipe, CommonModule } from '@angular/common';
import { startWith } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterModule, MatSidenavModule, MatListModule, MatIconModule, MatToolbarModule, TopNavComponent, SideNavComponent, AsyncPipe, CommonModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'copilot-dashboard';
  private collapsedSubject = new BehaviorSubject<boolean>(true); // Sidebar collapsed by default
  collapsed$ = this.collapsedSubject.asObservable().pipe(startWith(true));

  onMenuToggle() {
    this.collapsedSubject.next(!this.collapsedSubject.value);
  }

  expandSidebar() {
    this.collapsedSubject.next(false);
  }
}
