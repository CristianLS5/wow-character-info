import { TestBed } from '@angular/core/testing';

import { ReputationService } from './reputation.service';

describe('ReputationService', () => {
  let service: ReputationService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ReputationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
