import type { Request, Response } from 'express';

/**
 * Serverless Handler for LTA DataMall v3 Bus Arrival
 * Endpoint: GET /api/busarrival?BusStopCode={code}&ServiceNo={svc}
 * Target: https://datamall2.mytransport.sg/ltaodataservice/v3/BusArrival?BusStopCode={BusStopCode}
 * Headers forwarded: AccountKey, accept: application/json
 */
export default async function handler(req: Request, res: Response) {
  // Extract query parameters (case-insensitive)
  const busStopCode = (req.query.BusStopCode || req.query.busStopCode) as string;
  const serviceNo = (req.query.ServiceNo || req.query.serviceNo) as string | undefined;

  if (!busStopCode) {
    return res.status(400).json({
      error: 'BusStopCode query parameter is required (e.g. ?BusStopCode=83139)',
    });
  }

  // Read AccountKey strictly from environment variable or request header. No hardcoded keys.
  const headerKey = (req.headers['accountkey'] || req.headers['x-account-key']) as string | undefined;
  const accountKey =
    headerKey?.trim() ||
    process.env.LTA_ACCOUNT_KEY?.trim() ||
    process.env.LTA_DATAMALL_API_KEY?.trim();

  if (!accountKey) {
    return res.status(401).json({
      status: 'missing_key',
      message: 'No LTA DataMall AccountKey provided. Configure LTA_ACCOUNT_KEY in environment or pass via AccountKey header.',
      BusStopCode: busStopCode,
      Services: [],
    });
  }

  try {
    let url = `https://datamall2.mytransport.sg/ltaodataservice/v3/BusArrival?BusStopCode=${encodeURIComponent(busStopCode)}`;
    if (serviceNo) {
      url += `&ServiceNo=${encodeURIComponent(serviceNo)}`;
    }

    const ltaResponse = await fetch(url, {
      method: 'GET',
      headers: {
        AccountKey: accountKey,
        accept: 'application/json',
      },
    });

    if (!ltaResponse.ok) {
      const errorBody = await ltaResponse.text();
      return res.status(ltaResponse.status).json({
        error: `LTA DataMall upstream returned error: ${ltaResponse.statusText}`,
        statusCode: ltaResponse.status,
        details: errorBody,
      });
    }

    const data = await ltaResponse.json();
    return res.json(data);
  } catch (error: any) {
    return res.status(502).json({
      error: 'Failed to connect to LTA DataMall v3 gateway',
      message: error.message,
    });
  }
}
