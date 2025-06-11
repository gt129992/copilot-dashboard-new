import { Component, EventEmitter, Output, Input, OnInit, ViewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { RouterModule } from '@angular/router';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDateRangePicker } from '@angular/material/datepicker';
import { MatDialog } from '@angular/material/dialog';
import { CopilotMetricsService } from '../services/copilot-metrics.service';
import { SettingsDialogComponent } from './settings-dialog.component';

@Component({
  selector: 'app-top-nav',
  standalone: true,
  imports: [
    MatButtonModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    RouterModule,
    MatNativeDateModule,
    FormsModule
  ],
  templateUrl: './top-nav.component.html',
  styleUrls: ['./top-nav.component.scss']
})
export class TopNavComponent implements OnInit {
  @Output() menuToggle = new EventEmitter<void>();
  @Input() collapsed = false;
  @ViewChild('picker')
  picker!: MatDateRangePicker<Date>;
  startDate: Date;
  endDate: Date;
  maxDate: Date = new Date();
  minDate: Date;

  constructor(
    private dialog: MatDialog,
    private copilotMetricsService: CopilotMetricsService
  ) {
    // Set default date range to previous week (Monday to Sunday)
    const today = new Date();
    const dayOfWeek = today.getDay();
    // Calculate days since last Monday (previous week)
    const daysSinceMonday = ((dayOfWeek + 6) % 7) + 7;
    const lastMonday = new Date(today);
    lastMonday.setDate(today.getDate() - daysSinceMonday);
    // Last Sunday is 6 days after last Monday
    const lastSunday = new Date(lastMonday);
    lastSunday.setDate(lastMonday.getDate() + 6);
    this.startDate = lastMonday;
    this.endDate = lastSunday;

    // Set minDate to 6 months before today
    this.minDate = new Date(this.maxDate);
    this.minDate.setMonth(this.maxDate.getMonth() - 6);
  }

  ngOnInit(): void {
    this.copilotMetricsService.setSelectedDateRange({ start: this.startDate, end: this.endDate });
  }

  openDateRangePicker() {
    if (this.picker) {
      this.picker.open();
    };
  }

  // Add a method to validate the selected range
  validateDateRange() {
    if (this.startDate && this.endDate) {
      const diff = (this.endDate.getTime() - this.startDate.getTime()) / (1000 * 60 * 60 * 24);
      if (diff > 13) { // 14 days = 13 difference
        this.endDate = new Date(this.startDate);
        this.endDate.setDate(this.startDate.getDate() + 13);
      }
      this.onDateRangeChange(); // Emit after validation
    }
  }

  onDateRangeChange() {
    if (this.startDate && this.endDate) {
      this.copilotMetricsService.setSelectedDateRange({ start: this.startDate, end: this.endDate });
    }
  }

  openSettingsDialog() {
    this.dialog.open(SettingsDialogComponent, {
      width: '500px', // semi-medium size
      panelClass: 'settings-dialog-panel'
    });
  }

  toggleMenu() {
    this.menuToggle.emit();
  }
}
