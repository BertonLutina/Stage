import React from 'react';
import { StyleSheet } from 'react-native';
import { render, fireEvent } from '@testing-library/react-native';
import {
  AMBER,
  CYAN,
  GAMER_BG,
  PITCH,
  CyanCta,
  GamerClubTabNav,
  GamerSectionCard,
  GamerTabNav,
  GlassIconButton,
  iconButtonLabel,
  IdentityRail,
  statAccentColor,
} from '../../components/profile/gamer/GamerProfileUI';
import { STAGE_PALETTE } from '../../lib/stageTheme';

jest.mock('expo-linear-gradient', () => {
  const React = require('react');
  const { View } = require('react-native');
  return { LinearGradient: ({ children, style }) => React.createElement(View, { style }, children) };
});

describe('GamerProfileUI on the Stage palette', () => {
  test('legacy colour exports keep their names and carry Stage palette values', () => {
    expect(GAMER_BG).toBe(STAGE_PALETTE.bg);
    expect(CYAN).toBe(STAGE_PALETTE.cyan);
    expect(AMBER).toBe(STAGE_PALETTE.warning);
    expect(PITCH).toBe(STAGE_PALETTE.bgDeep);
  });

  test('statAccentColor maps accents to tokens', () => {
    const tokens = { amber: 'a', success: 's', danger: 'd', cyanHi: 'h', cyan: 'c' };
    expect(statAccentColor('gold', tokens)).toBe('a');
    expect(statAccentColor('green', tokens)).toBe('s');
    expect(statAccentColor('rose', tokens)).toBe('d');
    expect(statAccentColor('violet', tokens)).toBe('h');
    expect(statAccentColor(undefined, tokens)).toBe('c');
  });

  test('tabs are cyan pills that report selection and change', () => {
    const onChange = jest.fn();
    const { getByText, getAllByRole } = render(
      <GamerTabNav
        tabs={[{ id: 'a', label: 'Alpha' }, { id: 'b', label: 'Beta', badge: 3 }]}
        active="a"
        onChange={onChange}
      />,
    );
    const tabs = getAllByRole('tab');
    expect(tabs).toHaveLength(2);
    expect(tabs[0].props.accessibilityState.selected).toBe(true);
    expect(tabs[1].props.accessibilityState.selected).toBe(false);
    fireEvent.press(getByText('Beta'));
    expect(onChange).toHaveBeenCalledWith('b');
    // Active pill is solid cyan, the inactive one sits on the card with a border.
    const activeStyle = StyleSheet.flatten(tabs[0].props.style);
    const inactiveStyle = StyleSheet.flatten(tabs[1].props.style);
    expect(activeStyle).toMatchObject({ height: 34, backgroundColor: STAGE_PALETTE.cyan });
    expect(inactiveStyle).toMatchObject({ height: 34, backgroundColor: STAGE_PALETTE.card });
  });

  test('inactive count badge uses the readable text token, the active one keeps cyan on onCyan', () => {
    const { getByText, rerender } = render(
      <GamerTabNav tabs={[{ id: 'b', label: 'Beta', badge: 3 }]} active="x" />,
    );
    expect(StyleSheet.flatten(getByText('3').props.style).color).toBe('#EAF2FF');
    expect(StyleSheet.flatten(getByText('3').props.style).color).not.toBe(STAGE_PALETTE.onCyan);
    rerender(<GamerTabNav tabs={[{ id: 'b', label: 'Beta', badge: 3 }]} active="b" />);
    expect(StyleSheet.flatten(getByText('3').props.style).color).toBe(STAGE_PALETTE.cyan);
  });

  test('club tab groups switch to the first tab of the pressed group', () => {
    const onChange = jest.fn();
    const { getByText } = render(
      <GamerClubTabNav
        groups={[{ label: 'Posts', tabs: ['posts'] }, { label: 'Squad', tabs: ['squad'] }]}
        activeTab="posts"
        onChange={onChange}
      />,
    );
    fireEvent.press(getByText('Squad'));
    expect(onChange).toHaveBeenCalledWith('squad');
  });

  test('identity rail hides for one identity and selects through the segmented control', () => {
    const onChange = jest.fn();
    const one = render(<IdentityRail items={[{ id: 'player', label: 'Player' }]} value="player" onChange={onChange} />);
    expect(one.toJSON()).toBeNull();
    one.unmount();

    const { getByLabelText } = render(
      <IdentityRail
        items={[{ id: 'player', label: 'Player' }, { id: 'club', label: 'Club' }]}
        value="player"
        onChange={onChange}
      />,
    );
    fireEvent.press(getByLabelText('Club'));
    expect(onChange).toHaveBeenCalledWith('club');
  });

  test('primary call to action is the 52px Stage button', () => {
    const onPress = jest.fn();
    const { getByLabelText } = render(<CyanCta label="Sign" onPress={onPress} />);
    const button = getByLabelText('Sign');
    fireEvent.press(button);
    expect(onPress).toHaveBeenCalled();
    const face = button.children[0];
    const faceStyle = StyleSheet.flatten(face.props.style);
    expect(faceStyle.height).toBe(52);
    expect(faceStyle.borderRadius).toBe(14);
    expect(faceStyle.backgroundColor).toBe(STAGE_PALETTE.cyan);
  });

  test('section card renders its title as a label above the content', () => {
    const { getByText } = render(
      <GamerSectionCard title="Club Career"><React.Fragment>{null}</React.Fragment></GamerSectionCard>,
    );
    expect(getByText('Club Career')).toBeTruthy();
  });

  test('glass icon buttons get a default accessibility label from their icon', () => {
    const { getByLabelText, rerender } = render(<GlassIconButton icon="arrow-back" onPress={() => {}} />);
    expect(getByLabelText('Back')).toBeTruthy();
    rerender(<GlassIconButton icon="close" onPress={() => {}} />);
    expect(getByLabelText('Close')).toBeTruthy();
    rerender(<GlassIconButton icon="trash-outline" onPress={() => {}} />);
    expect(getByLabelText('Delete')).toBeTruthy();
    rerender(<GlassIconButton icon="arrow-back" onPress={() => {}} accessibilityLabel="Go home" />);
    expect(getByLabelText('Go home')).toBeTruthy();
  });

  test('iconButtonLabel falls back to a humanised icon name', () => {
    expect(iconButtonLabel('football-outline')).toBe('Football');
    expect(iconButtonLabel('people-circle')).toBe('People circle');
    expect(iconButtonLabel('arrow-back', 'Custom')).toBe('Custom');
    expect(iconButtonLabel(undefined)).toBeUndefined();
  });
});
