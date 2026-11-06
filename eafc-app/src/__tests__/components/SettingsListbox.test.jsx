import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';
import useThemeStore from '../../store/themeStore';
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

  it('looks like the Stage SelectField: 50 high, radius 12, bgDeep, truncating', () => {
    const long = 'L'.repeat(80);
    const { getByLabelText, getByText } = render(
      <SettingsListbox label="Timezone" value="x" options={[{ id: 'x', label: long }]} />,
    );
    const field = StyleSheet.flatten(getByLabelText(`Timezone, ${long}`).props.style);
    const tokens = useThemeStore.getState().tokens;
    expect(field.height).toBe(50);
    expect(field.borderRadius).toBe(12);
    expect(field.backgroundColor).toBe(tokens.bgDeep);
    expect(getByText(long).props.numberOfLines).toBe(1);
  });

  it('shows the placeholder when nothing is selected and skips disabled options', () => {
    const onChange = jest.fn();
    const options = [{ id: 'a', label: 'Alpha' }, { id: 'b', label: 'Beta', disabled: true }];
    const { getByLabelText, getByText } = render(
      <SettingsListbox label="Pick" placeholder="Choose one" options={options} onChange={onChange} />,
    );
    expect(getByText('Choose one')).toBeTruthy();
    fireEvent.press(getByLabelText('Pick, Choose one'));
    fireEvent.press(getByLabelText('Beta'));
    expect(onChange).not.toHaveBeenCalled();
    fireEvent.press(getByLabelText('Alpha'));
    expect(onChange).toHaveBeenCalledWith('a', options[0]);
  });

  it('adds a search field for long lists and filters them', () => {
    const options = Array.from({ length: 12 }, (_, i) => ({ id: `o${i}`, label: `Option ${i}` }));
    const { getByLabelText, getByText, queryByText } = render(
      <SettingsListbox label="Many" value="o0" options={options} />,
    );
    fireEvent.press(getByLabelText('Many, Option 0'));
    fireEvent.changeText(getByLabelText('Search…'), 'Option 11');
    expect(getByText('Option 11')).toBeTruthy();
    expect(queryByText('Option 3')).toBeNull();
  });

  it('keeps its 12px trailing gap unless flush', () => {
    const { toJSON, rerender } = render(<SettingsListbox label="A" value="x" options={[{ id: 'x', label: 'X' }]} />);
    expect(StyleSheet.flatten(toJSON().props.style)).toEqual({ marginBottom: 12 });
    rerender(<SettingsListbox flush label="A" value="x" options={[{ id: 'x', label: 'X' }]} />);
    expect(toJSON().props.style).toBeFalsy();
  });
});
