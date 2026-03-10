import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import Input from '../../components/common/Input';

describe('Input component', () => {
  it('renders with a label', () => {
    const { getByText } = render(<Input label="Email" value="" onChangeText={() => {}} />);
    expect(getByText('Email')).toBeTruthy();
  });

  it('does not render label when prop is absent', () => {
    const { queryByText } = render(<Input value="" onChangeText={() => {}} />);
    expect(queryByText('Email')).toBeNull();
  });

  it('displays error message when error prop provided', () => {
    const { getByText } = render(<Input value="" onChangeText={() => {}} error="Required field" />);
    expect(getByText('Required field')).toBeTruthy();
  });

  it('does not display error text when error is absent', () => {
    const { queryByText } = render(<Input value="" onChangeText={() => {}} />);
    expect(queryByText('Required field')).toBeNull();
  });

  it('calls onChangeText with new value', () => {
    const onChange = jest.fn();
    const { getByPlaceholderText } = render(
      <Input value="" onChangeText={onChange} placeholder="Enter email" />
    );
    fireEvent.changeText(getByPlaceholderText('Enter email'), 'test@email.com');
    expect(onChange).toHaveBeenCalledWith('test@email.com');
  });

  it('renders the current value', () => {
    const { getByDisplayValue } = render(<Input value="hello@test.com" onChangeText={() => {}} />);
    expect(getByDisplayValue('hello@test.com')).toBeTruthy();
  });
});
