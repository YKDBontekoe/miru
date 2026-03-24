import React from 'react';
import { render } from '@testing-library/react-native';
import { AppText } from '../src/components/AppText';

describe('AppText', () => {
  it('renders default body text', () => {
    const { getByText } = render(<AppText>Hello Miru</AppText>);
    expect(getByText('Hello Miru')).toBeTruthy();
  });

  it('renders variants correctly', () => {
    const { getByText: getByH1 } = render(<AppText variant="h1">Header 1</AppText>);
    expect(getByH1('Header 1')).toBeTruthy();

    const { getByText: getByH2 } = render(<AppText variant="h2">Header 2</AppText>);
    expect(getByH2('Header 2')).toBeTruthy();

    const { getByText: getByH3 } = render(<AppText variant="h3">Header 3</AppText>);
    expect(getByH3('Header 3')).toBeTruthy();

    const { getByText: getByCaption } = render(<AppText variant="caption">Caption text</AppText>);
    expect(getByCaption('Caption text')).toBeTruthy();
  });

  it('applies custom classes and styles', () => {
    const { getByText } = render(
      <AppText className="custom-class" style={{ opacity: 0.5 }}>
        Styled Text
      </AppText>
    );
    const element = getByText('Styled Text');
    expect(element.props.className).toContain('custom-class');
    // Ensure styles contain opacity 0.5, style could be a flat object or array of objects
    const hasOpacityStyle = Array.isArray(element.props.style)
      ? element.props.style.some((s: any) => s && s.opacity === 0.5)
      : element.props.style.opacity === 0.5;
    expect(hasOpacityStyle).toBe(true);
  });
});
