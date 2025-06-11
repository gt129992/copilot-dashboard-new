import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CopilotMetricsComponent } from './copilot-metrics.component';

describe('CopilotMetricsComponent', () => {
  let component: CopilotMetricsComponent;
  let fixture: ComponentFixture<CopilotMetricsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CopilotMetricsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CopilotMetricsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
