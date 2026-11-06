import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import AvailabilityScreen from '../../app/(tabs)/profile/availabilityscreen';
import api from '../../utils/api';

const mockBack = jest.fn();
jest.mock('expo-router', () => ({ useRouter: () => ({ back: mockBack, canGoBack: () => true, replace: jest.fn() }) }));
jest.mock('../../store/authStore', () => ({ __esModule: true, default: () => ({ user: { id: 'u1', timezone: 'Europe/Brussels' } }) }));
jest.mock('../../utils/api', () => ({ __esModule: true, default: { get: jest.fn(), put: jest.fn() } }));
jest.mock('expo-linear-gradient', () => {
  const React = require('react');
  const { View } = require('react-native');
  return { LinearGradient: ({ children, style }) => React.createElement(View, { style }, children) };
});

describe('AvailabilityScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    api.get.mockResolvedValue({ data: { data: [{ day_of_week: 1, start_time: '20:00', end_time: '22:00' }] } });
    api.put.mockResolvedValue({ data: { data: [] } });
  });

  test('renders the real 7 by 4 binary grid and saves changed slots', async () => {
    const { findByLabelText, getByText, queryByText } = render(<AvailabilityScreen />);
    const monday = await findByLabelText('Monday 20–22, available');
    expect(queryByText('Maybe')).toBeNull();
    fireEvent.press(monday);
    fireEvent.press(getByText('Save availability'));
    await waitFor(() => expect(api.put).toHaveBeenCalledWith('/users/u1/availability', { slots: [] }));
  });

  test('shows endpoint errors with a retry action', async () => {
    api.get.mockRejectedValueOnce(new Error('Availability unavailable'));
    const { findByText } = render(<AvailabilityScreen />);
    expect(await findByText('Availability unavailable')).toBeTruthy();
    fireEvent.press(await findByText('Try again'));
    await waitFor(() => expect(api.get).toHaveBeenCalledTimes(2));
  });
});
