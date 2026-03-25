import React from 'react';
import { render } from '@testing-library/react-native';
import { AppText } from '../src/components/AppText';

describe('AppText', () => {
  it('renders correctly with default props', () => {
    const { getByText } = render(<AppText>Hello World</AppText>);
    expect(getByText('Hello World')).toBeTruthy();
  });

  it('applies brand color correctly', () => {
    const { getByText } = render(<AppText color="brand">Brand Text</AppText>);
    const textElement = getByText('Brand Text');
    expect(textElement.props.style).toEqual(
      expect.arrayContaining([expect.objectContaining({ color: '#2563EB' })])
    );
  });

  it('applies variant typography correctly', () => {
    const { getByText } = render(<AppText variant="h1">H1 Text</AppText>);
    const textElement = getByText('H1 Text');
    expect(textElement.props.style).toEqual(
      expect.arrayContaining([expect.objectContaining({ fontSize: 32, fontWeight: 'bold' })])
    );
  });

  it('applies muted color correctly', () => {
    const { getByText } = render(<AppText color="muted">Muted</AppText>);
    expect(getByText('Muted')).toBeTruthy();
  });

  it('applies disabled color correctly', () => {
    const { getByText } = render(<AppText color="disabled">Disabled</AppText>);
    expect(getByText('Disabled')).toBeTruthy();
  });
});
