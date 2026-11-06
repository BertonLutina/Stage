import React from 'react';
import { StyleSheet, View } from 'react-native';
import { render } from '@testing-library/react-native';
import CommonButton from '../../components/common/Button';
import { layoutClassName } from '../../lib/layoutClassName';

const flat = (node) => StyleSheet.flatten(node.props.style) || {};

describe('common Button legacy className', () => {
  test('layoutClassName keeps layout classes and drops visual ones', () => {
    expect(layoutClassName('mt-4 rounded-2xl py-3')).toBe('mt-4');
    expect(layoutClassName('mx-2 w-full flex-1 self-center bg-primary px-6 border text-white -mt-2'))
      .toBe('mx-2 w-full flex-1 self-center -mt-2');
    expect(layoutClassName('')).toBe('');
  });

  test('mt-4 rounded-2xl py-3 keeps the ui button 52 tall; only mt-4 reaches the wrapper', () => {
    const { getByLabelText, UNSAFE_getAllByType } = render(
      <CommonButton title="Go" className="mt-4 rounded-2xl py-3" onPress={() => {}} />,
    );
    const style = flat(getByLabelText('Go'));
    expect(style.height).toBe(52);
    expect(style.borderRadius).toBe(14);
    expect(style.paddingVertical).toBeUndefined();
    const classes = UNSAFE_getAllByType(View).map((v) => v.props.className).filter(Boolean);
    expect(classes).toEqual(['mt-4']);
  });

  test('no wrapper when the className has no layout classes', () => {
    const { UNSAFE_queryAllByType } = render(
      <CommonButton title="Go" className="py-3 rounded-2xl" onPress={() => {}} />,
    );
    expect(UNSAFE_queryAllByType(View).filter((v) => v.props.className)).toHaveLength(0);
  });
});
