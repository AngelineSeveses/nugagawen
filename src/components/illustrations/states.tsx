import { Circle, G, Line, Path, Rect } from 'react-native-svg';
import { illustration as c } from '@/theme';
import { Art, FoldedMap, Pin } from './parts';

interface SizeProps {
  size: number;
}

/** No location yet: a map with a pin waiting to be placed. */
export function LocationArt({ size }: SizeProps) {
  return (
    <Art width={size}>
      <FoldedMap />
      <G transform="translate(60 78)">
        <Pin />
      </G>
    </Art>
  );
}

/** No saved places yet: an empty bookmark. */
export function EmptySavedArt({ size }: SizeProps) {
  return (
    <Art width={size}>
      <Path d="M36 14 H84 C88 14 92 18 92 22 V106 L60 86 L28 106 V22 C28 18 32 14 36 14 Z" fill={c.sageSoft} />
      <Path d="M64 14 H84 C88 14 92 18 92 22 V106 L64 88 Z" fill={c.sage} />
      <G transform="translate(60 66)">
        <Pin scale={0.6} />
      </G>
    </Art>
  );
}

/** Nothing matched: a magnifying glass over empty ground. */
export function NoResultsArt({ size }: SizeProps) {
  return (
    <Art width={size}>
      <Path d="M6 100 C30 88 90 88 114 100 C90 110 30 110 6 100 Z" fill={c.sand} />
      <Line x1={72} y1={70} x2={96} y2={94} stroke={c.coral} strokeWidth={11} strokeLinecap="round" />
      <Circle cx={52} cy={50} r={30} fill={c.white} />
      <Circle cx={52} cy={50} r={30} fill="none" stroke={c.ink} strokeWidth={7} />
      <Path d="M38 42 C40 34 48 30 56 32" fill="none" stroke={c.sage} strokeWidth={5} strokeLinecap="round" />
    </Art>
  );
}

/** No connection: a cloud with a line through it. */
export function OfflineArt({ size }: SizeProps) {
  return (
    <Art width={size}>
      <Path d="M36 90 C20 90 10 78 10 66 C10 52 22 42 36 44 C42 28 58 22 72 28 C84 32 90 42 90 50 C102 50 110 60 110 70 C110 82 100 90 90 90 Z" fill={c.sage} />
      <Path d="M90 50 C102 50 110 60 110 70 C110 82 100 90 90 90 H66 C80 84 90 66 90 50 Z" fill={c.sageDeep} />
      <Line x1={28} y1={22} x2={94} y2={102} stroke={c.paper} strokeWidth={14} strokeLinecap="round" />
      <Line x1={28} y1={22} x2={94} y2={102} stroke={c.coralDeep} strokeWidth={7} strokeLinecap="round" />
    </Art>
  );
}

/** Something went wrong: a road sign. */
export function ErrorArt({ size }: SizeProps) {
  return (
    <Art width={size}>
      <Rect x={56} y={70} width={8} height={42} rx={4} fill={c.ink} />
      <Path d="M60 18 L104 88 H16 Z" fill={c.coral} stroke={c.coral} strokeWidth={10} strokeLinejoin="round" />
      <Rect x={56} y={42} width={8} height={26} rx={4} fill={c.ink} />
      <Circle cx={60} cy={78} r={5} fill={c.ink} />
    </Art>
  );
}
