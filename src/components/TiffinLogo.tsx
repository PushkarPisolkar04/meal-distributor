import React from 'react';
import Svg, {
  Defs,
  LinearGradient,
  RadialGradient,
  Stop,
  Rect,
  Path,
  Ellipse,
  G,
} from 'react-native-svg';

interface Props {
  size?: number;
  /** 'badge' = gradient squircle + tiffin (app-icon look).
   *  'white' = white tiffin + steam on a transparent background (for use on a
   *  colored surface like the splash). */
  variant?: 'badge' | 'white';
}

/**
 * Tiffin Manager mark — a stacked tiffin (dabba) with lid, handle and rising
 * steam. Drawn as vectors so it stays crisp at every size and powers both the
 * in-app logo and the exported app icon.
 */
export function TiffinLogo({ size = 96, variant = 'badge' }: Props) {
  const onWhite = variant === 'white';
  const bodyFill = onWhite ? '#FFFFFF' : 'url(#bodyGrad)';
  const steam = onWhite ? 'rgba(255,255,255,0.75)' : 'rgba(255,255,255,0.9)';

  const tiffin = (
    <G>
      {/* rising steam */}
      <G stroke={steam} strokeWidth={2.4} strokeLinecap="round" fill="none">
        <Path d="M42 30 C 40 27.5, 43 25.5, 41.6 23 C 40.3 20.6, 43 18.8, 41.6 16.4" />
        <Path d="M50 29.5 C 47.8 26.8, 51 24.7, 49.5 22 C 48 19.3, 51 17.2, 49.5 14.2" />
        <Path d="M58 30 C 56 27.5, 59 25.5, 57.6 23 C 56.3 20.6, 59 18.8, 57.6 16.4" />
      </G>

      {/* handle */}
      <Path
        d="M43 37 Q50 29 57 37"
        stroke={onWhite ? '#FFFFFF' : '#FF6A4D'}
        strokeWidth={3.4}
        fill="none"
        strokeLinecap="round"
      />

      {/* lid */}
      <Rect x="34" y="36" width="32" height="8.6" rx="3.6" fill={bodyFill} />
      {/* top tier */}
      <Rect x="36.5" y="47" width="27" height="13.5" rx="3.8" fill={bodyFill} />
      {/* bottom tier (slightly wider, grounded) */}
      <Rect x="35.5" y="62" width="29" height="15.5" rx="4.4" fill={bodyFill} />

      {!onWhite ? (
        <>
          {/* soft highlights for depth */}
          <Rect x="38" y="48.2" width="9" height="2.4" rx="1.2" fill="rgba(255,255,255,0.55)" />
          <Rect x="37.5" y="63.4" width="9" height="2.4" rx="1.2" fill="rgba(255,255,255,0.55)" />
        </>
      ) : null}
    </G>
  );

  if (onWhite) {
    return (
      <Svg width={size} height={size} viewBox="0 0 100 100">
        {tiffin}
      </Svg>
    );
  }

  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Defs>
        <LinearGradient id="bgGrad" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#FF8A4B" />
          <Stop offset="0.55" stopColor="#FF5A3C" />
          <Stop offset="1" stopColor="#FF3D77" />
        </LinearGradient>
        <RadialGradient id="glow" cx="0.3" cy="0.22" r="0.9">
          <Stop offset="0" stopColor="#FFFFFF" stopOpacity="0.35" />
          <Stop offset="0.5" stopColor="#FFFFFF" stopOpacity="0" />
        </RadialGradient>
        <LinearGradient id="bodyGrad" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#FFFFFF" />
          <Stop offset="1" stopColor="#FFE7DC" />
        </LinearGradient>
      </Defs>

      <Rect x="3" y="3" width="94" height="94" rx="26" fill="url(#bgGrad)" />
      <Rect x="3" y="3" width="94" height="94" rx="26" fill="url(#glow)" />
      {/* grounding shadow under the tiffin */}
      <Ellipse cx="50" cy="80" rx="20" ry="3.2" fill="#000000" opacity="0.12" />
      {tiffin}
    </Svg>
  );
}
