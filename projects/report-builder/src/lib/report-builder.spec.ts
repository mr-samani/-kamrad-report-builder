import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NgxReportBuilder } from './report-builder';

describe('ReportBuilder', () => {
  let component: NgxReportBuilder;
  let fixture: ComponentFixture<NgxReportBuilder>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NgxReportBuilder],
    }).compileComponents();

    fixture = TestBed.createComponent(NgxReportBuilder);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
