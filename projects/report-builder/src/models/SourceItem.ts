export class SourceItem {
  tag: 'div' | 'span' | 'p' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'img' = 'div';
  title: string = 'Div';
  icon: string = '';
  text?: string;
}

export const SOURCE_ITEMS: SourceItem[] = [
  { tag: 'div', title: 'Div', icon: 'div_icon' },
  { tag: 'span', title: 'Span', icon: 'span_icon' },
  { tag: 'p', title: 'Paragraph', icon: 'p_icon', text: 'Paragraph' },
  { tag: 'h1', title: 'Heading 1', icon: 'h1_icon', text: 'Heading 1' },
  { tag: 'h2', title: 'Heading 2', icon: 'h2_icon', text: 'Heading 2' },
  { tag: 'h3', title: 'Heading 3', icon: 'h3_icon', text: 'Heading 3' },
  { tag: 'h4', title: 'Heading 4', icon: 'h4_icon', text: 'Heading 4' },
  { tag: 'h5', title: 'Heading 5', icon: 'h5_icon', text: 'Heading 5' },
  { tag: 'h6', title: 'Heading 6', icon: 'h6_icon', text: 'Heading 6' },
  { tag: 'img', title: 'Image', icon: 'img_icon' },
];
