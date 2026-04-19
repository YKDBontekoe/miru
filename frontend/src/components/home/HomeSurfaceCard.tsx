import React from 'react';
import { View } from 'react-native';

/**
 * A container component representing a surface card on the home dashboard.
 * @param {object} props - The component props.
 * @param {React.ReactNode} props.children - The elements to be rendered inside the card.
 * @param {string} [props.className] - Optional Tailwind classes to override or append to the default card styling.
 * @returns {React.ReactElement} The HomeSurfaceCard component.
 */
export function HomeSurfaceCard({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <View
      className={`bg-surface-light dark:bg-surface-dark rounded-3xl border border-faint p-4 mb-3.5 shadow-sm ${className || ''}`}
    >
      {children}
    </View>
  );
}
