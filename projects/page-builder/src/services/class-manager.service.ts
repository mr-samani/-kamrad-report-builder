import { Injectable } from '@angular/core';
import { parseCssToRecord } from '../utiles/css-parser';
interface ICssFiles {
  name: string;
  data: Record<string, string>;
}
@Injectable({
  providedIn: 'root',
})
export class ClassManagerService {
  availableClasses: string[] = [];

  cssFileData: ICssFiles[] = [
    {
      name: 'default',
      data: {
        'a[href=""],#b.a,a~b': 'color:red;',
        button: `color: red;
            
            background-color: #eecec;

            box-shadow   :    0 0 10px     1px red;
            `,
        '#btn': 'border:1px solid red;color:red;padding:10px 20px',
        '.btn-primary': 'background:blue;color:white',
        '.btn-large': 'font-size:18px;padding:15px 30px',
      },
    },
  ];

  constructor() {
    this.availableClasses = [];
    for (let item of this.cssFileData) {
      this.availableClasses.push(...Object.keys(item.data).filter((x) => x.startsWith('.')));
    }
  }

  public async addCssFile(name: string, content: string) {
    name = this.validateName(name);
    const data = await parseCssToRecord(content);
    if (Object.entries(data).length > 0) {
      this.cssFileData.push({
        name,
        data,
      });
    }
  }

  private validateName(name: string): string {
    // جدا کردن baseName و شماره‌ی انتهایی (اگر وجود داشت)
    const match = name.match(/^(.*?)(?:_(\d+))?$/);
    const baseName = match?.[1] ?? name;

    let index = 0;
    let finalName = baseName;

    while (this.cssFileData.some((x) => x.name.toLowerCase() === finalName.toLowerCase())) {
      index++;
      finalName = `${baseName}_${index}`;
    }

    return finalName;
  }

  public getClassValue(selectedClass: string): string {
    for (let i = 0; i < this.cssFileData.length; i++) {
      let found = this.cssFileData[i].data[selectedClass];
      if (found) {
        return found;
      }
    }
    return '';
  }
}
