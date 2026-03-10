import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import Button from '../../components/common/Button';

describe('Button component', () => {
  it('renders the title text', () => {
    const { getByText } = render(<Button title="Click me" onPress={() => {}} />);
    expect(getByText('Click me')).toBeTruthy();
  });

  it('calls onPress when tapped', () => {
    const onPress = jest.fn();
    const { getByText } = render(<Button title="Tap" onPress={onPress} />);
    fireEvent.press(getByText('Tap'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('does not call onPress when disabled', () => {
    const onPress = jest.fn();
    const { getByText } = render(<Button title="Disabled" onPress={onPress} disabled />);
    fireEvent.press(getByText('Disabled'));
    expect(onPress).not.toHaveBeenCalled();
  });

  it('shows ActivityIndicator when loading (title hidden)', () => {
    const { queryByText } = render(<Button title="Loading" onPress={() => {}} loading />);
    expect(queryByText('Loading')).toBeNull();
  });

  it('does not call onPress when loading', () => {
    const onPress = jest.fn();
    const { UNSAFE_root } = render(<Button title="Loading" onPress={onPress} loading />);
    expect(onPress).not.toHaveBeenCalled();
  });

  it('renders primary text style by default', () => {
    const { getByText } = render(<Button title="Primary" onPress={() => {}} />);
    const text = getByText('Primary');
    expect(text.props.className).toContain('text-dark');
  });

  it('renders outline variant text style', () => {
    const { getByText } = render(<Button title="Outline" onPress={() => {}} variant="outline" />);
    expect(getByText('Outline').props.className).toContain('text-primary');
  });

  it('renders danger variant text style', () => {
    const { getByText } = render(<Button title="Delete" onPress={() => {}} variant="danger" />);
    expect(getByText('Delete').props.className).toContain('text-white');
  });
});
