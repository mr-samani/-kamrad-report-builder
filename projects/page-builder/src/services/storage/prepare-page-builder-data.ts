import { PageBuilderDto } from '../../models/PageBuilderDto';
import { PageItem } from '../../models/PageItem';
import { sanitizeForStorage } from '../../utiles/sanitizeForStorage';

export function preparePageDataForSave(pageInfo: PageBuilderDto): PageBuilderDto {
  if (!pageInfo) {
    return new PageBuilderDto();
  }
  let tree = (list: PageItem[]) => {
    for (let item of list) {
      if (item.el) {
        item.style = encodeURIComponent(item.el.style.cssText);
      }
      delete item.options?.attributes;
      delete item.options?.events;
      delete item.options?.directives;
      if (item.component) {
        item.html = '';
      } else {
        //cleanup
        if (item.el) {
          let html = item.el.outerHTML;
          html = html.replace(/\s*data-id="[^"]*"/g, '');
          html = html.replace(/\s*contenteditable="[^"]*"/g, '');

          html = removeClassesFromHtml(html, ['ngx-corner-resize', 'block-item', 'ngx-draggable']);

          // remove style from first tag only
          if (item.tag)
            html = html.replace(new RegExp(item.tag.toLowerCase() + '.*style="[^"]*"'), item.tag);

          item.html = encodeURIComponent(html);
        }
      }
      if (item.children && item.children.length > 0) {
        tree(item.children);
      }
    }
  };
  for (let page of pageInfo.pages) {
    const list = [...page.headerItems, ...page.bodyItems, ...page.footerItems];
    tree(list);
  }

  pageInfo.pages.map((m, index) => (m.order = index));

  const sanitized = sanitizeForStorage(pageInfo);
  return sanitized;
}

export function removeClassesFromHtml(html: string, classesToRemove: string[]): string {
  if (!html || !classesToRemove?.length) return html;

  const doc = new DOMParser().parseFromString(html, 'text/html');
  const allElements = doc.body.querySelectorAll('*');

  for (const el of Array.from(allElements)) {
    classesToRemove.forEach((cls) => {
      if (el.classList.contains(cls)) el.classList.remove(cls);
    });
    if (el.classList.length === 0) el.removeAttribute('class');
  }

  return doc.body.innerHTML.trim();
}
