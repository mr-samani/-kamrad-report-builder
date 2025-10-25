/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { SpacingControlComponent } from './spacing-control.component';

describe('SpacingControlComponent', () => {
  let component: SpacingControlComponent;
  let fixture: ComponentFixture<SpacingControlComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SpacingControlComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SpacingControlComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
