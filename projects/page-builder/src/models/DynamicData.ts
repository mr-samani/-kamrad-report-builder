// dynamic-structure.model.ts (همون ساختار پیشنهادی)
export interface DynamicDataStructure {
  [key: string]: DynamicNode;
}

export type DynamicNode = DynamicObjectNode | DynamicArrayNode | DynamicValueNode;

export interface DynamicObjectNode {
  type: 'object';
  properties: Record<string, DynamicNode>;
  displayName?: string;
}

export interface DynamicArrayNode {
  type: 'array';
  items: DynamicNode;
  displayName?: string;
}

export interface DynamicValueNode {
  type: 'value';
  valueType: 'string' | 'number' | 'boolean' | 'date' | 'any';
  displayName?: string;
}
