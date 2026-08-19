declare module "ephemeris" {
  export interface PlanetObservation {
    name: string;
    raw: unknown;
    apparentLongitudeDms30: string;
    apparentLongitudeDms360: string;
    apparentLongitudeDd: number;
    geocentricDistanceKm: number;
    is_retrograde: boolean;
  }

  export interface EphemerisResult {
    date: {
      gregorianTerrestrial: string;
      gregorianTerrestrialRaw: unknown;
      gregorianUniversal: string;
      gregorianDelta: string;
      julianTerrestrial: number;
      julianUniversal: number;
      julianDelta: number;
    };
    observer: {
      name: string;
      longitudeGeodetic: number;
      longitudeGeocentric: number;
      latitudeGeodetic: number;
      latitudeGeocentric: number;
      heightGeodetic: number;
      heightGeocentric: number;
    };
    observed: Record<string, PlanetObservation>;
  }

  export function getAllPlanets(
    date: Date,
    geodeticalLongitude: number,
    geodeticalLatitude: number,
    height: number
  ): EphemerisResult;

  export function getPlanet(
    planetName: string,
    date: Date,
    geodeticalLongitude: number,
    geodeticalLatitude: number,
    height: number
  ): EphemerisResult;
}

declare module "ephemeris/src/astronomy/moshier/constant" {
  const constant: {
    tlong: number;
    glat: number;
    height: number;
    date: {
      day: number;
      month: number;
      year: number;
      hours: number;
      minutes: number;
      seconds: number;
      universal: number;
      julian: number;
      delta: number;
      universalDateString: string;
    };
    eps: number;
    RTD: number;
    j2000: number;
  };
  export default constant;
}

declare module "ephemeris/src/astronomy/moshier/sidereal" {
  const sidereal: {
    calc: (date: unknown, tlong: number) => number;
  };
  export default sidereal;
}