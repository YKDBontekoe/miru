import React from 'react';
import { render } from '@testing-library/react-native';
import { AppText } from '../src/components/AppText';

describe('AppText Component', () => {
  it('renders default variant correctly', () => {
    const { getByText } = render(<AppText>Hello</AppText>);
    const textElement = getByText('Hello');
    expect(textElement.props.className).toContain('text-base');
  });

  it('renders bodySm variant correctly', () => {
    const { getByText } = render(<AppText variant="bodySm">Hello</AppText>);
    const textElement = getByText('Hello');
    expect(textElement.props.className).toContain('text-sm');
  });

  it('renders h1 variant correctly', () => {
    const { getByText } = render(<AppText variant="h1">Hello</AppText>);
    const textElement = getByText('Hello');
    expect(textElement.props.className).toContain('text-3xl');
  });

  it('renders h2 variant correctly', () => {
    const { getByText } = render(<AppText variant="h2">Hello</AppText>);
    const textElement = getByText('Hello');
    expect(textElement.props.className).toContain('text-2xl');
  });

  it('renders h3 variant correctly', () => {
    const { getByText } = render(<AppText variant="h3">Hello</AppText>);
    const textElement = getByText('Hello');
    expect(textElement.props.className).toContain('text-xl');
  });

  it('renders caption variant correctly', () => {
    const { getByText } = render(<AppText variant="caption">Hello</AppText>);
    const textElement = getByText('Hello');
    expect(textElement.props.className).toContain('text-xs');
  });

  it('renders default primary color correctly', () => {
    const { getByText } = render(<AppText>Hello</AppText>);
    const textElement = getByText('Hello');
    // Using string stringify for exact class matching
    expect(textElement.props.className).toContain('text-onSurface-light');
  });

  it('renders disabled color correctly', () => {
    const { getByText } = render(<AppText color="disabled">Hello</AppText>);
    const textElement = getByText('Hello');
    expect(textElement.props.className).toContain('text-onSurface-disabledLight');
  });

  it('renders muted color correctly', () => {
    const { getByText } = render(<AppText color="muted">Hello</AppText>);
    const textElement = getByText('Hello');
    expect(textElement.props.className).toContain('text-onSurface-mutedLight');
  });

  it('renders brand color correctly', () => {
    const { getByText } = render(<AppText color="brand">Hello</AppText>);
    const textElement = getByText('Hello');
    expect(textElement.props.className).toContain('text-primary');
  });
});
