import { Component, OnInit, ViewChild, AfterViewInit, OnDestroy } from '@angular/core';
import { OrganizationCardsComponent } from "../../organization-cards/organization-cards.component";
import { OrgCard } from '../../organization-cards/org-card.interface';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatInputModule } from '@angular/material/input';
import { HttpClientModule, HttpClient } from '@angular/common/http';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { CopilotSeatsService } from '../../services/copilot-seats.service';
import { CopilotMetricsService } from '../../services/copilot-metrics.service';
import { Subscription } from 'rxjs';
import { Seat } from './seat.interface';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { MatDialogModule } from '@angular/material/dialog';
import { UserActivityDialogComponent } from './user-activity-dialog.component';

@Component({
  selector: 'app-seat-usage',
  standalone: true,
  imports: [
    CommonModule,
    HttpClientModule,
    OrganizationCardsComponent,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatInputModule,
    MatIconModule,
    MatDialogModule
  ],
  providers: [CopilotSeatsService],
  templateUrl: './seat-usage.component.html',
  styleUrl: './seat-usage.component.scss'
})
export class SeatUsageComponent implements OnInit, AfterViewInit, OnDestroy {
  orgName = '';
  orgCardsData: OrgCard[] = [];
  seatInformation: Seat[] = [];
  displayedColumns: string[] = ['user', 'created_at', 'updated_at', 'last_activity_at', 'last_activity_editor', 'pending_cancellation_date'];
  dataSource!: MatTableDataSource<Seat>;
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  selectedDateRange: { start: Date; end: Date } | undefined = undefined;
  private dateRangeSub!: Subscription;
  private allSeatData: Seat[] = [];
  emptyData = new MatTableDataSource([{ empty: "row" }]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  userActivityData: any[] = [];

  constructor(
    private copilotSeatsService: CopilotSeatsService,
    private copilotMetricsService: CopilotMetricsService,
    private dialog: MatDialog,
    private http: HttpClient
  ) {
    console.log('SeatUsageComponent constructed');
  }

  ngOnInit() {
    this.dateRangeSub = this.copilotMetricsService.selectedDateRange$.subscribe(range => {
      this.selectedDateRange = range;
      this.updateFilteredData();
    });
       // get orgname
    this.copilotMetricsService.extractOrgName().subscribe((data: string) => {
      this.orgName = data;
    });
    this.copilotSeatsService.getCopilotSeatsData().subscribe((data: unknown) => {
      this.allSeatData = data as Seat[];
      this.updateFilteredData();
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.http.get<any>('assets/user_activity_mygainwell.json').subscribe(res => {
      this.userActivityData = res.user_activity || [];
    });
  }

  ngOnDestroy() {
    if (this.dateRangeSub) {
      this.dateRangeSub.unsubscribe();
    }
  }

  updateFilteredData() {
    let filteredData = this.allSeatData;
    if (this.selectedDateRange && this.selectedDateRange.start && this.selectedDateRange.end) {
      let start = new Date(this.selectedDateRange.start);
      let end = new Date(this.selectedDateRange.end);
      if (start > end) {
        [start, end] = [end, start];
      }
      filteredData = this.allSeatData.filter((seat: Seat) => {
        const createdAt = seat.created_at ? new Date(seat.created_at) : null;
        const lastActivityAt = seat.last_activity_at ? new Date(seat.last_activity_at) : null;
        const inCreatedRange = createdAt && createdAt >= start && createdAt <= end;
        const inLastActivityRange = lastActivityAt && lastActivityAt >= start && lastActivityAt <= end;
        return inCreatedRange || inLastActivityRange;
      });
    }
    const users = [0, 0];
    this.seatInformation = filteredData;
    for (const seat of this.seatInformation) {
      const isActive = seat.last_activity_at && typeof seat.last_activity_at === 'string' && seat.last_activity_at.trim() !== '';
      users[isActive ? 1 : 0]++;
    }
    this.orgCardsData = [
      {
        title: 'Total Seat',
        value: this.allSeatData.length,
        desc: 'Total number of seats purchased'
      },
      {
        title: 'Active Users',
        value: users[1],
        desc: 'Total number of active users'
      },
      {
        title: 'Inactive Users',
        value: users[0],
        desc: 'Total number of inactive users'
      }
    ];
    this.dataSource = new MatTableDataSource(this.seatInformation);
    if (this.paginator && this.sort) {
      this.dataSource.paginator = this.paginator;
      this.dataSource.sort = this.sort;
    }
    this.dataSource.filterPredicate = (data: Seat, filter: string) => {
      const search = filter.trim().toLowerCase();
      return (
        (!!data.assignee?.login && data.assignee.login.toLowerCase().includes(search)) ||
        (!!data.created_at && new Date(data.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).toLowerCase().includes(search)) ||
        (!!data.updated_at && new Date(data.updated_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).toLowerCase().includes(search)) ||
        (!!data.last_activity_at && new Date(data.last_activity_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).toLowerCase().includes(search)) ||
        (!!data.last_activity_editor && data.last_activity_editor.toLowerCase().includes(search)) ||
        (!!data.pending_cancellation_date && new Date(data.pending_cancellation_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).toLowerCase().includes(search))
      );
    };
  }

  ngAfterViewInit() {
    // Assign paginator and sort after view is initialized
    if (this.dataSource) {
      this.dataSource.paginator = this.paginator;
      this.dataSource.sort = this.sort;
    }
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  openUserActivity(seat: Seat) {
    // Find user activity for this seat
    const userActivity = this.userActivityData.find(u => u.user_id === seat.assignee?.login);
    let activityChartData = null;
    if (userActivity && userActivity.user_id === seat.assignee?.login && userActivity.activity_date) {
      const dateCounts: Record<string, number> = {};
      userActivity.activity_date.forEach((entry: { date: string }) => {
        if (entry.date) {
          dateCounts[entry.date] = (dateCounts[entry.date] || 0) + 1;
        }
      });
      activityChartData = {
        labels: Object.keys(dateCounts),
        data: Object.values(dateCounts)
      };
    }
    this.dialog.open(UserActivityDialogComponent, {
      data: { ...seat, activityChartData },
      width: '800px',
      panelClass: 'user-activity-dialog',
    });
  }
}
