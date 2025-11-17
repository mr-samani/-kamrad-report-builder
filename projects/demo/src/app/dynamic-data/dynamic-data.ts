import { DynamicDataStructure, DynamicValueType } from '@ngx-page-builder';

export const DynamicData: DynamicDataStructure[] = [
  {
    id: '1',
    displayName: 'Personal Information',
    name: 'personalInfo',
    type: DynamicValueType.Array,
    values: [
      {
        id: '1',
        displayName: 'First name',
        name: 'firstName',
        type: DynamicValueType.String,
        value: 'Mohammadreza',
      },
      {
        id: '2',
        displayName: 'Last name',
        name: 'lastName',
        type: DynamicValueType.String,
        value: 'Samani',
      },
      {
        id: '3',
        displayName: 'Age',
        name: 'age',
        type: DynamicValueType.Int,
        value: 36,
      },
      {
        id: '4',
        displayName: 'Email',
        name: 'email',
        type: DynamicValueType.String,
        value: 'example@example.com',
      },
    ],
  },
  {
    id: '2',
    displayName: 'Job Data',
    name: 'jobData',
    type: DynamicValueType.Array,
    values: [
      {
        id: '1',
        displayName: 'Title',
        name: 'title',
        type: DynamicValueType.String,
        value: 'Software Engineer',
      },
      {
        id: '2',
        displayName: 'Company',
        name: 'company',
        type: DynamicValueType.String,
        value: 'Example Corp',
      },
      {
        id: '3',
        displayName: 'Location',
        name: 'location',
        type: DynamicValueType.String,
        value: 'New York',
      },
      {
        id: '4',
        displayName: 'Start Date',
        name: 'startDate',
        type: DynamicValueType.Date,
        value: new Date('2020-01-01'),
      },
      {
        id: '5',
        displayName: 'End Date',
        name: 'endDate',
        type: DynamicValueType.Date,
        value: new Date('2023-12-31'),
      },
    ],
  },
];
