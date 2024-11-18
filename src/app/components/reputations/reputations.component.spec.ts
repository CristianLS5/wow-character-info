import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReputationsComponent } from './reputations.component';

describe('ReputationsComponent', () => {
  let component: ReputationsComponent;
  let fixture: ComponentFixture<ReputationsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReputationsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReputationsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
