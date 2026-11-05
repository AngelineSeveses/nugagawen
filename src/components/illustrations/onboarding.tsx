import { Circle, Ellipse, G, Path, Rect } from 'react-native-svg';
import { colors, illustration as c } from '@/theme';
import { Art, Die, FoldedMap, Gem, Palm, PesoCoin, Pin, RiceBowl } from './parts';

/** Onboarding art is 4:3, so it scales to any phone width. */
const VIEW_BOX = '0 0 320 240';
const RATIO = 240 / 320;

interface WidthProps {
  width: number;
}

/** Slide 1: a signpost with one arm toward food and one toward places to go. */
export function OnboardingDiscoverArt({ width }: WidthProps) {
  return (
    <Art width={width} height={width * RATIO} viewBox={VIEW_BOX}>
      {/* Sun and hills. */}
      <Circle cx={262} cy={52} r={24} fill={c.coralSoft} />
      <Path d="M150 202 C190 150 240 146 276 176 C290 166 308 164 320 170 V240 H150 Z" fill={c.sage} />
      <Path d="M0 214 C60 192 120 194 170 206 C220 218 270 206 320 212 V240 H0 Z" fill={c.sageDeep} />
      {/* A palm tree on the right, a bowl of rice on the left. */}
      <G transform="translate(258 214) scale(1.05)">
        <Palm />
      </G>
      <G transform="translate(18 126) scale(0.86)">
        <RiceBowl />
      </G>
      {/* Signpost. */}
      <Rect x={155} y={44} width={10} height={168} rx={5} fill={c.ink} />
      <Path d="M172 62 H102 C99 62 97 63 95 65 L82 78 L95 91 C97 93 99 94 102 94 H172 C175 94 177 92 177 89 V67 C177 64 175 62 172 62 Z" fill={c.coral} />
      <Path d="M148 106 H218 C221 106 223 107 225 109 L238 122 L225 135 C223 137 221 138 218 138 H148 C145 138 143 136 143 133 V111 C143 108 145 106 148 106 Z" fill={c.white} />
      <Rect x={106} y={75} width={52} height={6} rx={3} fill={c.white} />
      <Rect x={162} y={119} width={52} height={6} rx={3} fill={c.sageDeep} />
      {/* The question. */}
      <G transform="translate(92 16)">
        <Path d="M4 0 H36 C40 0 44 4 44 8 V30 C44 34 40 38 36 38 H20 L8 48 V38 H4 C0 38 -4 34 -4 30 V8 C-4 4 0 0 4 0 Z" fill={c.white} />
        <Path d="M12 13 C12 6 28 6 28 14 C28 21 20 20 20 27" fill="none" stroke={c.ink} strokeWidth={4} strokeLinecap="round" />
        <Circle cx={20} cy={33} r={2.5} fill={c.ink} />
      </G>
    </Art>
  );
}

/** Slide 2: a place on the map and coins for the budget. */
export function OnboardingChooseArt({ width }: WidthProps) {
  return (
    <Art width={width} height={width * RATIO} viewBox={VIEW_BOX}>
      <G transform="translate(24 2) scale(1.72)">
        <FoldedMap />
      </G>
      <G transform="translate(128 140)">
        <Pin scale={1.5} />
      </G>
      <Ellipse cx={128} cy={142} rx={14} ry={5} fill={c.sageDeep} />
      {/* A stack of coins. */}
      <Ellipse cx={252} cy={212} rx={36} ry={11} fill={c.sageDeep} />
      <Rect x={216} y={176} width={72} height={34} rx={8} fill={c.coralDeep} />
      <Rect x={222} y={158} width={72} height={24} rx={8} fill={c.coral} />
      <Rect x={212} y={138} width={72} height={24} rx={8} fill={c.coralDeep} />
      <G transform="translate(250 108)">
        <PesoCoin r={36} />
      </G>
    </Art>
  );
}

/** One of the three cards on slide 3. */
function PickCard({ x, y, rotation, tint, children }: { x: number; y: number; rotation: number; tint: string; children: React.ReactNode }) {
  return (
    <G transform={`translate(${x} ${y}) rotate(${rotation})`}>
      <Rect x={-54} y={-76} width={108} height={152} rx={16} fill={c.white} />
      <Rect x={-46} y={-68} width={92} height={78} rx={10} fill={tint} />
      <G transform="translate(0 -29)">{children}</G>
      <Rect x={-46} y={22} width={64} height={9} rx={4.5} fill={c.ink} />
      <Rect x={-46} y={40} width={84} height={7} rx={3.5} fill={c.sandDeep} />
      <Rect x={-46} y={54} width={52} height={7} rx={3.5} fill={c.sandDeep} />
    </G>
  );
}

/** Slide 3: Safe Choice, Surprise Me and Hidden Gem, as three cards fanned out. */
export function OnboardingDecideArt({ width }: WidthProps) {
  return (
    <Art width={width} height={width * RATIO} viewBox={VIEW_BOX}>
      <PickCard x={84} y={128} rotation={-11} tint={colors.sage}>
        <Circle cx={0} cy={0} r={20} fill={c.sageDeep} />
        <Path d="M-9 0 L-3 7 L10 -7" fill="none" stroke={c.white} strokeWidth={4.5} strokeLinecap="round" strokeLinejoin="round" />
      </PickCard>
      <PickCard x={236} y={128} rotation={11} tint={colors.tintSand}>
        <Gem />
      </PickCard>
      <PickCard x={160} y={116} rotation={0} tint={colors.tintCoral}>
        <G transform="rotate(-8)">
          <Die color={c.coral} pip={c.white} />
        </G>
      </PickCard>
    </Art>
  );
}
