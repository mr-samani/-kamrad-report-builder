import { Injectable, signal } from '@angular/core';
import * as Highcharts from 'highcharts';

@Injectable()
export class ChartService {
  chart?: Highcharts.Chart;

  data = signal<number[]>([3, 1, 2, 3, 4]);

  chartTitle = 'my custom chart';
  highcharts: typeof Highcharts = Highcharts;
  chartOptions!: Highcharts.Options;
  initializeChart() {
    this.chartOptions = {
      chart: {
        animation: false,
      },
      credits: {
        enabled: false,
      },
      series: [
        {
          type: 'line',
          data: this.data(),
        },
      ],
      plotOptions: {
        line: {
          animation: false,
        },
      },
      title: {
        text: this.chartTitle,
      },
    };
    if (this.chart) {
      this.chart.update(this.chartOptions);
      this.chart.reflow();
    }
  }
}
