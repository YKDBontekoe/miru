import React from 'react';
import { render } from '@testing-library/react-native';
import { TypingIndicator } from '../src/components/TypingIndicator';

describe('TypingIndicator', () => {
  it('renders without crashing', () => {
    const { toJSON } = render(<TypingIndicator />);
    expect(toJSON()).toBeTruthy();
  });

  it('renders with custom dot color', () => {
    const { toJSON } = render(<TypingIndicator dotColor="#FF0000" />);
    expect(toJSON()).toBeTruthy();
  });
});
