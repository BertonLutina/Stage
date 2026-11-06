import React from 'react';
import { StyleSheet } from 'react-native';
import { render } from '@testing-library/react-native';
import BrandLogo from '../../components/ui/BrandLogo';

const lockup = require('../../../assets/brand/stage-logo.png');
const mark = require('../../../assets/brand/stage-icon.png');

describe('BrandLogo', () => {
  test('lockup variant renders the Stage wordmark at the width, keeping aspect ratio', () => {
    const { getByTestId } = render(<BrandLogo variant="lockup" width={320} testID="logo" />);
    const img = getByTestId('logo');
    expect(img.props.source).toBe(lockup);
    expect(img.props.accessibilityLabel).toBe('Stage');
    const style = StyleSheet.flatten(img.props.style);
    expect(style.width).toBe(320);
    expect(style.height).toBeCloseTo((320 * 304) / 1600, 1);
  });

  test('mark variant uses the stadium mark and its own aspect ratio', () => {
    const { getByTestId } = render(<BrandLogo variant="mark" width={100} testID="logo" />);
    const img = getByTestId('logo');
    expect(img.props.source).toBe(mark);
    const style = StyleSheet.flatten(img.props.style);
    expect(style.height).toBeCloseTo((100 * 220) / 461, 1);
  });

  test('defaults to the lockup variant', () => {
    const { getByTestId } = render(<BrandLogo width={200} testID="logo" />);
    expect(getByTestId('logo').props.source).toBe(lockup);
  });
});
