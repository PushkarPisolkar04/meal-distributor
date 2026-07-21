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
  /** 'badge' = full gradient emblem (app-icon look).
   *  'white' = white emblem on transparent (for colored surfaces / splash). */
  variant?: 'badge' | 'white';
}

/**
 * Tiffin Manager emblem — a tiffin (dabba) in front of a crossed spoon & fork,
 * inside a ringed gradient badge. Vector, so it stays crisp at every size and
 * powers both the in-app logo and the exported app icon.
 */
export function TiffinLogo({ size = 96, variant = 'badge' }: Props) {
  const onWhite = variant === 'white';
  const body = onWhite ? '#FFFFFF' : 'url(#bodyGrad)';
  const utensil = onWhite ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.92)';
  const handleColor = onWhite ? '#FFFFFF' : '#FF6A4D';

  const utensils = (
    <G fill={utensil}>
      {/* fork */}
      <G rotation={-18} originX={512} originY={800}>
        <Rect x="470" y="300" width="26" height="95" rx="13" />
        <Rect x="499" y="300" width="26" height="95" rx="13" />
        <Rect x="528" y="300" width="26" height="95" rx="13" />
        <Rect x="468" y="380" width="88" height="72" rx="26" />
        <Rect x="496" y="440" width="32" height="384" rx="16" />
      </G>
      {/* spoon */}
      <G rotation={18} originX={512} originY={800}>
        <Ellipse cx="512" cy="350" rx="52" ry="70" />
        <Rect x="496" y="440" width="32" height="384" rx="16" />
      </G>
    </G>
  );

  const tiffin = (
    <G>
      {/* handle */}
      <Path d="M452 396 Q512 322 572 396" stroke={handleColor} strokeWidth={34} fill="none" strokeLinecap="round" />
      {/* lid */}
      <Rect x="356" y="388" width="312" height="86" rx="38" fill={body} />
      {/* top tier */}
      <Rect x="382" y="498" width="260" height="130" rx="38" fill={body} />
      {/* bottom tier */}
      <Rect x="372" y="640" width="280" height="156" rx="44" fill={body} />
      {!onWhite ? (
        <>
          <Rect x="398" y="512" width="92" height="24" rx="12" fill="rgba(255,255,255,0.5)" />
          <Rect x="392" y="656" width="92" height="24" rx="12" fill="rgba(255,255,255,0.5)" />
        </>
      ) : null}
    </G>
  );

  if (onWhite) {
    return (
      <Svg width={size} height={size} viewBox="0 0 1024 1024">
        {utensils}
        {tiffin}
      </Svg>
    );
  }

  return (
    <Svg width={size} height={size} viewBox="0 0 1024 1024">
      <Defs>
        <LinearGradient id="bgGrad" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#FF8A4B" />
          <Stop offset="0.55" stopColor="#FF5A3C" />
          <Stop offset="1" stopColor="#FF3D77" />
        </LinearGradient>
        <RadialGradient id="glow" cx="0.3" cy="0.22" r="0.9">
          <Stop offset="0" stopColor="#FFFFFF" stopOpacity="0.35" />
          <Stop offset="0.55" stopColor="#FFFFFF" stopOpacity="0" />
        </RadialGradient>
        <LinearGradient id="bodyGrad" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#FFFFFF" />
          <Stop offset="1" stopColor="#FFE7DC" />
        </LinearGradient>
      </Defs>

      <Rect x="0" y="0" width="1024" height="1024" rx="232" fill="url(#bgGrad)" />
      <Rect x="0" y="0" width="1024" height="1024" rx="232" fill="url(#glow)" />
      <Rect x="70" y="70" width="884" height="884" rx="188" fill="none" stroke="rgba(255,255,255,0.22)" strokeWidth={10} />

      {utensils}
      <Ellipse cx="512" cy="828" rx="200" ry="30" fill="#000000" opacity="0.14" />
      {tiffin}
    </Svg>
  );
}
