import { createElement } from 'react';
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

function iconForPlace(kind: string | undefined, group: 'eat' | 'goOut'): Icon {
  return (kind && BY_KIND[kind]) || (group === 'eat' ? ForkKnifeIcon : PersonSimpleWalkIcon);
}

/** The icon for a kind of place. */
export function CategoryIcon({ kind, group, size }: { kind?: string; group: 'eat' | 'goOut'; size: number }) {
  return createElement(iconForPlace(kind, group), { size, color: colors.ink, weight: 'light' });
}

/** A tinted tile with the category icon: used where a place has no photo. */
export function CategoryTile({ kind, group, size, tint = colors.sage }: { kind?: string; group: 'eat' | 'goOut'; size: number; tint?: string }) {
  return (
    <View style={[styles.tile, { width: size, height: size, backgroundColor: tint }]} accessible={false}>
      <CategoryIcon kind={kind} group={group} size={Math.round(size * 0.4)} />
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    borderRadius: radius.md,
    borderCurve: 'continuous',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
