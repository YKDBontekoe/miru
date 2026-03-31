import React from 'react';
import { View } from 'react-native';
import { AppText } from './AppText';

interface AgentAvatarProps {
  name: string;
  size?: number;
  color: string;
}

/**
 * Renders a circular avatar displaying the first letter of an agent's name.
 *
 * @param props.name - The name of the agent (used for the initial letter).
 * @param props.size - The diameter of the avatar in pixels (defaults to 52).
 * @param props.color - The hex color used for the text and border styling.
 */
export function AgentAvatar({ name, size = 52, color }: AgentAvatarProps) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: `${color}18`,
        borderWidth: size > 44 ? 2 : 1.5,
        borderColor: `${color}40`,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <AppText style={{ color, fontSize: size * 0.42, fontWeight: '700' }}>
        {name[0]?.toUpperCase() ?? '?'}
      </AppText>
    </View>
  );
}
