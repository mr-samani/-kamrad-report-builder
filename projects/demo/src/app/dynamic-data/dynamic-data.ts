import { DynamicDataStructure } from '@ngx-page-builder';

export const DynamicData: DynamicDataStructure = {
  personalInfo: {
    type: 'object',
    properties: {
      name: {
        type: 'object',
        properties: {
          first: { type: 'value', valueType: 'string', value: 'Mohammadreza' },
          last: { type: 'value', valueType: 'string', value: 'Samani' },
        },
      },
      age: { type: 'value', valueType: 'number', value: 30 },
      email: { type: 'value', valueType: 'string', value: 'mohammadreza@example.com' },
    },
  },
  jobData: {
    type: 'object',
    properties: {
      title: { type: 'value', valueType: 'string', value: 'Developer' },
      company: { type: 'value', valueType: 'string', value: 'ABC Corp' },
      location: { type: 'value', valueType: 'string', value: 'Remote' },
      startDate: { type: 'value', valueType: 'date', value: '2020-01-01' },
      endDate: { type: 'value', valueType: 'date', value: '2021-01-01' },
    },
  },
};
