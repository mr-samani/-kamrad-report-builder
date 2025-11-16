import { Component, signal, NgZone, inject, computed } from '@angular/core';
import * as Highcharts from 'highcharts';
import { HighchartsChartComponent } from 'highcharts-angular';

@Component({
  selector: 'signal-highcart',
  templateUrl: './chart.component.html',
  standalone: true,
  imports: [HighchartsChartComponent],
  providers: [],
  styles: `
    :host {
      display: block;
    }
  `,
})
export class SignalHighcartComponent {
  ngZone = inject(NgZone);
  //A token that represents a dependency that should be injected
  data = signal<number[]>([3, 1, 2, 3, 4]);
  //Create a Signal that can be set or updated directly.
  highcharts: typeof Highcharts = Highcharts;
  chartOptions!: Highcharts.Options;
  //definite assignment assertion operator (!) to tell the compiler that it will not be undefined for null when we run the code:
  updateChart = computed(() => this.initializeChart());
  //Create a computed Signal which derives a reactive value from an expression.
  chart?: Highcharts.Chart;

  constructor() {}

  ngOnInit() {
    this.updateChart();
  }
  onLoad(ev: Highcharts.Chart) {
    this.chart = ev;
  }
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
    };
    this.chart?.update(this.chartOptions);
    this.chart?.reflow();
  }
  UpdateChart() {
    //#runOutsideAngular allows you to escape Angular's zone and do work that doesn't trigger Angular change-detection
    //this.ngZone.runOutsideAngular(() => {
    this.data.update((prev) => [...prev, prev.push(Math.random() * 100)]);
    //Update the value of the signal based on its current value, and notify any dependents.
    this.updateChart();
    // initializeChart() will be called it , because (data) signal has been updated on every event  and computed will excecute it dependent on (data) signal
    //});
  }
}
