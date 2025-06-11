import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OrgCard } from './org-card.interface';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-organization-cards',
  templateUrl: './organization-cards.component.html',
  styleUrls: ['./organization-cards.component.scss'],
  standalone: true,
  imports: [CommonModule, MatIconModule, MatTooltipModule]
})
export class OrganizationCardsComponent {
  @Input()
    orgCards!: OrgCard[];
  @Input() organizationName = 'mygainwell';
  @Input() selectedDateRange?: { start: Date, end: Date };
}
