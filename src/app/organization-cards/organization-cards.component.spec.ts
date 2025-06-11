import { ComponentFixture, TestBed } from '@angular/core/testing';
import { OrganizationCardsComponent } from './organization-cards.component';

describe('OrganizationCardsComponent', () => {
  let component: OrganizationCardsComponent;
  let fixture: ComponentFixture<OrganizationCardsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [OrganizationCardsComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(OrganizationCardsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
