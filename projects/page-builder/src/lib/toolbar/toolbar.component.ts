import { CommonModule } from '@angular/common';
import { Component, Injector, OnInit } from '@angular/core';
import { PageBuilderBaseComponent } from '../page-builder-base-component';
import { sanitizeForStorage } from '../../utiles/sanitizeForStorage';

@Component({
  selector: 'toolbar',
  templateUrl: './toolbar.component.html',
  styleUrls: ['./toolbar.component.scss'],
  standalone: true,
  imports: [CommonModule],
})
export class ToolbarComponent extends PageBuilderBaseComponent implements OnInit {
  constructor(injector: Injector) {
    super(injector);
  }

  ngOnInit() {}

  onSave() {
    this.pageBuilderService.items.forEach((item) => {
      //cleanup
      let html = item.el.outerHTML;
      html = html.replace(/\s*data-id="[^"]*"/g, '');
      html = html.replace(/\s*contenteditable="[^"]*"/g, '');
      html = html.replace(/<div[^>]*class="[^"]*ngx-corner-resize[^"]*"[^>]*>[\s\S]*?<\/div>/g, '');

      item.html = encodeURIComponent(html);
    });
    const sanitized = sanitizeForStorage(this.pageBuilderService.items);
    localStorage.setItem('report', JSON.stringify(sanitized));
  }

  toggleOutlines() {
    this.pageBuilderService.showOutlines = !this.pageBuilderService.showOutlines;
  }
  deSelectBlock() {
    this.pageBuilderService.activeEl.set(undefined);
  }

  print() {
    if (this.pageBuilderService.page()) {
      this.printService.print({
        html: this.pageBuilderService.page()?.nativeElement,
        size: 'A4',
        orientation: 'portrait',
      });
    }
  }
}
