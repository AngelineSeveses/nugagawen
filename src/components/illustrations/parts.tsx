/**
 * Shared pieces of the app's illustrations: flat, rounded shapes in a small warm
 * palette, with no outlines, gradients or shadows. These explain the interface;
 * they are never presented as photos of real places.
 *
 * Drawn with react-native-svg, which scales cleanly and adds no image files.
 */
import type { ReactNode } from 'react';
import { View } from 'react-native';
import Svg, { Circle, Ellipse, G, Line, Path, Rect } from 'react-native-svg';
import { illustration as c } from '@/theme';

interface ArtProps {
  width: number;
  height?: number;
  viewBox?: string;
  children: ReactNode;
}

/** The frame of every illustration. Hidden from screen readers unless a parent describes it. */
export function Art({ width, height = width, viewBox = '0 0 120 120', children }: ArtProps) {
  return (
    <View aria-hidden accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={{ width, height }}>
      <Svg width={width} height={height} viewBox={viewBox}>
        {children}
      </Svg>
    </View>
  );
}

/** A bowl of rice with a spoon and fork, the way Filipinos eat it. Drawn in a 120 x 120 box. */
export function RiceBowl() {
  return (
    <G>
      {/* Spoon and fork, standing in the rice. */}
      <Line x1={47} y1={22} x2={53} y2={50} stroke={c.ink} strokeWidth={4} strokeLinecap="round" />
      <Ellipse cx={45} cy={17} rx={6} ry={9} fill={c.ink} transform="rotate(-12 45 17)" />
      <Line x1={76} y1={14} x2={68} y2={50} stroke={c.ink} strokeWidth={4} strokeLinecap="round" />
      <Path d="M70 8 L66 22 C65 27 70 29 74 30 C78 31 83 30 84 25 L88 11" fill="none" stroke={c.ink} strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round" />
      <Line x1={79} y1={9} x2={76} y2={22} stroke={c.ink} strokeWidth={3.5} strokeLinecap="round" />
      {/* Rice. */}
      <Path d="M27 62 C27 34 93 34 93 62 Z" fill={c.white} />
      <Path d="M60 42 C78 42 93 48 93 62 H74 C74 54 70 46 60 42 Z" fill={c.sand} />
      {/* Bowl. */}
      <Path d="M20 60 H100 C100 86 84 102 60 102 C36 102 20 86 20 60 Z" fill={c.coral} />
      <Path d="M100 60 C100 86 84 102 60 102 C76 96 84 80 84 60 Z" fill={c.coralDeep} />
      <Rect x={15} y={55} width={90} height={9} rx={4.5} fill={c.coralDeep} />
      <Rect x={44} y={100} width={32} height={7} rx={3.5} fill={c.coralDeep} />
    </G>
  );
}

/** A coconut palm. Drawn with its base at (0, 0) and its crown 60 units above. */
export function Palm({ trunk = c.ink, leaf = c.sageDeep }: { trunk?: string; leaf?: string }) {
  return (
    <G>
      <Path d="M0 0 C-1 -20 2 -42 8 -60" fill="none" stroke={trunk} strokeWidth={5} strokeLinecap="round" />
      <Path d="M8 -60 C-4 -74 -22 -72 -30 -58 C-18 -64 -6 -64 8 -60 Z" fill={leaf} />
      <Path d="M8 -60 C20 -74 38 -72 46 -58 C34 -64 22 -64 8 -60 Z" fill={leaf} />
      <Path d="M8 -60 C2 -78 -12 -86 -24 -82 C-12 -78 -2 -70 8 -60 Z" fill={leaf} />
      <Path d="M8 -60 C16 -78 30 -86 42 -80 C30 -78 18 -70 8 -60 Z" fill={leaf} />
    </G>
  );
}

/** A location pin. Drawn with its point at (0, 0). */
export function Pin({ color = c.coral, dot = c.white, scale = 1 }: { color?: string; dot?: string; scale?: number }) {
  return (
    <G transform={`scale(${scale})`}>
      <Path d="M0 0 C0 0 -24 -19 -24 -36 C-24 -49 -13 -58 0 -58 C13 -58 24 -49 24 -36 C24 -19 0 0 0 0 Z" fill={color} />
      <Circle cx={0} cy={-36} r={9} fill={dot} />
    </G>
  );
}

/** A folded paper map. Drawn in a 120 x 120 box. */
export function FoldedMap() {
  return (
    <G>
      <Path d="M12 46 L44 34 V92 L12 104 Z" fill={c.sageSoft} />
      <Path d="M44 34 L76 46 V104 L44 92 Z" fill={c.sage} />
      <Path d="M76 46 L108 34 V92 L76 104 Z" fill={c.sageSoft} />
      <Path d="M18 90 C34 76 40 84 54 74 C68 64 78 78 102 52" fill="none" stroke={c.white} strokeWidth={5} strokeLinecap="round" strokeDasharray="1 10" />
    </G>
  );
}

/** A die, with pips for its value. Drawn with its center at (0, 0) in a 48 x 48 box. */
export function Die({ color = c.white, pip = c.ink, value = 5 }: { color?: string; pip?: string; value?: 3 | 5 }) {
  const corners: [number, number][] = value === 5 ? [[-12, -12], [12, -12], [-12, 12], [12, 12], [0, 0]] : [[-12, -12], [0, 0], [12, 12]];
  return (
    <G>
      <Rect x={-24} y={-24} width={48} height={48} rx={11} fill={color} />
      {corners.map(([x, y]) => (
        <Circle key={`${x},${y}`} cx={x} cy={y} r={4.5} fill={pip} />
      ))}
    </G>
  );
}

/** A gem. Drawn with its center at (0, 0), about 40 wide. */
export function Gem() {
  return (
    <G>
      <Path d="M-20 -8 L-10 -18 H10 L20 -8 L0 18 Z" fill={c.coral} />
      <Path d="M-20 -8 H20 L0 18 Z" fill={c.coralDeep} />
      <Path d="M-8 -8 L0 18 L8 -8 Z" fill={c.coral} />
    </G>
  );
}

/** A peso coin seen from the front. Drawn with its center at (0, 0). */
export function PesoCoin({ r = 24 }: { r?: number }) {
  const s = r / 24;
  return (
    <G>
      <Circle cx={0} cy={0} r={r} fill={c.coral} />
      <Circle cx={0} cy={0} r={r - 4} fill={c.coralSoft} />
      <G transform={`scale(${s})`}>
        <Path d="M-5 13 V-12 H3 C12 -12 12 3 3 3 H-5" fill="none" stroke={c.ink} strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round" />
        <Line x1={-10} y1={-6} x2={11} y2={-6} stroke={c.ink} strokeWidth={2.5} strokeLinecap="round" />
        <Line x1={-10} y1={-1} x2={11} y2={-1} stroke={c.ink} strokeWidth={2.5} strokeLinecap="round" />
      </G>
    </G>
  );
}
