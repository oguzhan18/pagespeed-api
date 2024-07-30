import { Controller, Get, Query } from '@nestjs/common';
import { PageSpeedService } from './pagespeed.service';
import { ApiTags, ApiQuery } from '@nestjs/swagger';

@ApiTags('pagespeed')
@Controller('pagespeed')
export class PageSpeedController {
  constructor(private readonly pageSpeedService: PageSpeedService) {}

  @Get('set-url')
  @ApiQuery({ name: 'url', type: String })
  setUrl(@Query('url') url: string) {
    this.pageSpeedService.setUrl(url);
    return { message: 'URL set for PageSpeed checks' };
  }

  @Get('set-interval')
  @ApiQuery({ name: 'interval', type: String })
  setInterval(@Query('interval') interval: string) {
    this.pageSpeedService.setInterval(interval);
    return { message: `Interval set to ${interval} seconds` };
  }
}
