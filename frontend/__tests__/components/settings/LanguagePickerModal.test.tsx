import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { LanguagePickerModal } from '../../../src/components/settings/LanguagePickerModal';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

describe('LanguagePickerModal', () => {
  it('renders and handles interactions', () => {
    const onSelect = jest.fn();
    const onClose = jest.fn();

    const { getByText, getAllByText } = render(
      <LanguagePickerModal
        visible={true}
        currentLang="en"
        onSelect={onSelect}
        onClose={onClose}
      />
    );

    expect(getByText('settings.items.language')).toBeTruthy();
    expect(getAllByText('English').length).toBeGreaterThan(0);
    expect(getByText('Nederlands')).toBeTruthy();

    fireEvent.press(getByText('Nederlands'));
    expect(onSelect).toHaveBeenCalledWith('nl');
  });
});
