import { describe, expect, it } from '@jest/globals';
import { en } from '@/localization/en';
import { fil } from '@/localization/fil';
import { compassFromBearing, parseOsrmResponse, simplifySteps, type OsrmResponse } from './parse';
import { RoutingError, type RouteStep } from './types';

const maneuver = (type: string, modifier?: string, extra: object = {}) => ({ type, modifier, bearing_after: 90, location: [121.04, 14.64] as [number, number], ...extra });

// Shaped like a real response from routing.openstreetmap.de.
const response: OsrmResponse = {
  code: 'Ok',
  routes: [
    {
      distance: 2000,
      duration: 300,
      geometry: { coordinates: [[121.04, 14.64], [121.06, 14.66]] },
      legs: [
        {
          steps: [
            { name: '', distance: 100, duration: 20, maneuver: maneuver('depart', 'left') },
            { name: 'NIA Road', distance: 400, duration: 60, maneuver: maneuver('turn', 'left') },
            { name: 'NIA Road', distance: 300, duration: 40, maneuver: maneuver('new name', 'straight') },
            { name: 'East Avenue', ref: '174', distance: 900, duration: 120, maneuver: maneuver('end of road', 'right') },
            { name: '', ref: '170', distance: 200, duration: 30, maneuver: maneuver('rotary', 'right', { exit: 2 }) },
            { name: 'Batangas Ferry', mode: 'ferry', distance: 100, duration: 30, maneuver: maneuver('notification', 'straight') },
            { name: 'Commonwealth Avenue', distance: 0, duration: 0, maneuver: maneuver('arrive', 'right') },
          ],
        },
      ],
    },
  ],
};

describe('parseOsrmResponse', () => {
  const route = parseOsrmResponse(response, 'driving');

  it('keeps the totals and the line for the map', () => {
    expect(route.distanceMeters).toBe(2000);
    expect(route.durationSeconds).toBe(300);
    expect(route.coordinates).toHaveLength(2);
  });

  it('turns server maneuvers into our own step types', () => {
    expect(route.steps.map((s) => s.type)).toEqual(['depart', 'turn', 'end-of-road', 'roundabout', 'ferry', 'arrive']);
  });

  it('uses the road number when a road has no name', () => {
    expect(route.steps[3].road).toBe('170');
    expect(route.steps[3].exit).toBe(2);
  });

  it('reports no route instead of an empty result', () => {
    expect(() => parseOsrmResponse({ code: 'NoRoute' }, 'walking')).toThrow(RoutingError);
    expect(() => parseOsrmResponse({ code: 'Ok', routes: [] }, 'walking')).toThrow(RoutingError);
  });
});

describe('simplifySteps', () => {
  it('folds "keep going" on the same road into the step before', () => {
    const turn = parseOsrmResponse(response, 'driving').steps[1];
    expect(turn.road).toBe('NIA Road');
    expect(turn.distanceMeters).toBe(700);
    expect(turn.durationSeconds).toBe(100);
  });

  it('keeps a real change of road', () => {
    const base = { compass: 'n', durationSeconds: 1, location: { latitude: 0, longitude: 0 } } as const;
    const steps: RouteStep[] = [
      { ...base, type: 'depart', road: 'A', distanceMeters: 10 },
      { ...base, type: 'continue', road: 'B', distanceMeters: 10 },
    ];
    expect(simplifySteps(steps)).toHaveLength(2);
  });
});

describe('compassFromBearing', () => {
  it('rounds to the nearest of eight directions', () => {
    expect(compassFromBearing(0)).toBe('n');
    expect(compassFromBearing(359)).toBe('n');
    expect(compassFromBearing(92)).toBe('e');
    expect(compassFromBearing(225)).toBe('sw');
  });
});

describe('written directions', () => {
  const step = (over: Partial<RouteStep>): RouteStep => ({
    type: 'turn',
    compass: 'n',
    distanceMeters: 100,
    durationSeconds: 60,
    location: { latitude: 0, longitude: 0 },
    ...over,
  });

  it('reads naturally in English, with and without a road name', () => {
    const say = en.directions.instruction;
    expect(say(step({ type: 'depart', compass: 'ne', road: 'Mariano Street' }))).toBe('Head northeast on Mariano Street');
    expect(say(step({ modifier: 'left', road: 'NIA Road' }))).toBe('Turn left onto NIA Road');
    expect(say(step({ modifier: 'slight right' }))).toBe('Bear right');
    expect(say(step({ type: 'roundabout', exit: 2, road: 'Quezon Avenue' }))).toBe('At the roundabout, take exit 2 onto Quezon Avenue');
    expect(say(step({ type: 'arrive' }), 'Baclaran Church')).toBe('Arrive at Baclaran Church');
  });

  it('reads naturally in Filipino, with and without a road name', () => {
    const say = fil.directions.instruction;
    expect(say(step({ type: 'depart', compass: 'n', road: 'Mariano Street' }))).toBe('Tumungo pa-hilaga sa Mariano Street');
    expect(say(step({ modifier: 'left', road: 'NIA Road' }))).toBe('Kumaliwa sa NIA Road');
    expect(say(step({ modifier: 'right' }))).toBe('Kumanan');
    expect(say(step({ type: 'roundabout', exit: 2 }))).toBe('Sa rotonda, lumabas sa ika-2 na labasan');
    expect(say(step({ type: 'ferry' }))).toBe('Sumakay ng ferry');
    expect(say(step({ type: 'arrive' }), 'Baclaran Church')).toBe('Nandito na ang Baclaran Church');
  });

  it('formats travel time in both languages', () => {
    expect(en.directions.duration(1133)).toBe('19 min');
    expect(en.directions.duration(5400)).toBe('1 hr 30 min');
    expect(fil.directions.duration(1133)).toBe('19 minuto');
    expect(fil.directions.duration(3600)).toBe('1 oras');
  });
});
