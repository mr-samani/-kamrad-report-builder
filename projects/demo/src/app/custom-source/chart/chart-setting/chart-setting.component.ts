import { Component, computed, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ChartService } from '../chart.service';

@Component({
  selector: 'app-chart-setting',
  templateUrl: './chart-setting.component.html',
  styleUrls: ['./chart-setting.component.css'],
  imports: [FormsModule],
})
export class ChartSettingComponent implements OnInit {
  updateChart = computed(() => this.chartService.initializeChart());

  constructor(public chartService: ChartService) {}

  ngOnInit() {}
}
