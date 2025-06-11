import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CommonModule } from '@angular/common';
import { Chart, BarController, BarElement, CategoryScale, LinearScale, Tooltip, Legend, PieController, ArcElement } from 'chart.js';
Chart.register(BarController, BarElement, CategoryScale, LinearScale, Tooltip, Legend, PieController, ArcElement);

// Use a more specific type for the dialog data
interface UserActivityDialogData {
  assignee?: { login?: string };
  user_id?: string;
  last_activity_at?: string;
  last_activity_editor?: string;
  team?: string;
  activity_date?: { date: string }[];
  activityChartData?: { labels: string[]; data: number[] };
}

@Component({
  selector: 'app-user-activity-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatTooltipModule],
  template: `
    <h2 mat-dialog-title>User Activity</h2>
    <mat-dialog-content>
      <div *ngIf="userName"><strong>User:</strong> {{ userName }}</div>
      <div *ngIf="lastActivityDate"><strong>Last Activity Date:</strong> {{ lastActivityDate }}</div>
      <div *ngIf="lastActivityEditor"><strong>Last Activity Editor:</strong> {{ lastActivityEditor }}</div>
      <div class="heatmap-container">
        <div class="heatmap-x-axis">
          <span *ngFor="let weekStart of weekStartDates; let i = index">
            {{
              (i === 0 || getMonthLabelForWeek(weekStart) !== getMonthLabelForWeek(weekStartDates[i - 1]))
                ? getMonthLabelForWeek(weekStart)
                : ''
            }}
          </span>
        </div>
        <div *ngFor="let dayIdx of daysOfWeek; let rowIdx = index" class="heatmap-row">
          <span class="heatmap-y-axis">{{ dayIdx }}</span>
          <div
            class="heatmap-cell"
            *ngFor="let week of heatmapData; let colIdx = index"
            [style.backgroundColor]="getHeatmapColor(week[rowIdx])"
            [matTooltip]="week[rowIdx].date + ': ' + week[rowIdx].activity + ' activities'"
          ></div>
        </div>
      </div>
      <div *ngIf="!heatmapData || heatmapData.length === 0">
        <img src="assets/img/no-data-chart.png" alt="No Data Available" style="width:100%;max-width:76px;margin:0 auto;margin-top: 54px !important;display:block;" />
        <p style="text-align:center;color:#2B3A44;font-weight:bold;">No activity data available for this user.</p>
      </div>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close class="close-btn">Close</button>
    </mat-dialog-actions>
  `,
  styles: [`
    h2 { color: #2B3A44; font-weight: 600; }
    mat-dialog-content div { margin-bottom: 4px; }
    mat-dialog-actions { margin-top: 16px; }
    .close-btn {
      background: #009681;
      color: #fff;
      border: none;
      border-radius: 6px;
      padding: 6px 22px;
      font-weight: 400;
      font-size: 14px;
      box-shadow: 0 2px 8px rgba(0,150,129,0.10);
      transition: background 0.2s;
      cursor: pointer;
    }
    .close-btn:hover, .close-btn:focus {
      background: #007a63;
    }
    .heatmap-container {
      display: flex;
      flex-direction: column;
      gap: 4px;
      margin-top: 15px;
    }
    .heatmap-x-axis {
      display: flex;
      gap: 4px;
      margin-bottom: 4px;
      margin-left: 37px;
      // justify-content: center;
    }
    .heatmap-x-axis span {
      font-weight: bold;
      color: #2B3A44;
    }
    .heatmap-row {
      display: flex;
      align-items: center;
      gap: 4px;
      min-height: 20px; /* Ensure consistent height for all rows */
    }
    .heatmap-y-axis {
      margin-right: 8px;
      color: #2B3A44;
      font-weight: bold;
      min-width: 30px; /* Ensure consistent width for y-axis labels */
      display: flex;
      align-items: center;
      justify-content: flex-end;
    }
    .heatmap-cell {
      width: 20px;
      height: 20px;
      border-radius: 4px;
    }
  `]
})
export class UserActivityDialogComponent implements OnInit {
  activityChartData: { labels: string[], data: number[] } | null = null;
  heatmapData: { date: string; activity: number }[][] = [];
  userName = '';
  lastActivityDate = '';
  lastActivityEditor = '';

