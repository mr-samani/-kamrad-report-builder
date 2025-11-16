import { PageBuilderDto } from '../../models/PageBuilderDto';
import { PageItem } from '../../models/PageItem';
import { ISourceOptions } from '../../public-api';
import { sanitizeForStorage } from './sanitizeForStorage';

export function preparePageDataForSave(pageInfo: PageBuilderDto): PageBuilderDto {
  if (!pageInfo) {
    return new PageBuilderDto();
  }
  const clonedData: PageBuilderDto = PageBuilderDto.fromJSON(pageInfo);

  let tree = (list: PageItem[]) => {
    for (let item of list) {
      if (item.el) {
        item.style = item.el.style.cssText;
        // item.style = encodeURIComponent(item.el.style.cssText);
      }
      delete item.component;
      delete item.componentSettings;
      delete item.providers;
      delete item.compInjector;

      cleanAttributes(item.options);
      delete item.options?.events;
      delete item.options?.directives;
      // if (item.component) {
      //   item.html = '';
      // } else {
      //   //cleanup
      //   if (item.el) {
      //     let html = item.el.outerHTML;
      //     html = html.replace(/\s*data-id="[^"]*"/g, '');
      //     html = html.replace(/\s*contenteditable="[^"]*"/g, '');

      //     html = removeClassesFromHtml(
      //       html,
      //       ['ngx-corner-resize', 'block-item', 'ngx-draggable', 'ngx-drop-list'],
      //       ['ngxDropList', 'ngxDraggable'],
      //     );
      //     // item.html = encodeURIComponent(html);
      //     item.html = ''; // html;
      //   }
      // }
      if (item.children && item.children.length > 0) {
        tree(item.children);
      }
    }
  };
  for (let page of clonedData.pages) {
    const list = [...page.headerItems, ...page.bodyItems, ...page.footerItems];
    tree(list);
  }

  clonedData.pages.map((m, index) => (m.order = index));

  const sanitized = sanitizeForStorage(clonedData);
  return sanitized;
}

function removeClassesFromHtml(
  html: string,
  classesToRemove: string[],
  attributesToRemove: string[],
): string {
  if (!html) return html;
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const allElements = doc.body.querySelectorAll('*');

  for (const el of Array.from(allElements)) {
    classesToRemove.forEach((cls) => {
      if (el.classList.contains(cls)) el.classList.remove(cls);
    });
    if (el.classList.length === 0) el.removeAttribute('class');
    attributesToRemove.forEach((attr) => {
      if (el.hasAttribute(attr)) el.removeAttribute(attr);
    });
  }

  return doc.body.innerHTML.trim();
}

function cleanAttributes(opt?: ISourceOptions) {
  if (!opt || !opt.attributes) return;
  // clean up class
  if (typeof opt.attributes['class'] == 'string') {
    const filterdClasses = ['block-item'];
    opt.attributes['class'] = opt.attributes['class']
      .split(' ')
      .map((m) => m.trim())
      .filter((x) => filterdClasses.indexOf(x.toLowerCase()) === -1)
      .join(' ');
  }
}
