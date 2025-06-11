import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaterialModule } from '../material.module';
import { FormsModule } from '@angular/forms';
import { CopilotMetricsComponent } from './copilot-metrics/copilot-metrics.component';

@NgModule({
  imports: [
    CommonModule,
    MaterialModule,
    FormsModule,
    CopilotMetricsComponent
  ],
  exports: [CopilotMetricsComponent]
})
export class CopilotMetricsModule {}