  // Add months and daysOfWeek properties
  months: string[] = [];
  weekStartDates: string[] = [];
  daysOfWeek: string[] = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  constructor(@Inject(MAT_DIALOG_DATA) public data: UserActivityDialogData) {}

  ngOnInit() {
    console.log('Dialog data received:', this.data); // Debugging log
    if (this.data) {
        this.userName = this.data.assignee?.login || this.data.user_id || '__';
        if (this.data.last_activity_at) {
            this.lastActivityDate = new Date(this.data.last_activity_at).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
        }
        this.lastActivityEditor = this.data.last_activity_editor || this.data.team || '';

        if (this.data.activityChartData && this.data.activityChartData.labels && this.data.activityChartData.data) {
            const labels = this.data.activityChartData.labels;
            const data = this.data.activityChartData.data;

            // Map label->activity for quick lookup
            const activityMap: Record<string, number> = {};
            labels.forEach((label, idx) => {
              activityMap[label] = data[idx];
            });

            // Guard: If no labels, do not proceed
            if (labels.length === 0) {
              this.heatmapData = [];
              this.months = [];
              this.weekStartDates = [];
              return;
            }

            // Find min and max date (only valid dates)
            const dateObjs = labels
              .map(l => new Date(l))
              .filter(d => !isNaN(d.getTime()));
            if (dateObjs.length === 0) {
              this.heatmapData = [];
              this.months = [];
              this.weekStartDates = [];
              return;
            }
            const minDate = new Date(Math.min(...dateObjs.map(d => d.getTime())));
            const maxDate = new Date(Math.max(...dateObjs.map(d => d.getTime())));

            // Start from the Sunday before minDate
            const startDate = new Date(minDate);
            startDate.setHours(0,0,0,0);
            startDate.setDate(startDate.getDate() - startDate.getDay());
            // End at the Saturday after maxDate
            const endDate = new Date(maxDate);
            endDate.setHours(0,0,0,0);
            endDate.setDate(endDate.getDate() + (6 - endDate.getDay()));

            // Build weeks
            const heatmapData: { date: string; activity: number }[][] = [];
            let currentWeek: { date: string; activity: number }[] = [];
            let iterDate = new Date(startDate.getTime()); // Ensure a new instance
            while (iterDate <= endDate) {
              const dateStr = iterDate.toISOString().slice(0, 10);
              currentWeek.push({
                date: dateStr,
                activity: activityMap[dateStr] !== undefined ? activityMap[dateStr] : 0
              });
              if (currentWeek.length === 7) {
                heatmapData.push(currentWeek);
                currentWeek = [];
              }
              iterDate.setDate(iterDate.getDate() + 1);
            }
            if (currentWeek.length > 0) {
              while (currentWeek.length < 7) {
                currentWeek.push({ date: '', activity: 0 });
              }
              heatmapData.push(currentWeek);
            }
            this.heatmapData = heatmapData;
console.log(heatmapData)
            // Generate weekStartDates for x-axis labels (always use the first day of each week)
            this.weekStartDates = heatmapData.map(week => week[0]?.date || '');
            // Filter out invalid/empty weekStartDates
            this.weekStartDates = this.weekStartDates.filter(dateStr =>
              !!dateStr && /^\d{4}-\d{2}-\d{2}$/.test(dateStr)
            );
console.log(this.weekStartDates)
            // Remove invalid/empty weekStartDates
            // this.weekStartDates = this.weekStartDates.map(dateStr =>
            //   (dateStr && !isNaN(new Date(dateStr).getTime())) ? dateStr : ''
            // );
        }
    }
  }

  getHeatmapColor(day: { activity: number }): string {
    return day.activity > 0 ? '#00EEAE' : '#EBEDF5';
  }

  // Cache for month labels to avoid repetition
  private monthLabelsCache: string[] = [];

  // Add this method to support template calls
  getMonthLabelForWeek(dateString: string): string {
    if (!dateString || typeof dateString !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(dateString)) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime()) || dateString === '0000-00-00') return '';
    const month = date.toLocaleString('en-US', { month: 'short' });
    const year = date.getFullYear();
    return `${month} ${year}`;
  }
}
