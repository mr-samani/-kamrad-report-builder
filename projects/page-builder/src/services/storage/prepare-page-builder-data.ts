import { PageBuilderDto } from '../../models/PageBuilderDto';
import { sanitizeForStorage } from '../../utiles/sanitizeForStorage';

export function preparePageDataForSave(pageInfo: PageBuilderDto): PageBuilderDto {
  if (!pageInfo) {
    return new PageBuilderDto();
  }
  for (let page of pageInfo.pages) {
    for (let item of page.items) {
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

  const sanitized = sanitizeForStorage(pageInfo);
  return sanitized;
}
