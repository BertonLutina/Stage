import React from 'react';
import { render } from '@testing-library/react-native';
import Avatar from '../../components/common/Avatar';

describe('Avatar component', () => {
  it('renders an Image with the given uri', () => {
    const { UNSAFE_getAllByType } = render(
      <Avatar uri="https://example.com/avatar.jpg" name="John Doe" size={48} />
    );
    const { Image } = require('react-native');
    const images = UNSAFE_getAllByType(Image);
    expect(images[0].props.source.uri).toBe('https://example.com/avatar.jpg');
  });

  it('renders initials JD for "John Doe"', () => {
    const { getByText } = render(<Avatar name="John Doe" size={48} />);
    expect(getByText('JD')).toBeTruthy();
  });

  it('renders ? when no name or uri provided', () => {
    const { getByText } = render(<Avatar size={48} />);
    expect(getByText('?')).toBeTruthy();
  });

  it('renders single initial L for "Lutina"', () => {
    const { getByText } = render(<Avatar name="Lutina" size={48} />);
    expect(getByText('L')).toBeTruthy();
  });

  it('applies correct size to image style', () => {
    const { UNSAFE_getAllByType } = render(
      <Avatar uri="https://example.com/x.jpg" name="Test" size={64} />
    );
    const { Image } = require('react-native');
    const images = UNSAFE_getAllByType(Image);
    expect(images[0].props.style.width).toBe(64);
    expect(images[0].props.style.height).toBe(64);
  });
});
