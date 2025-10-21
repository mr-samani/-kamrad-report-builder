import { CommonModule } from '@angular/common';
import { Component, effect, Injector, OnInit } from '@angular/core';
import { PageBuilderBaseComponent } from '../page-builder-base-component';
import { sanitizeForStorage } from '../../utiles/sanitizeForStorage';
import { LOCAL_STORAGE_SAVE_KEY } from '../../consts/defauls';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'toolbar',
  templateUrl: './toolbar.component.html',
  styleUrls: ['./toolbar.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule],
})
export class ToolbarComponent extends PageBuilderBaseComponent implements OnInit {
  pageNumber: number = 1;
  constructor(injector: Injector) {
    super(injector);
    effect(() => {
      this.pageNumber = this.pageBuilderService.currentPageIndex() + 1;
    });
  }

  ngOnInit() {}

  changePage() {
    this.pageBuilderService.changePage(this.pageNumber).then((index) => {
      this.pageNumber = index + 1;
    });
  }

  addPage() {
    this.pageBuilderService.addPage().then((index) => {
      this.pageNumber = index + 1;
    });
  }

  onSave() {
    for (let page of this.pageBuilderService.pagelist) {
      for (let item of page.items) {
        //cleanup
        let html = item.el.outerHTML;
        html = html.replace(/\s*data-id="[^"]*"/g, '');
        html = html.replace(/\s*contenteditable="[^"]*"/g, '');
        html = html.replace(
          /<div[^>]*class="[^"]*ngx-corner-resize[^"]*"[^>]*>[\s\S]*?<\/div>/g,
          ''
        );

        item.html = encodeURIComponent(html);
      }
    }

    const sanitized = sanitizeForStorage(this.pageBuilderService.pagelist);
    localStorage.setItem(LOCAL_STORAGE_SAVE_KEY, JSON.stringify(sanitized));
  }

  toggleOutlines() {
    this.pageBuilderService.showOutlines = !this.pageBuilderService.showOutlines;
  }
  deSelectBlock() {
    this.pageBuilderService.deSelectBlock();
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
