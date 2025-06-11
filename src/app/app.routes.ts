import { Routes } from '@angular/router';
import { CopilotMetricsComponent } from './copilot-usage/copilot-metrics/copilot-metrics.component';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/copilot-metrics/org',
    pathMatch: 'full',
  },
  {
    path: 'copilot-usage',
    children: [
      {
        path: 'seat-usage',
        loadComponent: () => import('./copilot-usage/seat-usage/seat-usage.component').then(m => m.SeatUsageComponent),
      },
      {
        path: 'copilot-metrics',
        children: [
          {
            path: 'org',
            component: CopilotMetricsComponent,
          },
          {
            path: 'mes',
            component: CopilotMetricsComponent,
          },
          {
            path: 'pharmacy',
            component: CopilotMetricsComponent,
          },
          {
            path: '',
            redirectTo: 'org',
            pathMatch: 'full',
          }
        ]
      },
      {
        path: '',
        redirectTo: 'seat-usage',
        pathMatch: 'full',
      }
    ]
  },
  {
    path: 'copilot-metrics',
    children: [
      { path: 'org', component: CopilotMetricsComponent },
      { path: 'mes', component: CopilotMetricsComponent },
      { path: 'pharmacy', component: CopilotMetricsComponent },
      { path: '', redirectTo: 'org', pathMatch: 'full' }
    ]
  }
];
