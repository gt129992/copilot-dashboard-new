import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SeatUsageComponent } from './seat-usage.component';

describe('SeatUsageComponent', () => {
  let component: SeatUsageComponent;
  let fixture: ComponentFixture<SeatUsageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SeatUsageComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SeatUsageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
