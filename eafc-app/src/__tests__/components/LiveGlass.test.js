import { splitLiveGlassStyle } from '../../components/theme/LiveGlass';

jest.mock('expo-blur', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    BlurView: ({ children, style }) => React.createElement(View, { style }, children),
  };
});

describe('LiveGlass clip', () => {
  test('keeps shadow on the outer shell and clips chrome inside the radius', () => {
    const { outer, inner, fillInner } = splitLiveGlassStyle({
      borderRadius: 16,
      borderWidth: 1,
      borderColor: '#00E8FF',
      backgroundColor: 'rgba(10,18,32,0.62)',
      padding: 12,
      justifyContent: 'space-between',
      flex: 1,
      minHeight: 88,
      elevation: 8,
      shadowColor: '#00E8FF',
      shadowOpacity: 0.3,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 5 },
    });

    expect(outer.elevation).toBe(8);
    expect(outer.shadowColor).toBe('#00E8FF');
    expect(outer.borderRadius).toBe(16);
    expect(outer.flex).toBe(1);
    expect(outer).not.toHaveProperty('borderWidth');
    expect(outer).not.toHaveProperty('padding');

    expect(inner.overflow).toBe('hidden');
    expect(inner.borderRadius).toBe(16);
    expect(inner.borderWidth).toBe(1);
    expect(inner.padding).toBe(12);
    expect(inner.justifyContent).toBe('space-between');
    expect(inner).not.toHaveProperty('elevation');
    expect(inner.minHeight).toBe(88);
    expect(fillInner).toBe(true);
  });
});
