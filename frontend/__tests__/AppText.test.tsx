import React from 'react';
import { render } from '@testing-library/react-native';
import { AppText } from '../src/components/AppText';

describe('AppText', () => {
  it('renders correctly with default props', () => {
    const { getByText } = render(<AppText>Default Text</AppText>);
    expect(getByText('Default Text')).toBeTruthy();
  });

  it('renders correctly with h1 variant', () => {
    const { getByText } = render(<AppText variant="h1">Heading 1</AppText>);
    expect(getByText('Heading 1')).toBeTruthy();
  });

  it('renders correctly with h2 variant', () => {
    const { getByText } = render(<AppText variant="h2">Heading 2</AppText>);
    expect(getByText('Heading 2')).toBeTruthy();
  });

  it('renders correctly with h3 variant', () => {
    const { getByText } = render(<AppText variant="h3">Heading 3</AppText>);
    expect(getByText('Heading 3')).toBeTruthy();
  });

  it('renders correctly with body variant', () => {
    const { getByText } = render(<AppText variant="body">Body Text</AppText>);
    expect(getByText('Body Text')).toBeTruthy();
  });

  it('renders correctly with bodySm variant', () => {
    const { getByText } = render(<AppText variant="bodySm">Body Small Text</AppText>);
    expect(getByText('Body Small Text')).toBeTruthy();
  });

  it('renders correctly with caption variant', () => {
    const { getByText } = render(<AppText variant="caption">Caption Text</AppText>);
    expect(getByText('Caption Text')).toBeTruthy();
  });

  it('renders correctly with primary color', () => {
    const { getByText } = render(<AppText color="primary">Primary Color Text</AppText>);
    expect(getByText('Primary Color Text')).toBeTruthy();
  });

  it('renders correctly with muted color', () => {
    const { getByText } = render(<AppText color="muted">Muted Color Text</AppText>);
    expect(getByText('Muted Color Text')).toBeTruthy();
  });

  it('renders correctly with disabled color', () => {
    const { getByText } = render(<AppText color="disabled">Disabled Color Text</AppText>);
    expect(getByText('Disabled Color Text')).toBeTruthy();
  });

  it('renders correctly with brand color', () => {
    const { getByText } = render(<AppText color="brand">Brand Color Text</AppText>);
    expect(getByText('Brand Color Text')).toBeTruthy();
  });

  it('renders correctly with white color', () => {
    const { getByText } = render(<AppText color="white">White Color Text</AppText>);
    expect(getByText('White Color Text')).toBeTruthy();
  });
});
