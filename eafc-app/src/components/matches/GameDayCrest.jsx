import React from 'react';
import { View } from 'react-native';
import Svg, { ClipPath, Defs, Image as SvgImage, Polygon, Text as SvgText } from 'react-native-svg';
import { clubInitials } from '@/lib/gameDayPresentation';

const SHIELD = '50,2 94,18 94,70 50,98 6,70 6,18';
const INNER = '50,8 88,22 88,68 50,90 12,68 12,22';

const SIZES = {
  sm: 36,
  md: 88,
  lg: 128,
};

export default function GameDayCrest({ name, imageUrl, size = 'lg', glow = false }) {
  const px = typeof size === 'number' ? size : (SIZES[size] || SIZES.lg);
  const initials = clubInitials(name);
  const clipId = `crest-${px}-${initials}-${imageUrl ? 'img' : 'txt'}`;

  return (
    <View
      style={{
        width: px,
        height: px,
        shadowColor: glow ? '#F5C542' : 'transparent',
        shadowOpacity: glow ? 0.55 : 0,
        shadowRadius: glow ? 16 : 0,
        shadowOffset: { width: 0, height: 0 },
        elevation: glow ? 8 : 0,
      }}
    >
      <Svg width={px} height={px} viewBox="0 0 100 100">
        <Defs>
          <ClipPath id={clipId}>
            <Polygon points={INNER} />
          </ClipPath>
        </Defs>
        <Polygon points={SHIELD} fill="#C9A227" />
        <Polygon points={INNER} fill="#071018" />
        {imageUrl ? (
          <SvgImage
            href={imageUrl}
            x="12"
            y="12"
            width="76"
            height="76"
            preserveAspectRatio="xMidYMid slice"
            clipPath={`url(#${clipId})`}
          />
        ) : (
          <SvgText
            x="50"
            y="58"
            textAnchor="middle"
            fill="#F5C542"
            fontSize={initials.length > 2 ? 18 : 22}
            fontWeight="bold"
          >
            {initials}
          </SvgText>
        )}
      </Svg>
    </View>
  );
}
