import React from 'react';
import { StyleSheet } from 'react-native';
import { render, fireEvent } from '@testing-library/react-native';
import useThemeStore from '../../../store/themeStore';
import {
  TextField,
  SelectField,
  SegmentedControl,
  Toggle,
  StepProgress,
  FormBadge,
  StatGrid,
} from '../../../components/ui';

jest.mock('@expo/vector-icons/Ionicons', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return { __esModule: true, default: ({ name }) => React.createElement(Text, null, name) };
});

const flat = (node) => StyleSheet.flatten(node.props.style) || {};

function useTheme(id) {
  const store = {};
  global.localStorage = {
    getItem: (key) => (Object.prototype.hasOwnProperty.call(store, key) ? store[key] : null),
    setItem: (key, value) => { store[String(key)] = String(value); },
    removeItem: (key) => { delete store[String(key)]; },
  };
  useThemeStore.getState().setStageTheme(id);
}

describe('ui primitives B', () => {
  beforeEach(() => useTheme('theme-dark'));

  describe('SegmentedControl', () => {
    const options = [
      { key: 'a', label: 'Alpha' },
      { key: 'b', label: 'Beta' },
    ];

    test('calls onChange with the option key', () => {
      const onChange = jest.fn();
      const { getByText } = render(<SegmentedControl options={options} value="a" onChange={onChange} />);
      fireEvent.press(getByText('Beta'));
      expect(onChange).toHaveBeenCalledWith('b');
    });

    test('highlights the active segment in cyan with onCyan text; track is bgDeep', () => {
      const { getByTestId, getByText } = render(
        <SegmentedControl testID="seg" options={options} value="a" onChange={() => {}} />,
      );
      expect(flat(getByTestId('seg')).backgroundColor).toBe('#07163A');
      expect(flat(getByTestId('seg-a')).backgroundColor).toBe('#4A6AA5');
      expect(flat(getByTestId('seg-b')).backgroundColor).not.toBe('#4A6AA5');
      expect(flat(getByText('Alpha')).color).toBe('#EAF2FF');
      expect(getByTestId('seg-a').props.accessibilityState.selected).toBe(true);
      expect(getByTestId('seg-b').props.accessibilityState.selected).toBe(false);
    });

    test('accessibilityLabel names the group as a radio group; without it the container stays plain', () => {
      const { getByLabelText, getByTestId, rerender } = render(
        <SegmentedControl testID="seg" accessibilityLabel="App Theme" options={options} value="a" onChange={() => {}} />,
      );
      expect(getByLabelText('App Theme').props.accessibilityRole).toBe('radiogroup');
      expect(getByLabelText('App Theme')).toBe(getByTestId('seg'));
      rerender(<SegmentedControl testID="seg" options={options} value="a" onChange={() => {}} />);
      expect(getByTestId('seg').props.accessibilityLabel).toBeUndefined();
      expect(getByTestId('seg').props.accessibilityRole).toBeUndefined();
    });

    test('a 40 character label is truncated on one line and segments are at least 44 high', () => {
      const long = 'L'.repeat(40);
      const { getByText, getByTestId } = render(
        <SegmentedControl testID="seg" options={[{ key: 'x', label: long }, ...options]} value="x" onChange={() => {}} />,
      );
      expect(getByText(long).props.numberOfLines).toBe(1);
      expect(flat(getByTestId('seg-x')).minHeight).toBeGreaterThanOrEqual(44);
    });
  });

  describe('StepProgress', () => {
    test('total 4, current 2 renders 2 filled and 2 empty bars', () => {
      const { getAllByTestId } = render(<StepProgress total={4} current={2} />);
      const bars = getAllByTestId(/^step-bar-/);
      expect(bars).toHaveLength(4);
      const filled = bars.filter((b) => flat(b).backgroundColor === '#4A6AA5');
      expect(filled).toHaveLength(2);
      expect(flat(bars[2]).backgroundColor).toBe('#234480');
    });

    test('defaults to 4 bars and clamps current', () => {
      const { getAllByTestId } = render(<StepProgress current={9} />);
      const bars = getAllByTestId(/^step-bar-/);
      expect(bars).toHaveLength(4);
      expect(bars.every((b) => flat(b).backgroundColor === '#4A6AA5')).toBe(true);
    });
  });

  describe('FormBadge', () => {
    test('W / D / L use success / muted / danger text colours', () => {
      const { getByText, rerender } = render(<FormBadge result="W" />);
      expect(flat(getByText('W')).color).toBe('#4ADE80');
      rerender(<FormBadge result="D" />);
      expect(flat(getByText('D')).color).toBe('#9FB3D1');
      rerender(<FormBadge result="L" />);
      expect(flat(getByText('L')).color).toBe('#F87171');
    });

    test('W and L sit on the success / danger background tokens', () => {
      const { getByTestId, rerender } = render(<FormBadge testID="fb" result="W" />);
      expect(flat(getByTestId('fb')).backgroundColor).toBe('#14532D');
      rerender(<FormBadge testID="fb" result="L" />);
      expect(flat(getByTestId('fb')).backgroundColor).toBe('#5B1A1A');
    });
  });

  describe('TextField', () => {
    test('has height 50, radius 12, bgDeep fill and border; accessibilityLabel is the label', () => {
      const { getByLabelText } = render(<TextField label="Email" value="" onChangeText={() => {}} />);
      const input = getByLabelText('Email');
      const style = flat(input);
      expect(style.height).toBe(50);
      expect(style.borderRadius).toBe(12);
      expect(style.backgroundColor).toBe('#07163A');
      expect(style.borderColor).toBe('#234480');
    });

    test('shows the error message and a danger border', () => {
      const { getByText, getByLabelText } = render(
        <TextField label="Email" value="" onChangeText={() => {}} error="Required" />,
      );
      expect(getByText('Required')).toBeTruthy();
      expect(flat(getByLabelText('Email')).borderColor).toBe('#F87171');
    });

    test('passes TextInput props through and reports changes', () => {
      const onChangeText = jest.fn();
      const { getByPlaceholderText } = render(
        <TextField label="Tag" value="" onChangeText={onChangeText} placeholder="Gamertag" autoCapitalize="none" />,
      );
      const input = getByPlaceholderText('Gamertag');
      expect(input.props.autoCapitalize).toBe('none');
      fireEvent.changeText(input, 'abc');
      expect(onChangeText).toHaveBeenCalledWith('abc');
    });

    test('multiline grows beyond 50 instead of using a fixed height', () => {
      const { getByLabelText } = render(<TextField label="Bio" value="" onChangeText={() => {}} multiline />);
      const style = flat(getByLabelText('Bio'));
      expect(style.height).toBeUndefined();
      expect(style.minHeight).toBeGreaterThanOrEqual(50);
    });

    test('a long label is truncated on one line', () => {
      const long = 'T'.repeat(60);
      const { getByText } = render(<TextField label={long} value="" onChangeText={() => {}} />);
      expect(getByText(long).props.numberOfLines).toBe(1);
    });
  });

  describe('SelectField', () => {
    test('shows the value, falls back to the placeholder, and fires onPress', () => {
      const onPress = jest.fn();
      const { getByText, queryByText, rerender } = render(
        <SelectField label="Country" placeholder="Pick one" onPress={onPress} />,
      );
      expect(getByText('Pick one')).toBeTruthy();
      rerender(<SelectField label="Country" value="Belgium" placeholder="Pick one" onPress={onPress} />);
      expect(getByText('Belgium')).toBeTruthy();
      expect(queryByText('Pick one')).toBeNull();
      fireEvent.press(getByText('Belgium'));
      expect(onPress).toHaveBeenCalledTimes(1);
    });

    test('is a 50 high button labelled by its label; long values truncate', () => {
      const long = 'V'.repeat(60);
      const { getByLabelText, getByText } = render(
        <SelectField label="Country" value={long} onPress={() => {}} />,
      );
      const node = getByLabelText('Country');
      expect(node.props.accessibilityRole).toBe('button');
      expect(flat(node).height).toBe(50);
      expect(flat(node).backgroundColor).toBe('#07163A');
      expect(getByText(long).props.numberOfLines).toBe(1);
    });
  });

  describe('SelectField accessibilityLabel', () => {
    test('overrides the label as the spoken name but keeps the visible label', () => {
      const { getByLabelText, getByText } = render(
        <SelectField label="Language" accessibilityLabel="Language, English" value="English" onPress={() => {}} />,
      );
      expect(getByLabelText('Language, English').props.accessibilityRole).toBe('button');
      expect(getByText('Language')).toBeTruthy();
    });

    test('does not announce the value twice when accessibilityLabel is supplied', () => {
      const { getByLabelText, rerender } = render(
        <SelectField label="Language" accessibilityLabel="Language, English" value="English" onPress={() => {}} />,
      );
      expect(getByLabelText('Language, English').props.accessibilityValue?.text).toBeUndefined();
      rerender(<SelectField label="Language" value="English" onPress={() => {}} />);
      expect(getByLabelText('Language').props.accessibilityValue).toEqual({ text: 'English' });
    });

    test('chevron is down by default and up while open', () => {
      const { getByText, queryByText, rerender } = render(
        <SelectField label="Country" value="BE" onPress={() => {}} />,
      );
      expect(getByText('chevron-down')).toBeTruthy();
      expect(queryByText('chevron-up')).toBeNull();
      rerender(<SelectField label="Country" value="BE" open onPress={() => {}} />);
      expect(getByText('chevron-up')).toBeTruthy();
      expect(queryByText('chevron-down')).toBeNull();
    });
  });

  describe('Toggle', () => {
    test('press calls onValueChange with the opposite value', () => {
      const onValueChange = jest.fn();
      const { getByLabelText, rerender } = render(
        <Toggle value={false} onValueChange={onValueChange} accessibilityLabel="Notifications" />,
      );
      fireEvent.press(getByLabelText('Notifications'));
      expect(onValueChange).toHaveBeenLastCalledWith(true);
      rerender(<Toggle value onValueChange={onValueChange} accessibilityLabel="Notifications" />);
      fireEvent.press(getByLabelText('Notifications'));
      expect(onValueChange).toHaveBeenLastCalledWith(false);
    });

    test('is a switch exposing its checked state; on track is cyan', () => {
      const { getByLabelText, rerender } = render(
        <Toggle value onValueChange={() => {}} accessibilityLabel="Notifications" />,
      );
      const node = getByLabelText('Notifications');
      expect(node.props.accessibilityRole).toBe('switch');
      expect(node.props.accessibilityState.checked).toBe(true);
      expect(flat(node).backgroundColor).toBe('#4A6AA5');
      rerender(<Toggle value={false} onValueChange={() => {}} accessibilityLabel="Notifications" />);
      expect(getByLabelText('Notifications').props.accessibilityState.checked).toBe(false);
      expect(flat(getByLabelText('Notifications')).backgroundColor).not.toBe('#4A6AA5');
    });
  });

  describe('Toggle disabled', () => {
    test('disabled ignores presses, is dimmed and exposes disabled state', () => {
      const onValueChange = jest.fn();
      const { getByLabelText, rerender } = render(
        <Toggle value={false} disabled onValueChange={onValueChange} accessibilityLabel="Push" />,
      );
      const node = getByLabelText('Push');
      fireEvent.press(node);
      expect(onValueChange).not.toHaveBeenCalled();
      expect(node.props.accessibilityState).toEqual({ checked: false, disabled: true });
      expect(flat(node).opacity).toBe(0.5);
      rerender(<Toggle value={false} onValueChange={onValueChange} accessibilityLabel="Push" />);
      const enabled = getByLabelText('Push');
      expect(enabled.props.accessibilityState).toEqual({ checked: false, disabled: false });
      expect(flat(enabled).opacity).toBe(1);
      fireEvent.press(enabled);
      expect(onValueChange).toHaveBeenCalledWith(true);
    });
  });

  describe('StatGrid', () => {
    const items = [1, 2, 3, 4, 5].map((n) => ({ label: `L${n}`, value: `V${n}` }));

    test('5 items with columns 3 yield 2 rows', () => {
      const { getAllByTestId } = render(<StatGrid items={items} columns={3} />);
      expect(getAllByTestId(/^stat-row-/)).toHaveLength(2);
    });

    test('defaults to 3 columns and renders every label and value', () => {
      const { getAllByTestId, getByText } = render(<StatGrid items={items} />);
      expect(getAllByTestId(/^stat-row-/)).toHaveLength(2);
      items.forEach((i) => {
        expect(getByText(i.label)).toBeTruthy();
        expect(getByText(i.value)).toBeTruthy();
      });
    });

    test('long values and labels truncate on one line; short rows keep column widths', () => {
      const long = '1234567890123456';
      const { getByText, getAllByTestId } = render(
        <StatGrid items={[{ label: 'Total balance in STC', value: long }]} columns={3} />,
      );
      expect(getByText(long).props.numberOfLines).toBe(1);
      expect(getByText('Total balance in STC').props.numberOfLines).toBe(1);
      const cells = getAllByTestId(/^stat-cell-/);
      expect(flat(cells[0]).flex).toBe(1);
    });

    test('renders nothing for an empty list', () => {
      const { queryAllByTestId } = render(<StatGrid items={[]} />);
      expect(queryAllByTestId(/^stat-row-/)).toHaveLength(0);
    });
  });

  describe('Live Dark', () => {
    test('every batch B component renders on live tokens using token colours only', () => {
      useTheme('theme-video');
      const t = useThemeStore.getState().tokens;
      expect(t.live).toBe(true);
      const { getByLabelText, getByTestId, getAllByTestId, getByText } = render(
        <>
          <TextField label="Tag" value="" onChangeText={() => {}} />
          <SelectField label="Country" value="BE" onPress={() => {}} />
          <SegmentedControl testID="seg" options={[{ key: 'a', label: 'A' }, { key: 'b', label: 'B' }]} value="a" onChange={() => {}} />
          <Toggle value accessibilityLabel="Notify" onValueChange={() => {}} />
          <StepProgress total={4} current={2} />
          <FormBadge testID="fb" result="W" />
          <StatGrid items={[{ label: 'Goals', value: '9' }]} />
        </>,
      );
      expect(flat(getByLabelText('Tag')).backgroundColor).toBe(t.bgDeep);
      expect(flat(getByLabelText('Country')).backgroundColor).toBe(t.bgDeep);
      expect(flat(getByTestId('seg')).backgroundColor).toBe(t.bgDeep);
      expect(flat(getByTestId('seg-a')).backgroundColor).toBe(t.cyan);
      expect(flat(getByLabelText('Notify')).backgroundColor).toBe(t.cyan);
      const bars = getAllByTestId(/^step-bar-/);
      expect(bars.filter((b) => flat(b).backgroundColor === t.cyan)).toHaveLength(2);
      expect(flat(bars[3]).backgroundColor).toBe(t.border);
      expect(flat(getByTestId('fb')).backgroundColor).toBe(t.successBg);
      expect(flat(getByText('Goals')).color).toBe(t.muted);
    });
  });
});
