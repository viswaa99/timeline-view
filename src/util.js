import moment from 'moment';

const template = {
  _item_id: 'MUT-0006',
  Name: 'Task',
  _priority_name: 'Critical',
  _status_name: 'Found Issue',
  _modified_at: '2024-06-04T05:15:43Z',
  _created_at: '2023-08-28T11:17:34Z',
  _id: 'MUT-0006',
  _category: 'NotStarted',
  _status_id: 'Status_0001_New',
  _priority_id: 'Critical',
  _start_date: '2024-08-17T00:00:00Z America/Los_Angeles',
  DueDate: '2024-08-18T00:00:00Z America/Los_Angeles',
};

export function utcToMs(date) {
  return moment(date).utc().valueOf();
}

export const ZOOM_LEVELS_CONVERSION = {
  HOUR: {
    id: 'Hour',
    timeUnit: 80,
    Conv: 60 * 60 * 1000 * 6,
    widthUnit: 61 * 24 * 60 * 60 * 1000,
  },
  DAY: {
    id: 'Day',
    timeUnit: 80,
    Conv: 24 * 60 * 60 * 1000,
    widthUnit: 183 * 24 * 60 * 60 * 1000,
  },
  WEEK: {
    id: 'Week',
    timeUnit: 420,
    Conv: 24 * 7 * 60 * 60 * 1000,
    widthUnit: 500 * 24 * 60 * 60 * 1000,
  },
  MONTH: {
    id: 'Month',
    timeUnit: 110,
    Conv: 24 * 31 * 60 * 60 * 1000,
    widthUnit: 548 * 24 * 60 * 60 * 1000,
  },
  QUARTER: {
    id: 'Quarter',
    timeUnit: 87,
    Conv: 3 * 24 * 31 * 60 * 60 * 1000,
    widthUnit: 2555 * 24 * 60 * 60 * 1000,
  },
  YEAR: {
    id: 'Year',
    timeUnit: 108,
    Conv: 366 * 24 * 60 * 60 * 1000,
    widthUnit: 7300 * 24 * 60 * 60 * 1000,
  },
};

export const FIELDS = [
  {
    Id: '_item_id',
    Name: 'Item Id',
    Type: 'Text',
    IsSystemField: true,
    Model: 'testboard',
    Widget: null,
    Required: false,
    IsInternal: false,
    IsComputedField: false,
  },
  {
    Id: 'Name',
    Name: 'Title',
    Type: 'Text',
    IsSystemField: true,
    Model: 'testboard',
    Widget: null,
    Required: false,
    IsInternal: false,
    IsComputedField: true,
  },
  {
    Id: 'AssignedTo',
    Name: 'Assignee',
    Type: 'User',
    IsSystemField: true,
    Model: 'testboard',
    Widget: null,
    Required: false,
    IsInternal: false,
    SourceFlowId: 'User',
    SourceFlowType: 'User',
    IsComputedField: false,
  },
  {
    Id: '_status_name',
    Name: 'Status',
    Type: 'Text',
    IsSystemField: true,
    Model: 'testboard',
    Widget: null,
    Required: false,
    IsInternal: false,
    IsComputedField: false,
  },
  {
    Id: '_priority_name',
    Name: 'Priority',
    Type: 'Text',
    IsSystemField: true,
    Model: 'testboard',
    Widget: null,
    Required: false,
    IsInternal: false,
    IsComputedField: false,
  },
];

export function getDaysInMonth(timestamp) {
  const date = moment.utc(timestamp);
  return date.daysInMonth();
}

export function getDaysInYear(timestamp) {
  const date = moment.utc(timestamp);
  return date.isLeapYear() ? 366 : 365;
}

export function getDaysInQuarter(timestamp) {
  const date = moment.utc(timestamp);

  const startOfQuarter = date.clone().startOf('quarter');
  const endOfQuarter = date.clone().endOf('quarter');

  const daysInQuarter = endOfQuarter.diff(startOfQuarter, 'days') + 1;

  return daysInQuarter;
}

export function makeData(value) {
  const data = [];
  for (let i = 1; i <= value; i++) {
    const obj = { ...template };
    const id = `MUT-${i.toString().padStart(5, '0')}`;
    obj['_item_id'] = id;
    obj['_id'] = id;
    data.push(obj);
  }
  return JSON.stringify(data);
}
