import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import axios from 'axios';
import * as fs from 'fs-extra';
import * as path from 'path';
import * as puppeteer from 'puppeteer';

@Injectable()
export class PageSpeedService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PageSpeedService.name);
  private url: string;
  private interval = 60000;
  private intervalId: NodeJS.Timeout;
  private readonly outputDir = path.join(
    __dirname,
    '..',
    '..',
    'pagespeed_data',
  );

  constructor() {
    this.createOutputDirectory();
  }

  setUrl(url: string) {
    this.url = url;
  }

  setInterval(interval: string) {
    const milliseconds = parseFloat(interval) * 1000;
    this.interval = isNaN(milliseconds) ? 60000 : milliseconds;
    this.clearInterval();
    this.startInterval();
    this.logger.log(`Interval set to ${this.interval} milliseconds`);
  }

  private createOutputDirectory() {
    fs.ensureDirSync(this.outputDir);
  }

  onModuleInit() {
    this.startInterval();
  }

  onModuleDestroy() {
    this.clearInterval();
  }

  private startInterval() {
    this.intervalId = setInterval(() => this.handleCron(), this.interval);
    this.logger.log(
      `Interval started with interval: ${this.interval} milliseconds`,
    );
  }

  private clearInterval() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.logger.log('Interval cleared');
    }
  }

  async handleCron() {
    if (!this.url) {
      this.logger.warn('URL is not set');
      return;
    }

    const apiUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${this.url}`;
    try {
      const response = await axios.get(apiUrl);
      const data = response.data.lighthouseResult;

      const categories = data.categories;
      const audits = data.audits;

      const performance = categories?.performance?.score ?? 0;
      const accessibility = categories?.accessibility?.score ?? 0;
      const bestPractices = categories['best-practices']?.score ?? 0;
      const seo = categories?.seo?.score ?? 0;

      const timestamp = new Date().toISOString();
      const fileName = `pagespeed_data_${timestamp.replace(/[:.]/g, '-')}.pdf`;
      const filePath = path.join(this.outputDir, fileName);

      await this.generatePDF(
        {
          timestamp,
          performance,
          accessibility,
          bestPractices,
          seo,
          audits,
        },
        filePath,
      );

      this.logger.log(`PageSpeed data written to ${filePath}`);
      console.log('PageSpeed data written to', filePath);
    } catch (error) {
      this.logger.error('Failed to fetch PageSpeed data', error.message);
    }
  }

  private async generatePDF(data: any, filePath: string) {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    const content = `
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 0; }
          .container { width: 800px; margin: auto; padding: 20px; }
          .header { text-align: center; padding: 20px 0; }
          .charts { display: flex; flex-wrap: wrap; justify-content: space-around; }
          .chart-container { width: 400px; height: 400px; }
          .audit-section { margin: 20px 0; }
          .audit-title { font-size: 18px; margin: 10px 0; }
          .audit-details { margin-left: 20px; }
          .audit-issues { color: red; }
          .audit-opportunities { color: orange; }
          .audit-passed { color: green; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 8px; }
          th { background-color: #f2f2f2; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>PageSpeed Report</h1>
            <p>Generated on: ${data.timestamp}</p>
          </div>
          <div class="charts">
            <div class="chart-container">
              <canvas id="performanceChart"></canvas>
            </div>
            <div class="chart-container">
              <canvas id="accessibilityChart"></canvas>
            </div>
            <div class="chart-container">
              <canvas id="bestPracticesChart"></canvas>
            </div>
            <div class="chart-container">
              <canvas id="seoChart"></canvas>
            </div>
          </div>
          ${this.generateAuditTable(data.audits)}
        </div>
        <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
        <script>
          const ctx1 = document.getElementById('performanceChart').getContext('2d');
          const performanceChart = new Chart(ctx1, {
            type: 'doughnut',
            data: {
              labels: ['Performance'],
              datasets: [{
                data: [${data.performance * 100}, 100 - ${
      data.performance * 100
    }],
                backgroundColor: ['#FF6384', '#CCCCCC'],
              }],
            },
          });

          const ctx2 = document.getElementById('accessibilityChart').getContext('2d');
          const accessibilityChart = new Chart(ctx2, {
            type: 'doughnut',
            data: {
              labels: ['Accessibility'],
              datasets: [{
                data: [${data.accessibility * 100}, 100 - ${
      data.accessibility * 100
    }],
                backgroundColor: ['#36A2EB', '#CCCCCC'],
              }],
            },
          });

          const ctx3 = document.getElementById('bestPracticesChart').getContext('2d');
          const bestPracticesChart = new Chart(ctx3, {
            type: 'doughnut',
            data: {
              labels: ['Best Practices'],
              datasets: [{
                data: [${data.bestPractices * 100}, 100 - ${
      data.bestPractices * 100
    }],
                backgroundColor: ['#FFCE56', '#CCCCCC'],
              }],
            },
          });

          const ctx4 = document.getElementById('seoChart').getContext('2d');
          const seoChart = new Chart(ctx4, {
            type: 'doughnut',
            data: {
              labels: ['SEO'],
              datasets: [{
                data: [${data.seo * 100}, 100 - ${data.seo * 100}],
                backgroundColor: ['#4CAF50', '#CCCCCC'],
              }],
            },
          });
        </script>
      </body>
      </html>
    `;

    await page.setContent(content);
    await page.pdf({ path: filePath, format: 'A4' });

    await browser.close();
  }

  private generateAuditTable(audits: any): string {
    let auditTable =
      '<table><tr><th>Title</th><th>Description</th><th>Score</th><th>Details</th></tr>';

    Object.keys(audits).forEach((key) => {
      const audit = audits[key];
      const score =
        audit.scoreDisplayMode === 'numeric'
          ? (audit.score * 100).toFixed(2)
          : 'N/A';
      auditTable += `
        <tr>
          <td>${audit.title}</td>
          <td>${audit.description}</td>
          <td>${score}</td>
          <td>${
            audit.details
              ? JSON.stringify(audit.details)
              : 'No details available'
          }</td>
        </tr>
      `;
    });

    auditTable += '</table>';
    return auditTable;
  }
}
