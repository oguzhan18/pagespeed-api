import { Module } from '@nestjs/common';
import { PageSpeedModule } from "./pagespeed/pagespeed.module";

@Module({
  imports: [PageSpeedModule]
})
export class AppModule {}
