import React from 'react';
import { render } from '@testing-library/react-native';
import { AgentActivityIndicator } from '../src/components/AgentActivityIndicator';

describe('AgentActivityIndicator', () => {
  it('renders correctly with thinking activity', () => {
    const { getByText } = render(
      <AgentActivityIndicator
        activity={{
          activity: 'thinking',
          agent_names: ['Agent 1', 'Agent 2'],
          detail: 'Processing request...',
        }}
      />
    );
    expect(getByText('Agent 1, Agent 2')).toBeTruthy();
    expect(getByText('thinking')).toBeTruthy();
  });

  it('renders correctly with using_tool activity and detail', () => {
    const { getByText } = render(
      <AgentActivityIndicator
        activity={{
          activity: 'using_tool',
          agent_names: ['Tool Agent'],
          detail: 'Searching database',
        }}
      />
    );
    expect(getByText('Tool Agent')).toBeTruthy();
    expect(getByText('working')).toBeTruthy();
    expect(getByText('Searching database')).toBeTruthy();
  });

  it('renders correctly with done activity', () => {
    const { getByText } = render(
      <AgentActivityIndicator
        activity={{
          activity: 'done',
          agent_names: ['Agent 3'],
        }}
      />
    );
    expect(getByText('Agent 3')).toBeTruthy();
    expect(getByText('done')).toBeTruthy();
  });
});
