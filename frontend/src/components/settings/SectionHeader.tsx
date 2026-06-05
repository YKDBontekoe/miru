import React from 'react';
import { AppText } from '@/components/AppText';

export const SectionHeader: React.FC<{ title: string }> = ({ title }) => {
  return (
    <AppText className="uppercase tracking-[1.2px] text-[11px] font-bold text-muted mb-2.5 mt-2">
      {title}
    </AppText>
  );
};
