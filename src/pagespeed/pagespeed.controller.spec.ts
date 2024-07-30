import { Test, TestingModule } from '@nestjs/testing';
import { PagespeedController } from './pagespeed.controller';

describe('PagespeedController', () => {
  let controller: PagespeedController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PagespeedController],
    }).compile();

    controller = module.get<PagespeedController>(PagespeedController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
