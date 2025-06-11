import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Seat } from './seat.interface';

@Component({
  selector: 'app-user-activity-dialog',
  templateUrl: './user-activity-dialog.component.html',
  styleUrls: ['./user-activity-dialog.component.scss']
})
export class UserActivityDialogComponent implements OnInit {
  constructor(@Inject(MAT_DIALOG_DATA) public data: Seat) {}

  ngOnInit(): void {
    // Initialization logic if needed
  }

  getMonthLabelForWeek(dateString: string): string {
    // Expects dateString in 'YYYY-MM-DD' format
    const date = new Date(dateString);
    const month = date.toLocaleString('default', { month: 'short' });
    const year = date.getFullYear();
    return `${month} ${year}`;
  }
}