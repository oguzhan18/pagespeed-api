import { Test, TestingModule } from '@nestjs/testing';
import { PagespeedService } from './pagespeed.service';

describe('PagespeedService', () => {
  let service: PagespeedService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PagespeedService],
    }).compile();

    service = module.get<PagespeedService>(PagespeedService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
