import React, { useId } from 'react';
import { View } from 'react-native';
import Svg, {
  ClipPath,
  Defs,
  Image as SvgImage,
  LinearGradient,
  Polygon,
  Stop,
  Text as SvgText,
} from 'react-native-svg';
import { clubInitials } from '@/lib/gameDayPresentation';

/** Matches web GameDayCrest: polygon(12% 0, 100% 0, 88% 100%, 0 100%). */
const SIZES = {
  sm: { w: 40, h: 36, font: 9 },
  md: { w: 112, h: 96, font: 22 },
  lg: { w: 132, h: 116, font: 28 },
};

function trapPoints(w, h, inset = 0) {
  const x0 = inset;
  const y0 = inset;
  const x1 = w - inset;
  const y1 = h - inset;
  const cut = Math.max(4, (x1 - x0) * 0.12);
  return `${x0 + cut},${y0} ${x1},${y0} ${x1 - cut},${y1} ${x0},${y1}`;
}

export default function GameDayCrest({ name, imageUrl, size = 'lg', glow = false }) {
  const dims = typeof size === 'number'
    ? { w: size, h: Math.round(size * 0.88), font: Math.round(size * 0.22) }
    : (SIZES[size] || SIZES.lg);
  const { w, h, font } = dims;
  const initials = clubInitials(name);
  const rawId = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const clipId = `gd-crest-${rawId}`;
  const fillId = `gd-crest-fill-${rawId}`;

  return (
    <View
      style={{
        width: w,
        height: h,
        shadowColor: glow ? '#EEF3FB' : 'transparent',
        shadowOpacity: glow ? 0.55 : 0,
        shadowRadius: glow ? 16 : 0,
        shadowOffset: { width: 0, height: 0 },
        elevation: glow ? 8 : 0,
      }}
    >
      <Svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
        <Defs>
          <LinearGradient id={fillId} x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#FFFFFF" />
            <Stop offset="0.45" stopColor="#8EEEFF" />
            <Stop offset="1" stopColor="#AEB8C6" />
          </LinearGradient>
          <ClipPath id={clipId}>
            <Polygon points={trapPoints(w, h, 2)} />
          </ClipPath>
        </Defs>
        <Polygon points={trapPoints(w, h, 0)} fill={`url(#${fillId})`} />
        <Polygon points={trapPoints(w, h, 2)} fill="#111827" />
        {imageUrl ? (
          <SvgImage
            href={imageUrl}
            x="0"
            y="0"
            width={w}
            height={h}
            preserveAspectRatio="xMidYMid slice"
            clipPath={`url(#${clipId})`}
          />
        ) : (
          <SvgText
            x={w / 2}
            y={h / 2 + font * 0.35}
            textAnchor="middle"
            fill="#EEF3FB"
            fontSize={initials.length > 2 ? font * 0.78 : font}
            fontWeight="bold"
            clipPath={`url(#${clipId})`}
          >
            {initials}
          </SvgText>
        )}
      </Svg>
    </View>
  );
}
