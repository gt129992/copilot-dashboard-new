import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class CopilotMetricsService {
  private readonly selectedDateRangeSubject = new BehaviorSubject<{ start: Date, end: Date } | undefined>(undefined);
  readonly selectedDateRange$: Observable<{ start: Date, end: Date } | undefined> = this.selectedDateRangeSubject.asObservable();

  constructor(private http: HttpClient) {}

  /**
   * Fetches Copilot metrics data from a specific JSON file in assets.
   * @param filename The JSON filename to load (e.g., 'mes-copilot-users-02-May-2025.json')
   */
  getCopilotMetricsDataByFile(filename: string): Observable<unknown> {
    const filePath = `assets/${filename}`;
    return this.http.get<unknown>(filePath);
  }

  /**
   * Legacy method: fetches the default Copilot metrics data file (auto-detected).
   * For compatibility, now calls getCopilotMetricsDataByFile with detected filename.
   */
  getCopilotMetricsData(): Observable<unknown> {
    return this.findMetricsFile().pipe(
      switchMap((filename: string) => {
        const filePath = `assets/${filename}`;
        return this.http.get<unknown>(filePath);
      })
    );
  }

  findMetricsFile(): Observable<string> {
    return this.http.get('assets/data.txt', { responseType: 'text' }).pipe(
      map((data: string) => {
        const lines = data.split('\n');
        const found = lines.find(line => line.startsWith('copilot_metrics') && line.endsWith('.json'));
        return found || '';
      })
    );
  }

  extractOrgName(): Observable<string> {
    return this.http.get('assets/data.txt', { responseType: 'text' }).pipe(
      map((data: string) => {
        const firstLine = data.split('\n')[0];
        if (firstLine.startsWith('copilot_metrics') && firstLine.endsWith('.json')) {
          return firstLine.replace('copilot_metrics_', '').replace('.json', '');
        }
        return '';
      })
    );
  }

  setSelectedDateRange(range: { start: Date, end: Date }): void {
    this.selectedDateRangeSubject.next(range);
  }

  getSelectedDateRange(): { start: Date, end: Date } | undefined {
    return this.selectedDateRangeSubject.value;
  }
}
