// SAMPLE DATA — for prototype demonstration only. Replace with live request records on integration.

export const volumeByMonth = [
{ month: 'May', received: 312, resolved: 241 },
{ month: 'Jun', received: 356, resolved: 298 },
{ month: 'Jul', received: 401, resolved: 352 },
{ month: 'Aug', received: 384, resolved: 371 },
{ month: 'Sep', received: 438, resolved: 389 },
{ month: 'Oct', received: 296, resolved: 214 }];


export const byCategory = [
{ name: 'Roads', value: 512 },
{ name: 'Water', value: 468 },
{ name: 'Waste', value: 301 },
{ name: 'Lighting', value: 254 },
{ name: 'Health', value: 132 },
{ name: 'Environment', value: 118 },
{ name: 'Facilities', value: 84 },
{ name: 'Other', value: 61 }];


export const bySubCounty = [
{ name: 'Kiharu', value: 418 },
{ name: 'Maragwa', value: 366 },
{ name: 'Kandara', value: 312 },
{ name: 'Gatanga', value: 287 },
{ name: 'Kigumo', value: 244 },
{ name: 'Kangema', value: 162 },
{ name: 'Mathioya', value: 141 }];


export const departmentWorkload = [
{ name: 'Roads', open: 86, overdue: 19 },
{ name: 'Water', open: 74, overdue: 12 },
{ name: 'Waste', open: 41, overdue: 6 },
{ name: 'Lighting', open: 37, overdue: 9 },
{ name: 'Health', open: 18, overdue: 2 },
{ name: 'Facilities', open: 15, overdue: 3 }];


export const resolutionTrend = [
{ month: 'May', days: 6.8 },
{ month: 'Jun', days: 6.1 },
{ month: 'Jul', days: 5.4 },
{ month: 'Aug', days: 5.0 },
{ month: 'Sep', days: 4.6 },
{ month: 'Oct', days: 4.2 }];


export const priorityDistribution = [
{ name: 'Urgent', open: 21, overdue: 8 },
{ name: 'High', open: 74, overdue: 22 },
{ name: 'Medium', open: 128, overdue: 15 },
{ name: 'Low', open: 48, overdue: 6 }];


export const adminKpis = {
  total: 1930,
  pending: 142,
  inProgress: 129,
  resolved: 1607,
  overdue: 51,
  avgDays: 4.2
};

export const publicMetrics = [
{ label: 'Requests received', value: '1,930', note: 'Since portal launch' },
{ label: 'In progress', value: '129', note: 'Being worked on now' },
{ label: 'Resolved', value: '1,607', note: '83% of all requests' },
{ label: 'Average resolution time', value: '4.2 days', note: 'Last 30 days' }];