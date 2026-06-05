import React from 'react';
import { render } from '@testing-library/react-native';
import { SectionHeader } from '../../../src/components/settings/SectionHeader';

describe('SectionHeader', () => {
  it('renders title', () => {
    const { getByText } = render(<SectionHeader title="Test Section" />);
    expect(getByText('Test Section')).toBeTruthy();
  });
});
