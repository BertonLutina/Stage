import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import TransferWindowHomeIcon from '../../components/dashboard/TransferWindowHomeIcon';

describe('TransferWindowHomeIcon', () => {
  it('shows only the transfers icon and calls onPress', () => {
    const onPress = jest.fn();
    const { getByLabelText, queryByText } = render(
      <TransferWindowHomeIcon onPress={onPress} />,
    );

    expect(queryByText('OPEN')).toBeNull();
    fireEvent.press(getByLabelText('Transfers'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
