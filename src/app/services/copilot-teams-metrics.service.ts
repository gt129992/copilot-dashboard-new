import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CopilotTeamsMetricsService {

  constructor(private http: HttpClient) { }

  getTeamsMetricsData(): Observable<unknown> {
    const filePath = 'assets/mes-copilot-users-02-May-2025.json';
    return this.http.get(filePath);
  }
}