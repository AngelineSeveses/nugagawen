import { Circle, G, Path, Rect } from 'react-native-svg';
import { illustration as c } from '@/theme';
import type { Activity } from '@/types';
import { Art, Die, Palm, RiceBowl } from './parts';

interface SizeProps {
  size: number;
}

/** Kain: a bowl of rice with a spoon and fork. */
export function KainArt({ size }: SizeProps) {
  return (
    <Art width={size}>
      <RiceBowl />
    </Art>
  );
}

/** Gala: a palm tree and hills under the sun. */
export function GalaArt({ size }: SizeProps) {
  return (
    <Art width={size}>
      <Circle cx={86} cy={32} r={16} fill={c.coral} />
      <Path d="M0 92 C22 60 46 60 66 78 C82 64 106 66 120 84 V120 H0 Z" fill={c.sage} />
      <Path d="M0 106 C32 86 72 90 120 104 V120 H0 Z" fill={c.sageDeep} />
      <G transform="translate(38 100)">
        <Palm />
      </G>
    </Art>
  );
}

/** Kahit Ano: two dice, because anything goes. */
export function KahitAnoArt({ size }: SizeProps) {
  return (
    <Art width={size}>
      <G transform="translate(80 40) rotate(16)">
        <Die color={c.coral} pip={c.white} value={3} />
      </G>
      <G transform="translate(50 76) rotate(-10) scale(1.25)">
        <Die />
      </G>
    </Art>
  );
}

export const ACTIVITY_ART: Record<Activity, (props: SizeProps) => React.JSX.Element> = {
  eat: KainArt,
  goOut: GalaArt,
  anything: KahitAnoArt,
};

/** Surprise Me: a wrapped present. */
export function SurpriseArt({ size }: SizeProps) {
  return (
    <Art width={size}>
      {/* Bow. */}
      <Path d="M60 40 C46 16 22 22 30 36 C34 42 48 42 60 40 Z" fill={c.ink} />
      <Path d="M60 40 C74 16 98 22 90 36 C86 42 72 42 60 40 Z" fill={c.ink} />
      {/* Box and lid. */}
      <Rect x={24} y={56} width={72} height={50} rx={6} fill={c.coral} />
      <Path d="M78 56 H90 C93 56 96 59 96 62 V100 C96 103 93 106 90 106 H78 Z" fill={c.coralDeep} />
      <Rect x={16} y={38} width={88} height={22} rx={6} fill={c.coralDeep} />
      {/* Ribbon. */}
      <Rect x={51} y={38} width={18} height={68} fill={c.white} />
    </Art>
  );
}
