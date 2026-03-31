import React from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '../AppText';
import { ScalePressable } from '../ScalePressable';
import { Task } from '../../core/models';

const C = {
  primaryFaint: '#EEF4FF',
  primary: '#2563EB',
  text: '#0A0E2E',
  faint: '#B4BBDE',
};

export const HomeTaskRow = React.memo(function HomeTaskRow({
  task,
  onToggle,
  isLast,
}: {
  task: Task;
  onToggle: () => void;
  isLast: boolean;
}) {
  const { i18n } = useTranslation();
  return (
    <ScalePressable
      onPress={onToggle}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
      }}
    >
      <View
        style={{
          width: 24,
          height: 24,
          borderRadius: 12,
          borderWidth: 2,
          borderColor: task.completed ? C.primary : C.faint,
          backgroundColor: task.completed ? C.primary : 'transparent',
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: 12,
        }}
      >
        {task.completed && <Ionicons name="checkmark" size={13} color="white" />}
      </View>
      <AppText
        style={{
          flex: 1,
          fontSize: 14,
          color: task.completed ? C.faint : C.text,
          textDecorationLine: task.completed ? 'line-through' : 'none',
        }}
        numberOfLines={1}
      >
        {task.title}
      </AppText>
      {task.due_date && (
        <View
          style={{
            backgroundColor: C.primaryFaint,
            borderRadius: 8,
            paddingHorizontal: 8,
            paddingVertical: 3,
            marginLeft: 8,
          }}
        >
          <AppText style={{ fontSize: 11, color: C.primary, fontWeight: '600' }}>
            {new Intl.DateTimeFormat(i18n.language, { month: 'short', day: 'numeric' }).format(
              new Date(task.due_date)
            )}
          </AppText>
        </View>
      )}
    </ScalePressable>
  );
});
