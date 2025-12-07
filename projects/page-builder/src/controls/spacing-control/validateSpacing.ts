import { IPosValue, ISpacing } from './ISpacingModel';

export function validateSpacing(spacing: ISpacing, allowNegative: boolean): ISpacing {
  const validated: ISpacing = {
    top: { value: undefined, unit: 'px' },
    right: { value: undefined, unit: 'px' },
    bottom: { value: undefined, unit: 'px' },
    left: { value: undefined, unit: 'px' },
  };
  const keys: (keyof ISpacing)[] = ['top', 'right', 'bottom', 'left'];

  for (const key of keys) {
    const value = spacing[key]?.value;
    validated[key] = {};

    if (value == 'auto') {
      validated[key].value = 'auto';
    } else if (value === undefined || isNaN(+value)) {
      validated[key].value = undefined;
    } else if (!allowNegative && +value < 0) {
      validated[key].value = 0; // No negative values for padding
    } else {
      validated[key].value = Math.round(+value * 100) / 100; // Round to 2 decimal places
    }
    validated[key]!.unit = spacing[key]?.unit ?? 'px';
  }
  return validated;
}
// Parse spacing values from CSS string (e.g., "10px 20px 30px 40px")
export function parseSpacingValues(cssValue: string | undefined, defaultValue: ISpacing): ISpacing {
  if (!cssValue) return { ...defaultValue };

  const values = cssValue.trim().split(/\s+/);
  const unitRegex = /(px|rem|em|%)$/;

  // Extract numeric values and unit
  const parsed: ISpacing = { ...defaultValue };
  if (values.length === 1) {
    // Single value (e.g., "10px")
    const val = parseSingleValue(values[0], unitRegex);
    parsed.top = parsed.right = parsed.bottom = parsed.left = val;
  } else if (values.length === 2) {
    // Two values (e.g., "10px 20px")
    parsed.top = parsed.bottom = parseSingleValue(values[0], unitRegex);
    parsed.right = parsed.left = parseSingleValue(values[1], unitRegex);
  } else if (values.length === 3) {
    // Three values (e.g., "10px 20px 30px")
    parsed.top = parseSingleValue(values[0], unitRegex);
    parsed.right = parsed.left = parseSingleValue(values[1], unitRegex);
    parsed.bottom = parseSingleValue(values[2], unitRegex);
  } else if (values.length === 4) {
    // Four values (e.g., "10px 20px 30px 40px")
    parsed.top = parseSingleValue(values[0], unitRegex);
    parsed.right = parseSingleValue(values[1], unitRegex);
    parsed.bottom = parseSingleValue(values[2], unitRegex);
    parsed.left = parseSingleValue(values[3], unitRegex);
  }

  return parsed;
}

// Parse a single CSS value (e.g., "10px" -> 10)
export function parseSingleValue(value: string, unitRegex: RegExp): IPosValue {
  if (value == 'auto') return { value: 'auto', unit: 'auto' };
  const num = parseFloat(value.replace(unitRegex, ''));
  let unit = value.match(unitRegex)?.[0] as any;
  return {
    value: isNaN(num) ? 0 : num,
    unit,
  };
}
