import React from 'react';
import { StyleSheet } from 'react-native';
import { fireEvent, render } from '@testing-library/react-native';
import useThemeStore from '../../store/themeStore';
import Button from '../../components/ui/Button';

beforeEach(() => {
  useThemeStore.getState().setStageTheme('theme-dark');
});

function flatStyle(node) {
  return StyleSheet.flatten(node.props.style);
}

describe('Button (mockup Welcome CTAs)', () => {
  test('primary is 52px cut bar with centered uppercase ink', () => {
    const { getByText, getByLabelText } = render(
      <Button title="Create Account" onPress={() => {}} />,
    );
    expect(flatStyle(getByLabelText('Create Account'))).toEqual(
      expect.objectContaining({
        height: 52,
        backgroundColor: 'transparent',
        overflow: 'hidden',
      }),
    );
    expect(flatStyle(getByText('Create Account'))).toEqual(
      expect.objectContaining({
        color: '#07163A',
        textTransform: 'uppercase',
        fontWeight: '800',
        textAlign: 'center',
        textAlignVertical: 'center',
        height: 52,
        lineHeight: 52,
        includeFontPadding: false,
      }),
    );
  });

  test('secondary is 52px cyan outline with centered sentence case', () => {
    const { getByText, getByLabelText } = render(
      <Button title="I already have an account" variant="secondary" onPress={() => {}} />,
    );
    expect(flatStyle(getByLabelText('I already have an account'))).toEqual(
      expect.objectContaining({
        height: 52,
        borderRadius: 14,
        borderColor: '#5FE3E8',
        backgroundColor: 'transparent',
      }),
    );
    expect(flatStyle(getByText('I already have an account'))).toEqual(
      expect.objectContaining({
        color: '#5FE3E8',
        textTransform: 'none',
        fontWeight: '600',
        textAlign: 'center',
        textAlignVertical: 'center',
        height: 52,
        lineHeight: 52,
        includeFontPadding: false,
      }),
    );
  });

  test('press fires when enabled', () => {
    const onPress = jest.fn();
    const { getByLabelText } = render(<Button title="Continue" onPress={onPress} />);
    fireEvent.press(getByLabelText('Continue'));
    expect(onPress).toHaveBeenCalled();
  });
});
