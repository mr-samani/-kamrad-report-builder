import { Component, signal, NgZone, inject, computed } from '@angular/core';
import { HighchartsChartComponent } from 'highcharts-angular';
import { ChartService } from './chart.service';

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
  updateChart = computed(() => this.chartService.initializeChart());

  constructor(public chartService: ChartService) {}

  ngOnInit() {
    this.updateChart();
  }
  onLoad(ev: Highcharts.Chart) {
    this.chartService.chart = ev;
  }

  updateData() {
    this.chartService.data.update((prev) => [...prev, Math.random() * 100]);
    this.updateChart();
  }
}
