import React, { useId } from 'react';
import { TouchableOpacity, View } from 'react-native';
import Svg, {
  ClipPath,
  Defs,
  Image as SvgImage,
  Line,
  LinearGradient,
  Polygon,
  Rect,
  Stop,
} from 'react-native-svg';

/** Right-leaning parallelogram: top and bottom stay level, sides slant. */
export function parallelogramPoints(width, height, cut, ox = 0, oy = 0) {
  return [
    [ox + cut, oy],
    [ox + width, oy],
    [ox + width - cut, oy + height],
    [ox, oy + height],
  ].map(([x, y]) => `${x},${y}`).join(' ');
}

export function parallelogramCut(height, degrees = 12) {
  return Math.round(height * Math.tan((degrees * Math.PI) / 180));
}

/** Stage web identity card: parallelogram clip, photo fills the whole shape. */
export default function TrapeziumPhotoCard({
  width,
  height,
  imageUrl,
  fill = '#071018',
  edgeColor = 'rgba(245,197,66,0.55)',
  children,
  onPress,
  chamfer,
  fit = 'cover',
}) {
  const rawId = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const clipId = `trap-photo-${rawId}`;
  const fadeId = `trap-fade-${rawId}`;
  const cut = Math.min(
    chamfer ?? parallelogramCut(height, 12),
    Math.max(12, Math.round(width * 0.28)),
  );
  const shapePts = parallelogramPoints(width, height, cut);
  const Wrapper = onPress ? TouchableOpacity : View;

  return (
    <Wrapper onPress={onPress} activeOpacity={0.92} style={{ width, height }}>
      <Svg width={width} height={height}>
        <Defs>
          <ClipPath id={clipId}>
            <Polygon points={shapePts} />
          </ClipPath>
          <LinearGradient id={fadeId} x1="0" y1="0.42" x2="0" y2="1">
            <Stop offset="0" stopColor="#05070F" stopOpacity="0" />
            <Stop offset="0.55" stopColor="#05070F" stopOpacity="0.18" />
            <Stop offset="1" stopColor="#05070F" stopOpacity="0.9" />
          </LinearGradient>
        </Defs>
        <Polygon points={shapePts} fill={fill} />
        {imageUrl ? (
          <SvgImage
            href={imageUrl}
            x={0}
            y={0}
            width={width}
            height={height}
            preserveAspectRatio={fit === 'contain' ? 'xMidYMid meet' : 'xMidYMid slice'}
            clipPath={`url(#${clipId})`}
          />
        ) : null}
        <Rect
          x={0}
          y={0}
          width={width}
          height={height}
          fill={`url(#${fadeId})`}
          clipPath={`url(#${clipId})`}
          pointerEvents="none"
        />
        <Line
          x1={cut}
          y1={1.25}
          x2={width}
          y2={1.25}
          stroke={edgeColor}
          strokeWidth={1.5}
          strokeLinecap="butt"
        />
        <Line
          x1={0}
          y1={height - 1.25}
          x2={width - cut}
          y2={height - 1.25}
          stroke={edgeColor}
          strokeWidth={1.5}
          strokeLinecap="butt"
        />
      </Svg>
      <View pointerEvents="box-none" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
        {children}
      </View>
    </Wrapper>
  );
}
