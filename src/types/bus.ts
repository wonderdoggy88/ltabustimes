export type BusLoad = 'SEA' | 'SDA' | 'LSD'; // Seats Available, Standing Available, Limited Standing
export type BusType = 'SD' | 'DD' | 'BD'; // Single Deck, Double Deck, Bendy
export type BusOperator = 'SBST' | 'SMRT' | 'TTS' | 'GAS';

export interface NextBusInfo {
  OriginCode: string;
  DestinationCode: string;
  EstimatedArrival: string; // ISO string
  Latitude: string;
  Longitude: string;
  VisitNumber: string;
  Load: BusLoad;
  Feature: 'WAB' | '';
  Type: BusType;
  minutesAway: number; // computed helper
  isArriving: boolean; // <= 1 min
}

export interface BusServiceArrival {
  ServiceNo: string;
  Operator: BusOperator;
  NextBus: NextBusInfo;
  NextBus2?: NextBusInfo;
  NextBus3?: NextBusInfo;
  inService: boolean;
}

export interface BusStop {
  BusStopCode: string;
  RoadName: string;
  Description: string;
  Latitude: number;
  Longitude: number;
  services: string[];
  distance?: number; // distance in meters from current user position
  region?: 'Central' | 'East' | 'West' | 'North' | 'North-East';
}

export interface FavoriteStop {
  id: string;
  busStopCode: string;
  nickname?: string;
  pinnedServices?: string[];
  createdTimestamp: number;
}

export interface BusRouteStop {
  BusStopCode: string;
  RoadName: string;
  Description: string;
  StopSequence: number;
  Distance: number; // cumulative km
  Latitude: number;
  Longitude: number;
}

export interface BusServiceRoute {
  ServiceNo: string;
  Operator: BusOperator;
  Direction: number; // 1 or 2
  Origin: string;
  Destination: string;
  Stops: BusRouteStop[];
}

export interface ActiveLiveBus {
  id: string;
  serviceNo: string;
  operator: BusOperator;
  type: BusType;
  load: BusLoad;
  feature: 'WAB' | '';
  latitude: number;
  longitude: number;
  heading: number;
  speedKmH: number;
  nextStopCode: string;
  targetStopCode: string;
  minutesAway: number;
  distanceKm: number;
}
