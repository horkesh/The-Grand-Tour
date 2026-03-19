import React from 'react';
import { TripUser } from '../types';

interface Props {
  user: TripUser | null;
  size?: 'sm' | 'md';
  showName?: boolean;
}

const colorClasses = {
  teal: 'bg-[#194f4c] text-white',
  rust: 'bg-[#ac3d29] text-white',
};

const sizeClasses = {
  sm: 'w-5 h-5 text-[9px]',
  md: 'w-7 h-7 text-xs',
};

const UserAvatar: React.FC<Props> = ({ user, size = 'sm', showName = false }) => {
  if (!user) return null;

  const initial = (user.displayName || '?')[0].toUpperCase();

  return (
    <span className="inline-flex items-center gap-1.5">
      {user.photoURL ? (
        <img
          src={user.photoURL}
          alt={user.displayName}
          className={`${sizeClasses[size]} rounded-full object-cover ring-2 ring-white dark:ring-black`}
        />
      ) : (
        <span className={`${sizeClasses[size]} ${colorClasses[user.color]} rounded-full flex items-center justify-center font-bold ring-2 ring-white dark:ring-black`}>
          {initial}
        </span>
      )}
      {showName && (
        <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
          {user.displayName?.split(' ')[0]}
        </span>
      )}
    </span>
  );
};

export default UserAvatar;
