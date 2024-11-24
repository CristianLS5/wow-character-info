import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DungeonCardComponent } from './dungeon-card.component';

describe('DungeonCardComponent', () => {
  let component: DungeonCardComponent;
  let fixture: ComponentFixture<DungeonCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DungeonCardComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DungeonCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
