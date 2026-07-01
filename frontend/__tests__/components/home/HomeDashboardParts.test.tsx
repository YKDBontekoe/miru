import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { HomeSectionHeader, HomeActionTile, HomeTaskRow, HomeChatRow, HomeAgentBadge, HomeHeroCard, HomeSurfaceCard } from '../../../src/components/home/HomeDashboardParts';

jest.mock('../../../src/components/home/homeUtils', () => ({
  relativeTimeFromNow: jest.fn(() => '2 hours ago'),
}));

jest.mock('nativewind', () => ({
  useColorScheme: jest.fn().mockReturnValue({ colorScheme: 'light' }),
}));

describe('HomeDashboardParts', () => {
  describe('HomeSectionHeader', () => {
    it('renders title correctly', () => {
      const { getByText } = render(<HomeSectionHeader title="My Title" />);
      expect(getByText('My Title')).toBeTruthy();
    });

    it('renders action label and triggers onAction', () => {
      const onAction = jest.fn();
      const { getByText } = render(<HomeSectionHeader title="My Title" actionLabel="See All" onAction={onAction} />);
      const actionBtn = getByText('See All');
      expect(actionBtn).toBeTruthy();
      fireEvent.press(actionBtn);
      expect(onAction).toHaveBeenCalled();
    });
  });

  describe('HomeActionTile', () => {
    it('renders label and handles press', () => {
      const onPress = jest.fn();
      const { getByText } = render(<HomeActionTile label="Tile Label" icon="add" onPress={onPress} />);
      const label = getByText('Tile Label');
      expect(label).toBeTruthy();
      fireEvent.press(label);
      expect(onPress).toHaveBeenCalled();
    });
  });

  describe('HomeTaskRow', () => {
    it('renders task correctly', () => {
      const onToggle = jest.fn();
      const task = { id: '1', title: 'Task 1', completed: false, due_date: '2025-01-01' } as any;
      const { getByText } = render(<HomeTaskRow task={task} onToggle={onToggle} />);
      expect(getByText('Task 1')).toBeTruthy();
      expect(getByText('Jan 1')).toBeTruthy();
      fireEvent.press(getByText('Task 1'));
      expect(onToggle).toHaveBeenCalled();
    });

    it('renders completed task correctly', () => {
      const onToggle = jest.fn();
      const task = { id: '1', title: 'Task 1', completed: true } as any;
      const { getByText } = render(<HomeTaskRow task={task} onToggle={onToggle} />);
      expect(getByText('Task 1')).toBeTruthy();
    });
  });

  describe('HomeChatRow', () => {
    it('renders chat room correctly', () => {
      const onPress = jest.fn();
      const t = (key: string) => key;
      const room = { id: '1', name: 'General', updated_at: '2025-01-01' } as any;
      const { getByText } = render(<HomeChatRow room={room} onPress={onPress} t={t} />);
      expect(getByText('General')).toBeTruthy();
      expect(getByText('G')).toBeTruthy();
      expect(getByText('home.actions.tap_to_continue')).toBeTruthy();
      expect(getByText('2 hours ago')).toBeTruthy();
      fireEvent.press(getByText('General'));
      expect(onPress).toHaveBeenCalled();
    });
  });

  describe('HomeAgentBadge', () => {
    it('renders agent badge correctly', () => {
      const onPress = jest.fn();
      const agent = { id: '1', name: 'Agent Smith', message_count: 5 } as any;
      const { getByText } = render(<HomeAgentBadge agent={agent} onPress={onPress} />);
      expect(getByText('Agent Smith')).toBeTruthy();
      expect(getByText('5 messages')).toBeTruthy();
      expect(getByText('A')).toBeTruthy();
      fireEvent.press(getByText('Agent Smith'));
      expect(onPress).toHaveBeenCalled();
    });

    it('renders agent badge correctly with 1 message', () => {
      const agent = { id: '1', name: 'Agent', message_count: 1 } as any;
      const { getByText } = render(<HomeAgentBadge agent={agent} onPress={jest.fn()} />);
      expect(getByText('1 message')).toBeTruthy();
    });
  });

  describe('HomeHeroCard', () => {
    it('renders hero card correctly', () => {
      const onSettingsPress = jest.fn();
      const t = (key: string, opts: any) => opts?.defaultValue || key;
      const { getByText } = render(
        <HomeHeroCard
          greeting="Good morning"
          firstName="Alice"
          dateText="Today is Monday"
          initials="AL"
          todayTaskCount={2}
          completionRate={50}
          onSettingsPress={onSettingsPress}
          t={t}
        />
      );

      expect(getByText('Good morning')).toBeTruthy();
      expect(getByText('Alice')).toBeTruthy();
      expect(getByText('Today is Monday')).toBeTruthy();
      expect(getByText('AL')).toBeTruthy();
      expect(getByText('{{count}} tasks due today')).toBeTruthy();
      expect(getByText('50% complete')).toBeTruthy();

      fireEvent.press(getByText('AL'));
      expect(onSettingsPress).toHaveBeenCalled();
    });

    it('renders hero card with 0 tasks', () => {
      const t = (key: string, opts: any) => opts?.defaultValue || key;
      const { getByText } = render(
        <HomeHeroCard
          greeting="Hi"
          firstName="Bob"
          dateText="Date"
          initials="BO"
          todayTaskCount={0}
          completionRate={100}
          onSettingsPress={jest.fn()}
          t={t}
        />
      );

      expect(getByText('No deadlines today')).toBeTruthy();
    });
  });

  describe('HomeSurfaceCard', () => {
    it('renders children correctly', () => {
      const { getByText } = render(<HomeSurfaceCard><HomeSectionHeader title="Surface Title" /></HomeSurfaceCard>);
      expect(getByText('Surface Title')).toBeTruthy();
    });
  });
});
