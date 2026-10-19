import {
  DropletsIcon, RouteIcon, LightbulbIcon, Trash2Icon, HeartPulseIcon,
  GraduationCapIcon, LandmarkIcon, type LucideIcon,
} from 'lucide-react';

/** Picks an icon from the category name, so no icon data is stored anywhere. */
export function categoryIcon(name: string): LucideIcon {
  const n = name.toLowerCase();
  if (/water|sanit|sewer/.test(n)) return DropletsIcon;
  if (/road|transport|traffic/.test(n)) return RouteIcon;
  if (/street|light|energy|power/.test(n)) return LightbulbIcon;
  if (/waste|environment|garbage|litter/.test(n)) return Trash2Icon;
  if (/health|clinic|hospital/.test(n)) return HeartPulseIcon;
  if (/educat|school/.test(n)) return GraduationCapIcon;
  return LandmarkIcon;
}