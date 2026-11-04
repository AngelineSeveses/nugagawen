import { StyleSheet, View } from 'react-native';
import { colors, radius } from '@/theme';
import {
  BankIcon,
  BinocularsIcon,
  BowlingBallIcon,
  BreadIcon,
  CoffeeIcon,
  DropIcon,
  FilmStripIcon,
  FishIcon,
  FlowerIcon,
  ForkKnifeIcon,
  HamburgerIcon,
  IceCreamIcon,
  MapTrifoldIcon,
  MaskHappyIcon,
  PaintBrushIcon,
  PawPrintIcon,
  PersonSimpleWalkIcon,
  ShoppingBagIcon,
  ThermometerIcon,
  TicketIcon,
  TreeIcon,
  WavesIcon,
  type Icon,
} from './icons';

/** One icon per category key (scripts/osm/build.mjs). Icons carry meaning: they tell the kind of place at a glance. */
const BY_KIND: Record<string, Icon> = {
  restaurant: ForkKnifeIcon,
  cafe: CoffeeIcon,
  fast_food: HamburgerIcon,
  food_court: ForkKnifeIcon,
  ice_cream: IceCreamIcon,
  bakery: BreadIcon,
  museum: BankIcon,
  gallery: PaintBrushIcon,
  viewpoint: BinocularsIcon,
  zoo: PawPrintIcon,
  aquarium: FishIcon,
  theme_park: TicketIcon,
  park: TreeIcon,
  garden: FlowerIcon,
  cinema: FilmStripIcon,
  bowling: BowlingBallIcon,
  mall: ShoppingBagIcon,
  arts_centre: MaskHappyIcon,
  beach: WavesIcon,
  waterfall: DropIcon,
  hot_spring: ThermometerIcon,
  attraction: MapTrifoldIcon,
};

export function iconForPlace(kind: string | undefined, group: 'eat' | 'goOut'): Icon {
  return (kind && BY_KIND[kind]) || (group === 'eat' ? ForkKnifeIcon : PersonSimpleWalkIcon);
}

/** A sage tile with the category icon: used where a place has no photo. */
export function CategoryTile({ kind, group, size }: { kind?: string; group: 'eat' | 'goOut'; size: number }) {
  const KindIcon = iconForPlace(kind, group);
  return (
    <View style={[styles.tile, { width: size, height: size }]} accessible={false}>
      <KindIcon size={Math.round(size * 0.36)} color={colors.ink} weight="light" />
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    backgroundColor: colors.sage,
    borderRadius: radius.md,
    borderCurve: 'continuous',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
