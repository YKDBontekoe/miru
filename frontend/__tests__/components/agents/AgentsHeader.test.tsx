import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { AgentsHeader } from '../../../src/components/agents/AgentsHeader';

describe('AgentsHeader', () => {
  it('renders and handles interactions', () => {
    const onViewModeChange = jest.fn();
    const onShowTemplates = jest.fn();
    const onShowCreate = jest.fn();

    const { getByText } = render(
      <AgentsHeader
        agentsCount={3}
        viewMode="grid"
        onViewModeChange={onViewModeChange}
        onShowTemplates={onShowTemplates}
        onShowCreate={onShowCreate}
      />
    );

    expect(getByText('Personas')).toBeTruthy();
    expect(getByText('3 personas')).toBeTruthy();

    fireEvent.press(getByText('New'));
    expect(onShowCreate).toHaveBeenCalled();
  });
});
