import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NgxPageBuilder } from './page-builder';

describe('PageBuilder', () => {
  let component: NgxPageBuilder;
  let fixture: ComponentFixture<NgxPageBuilder>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NgxPageBuilder],
    }).compileComponents();

    fixture = TestBed.createComponent(NgxPageBuilder);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
