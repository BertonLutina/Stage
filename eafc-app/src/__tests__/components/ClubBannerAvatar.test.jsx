import React from 'react';
import { Image } from 'react-native';
import { render } from '@testing-library/react-native';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { ClubBannerAvatar, ProfileBannerAvatar } from '../../components/profile/gamer/GamerProfileUI';

jest.mock('expo-linear-gradient', () => {
  const React = require('react');
  const { View } = require('react-native');
  const LinearGradient = ({ children, style }) => React.createElement(View, { style }, children);
  return { LinearGradient };
});

function readRepoFile(path) {
  return readFileSync(resolve(__dirname, '../..', path), 'utf8');
}

describe('profile banner avatars', () => {
  test('renders a circular image for player, president, and club', () => {
    const player = render(
      <ProfileBannerAvatar imageUrl="https://cdn.example/player.png" accent="cyan" />
    );
    expect(player.UNSAFE_getAllByType(Image)[0].props.source.uri).toBe('https://cdn.example/player.png');
    player.unmount();

    const president = render(
      <ProfileBannerAvatar imageUrl="https://cdn.example/prez.png" accent="amber" />
    );
    expect(president.UNSAFE_getAllByType(Image)[0].props.source.uri).toBe('https://cdn.example/prez.png');
    president.unmount();

    const club = render(<ClubBannerAvatar logoUrl="https://cdn.example/hooded.png" size={72} />);
    expect(club.UNSAFE_getAllByType(Image)[0].props.source.uri).toBe('https://cdn.example/hooded.png');
    expect(club.UNSAFE_getAllByType(Image)[0].props.style.width).toBe(72);
  });

  test('only the public club banner pins a corner avatar — card/crest surfaces do not', () => {
    const player = readRepoFile('app/(tabs)/profile/profilescreen.jsx');
    const president = readRepoFile('app/(tabs)/profile/presidentprofilescreen.jsx');
    const clubTab = readRepoFile('app/(tabs)/profile/index.jsx');
    const publicClub = readRepoFile('app/apps/club/[id].jsx');

    expect(player).not.toMatch(/ProfileBannerAvatar/);
    expect(player).toMatch(/FutIdentityCard/);
    expect(readRepoFile('components/profile/gamer/GamerProfileUI.jsx')).toMatch(/TrapeziumPhotoCard/);
    expect(readRepoFile('components/profile/TrapeziumPhotoCard.jsx')).toMatch(/parallelogramPoints/);

    expect(president).not.toMatch(/ProfileBannerAvatar/);
    expect(president).toMatch(/FutIdentityCard/);

    expect(clubTab).not.toMatch(/ClubBannerAvatar/);
    expect(clubTab).not.toMatch(/ClubCrest/);

    expect(publicClub).toMatch(/GamerBanner|ClubHero/);
    expect(publicClub).toMatch(/ClubProfileTabs/);
    expect(publicClub).toMatch(/ClubHero/);
    expect(readRepoFile('components/club/ClubHero.jsx')).toMatch(/club\?\.logo_url/);
    expect(readRepoFile('components/club/ClubHero.jsx')).not.toMatch(/president\?\.avatar_url/);
  });
});
