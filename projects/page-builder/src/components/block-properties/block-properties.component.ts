import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  Injector,
  OnInit,
} from '@angular/core';
import { BaseComponent } from '../BaseComponent';
import { PageItem } from '../../models/PageItem';
import { MatDialog } from '@angular/material/dialog';
import { TextEditorComponent } from '../text-editor/text-editor.component';
import { SafeHtmlPipe } from '../../pipes/safe-html.pipe';
import { SpacingControlComponent } from '../../controls/spacing-control/spacing-control.component';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'block-properties',
  templateUrl: './block-properties.component.html',
  styleUrls: ['./block-properties.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, SafeHtmlPipe, SpacingControlComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BlockPropertiesComponent extends BaseComponent implements OnInit {
  item?: PageItem;

  constructor(injector: Injector, private matDialog: MatDialog) {
    super(injector);
    effect(() => {
      this.item = this.pageBuilderService.activeEl();
      // console.log('updated properties', this.item);
      this.chdRef.detectChanges();
    });
  }

  ngOnInit() {}

  openTextEditor() {
    if (!this.item) return;
    this.matDialog
      .open(TextEditorComponent, {
        data: this.item,
      })
      .afterClosed()
      .subscribe((result) => {
        if (result && this.item) {
          this.item.content = result;
          this.pageBuilderService.writeItemValue(this.item);
          this.chdRef.detectChanges();
        }
      });
  }

  onChangeProperties() {}
}
