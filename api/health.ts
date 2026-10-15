import type { Request, Response } from 'express';

export default async function handler(req: Request, res: Response) {
  const hasServerKey = Boolean(
    process.env.LTA_ACCOUNT_KEY?.trim() || process.env.LTA_DATAMALL_API_KEY?.trim()
  );

  return res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    hasServerApiKey: hasServerKey,
    endpoints: {
      busArrival: '/api/busarrival?BusStopCode={code}',
      busArrivalAlt: '/api/bus-arrival?BusStopCode={code}',
      busStops: '/api/bus-stops?skip=0',
      busRoutes: '/api/bus-routes?skip=0',
      busServices: '/api/bus-services?skip=0',
      health: '/api/health',
    },
  });
}
