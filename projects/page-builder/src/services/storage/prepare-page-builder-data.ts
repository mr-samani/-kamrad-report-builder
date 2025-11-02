import { PageBuilderDto } from '../../models/PageBuilderDto';
import { sanitizeForStorage } from '../../utiles/sanitizeForStorage';

export function preparePageDataForSave(pageInfo: PageBuilderDto): PageBuilderDto {
  if (!pageInfo) {
    return new PageBuilderDto();
  }
  for (let page of pageInfo.pages) {
    const list = [...page.headerItems, ...page.bodyItems, ...page.footerItems];
    for (let item of list) {
      if (item.el) {
        item.style = encodeURIComponent(item.el.style.cssText);
      }
      if (item.component) {
        item.html = '';
        continue;
      }
      //cleanup
      if (item.el) {
        debugger;
        let html = item.el.outerHTML;
        html = html.replace(/\s*data-id="[^"]*"/g, '');
        html = html.replace(/\s*contenteditable="[^"]*"/g, '');

        html = removeClassesFromHtml(html, ['ngx-corner-resize', 'block-item', 'ngx-draggable']);
        html = html.replace(/\s*style="[^"]*"/g, '');

        item.html = encodeURIComponent(html);
      }
    }
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
