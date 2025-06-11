import { Component, OnInit, ViewChild, ElementRef, AfterViewInit, OnDestroy } from '@angular/core';
import { OrganizationCardsComponent } from "../../organization-cards/organization-cards.component";
import { OrgCard } from '../../organization-cards/org-card.interface';
import { CopilotMetricsService } from '../../services/copilot-metrics.service';
import { CopilotSeatsService } from '../../services/copilot-seats.service';
import { Chart, BarController, BarElement, LineController, LineElement, PointElement, CategoryScale, LinearScale, Legend, Tooltip, Filler } from 'chart.js';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import annotationPlugin from 'chartjs-plugin-annotation';
import { MaterialModule } from '../../material.module';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import {
  CopilotMetrics
} from './copilot-metrics.interfaces';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';

// Register Chart.js components
Chart.register(BarController, BarElement, LineController, LineElement, PointElement, CategoryScale, LinearScale, Legend, Tooltip, annotationPlugin, Filler);

@Component({
  selector: 'app-copilot-metrics',
  providers: [CopilotSeatsService],
  templateUrl: './copilot-metrics.component.html',
  styleUrl: './copilot-metrics.component.scss',
  standalone: true,
  imports: [
    CommonModule,
    MaterialModule,
    MatCheckboxModule,
    FormsModule,
    OrganizationCardsComponent,
    MatSlideToggleModule
  ]
})
export class CopilotMetricsComponent implements OnInit, AfterViewInit, OnDestroy {
  data: CopilotMetrics[] = [];
  orgCardsData: OrgCard[] = [];
  orgName!: string;
  xlabel: string[] = [];
  total_lines_suggested: number[] = [];
  total_lines_accepted: number[] = [];
  total_active_users: number[] = [];
  chart: Chart | undefined;
  userChart: Chart | undefined;
  languageCharts: Chart[] = [];
  showChatCardsText = false; // Ensure toggle is off by default
  selectedDateRange?: { start: Date, end: Date };
  allLanguages: string[] = [];
  selectedLanguages: string[] = [];
  showAcceptances = true;
  showSuggestions = false;
  allMetricsData: CopilotMetrics[] = [];
  totalSuggestions = 0;
  totalAccepted = 0;
  private dateRangeSub!: Subscription;
  showChartMetricsToggle = false; // Add this line
  chatLabels: string[] = [];
  totalChats: number[] = [];
  totalChatCopyEvents: number[] = [];
  totalChatInsertionEvents: number[] = [];
  chatChart: Chart | undefined;
  chatEngagedUsersLabels: string[] = [];
  chatEngagedUsersData: number[] = [];
  chatEngagedUsersChart: Chart | undefined;

  @ViewChild('barChart', { static: false }) barChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('lineChart', { static: false }) lineChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('chatChart', { static: false }) chatChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('chatEngagedUsersChart', { static: false }) chatChartEngagedUsersRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('barLangChartContainer', { static: false }) barLangChartContainerRef!: ElementRef<HTMLDivElement>;
  @ViewChild('lineLangChartContainer', { static: false }) lineLangChartContainerRef!: ElementRef<HTMLDivElement>;

  constructor(
    private copilotMetricsService: CopilotMetricsService,
    private router: Router
  ) {
    this.orgCardsData = this.getDefaultOrgCardsData();
  }

  ngOnInit(): void {
    this.showChatCardsText = false; // Explicitly set toggle off on init
    this.dateRangeSub = this.copilotMetricsService.selectedDateRange$.subscribe(range => {
      this.selectedDateRange = range;
      this.getData();
    });
  }

