/** parseCssToRecord.ts */
export function parseCssToRecord(cssText: string): Promise<Record<string, string>> {
  return new Promise((resolve, reject) => {
    try {
      // 1) حذف کامنت‌ها (/* ... */)
      const noComments = cssText.replace(/\/\*[\s\S]*?\*\//g, '');

      const result: Record<string, string> = {};

      // utility: split declarations by ';' but ignore ; داخل پرانتز
      function splitDecls(body: string): string[] {
        const parts: string[] = [];
        let cur = '';
        let paren = 0;
        for (let i = 0; i < body.length; i++) {
          const ch = body[i];
          if (ch === '(') paren++;
          else if (ch === ')') paren = Math.max(0, paren - 1);
          if (ch === ';' && paren === 0) {
            parts.push(cur.trim());
            cur = '';
          } else {
            cur += ch;
          }
        }
        if (cur.trim()) parts.push(cur.trim());
        return parts.filter((p) => p.length > 0);
      }

      // main parser: scan and handle nested blocks via brace counting
      function parseBlocks(src: string) {
        let i = 0;
        const len = src.length;

        while (i < len) {
          // skip whitespace/newlines
          while (i < len && /\s/.test(src[i])) i++;
          if (i >= len) break;

          // if starts with @ (at-rule)
          if (src[i] === '@') {
            // read at-rule header until first '{' or ';'
            let headerStart = i;
            while (i < len && src[i] !== '{' && src[i] !== ';') i++;
            if (i < len && src[i] === ';') {
              // at-rule without block e.g. @charset "utf-8";
              i++; // consume ;
              continue;
            }
            if (i >= len) break;
            // now src[i] === '{'
            // find matching closing brace for this at-rule block
            let braceCount = 1;
            i++; // move past '{'
            const innerStart = i;
            while (i < len && braceCount > 0) {
              if (src[i] === '{') braceCount++;
              else if (src[i] === '}') braceCount--;
              i++;
            }
            const innerEnd = i - 1; // index of char before closing brace
            if (innerEnd >= innerStart) {
              const inner = src.slice(innerStart, innerEnd);
              // recursively parse inner content so nested selectors are extracted too
              parseBlocks(inner);
            }
            continue;
          }

          // otherwise read selector up to first '{'
          let selStart = i;
          while (i < len && src[i] !== '{') i++;
          if (i >= len) break;
          const selectorRaw = src.slice(selStart, i).trim();
          i++; // move past '{'
          // now read body until matching '}' (brace count)
          let brace = 1;
          const bodyStart = i;
          while (i < len && brace > 0) {
            if (src[i] === '{') brace++;
            else if (src[i] === '}') brace--;
            i++;
          }
          const bodyEnd = i - 1;
          const body = src.slice(bodyStart, bodyEnd).trim();

          // handle multiple selectors: .a, .b {...}
          const selectors = selectorRaw
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean);
          if (selectors.length === 0) continue;

          // normalize declarations from body
          const decls = splitDecls(body)
            .map((d) => d.replace(/\s+/g, ' ').trim()) // normalize spaces
            .filter(Boolean);

          if (decls.length === 0) {
            // empty block => set empty string
            for (const s of selectors) {
              const key = normalizeSelectorKey(s);
              // do not overwrite existing declarations if present: append nothing
              if (!(key in result)) result[key] = '';
            }
          } else {
            const joined = decls
              .map((d) => {
                // ensure there is exactly one colon between prop and value
                const idx = d.indexOf(':');
                if (idx === -1) return d; // keep as-is (invalid but preserved)
                const prop = d.slice(0, idx).trim();
                const val = d.slice(idx + 1).trim();
                return `${prop}:${val}`;
              })
              .join(';');
            // ensure trailing semicolon (like examples)
            const valueStr = joined.endsWith(';') ? joined : joined + ';';
            for (const s of selectors) {
              const key = normalizeSelectorKey(s);
              // if key already exists, append new declarations (avoid duplicate semicolons)
              if (result[key]) {
                // remove trailing ; to concat cleanly
                const a = result[key].replace(/;+\s*$/, '');
                const b = valueStr.replace(/;+\s*$/, '');
                result[key] = a && b ? a + ';' + b + ';' : (a || b) + ';';
              } else {
                result[key] = valueStr;
              }
            }
          }
        }
      }

      // normalize selector to a key acceptable for Record<string,string>
      function normalizeSelectorKey(sel: string): string {
        // collapse whitespace/newlines and keep full selector (including attributes, ids, complex selectors)
        return sel.replace(/\s+/g, ' ').trim();
      }

      parseBlocks(noComments);
      resolve(result);
    } catch (error) {
      reject(error);
    }
  });
}
