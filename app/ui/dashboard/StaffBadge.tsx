import Link from 'next/link';
import { CheckCircle2 } from 'lucide-react';

interface StaffBadgeProps {
  role?: 'user' | 'staff' | 'admin';
  size?: 'sm' | 'md';
}

export default function StaffBadge({ role, size = 'md' }: StaffBadgeProps) {
  const isStaff = role === 'staff' || role === 'admin';
  
  if (!isStaff) {
    return null;
  }

  const sizeClasses = size === 'sm' 
    ? 'px-2 py-0.5 text-xs' 
    : 'px-2 py-1 text-xs';
  
  const iconSize = size === 'sm' ? 'w-3 h-3' : 'w-4 h-4';

  return (
    <Link href="/dashboard/admin" className={`inline-flex items-center gap-1 ${sizeClasses} font-semibold text-green-700 bg-green-100 rounded-full border border-green-200 cursor-pointer hover:bg-green-200 hover:border-green-300 transition-colors`}>
      <CheckCircle2 className={iconSize} />
      Staff account
    </Link>
  );
}
