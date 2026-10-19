import {
  DropletsIcon,
  ConstructionIcon,
  LightbulbIcon,
  Trash2Icon,
  HeartPulseIcon,
  TreesIcon,
  Building2Icon,
  LayoutGridIcon } from
'lucide-react';
import type { ServiceCategory } from '../types/request';

export const categories: ServiceCategory[] = [
{
  id: 'water',
  name: 'Water and Sanitation',
  description: 'Burst pipes, supply interruptions, sewer blockages and public toilets.',
  department: 'Water & Sanitation',
  responseTarget: '48 hours',
  subcategories: ['Burst or leaking pipe', 'No water supply', 'Sewer blockage', 'Water quality concern', 'Public toilet'],
  icon: DropletsIcon
},
{
  id: 'roads',
  name: 'Roads and Drainage',
  description: 'Potholes, blocked culverts, damaged bridges and flooded roads.',
  department: 'Roads & Public Works',
  responseTarget: '5 working days',
  subcategories: ['Pothole', 'Blocked drainage or culvert', 'Damaged footbridge', 'Road flooding', 'Missing road sign'],
  icon: ConstructionIcon
},
{
  id: 'lighting',
  name: 'Street Lighting',
  description: 'Faulty street lights, flood lights and exposed electrical cables.',
  department: 'Energy & Street Lighting',
  responseTarget: '72 hours',
  subcategories: ['Street light not working', 'Flood mast not working', 'Exposed cables', 'Damaged pole'],
  icon: LightbulbIcon
},
{
  id: 'waste',
  name: 'Waste Collection',
  description: 'Missed collection, illegal dumping and overflowing market skips.',
  department: 'Environment & Waste',
  responseTarget: '72 hours',
  subcategories: ['Missed collection', 'Illegal dumping', 'Overflowing skip', 'Market cleanliness'],
  icon: Trash2Icon
},
{
  id: 'health',
  name: 'Public Health',
  description: 'Food hygiene, stagnant water, pest control and public health risks.',
  department: 'Health Services',
  responseTarget: '48 hours',
  subcategories: ['Food hygiene', 'Stagnant water', 'Pest or vector control', 'Health facility service'],
  icon: HeartPulseIcon
},
{
  id: 'environment',
  name: 'Environmental Services',
  description: 'Noise, tree cutting, riverbank encroachment and pollution.',
  department: 'Environment & Waste',
  responseTarget: '5 working days',
  subcategories: ['Noise nuisance', 'Illegal tree cutting', 'River pollution', 'Quarry concern'],
  icon: TreesIcon
},
{
  id: 'facilities',
  name: 'County Facilities',
  description: 'Markets, stadia, bus parks, social halls and county offices.',
  department: 'County Facilities',
  responseTarget: '5 working days',
  subcategories: ['Market facility', 'Bus park', 'Social hall', 'Stadium or playground'],
  icon: Building2Icon
},
{
  id: 'other',
  name: 'Other Public Services',
  description: "Anything that doesn't fit above. We'll route it to the right team.",
  department: 'Customer Service Desk',
  responseTarget: '3 working days',
  subcategories: ['General enquiry', 'Service complaint', 'Suggestion'],
  icon: LayoutGridIcon
}];


export const subCounties: Record<string, string[]> = {
  Kiharu: ['Township', 'Murarandia', 'Mugoiri', 'Mbiri', 'Gaturi', 'Wangu'],
  Kangema: ['Kanyenyaini', 'Muguru', 'Rwathia'],
  Mathioya: ['Gitugi', 'Kiru', 'Kamacharia'],
  Kigumo: ['Kahumbu', 'Muthithi', 'Kigumo', 'Kangari', 'Kinyona'],
  Maragwa: ['Kimorori/Wempa', 'Makuyu', 'Kambiti', 'Kamahuha', 'Ichagaki', 'Nginda'],
  Kandara: ["Ng'araria", 'Muruka', 'Kagundu-ini', 'Gaichanjiru', 'Ithiru', 'Ruchu'],
  Gatanga: ['Ithanga', 'Kakuzi/Mitubiri', 'Mugumo-ini', 'Kihumbu-ini', 'Gatanga', 'Kariara']
};

export const departments = [
'Water & Sanitation',
'Roads & Public Works',
'Energy & Street Lighting',
'Environment & Waste',
'Health Services',
'County Facilities',
'Customer Service Desk'];