  ngOnDestroy(): void {
    this.dateRangeSub?.unsubscribe();
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.getData();
      // Only load chat charts if toggle is on
      if (this.showChatCardsText) {
        this.createChatChart();
        this.createChatEngagedUsersChart();
      }
    }, 0);
  }

  getData() {
    this.copilotMetricsService.extractOrgName().subscribe((data: string) => {
      this.orgName = data;
    });

    const dataFile = this.getDataFileByRoute();
    this.copilotMetricsService.getCopilotMetricsDataByFile(dataFile).subscribe((data: unknown) => {
      this.allMetricsData = data as CopilotMetrics[];
      const filteredData = this.filterDataByDateRange(this.allMetricsData, this.selectedDateRange);
      this.data = filteredData;

      if (typeof window !== 'undefined' && window.sessionStorage) {
        sessionStorage.setItem('orgData', JSON.stringify(data));
      }

      // this.showChatCardsText = this.isMesOrPharmacy;
      // Show chart metrics toggle label if MES/Pharmacy
      if (this.isMesOrPharmacy) {
        // You can bind this property in your template to show the toggle and label
        this.showChartMetricsToggle = true;
        console.log(this.showChatCardsText)
      } else {
        this.showChartMetricsToggle = false;
      }
      if (filteredData.length > 0) {
        this.setOrgCardsData(filteredData[0]);
      }
      this.chartDataInitialization();
      this.selectedDateRange = this.copilotMetricsService.getSelectedDateRange();
      if (this.selectedDateRange) {
        this.chartDataInitialization();
        setTimeout(() => {
          this.createChart();
          this.createLanguageComparisonCharts();
          if (this.showChatCardsText) {
            this.createChatChart();
            this.createChatEngagedUsersChart();
          }
        }, 0);
      }
    });
  }

  private getDataFileByRoute(): string {
    if (this.router.url.endsWith('/copilot-metrics/mes')) {
      return 'mes-copilot-users-02-May-2025.json';
    } else if (this.router.url.endsWith('/copilot-metrics/pharmacy')) {
      return 'pharmacy-copilot-users-02-May-2025.json';
    }
    return 'copilot_metrics_mygainwell.json';
  }

  private filterDataByDateRange(data: CopilotMetrics[], range?: { start: Date, end: Date }): CopilotMetrics[] {
    if (!range?.start || !range?.end) return data;
    let [start, end] = [new Date(range.start), new Date(range.end)];
    if (start > end) [start, end] = [end, start];
    return data.filter(element => {
      const dateObj = new Date(element.date);
      return dateObj >= start && dateObj <= end;
    });
  }

  private getDefaultOrgCardsData(): OrgCard[] {
    if (typeof window !== 'undefined' && (window.location.pathname.includes('/mes') || window.location.pathname.includes('/pharmacy'))) {
      return [
        { title: 'Total Chat', value: 492, desc: 'Total number of Chat Users' },
        { title: 'Total Engaged Users', value: 360, desc: 'The total number of Engaged chat users' },
        { title: 'Total Lines of code Suggested', value: 132, desc: 'The total number of suggestions accepted by users' },
        { title: 'Total Lines of code Accepted rate', value: 360, desc: 'Percentage of suggestions that were accepted by users' }
      ];
    }
    return [
      { title: 'Average Engaged Users', value: 492, desc: 'Average number of Active Users' },
      { title: 'Total Suggestions', value: 360, desc: 'The total number of suggestions offered by Copilot for all developers' },
      { title: 'Total Acceptance', value: 132, desc: 'The total number of suggestions accepted by users' },
      { title: 'Acceptance Rate', value: 360, desc: 'Percentage of suggestions that were accepted by users' }
    ];
  }

  private setOrgCardsData(metrics: CopilotMetrics) {
    // Calculate totals
    let totalLinesSuggested = 0, totalLinesAccepted = 0;
    metrics.copilot_ide_code_completions?.editors?.forEach(editor => {
      editor.models?.forEach(model => {
        model.languages?.forEach(language => {
          totalLinesSuggested += language.total_code_lines_suggested || 0;
          totalLinesAccepted += language.total_code_lines_accepted || 0;
        });
      });
    });
    this.totalSuggestions = totalLinesSuggested;
    this.totalAccepted = totalLinesAccepted;
    const acceptanceRate = this.totalSuggestions > 0 ? Math.round((this.totalAccepted / this.totalSuggestions) * 100) : 0;

    if (this.isMesOrPharmacy) {
      this.orgCardsData = [
        { title: 'Total Active Users', value: metrics?.total_active_users ?? 0, desc: 'Total number of Chat Users' },
        { title: 'Total Engaged Users', value: metrics?.total_engaged_users ?? 0, desc: 'The total number of Engaged chat users' },
        { title: 'Total Lines of code Suggested', value: this.totalSuggestions, desc: 'The total number of Line  of Code suggested' },
        { title: 'Total Lines of code Accepted', value: this.totalAccepted, desc: 'The total number code suggestions that were accepted by users' }
      ];
    } else {
      this.orgCardsData = [
        { title: 'Average Engaged Users', value: metrics.copilot_ide_chat?.editors?.[0]?.total_engaged_users ?? 0, desc: 'Average number of Active Users' },
        { title: 'Total Suggestions', value: this.totalSuggestions, desc: 'The total number of suggestions offered by Copilot for all developers' },
        { title: 'Total Acceptance', value: this.totalAccepted, desc: 'The total number of suggestions accepted by users' },
        { 
          title: 'Acceptance Rate', 
          value: acceptanceRate + '%', // keep as number for OrgCard interface
          desc: `Percentage of suggestions that were accepted by users (${acceptanceRate}%)`
        }
      ];
    }
  }

  chartDataInitialization() {
    this.xlabel = [];
    this.total_lines_suggested = [];
    this.total_lines_accepted = [];
    this.total_active_users = [];
    this.chatLabels = [];
    this.totalChats = [];
    this.totalChatCopyEvents = [];
    this.totalChatInsertionEvents = [];
    this.chatEngagedUsersLabels = [];
    this.chatEngagedUsersData = [];
    // Sort data by date ascending before processing
    const filteredData = [...this.filterDataByDateRange(this.data, this.selectedDateRange)].sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      return dateA.getTime() - dateB.getTime();
    });
    filteredData.forEach((element: CopilotMetrics) => {
      const dateObj = new Date(element.date);
      const formattedDate = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      this.xlabel.push(formattedDate);

      let totalLinesSuggested = 0, totalLinesAccepted = 0;
      element.copilot_ide_code_completions?.editors?.forEach(editor => {
        editor.models?.forEach(model => {
          model.languages?.forEach(language => {
            totalLinesSuggested += language.total_code_lines_suggested || 0;
            totalLinesAccepted += language.total_code_lines_accepted || 0;
          });
        });
      });
      this.total_lines_suggested.push(totalLinesSuggested);
      this.total_lines_accepted.push(totalLinesAccepted);
      this.total_active_users.push(element.total_engaged_users ?? 0);

      // Chat metrics aggregation (fix: sum from models, not editor)
      let chatTotal = 0, chatCopy = 0, chatInsert = 0;
      if (element.copilot_ide_chat?.editors) {
        element.copilot_ide_chat.editors.forEach(editor => {
          if (editor.models && Array.isArray(editor.models)) {
            editor.models.forEach((model: any) => {
              chatTotal += model.total_chats || 0;
              chatCopy += model.total_chat_copy_events || 0;
              chatInsert += model.total_chat_insertion_events || 0;
            });
          }
        });
      }
      this.chatLabels.push(formattedDate);
      this.totalChats.push(chatTotal);
      this.totalChatCopyEvents.push(chatCopy);
      this.totalChatInsertionEvents.push(chatInsert);

      // Copilot Chat Engaged Users (from copilot_ide_chat.total_engaged_users)
      let chatEngagedUsers = 0;
      if (element.copilot_ide_chat && typeof (element.copilot_ide_chat as any).total_engaged_users === 'number') {
        chatEngagedUsers = (element.copilot_ide_chat as any).total_engaged_users;
      }
      this.chatEngagedUsersLabels.push(formattedDate);
      this.chatEngagedUsersData.push(chatEngagedUsers);
    });
  }

  createChart() {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      // Avoid running chart code on the server
      return;
    }
    setTimeout(() => {
      const barCanvas = this.barChartRef?.nativeElement;
      const lineCanvas = this.lineChartRef?.nativeElement;
      if (this.chart) {
        this.chart.destroy();
      }
      if (barCanvas) {
        this.chart = new Chart(barCanvas.getContext('2d')!, {
          type: 'bar',
          data: {
            labels: this.xlabel,
            datasets: [
              {
                label: 'Lines Suggested',
                data: this.total_lines_suggested,
                backgroundColor: 'rgba(54, 162, 235, 0.5)',
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 1
              },
              {
                label: 'Lines Accepted',
                data: this.total_lines_accepted,
                backgroundColor: 'rgba(255, 99, 132, 0.5)',
                borderColor: 'rgba(255, 99, 132, 1)',
                borderWidth: 1
              }
            ]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              x: {
                grid: {
                  display: true,
                  color: 'rgba(0, 0, 0, 0.1)'
                },
                ticks: {
                  maxRotation: 45,
                  minRotation: 45
                }
              },
              y: {
                grid: {
                  display: true,
                  color: 'rgba(0, 0, 0, 0.1)'
                },
                beginAtZero: true
              }
            },
            plugins: {
              legend: {
                position: 'top',
                align: 'center'
              }
            }
          }
        });
      }
      if (this.userChart) {
        this.userChart.destroy();
      }
      if (lineCanvas) {
        this.userChart = new Chart(lineCanvas.getContext('2d')!, {
          type: 'line',
          data: {
            labels: this.xlabel,
            datasets: [
              {
                label:  'Engaged Users',
                data: this.total_active_users,
                backgroundColor:'rgba(75, 192, 192, 0.5)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 2,
                fill: true,
                tension: 0.4,
                pointRadius: 6, // Increased for better hit area
                pointHoverRadius: 9 // Increased for easier hover
              }
            ]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: { mode: 'nearest', intersect: false }, // Improve tooltip reliability
            hover: { mode: 'nearest', intersect: false },
            scales: {
              x: {
                grid: {
                  display: true,
                  color: 'rgba(0, 0, 0, 0.1)'
                },
                ticks: {
                  maxRotation: 45,
                  minRotation: 45
                }
              },
              y: {
                grid: {
                  display: true,
                  color: 'rgba(0, 0, 0, 0.1)'
                },
                beginAtZero: true
              }
            },
            plugins: {
              legend: {
                position: 'top',
                align: 'center'
              }
            }
          }
        });
      }
    }, 0);
  }

  createChatChart() {
    const barPalette = [
      'rgba(75, 192, 192, 0.6)', // Teal
      'rgba(153, 102, 255, 0.6)', // Purple
      '#FFE082', // Light Yellow
      '#FFCCBC', // Light Peach
      '#B3B3FF', // Light Lavender
      '#B2EBF2', // Light Cyan
      '#F8BBD0', // Light Pink
      '#FFF9C4', // Light Cream
      '#FFD180', // Light Orange
      '#C5E1A5'  // Light Green
    ];
    const barBorderPalette = [
      'rgba(75, 192, 192, 1)',
      'rgba(153, 102, 255, 1)',
      '#FFD54F',
      '#FFAB91',
      '#9575CD',
      '#4DD0E1',
      '#F06292',
      '#FFF176',
      '#FFB74D',
      '#81C784'
    ];
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return;
    }
    setTimeout(() => {
      const chatCanvas = this.chatChartRef?.nativeElement;
      if (this.chatChart) {
        this.chatChart.destroy();
      }
      if (chatCanvas) {
        this.chatChart = new Chart(chatCanvas.getContext('2d')!, {
          type: 'bar',
          data: {
            labels: this.chatLabels,
            datasets: [
              {
                label: 'Total Chats',
                data: this.totalChats,
                backgroundColor: barPalette[0],
                borderColor: barBorderPalette[0],
                borderWidth: 1
              },
              {
                label: 'Chat Copy Events',
                data: this.totalChatCopyEvents,
                backgroundColor: barPalette[1],
                borderColor: barBorderPalette[1],
                borderWidth: 1
              },
              {
                label: 'Chat Insertion Events',
                data: this.totalChatInsertionEvents,
                backgroundColor: barPalette[2],
                borderColor: barBorderPalette[2],
                borderWidth: 1
              }
            ]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { position: 'top' },
              title: { display: true, text: 'Copilot Chat Metrics' }
            },
            scales: {
              x: { grid: { display: false } },
              y: { beginAtZero: true }
            }
          }
        });
      }
    }, 0);
  }

  createChatEngagedUsersChart() {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return;
    }
    setTimeout(() => {
      const chatEngagedUsersCanvas = this.chatChartEngagedUsersRef?.nativeElement;
      if (this.chatEngagedUsersChart) {
        this.chatEngagedUsersChart.destroy();
      }
      if (chatEngagedUsersCanvas) {
        const ctx = chatEngagedUsersCanvas.getContext('2d');
        this.chatEngagedUsersChart = new Chart(ctx!, {
          type: 'line',
          data: {
            labels: this.chatEngagedUsersLabels,
            datasets: [
              {
                label: 'Total Engaged Users (Chat)',
                data: this.chatEngagedUsersData,
                backgroundColor: 'rgba(54, 162, 235, 0.2)',
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 2,
                pointBackgroundColor: 'rgba(54, 162, 235, 0.2)',
                pointBorderColor:  'rgba(54, 162, 235, 1)',
                fill: true,
                tension: 0.4,
                pointRadius: 6, // Increased for better tooltip hit area
                pointHoverRadius: 9 // Increased for better tooltip hit area
              }
            ]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { position: 'top' },
              title: { display: true, text: 'Copilot Chat Engaged Users' },
              tooltip: {
                enabled: true,
                mode: 'nearest',
                intersect: false
              }
            },
            elements: {
              line: { fill: true },
              point: { radius: 6, hoverRadius: 9 }
            },
            interaction: {
              mode: 'nearest',
              intersect: false
            },
            hover: {
              mode: 'nearest',
              intersect: false
            },
            scales: {
              x: { grid: { display: false } },
              y: { beginAtZero: true }
            }
          }
        });
      }
    }, 0);
  }

  createLanguageComparisonCharts() {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return;
    }
    // Aggregate data by language and date
    const languageStats: Record<string, Record<string, { total_code_acceptances: number, total_code_suggestions: number, total_engaged_users: number }>> = {};
    let filteredData = this.data;
    if (this.selectedDateRange) {
      const start = new Date(this.selectedDateRange.start);
      const end = new Date(this.selectedDateRange.end);
      filteredData = this.data.filter((element: CopilotMetrics) => {
        const dateObj = new Date(element.date);
        return dateObj >= start && dateObj <= end;
      });
    }
    filteredData.forEach((element: CopilotMetrics) => {
      const date = element.date;
      if (element.copilot_ide_code_completions && element.copilot_ide_code_completions.editors) {
        element.copilot_ide_code_completions.editors.forEach((editor) => {
          if (editor.models) {
            editor.models.forEach((model) => {
              if (model.languages) {
                model.languages.forEach((language) => {
                  const lang = language.name;
                  if (!languageStats[lang]) {
                    languageStats[lang] = {};
                  }
                  if (!languageStats[lang][date]) {
                    languageStats[lang][date] = {
                      total_code_acceptances: 0,
                      total_code_suggestions: 0,
                      total_engaged_users: 0
                    };
                  }
                  languageStats[lang][date].total_code_acceptances += Number(language.total_code_acceptances) || 0;
                  languageStats[lang][date].total_code_suggestions += Number(language.total_code_suggestions) || 0;
                  languageStats[lang][date].total_engaged_users += Number(language.total_engaged_users) || 0;
                });
              }
            });
          }
        });
      }
    });
    // Prepare chart data: group by language, show each date as a group
    const languages = Object.keys(languageStats);
    this.allLanguages = languages;
    // Select first four languages as default if none selected
    if (this.selectedLanguages.length === 0) {
      this.selectedLanguages = languages.slice(0, 4);
    }
    // Ensure selectedLanguages are valid (remove any that are not in allLanguages)
    this.selectedLanguages = this.selectedLanguages.filter(lang => languages.includes(lang));
    // If after filtering, selectedLanguages is empty but languages exist, select the first four
    if (this.selectedLanguages.length === 0 && languages.length > 0) {
      this.selectedLanguages = languages.slice(0, 4);
    }
    const filteredLanguages = this.selectedLanguages.length > 0 ? this.selectedLanguages : languages;
    const allDatesSet = new Set<string>();
    filteredLanguages.forEach(lang => {
      if (languageStats[lang]) {
        Object.keys(languageStats[lang]).forEach(date => allDatesSet.add(date));
      }
    });
    const allDates = Array.from(allDatesSet).sort();
    // Format allDates to 'Mon DD' (e.g., May 24)
    const formattedDates = allDates.map(dateStr => {
      const dateObj = new Date(dateStr);
      return dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    });
    // Chart metric keys and titles
    // Use only light, non-grey colors for all datasets
    const lightPalette = [
      '#B3E5FC', // Light Blue
      '#B2DFDB', // Light Teal
      '#FFE082', // Light Yellow
      '#FFCCBC', // Light Peach
      '#B3B3FF', // Light Lavender
      '#B2EBF2', // Light Cyan
      '#F8BBD0', // Light Pink
      '#FFF9C4', // Light Cream
      '#FFD180', // Light Orange
      '#C5E1A5'  // Light Green
    ];
    const barPalette = [
      'rgba(75, 192, 192, 0.6)', // Teal
      'rgba(153, 102, 255, 0.6)', // Purple
      '#FFE082', // Light Yellow
      '#FFCCBC', // Light Peach
      '#B3B3FF', // Light Lavender
      '#B2EBF2', // Light Cyan
      '#F8BBD0', // Light Pink
      '#FFF9C4', // Light Cream
      '#FFD180', // Light Orange
      '#C5E1A5'  // Light Green
    ];
    const barBorderPalette = [
      'rgba(75, 192, 192, 1)',
      'rgba(153, 102, 255, 1)',
      '#FFD54F',
      '#FFAB91',
      '#9575CD',
      '#4DD0E1',
      '#F06292',
      '#FFF176',
      '#FFB74D',
      '#81C784'
    ];
    // Find the correct containers for MES/Pharmacy layout
    const isMesOrPharmacy = this.isMesOrPharmacy;
    let barContainer: HTMLElement | null = null;
    let lineContainer: HTMLElement | null = null;
    if (isMesOrPharmacy) {
      barContainer = this.barLangChartContainerRef?.nativeElement || null;
      lineContainer = this.lineLangChartContainerRef?.nativeElement || null;
    } else {
      const container = document.getElementById('language-comparison-container');
      barContainer = container;
      lineContainer = container;
    }
    // Remove old charts if they exist
    if (this.languageCharts && Array.isArray(this.languageCharts)) {
      this.languageCharts.forEach(chart => chart?.destroy());
    }
    this.languageCharts = [];
    // Remove old canvases if present
    if (isMesOrPharmacy) {
      if (barContainer) barContainer.innerHTML = '';
      if (lineContainer) lineContainer.innerHTML = '';
    } else {
      if (barContainer) barContainer.innerHTML = '';
    }
    // Show date range and language dropdown above the charts if available
    if (barContainer) {
      const controlsDiv = document.createElement('div');
      controlsDiv.style.display = 'flex';
      controlsDiv.style.alignItems = 'center';
      controlsDiv.style.gap = '24px';
      controlsDiv.style.marginBottom = '8px';
      controlsDiv.style.maxWidth = '100%';
     
      // Language dropdown placeholder (actual dropdown in template)
      const langDropPlaceholder = document.createElement('div');
      langDropPlaceholder.id = 'language-multiselect-placeholder';
      controlsDiv.appendChild(langDropPlaceholder);
      barContainer.appendChild(controlsDiv);
    }

    // Define the metrics to chart
    const metricKeys = [
      { key: 'accept_suggest', title: 'Code Acceptances vs Suggestions' },
      { key: 'total_engaged_users', title: 'Engaged Users by Language' }
    ];

    // For each metric, create a chart
    metricKeys.forEach((metric) => {
      let datasets: any[] = [];
      // Check if there is any data for this metric
      let hasData = false;
      if (metric.key === 'accept_suggest') {
        datasets = filteredLanguages.flatMap((lang, langIdx) => {
          const arr = [];
          const acceptances = allDates.map(date => (languageStats[lang] && languageStats[lang][date] ? languageStats[lang][date]['total_code_acceptances'] : 0));
          const suggestions = allDates.map(date => (languageStats[lang] && languageStats[lang][date] ? languageStats[lang][date]['total_code_suggestions'] : 0));
          if (this.showAcceptances && acceptances.some(v => v > 0)) hasData = true;
          if (this.showSuggestions && suggestions.some(v => v > 0)) hasData = true;
          if (this.showAcceptances) {
            arr.push({
              label: lang + ' Acceptances',
              data: acceptances,
              backgroundColor: barPalette[(langIdx * 2) % barPalette.length],
              borderColor: barBorderPalette[(langIdx * 2) % barBorderPalette.length],
              borderWidth: 1,
              stack: lang
            });
          }
          if (this.showSuggestions) {
            arr.push({
              label: lang + ' Suggestions',
              data: suggestions,
              backgroundColor: barPalette[(langIdx * 2 + 1) % barPalette.length],
              borderColor: barBorderPalette[(langIdx * 2 + 1) % barBorderPalette.length],
              borderWidth: 1,
              stack: lang
            });
          }
          return arr;
        });
      } else if (metric.key === 'total_engaged_users') {
        datasets = filteredLanguages.map((lang, langIdx) => {
          const engaged = allDates.map(date => (languageStats[lang] && languageStats[lang][date] ? languageStats[lang][date]['total_engaged_users'] : 0));
          if (engaged.some(v => v > 0)) hasData = true;
          return {
            label: lang + ' Engaged User',
            data: engaged,
            backgroundColor: lightPalette[langIdx % lightPalette.length],
            borderColor: lightPalette[langIdx % lightPalette.length],
            borderWidth: 2,
            fill: false,
            tension: 0.4,
            pointBackgroundColor: lightPalette[langIdx % lightPalette.length],
            pointBorderColor: lightPalette[langIdx % lightPalette.length],
          };
        });
      } else {
        datasets = [];
      }
      // Create a container for each chart
      let targetContainer = barContainer;
      if (isMesOrPharmacy) {
        targetContainer = metric.key === 'total_engaged_users' ? lineContainer : barContainer;
      }
      if (targetContainer) {
        const chartTitle = document.createElement('div');
        chartTitle.textContent = metric.title;
chartTitle.style.fontSize = '16px';
chartTitle.style.fontWeight = 'bold';
chartTitle.style.color = '#333';
chartTitle.style.textAlign = 'left';
chartTitle.style.marginBottom = '8px';
        targetContainer.appendChild(chartTitle);
        if (hasData) {
          const chartCanvas = document.createElement('canvas');
          chartCanvas.id = `languageComparisonChart_${metric.key}`;
          chartCanvas.style.maxHeight = '320px';
          targetContainer.appendChild(chartCanvas);
          const chartType = metric.key === 'total_engaged_users' ? 'line' : 'bar';
          const chartInstance = new Chart(chartCanvas.getContext('2d')!, {
            type: chartType,
            data: {
              labels: formattedDates,
              datasets: datasets
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              scales: {
                x: {
                  stacked: false,
                  title: { display: true, text: 'Date' }
                },
                y: {
                  beginAtZero: true,
                  stacked: false
                }
              },
              plugins: {
                legend: {
                  position: 'top',
                  align: 'center'
                }
              }
            }});
          this.languageCharts.push(chartInstance);
        } else {
          const noDataDiv = document.createElement('div');
          noDataDiv.className = 'no-data-message';
          noDataDiv.style.textAlign = 'center';
          noDataDiv.style.padding = '32px 0';
          noDataDiv.style.color = '#222';
          noDataDiv.style.fontSize = '1.1rem';
          // Add image above the message
          const noDataImg = document.createElement('img');
          noDataImg.src = 'assets/img/no-data-chart.png';
          noDataImg.alt = 'No Data';
          noDataImg.style.display = 'block';
          noDataImg.style.margin = '0 auto 16px auto';
          noDataImg.style.maxWidth = '65px';
          noDataDiv.appendChild(noDataImg);
          // Add message below the image
          const noDataMsg = document.createElement('div');
          noDataMsg.textContent =  'No data found for the selected range.';
          noDataDiv.appendChild(noDataMsg);
          targetContainer.appendChild(noDataDiv);
        }
      }
    });
  }

  refreshCharts() {
    console.log('Refreshing charts...');
    this.chart?.destroy();
    this.userChart?.destroy();
    this.createChart();
  }

  public get isMesOrPharmacy(): boolean {
    return this.router.url.endsWith('/copilot-metrics/mes') || this.router.url.endsWith('/copilot-metrics/pharmacy');
  }

  // Add this method to handle toggle changes
  onShowChatCardsTextChange() {
    if (this.showChatCardsText) {
      setTimeout(() => {
        this.createChatChart();
        this.createChatEngagedUsersChart();
      }, 0);
    } else {
      // Optionally destroy charts when toggled off
      if (this.chatChart) {
        this.chatChart.destroy();
        this.chatChart = undefined;
      }
      if (this.chatEngagedUsersChart) {
        this.chatEngagedUsersChart.destroy();
        this.chatEngagedUsersChart = undefined;
      }
    }
  }

  // Utility method for template to check if any value in array is > 0
  hasAnyValue(arr: number[] | undefined): boolean {
    if (!arr || arr.length === 0) return false;
    return arr.some(v => v > 0);
  }
}
