import React from 'react';
import { AppText } from '../AppText';
import { DESIGN_TOKENS } from '@/core/design/tokens';

const C = {
  muted: DESIGN_TOKENS.colors.muted,
};

export function SectionHeader({ title }: { title: string }) {
  return (
    <AppText
      style={{
        textTransform: 'uppercase',
        letterSpacing: 1.2,
        fontSize: 11,
        fontWeight: '700',
        color: C.muted,
        marginBottom: 10,
        marginTop: 8,
      }}
    >
      {title}
    </AppText>
  );
}
