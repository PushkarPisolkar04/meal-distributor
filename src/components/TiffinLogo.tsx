import React from 'react';
import Svg, { Defs, LinearGradient, Stop, Rect, Path, G } from 'react-native-svg';

interface Props {
  size?: number;
  /** 'badge' = gradient rounded square + white tiffin (app icon look).
   *  'white' = just the white tiffin glyph (for use on a colored background). */
  variant?: 'badge' | 'white';
}

/** The Tiffin Manager mark: a stacked tiffin (dabba) with a handle. Vector, so
 *  it stays crisp at any size and drives both the in-app logo and the app icon. */
export function TiffinLogo({ size = 96, variant = 'badge' }: Props) {
  const white = '#FFFFFF';
  const tiffin = (
    <G>
      {/* handle */}
      <Path d="M35 33 Q50 21 65 33" stroke={white} strokeWidth={4.5} fill="none" strokeLinecap="round" />
      {/* lid */}
      <Rect x="33" y="32" width="34" height="9" rx="4" fill={white} />
      {/* top tier */}
      <Rect x="35.5" y="44" width="29" height="14" rx="4.5" fill={white} />
      {/* bottom tier */}
      <Rect x="35.5" y="60" width="29" height="16" rx="5" fill={white} />
    </G>
  );

  if (variant === 'white') {
    return (
      <Svg width={size} height={size} viewBox="0 0 100 100">
        {tiffin}
      </Svg>
    );
  }

  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Defs>
        <LinearGradient id="tiffinGrad" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#FF7A45" />
          <Stop offset="1" stopColor="#FF3D77" />
        </LinearGradient>
      </Defs>
      <Rect x="3" y="3" width="94" height="94" rx="24" fill="url(#tiffinGrad)" />
      {tiffin}
    </Svg>
  );
}
