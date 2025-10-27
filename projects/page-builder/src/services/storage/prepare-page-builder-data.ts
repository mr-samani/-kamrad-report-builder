import { PageBuilderDto } from '../../models/PageBuilderDto';
import { sanitizeForStorage } from '../../utiles/sanitizeForStorage';

export function preparePageDataForSave(pageInfo: PageBuilderDto): PageBuilderDto {
  if (!pageInfo) {
    return new PageBuilderDto();
  }
  for (let page of pageInfo.pages) {
    const list = [...page.headerItems, ...page.bodyItems, ...page.footerItems];
    for (let item of list) {
      //cleanup
      if (item.el) {
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
  }
  pageInfo.pages.map((m, index) => (m.order = index));

  const sanitized = sanitizeForStorage(pageInfo);
  return sanitized;
}
