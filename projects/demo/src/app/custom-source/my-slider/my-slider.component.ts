import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'my-slider',
  standalone: true,
  template: `
    <div class="slider">
      <input type="range" [value]="value" (input)="onInput($event)" />
      <span>range:{{ value }}</span>
    </div>
  `,
})
export class MySliderComponent {
  @Input() value = 50;
  @Output() valueChange = new EventEmitter<number>();

  onInput(event: any) {
    const val = +event.target.value;
    this.value = val;
    this.valueChange.emit(val);
    console.log('slider :', val);
  }
}
