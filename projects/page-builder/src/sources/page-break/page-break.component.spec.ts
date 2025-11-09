/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { PageBreakComponent } from './page-break.component';

describe('PageBreakComponent', () => {
  let component: PageBreakComponent;
  let fixture: ComponentFixture<PageBreakComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PageBreakComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PageBreakComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
