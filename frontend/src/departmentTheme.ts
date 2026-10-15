// This file shares department icons, colors and description fallbacks.
// Department cards and Overview bars use the same name-based theme.
// Run npm run dev from the root to preview department styling.
import {
  Building2,
  PenTool,
  CodeXml,
  Wallet,
  Megaphone,
  Workflow,
  HeartHandshake,
} from 'lucide-react';

const departmentStyles = {
  Design: {
    tileBg: 'var(--design-soft)',
    iconColor: 'var(--design)',
    icon: PenTool,
    description: 'Product design and user research',
  },
  Engineering: {
    tileBg: 'var(--engineering-soft)',
    iconColor: 'var(--engineering)',
    icon: CodeXml,
    description: 'Backend, frontend and QA',
  },
  Finance: {
    tileBg: 'var(--finance-soft)',
    iconColor: 'var(--finance)',
    icon: Wallet,
    description: 'Budgeting, payroll and reporting',
  },
  Marketing: {
    tileBg: 'var(--marketing-soft)',
    iconColor: 'var(--marketing)',
    icon: Megaphone,
    description: 'Brand, content and campaigns',
  },
  Operations: {
    tileBg: 'var(--operations-soft)',
    iconColor: 'var(--operations)',
    icon: Workflow,
    description: 'Admin, facilities and vendors',
  },
  'People & Culture': {
    tileBg: 'var(--people-soft)',
    iconColor: 'var(--people)',
    icon: HeartHandshake,
    description: 'Hiring, onboarding and employee care',
  },
};
const defaultDepartmentStyle = {
  tileBg: 'var(--primary-soft)',
  iconColor: 'var(--primary)',
  icon: Building2,
  description: 'No description added.',
};

export function getDepartmentStyle(name: string) {
  return departmentStyles[name as keyof typeof departmentStyles] ?? defaultDepartmentStyle;
}
