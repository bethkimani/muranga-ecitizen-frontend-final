import type { Announcement, Faq, PortalNotification, StaffMember } from '../types/portal';

export const notifications: PortalNotification[] = [
{ id: 'n1', type: 'status', title: 'Repair works started', body: 'Water & Sanitation published an update on your burst pipe request.', date: '2026-10-16T15:40:00', read: false, ref: 'MCG-2026-004812' },
{ id: 'n2', type: 'clarification', title: 'Clarification requested', body: 'Roads & Public Works asked for the nearest building to the pothole.', date: '2026-10-15T10:12:00', read: false, ref: 'MCG-2026-004790' },
{ id: 'n3', type: 'announcement', title: 'Scheduled water interruption — Makuyu', body: 'Supply will be interrupted on 17 October, 9am–3pm, for pipe repairs.', date: '2026-10-14T08:00:00', read: false },
{ id: 'n4', type: 'assigned', title: 'Request assigned', body: 'Your burst pipe request was assigned to Water & Sanitation.', date: '2026-10-09T11:02:00', read: true, ref: 'MCG-2026-004812' },
{ id: 'n5', type: 'submitted', title: 'Request received', body: 'We received your request MCG-2026-004812.', date: '2026-10-09T08:14:00', read: true, ref: 'MCG-2026-004812' },
{ id: 'n6', type: 'resolved', title: 'Request resolved', body: 'Street lights on Mumbi Road have been repaired. Tell us how we did.', date: '2026-10-06T12:00:00', read: true, ref: 'MCG-2026-004655' }];


export const announcements: Announcement[] = [
{ id: 'a1', category: 'Water', title: 'Scheduled water interruption in Makuyu town', summary: 'Supply will be interrupted on Saturday 17 October between 9am and 3pm to allow pipe replacement works.', date: '2026-10-14T08:00:00' },
{ id: 'a2', category: 'Roads', title: 'Drainage clearing ahead of the short rains', summary: 'Ward teams are clearing culverts across Kandara and Gatanga. Report blocked drains through the portal.', date: '2026-10-10T09:00:00' },
{ id: 'a3', category: 'Health', title: 'Free community health outreach in Kigumo', summary: 'Outreach at Kangari Health Centre on 24 October. Bring your health card.', date: '2026-10-08T09:00:00' },
{ id: 'a4', category: 'General', title: 'The portal is now available in Kiswahili', summary: 'Choose "Kiswahili" from the language menu at the top of any page.', date: '2026-10-01T09:00:00' }];


export const staff: StaffMember[] = [
{ id: 's1', name: 'Grace Njeri', email: 'g.njeri@muranga.go.ke', role: 'Administrator', department: 'ICT & e-Government', status: 'Active', openCases: 0, lastActive: '2026-10-17T09:58:00' },
{ id: 's2', name: 'James Kariuki', email: 'j.kariuki@muranga.go.ke', role: 'County Officer', department: 'Water & Sanitation', status: 'Active', openCases: 14, lastActive: '2026-10-17T08:40:00' },
{ id: 's3', name: 'Mercy Wairimu', email: 'm.wairimu@muranga.go.ke', role: 'County Officer', department: 'Energy & Street Lighting', status: 'Active', openCases: 9, lastActive: '2026-10-16T17:12:00' },
{ id: 's4', name: 'Samuel Mwangi', email: 's.mwangi@muranga.go.ke', role: 'County Officer', department: 'Environment & Waste', status: 'Active', openCases: 11, lastActive: '2026-10-17T07:55:00' },
{ id: 's5', name: 'Peter Mwangi', email: 'p.mwangi@muranga.go.ke', role: 'Department Head', department: 'Roads & Public Works', status: 'Active', openCases: 6, lastActive: '2026-10-17T10:05:00' },
{ id: 's6', name: 'Alice Muthoni', email: 'a.muthoni@muranga.go.ke', role: 'County Officer', department: 'Environment & Waste', status: 'Active', openCases: 7, lastActive: '2026-10-15T15:30:00' },
{ id: 's7', name: 'Daniel Ndung’u', email: 'd.ndungu@muranga.go.ke', role: 'Customer Service', department: 'Customer Service Desk', status: 'Invited', openCases: 0, lastActive: '2026-10-16T10:00:00' },
{ id: 's8', name: 'Lucy Gathoni', email: 'l.gathoni@muranga.go.ke', role: 'County Officer', department: 'Health Services', status: 'Deactivated', openCases: 0, lastActive: '2026-08-30T12:00:00' }];


export const faqs: Faq[] = [
{ q: 'Do I need an account to report an issue?', a: 'An account lets you track progress, receive updates and reply to officers. You can still track any request with its reference number without signing in.' },
{ q: 'How long will it take for my request to be handled?', a: 'Each service has a response target shown in the Service Directory. Complex works such as road repairs may take longer; the department will publish updates on your request.' },
{ q: 'What do the request statuses mean?', a: 'Pending means received and awaiting review. In Progress means a department is working on it. Resolved means the county has completed the work. Rejected means the request falls outside county mandate, with an explanation.' },
{ q: 'Can I attach photos?', a: 'Yes. You can attach up to 3 images (JPG, PNG or WEBP, maximum 5 MB each). Photos help officers locate and assess the issue faster.' },
{ q: 'Who can see my personal details?', a: 'Only authorised county staff handling your request. Public pages never show your name or contact details.' },
{ q: 'Can I use the portal in Kiswahili?', a: 'Yes. Use the language selector at the top of any page to switch between English and Kiswahili.' }];


export const auditLog = [
{ id: 'l1', date: '2026-10-17T10:05:00', actor: 'Peter Mwangi', action: 'Bulk assigned 3 requests', target: 'Roads & Public Works', ip: '10.12.4.21' },
{ id: 'l2', date: '2026-10-17T09:58:00', actor: 'Grace Njeri', action: 'Signed in', target: 'Admin console', ip: '10.12.1.8' },
{ id: 'l3', date: '2026-10-16T15:40:00', actor: 'James Kariuki', action: 'Published citizen update', target: 'MCG-2026-004812', ip: '10.12.6.33' },
{ id: 'l4', date: '2026-10-16T14:12:00', actor: 'Grace Njeri', action: 'Invited staff account', target: 'd.ndungu@muranga.go.ke', ip: '10.12.1.8' },
{ id: 'l5', date: '2026-10-16T11:00:00', actor: 'Mercy Wairimu', action: 'Changed status to In Progress', target: 'MCG-2026-004799', ip: '10.12.7.2' },
{ id: 'l6', date: '2026-10-15T16:30:00', actor: 'Grace Njeri', action: 'Deactivated account', target: 'l.gathoni@muranga.go.ke', ip: '10.12.1.8' },
{ id: 'l7', date: '2026-10-15T09:20:00', actor: 'Grace Njeri', action: 'Updated assignment rule', target: 'Street Lighting → Energy & Street Lighting', ip: '10.12.1.8' }];