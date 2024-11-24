import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RaidCardComponent } from './raid-card.component';

describe('RaidCardComponent', () => {
  let component: RaidCardComponent;
  let fixture: ComponentFixture<RaidCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RaidCardComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RaidCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
