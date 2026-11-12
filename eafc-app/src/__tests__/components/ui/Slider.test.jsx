import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { Slider } from '../../../components/ui';

jest.mock('expo-linear-gradient', () => {
  const ReactModule = require('react');
  const { View } = require('react-native');
  return { LinearGradient: ({ children, style }) => ReactModule.createElement(View, { style }, children) };
});

function setup(props = {}) {
  const onChange = jest.fn();
  const utils = render(
    <Slider accessibilityLabel="Blur" min={0} max={16} step={1} value={4} onChange={onChange} {...props} />,
  );
  const track = utils.getByTestId('slider-track');
  fireEvent(track, 'layout', { nativeEvent: { layout: { x: 0, y: 0, width: 200, height: 44 } } });
  return { ...utils, track, onChange };
}

describe('Slider', () => {
  test('exposes an adjustable control with its range and value', () => {
    const { getByLabelText } = setup({ valueText: '4 px' });
    const node = getByLabelText('Blur');
    expect(node.props.accessibilityRole).toBe('adjustable');
    expect(node.props.accessibilityValue).toEqual({ min: 0, max: 16, now: 4, text: '4 px' });
  });

  test('screen readers can step it up and down, clamped to the range', () => {
    const { getByLabelText, onChange } = setup({ value: 15, step: 2 });
    const node = getByLabelText('Blur');
    fireEvent(node, 'accessibilityAction', { nativeEvent: { actionName: 'increment' } });
    expect(onChange).toHaveBeenLastCalledWith(16);
    fireEvent(node, 'accessibilityAction', { nativeEvent: { actionName: 'decrement' } });
    expect(onChange).toHaveBeenLastCalledWith(14);
  });

  test('touching the track picks the value under the finger, snapped to the step', () => {
    const { track, onChange } = setup();
    fireEvent(track, 'responderGrant', { nativeEvent: { locationX: 100 } });
    expect(onChange).toHaveBeenLastCalledWith(8);
    fireEvent(track, 'responderMove', { nativeEvent: { locationX: 200 } });
    expect(onChange).toHaveBeenLastCalledWith(16);
    fireEvent(track, 'responderMove', { nativeEvent: { locationX: -40 } });
    expect(onChange).toHaveBeenLastCalledWith(0);
  });

  test('a decimal step stays on the grid', () => {
    const { track, onChange } = setup({ min: 0, max: 1, step: 0.05, value: 0.2 });
    fireEvent(track, 'responderGrant', { nativeEvent: { locationX: 73 } });
    expect(onChange).toHaveBeenLastCalledWith(0.35);
  });

  test('disabled ignores touches', () => {
    const { track, onChange } = setup({ disabled: true });
    fireEvent(track, 'responderGrant', { nativeEvent: { locationX: 100 } });
    expect(onChange).not.toHaveBeenCalled();
  });

  test('the touch target is at least 44 high', () => {
    const { track } = setup();
    const style = Object.assign({}, ...[].concat(track.props.style).flat(Infinity).filter(Boolean));
    expect(style.height).toBeGreaterThanOrEqual(44);
  });
});
