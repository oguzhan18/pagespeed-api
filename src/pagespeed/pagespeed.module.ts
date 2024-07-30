import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { PageSpeedService } from './pagespeed.service';
import { PageSpeedController } from "./pagespeed.controller";

@Module({
  imports: [ScheduleModule.forRoot()],
  providers: [PageSpeedService],
  controllers: [PageSpeedController],
})
export class PageSpeedModule {}
