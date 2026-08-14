import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { SettingsListbox } from '../../components/settings/SettingsListbox';

jest.mock('expo-linear-gradient', () => {
  const React = require('react');
  const { View } = require('react-native');
  const LinearGradient = ({ children, style }) => React.createElement(View, { style }, children);
  return { LinearGradient };
});

const OPTIONS = [
  { id: 'en', label: 'English' },
  { id: 'fr', label: 'Français', description: 'French' },
  { id: 'nl', label: 'Nederlands' },
];

describe('SettingsListbox', () => {
  it('shows the current value and opens a bottom sheet of options', () => {
    const onChange = jest.fn();
    const { getByLabelText, getByText } = render(
      <SettingsListbox
        label="Language"
        value="en"
        options={OPTIONS}
        onChange={onChange}
      />,
    );

    expect(getByLabelText('Language, English')).toBeTruthy();
    fireEvent.press(getByLabelText('Language, English'));
    expect(getByText('Français')).toBeTruthy();
    expect(getByText('French')).toBeTruthy();
  });

  it('selects an option from the sheet and closes', () => {
    const onChange = jest.fn();
    const { getByLabelText, queryByText } = render(
      <SettingsListbox
        label="Language"
        value="en"
        options={OPTIONS}
        onChange={onChange}
      />,
    );

    fireEvent.press(getByLabelText('Language, English'));
    fireEvent.press(getByLabelText('Français'));

    expect(onChange).toHaveBeenCalledWith('fr', OPTIONS[1]);
    expect(queryByText('French')).toBeNull();
  });
});
