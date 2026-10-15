import type { Request, Response } from 'express';

export default async function handler(req: Request, res: Response) {
  // Extract query parameters
  const busStopCode = (req.query.BusStopCode || req.query.busStopCode) as string;
  const serviceNo = (req.query.ServiceNo || req.query.serviceNo) as string | undefined;

  if (!busStopCode) {
    return res.status(400).json({ error: 'BusStopCode query parameter is required (e.g. 83139)' });
  }

  // AccountKey priority:
  // 1. Client header: 'x-account-key' or 'AccountKey'
  // 2. Server env var: LTA_ACCOUNT_KEY or LTA_DATAMALL_API_KEY
  const clientKey = (req.headers['x-account-key'] || req.headers['accountkey']) as string | undefined;
  const accountKey = clientKey?.trim() || process.env.LTA_ACCOUNT_KEY?.trim() || process.env.LTA_DATAMALL_API_KEY?.trim();

  if (!accountKey) {
    return res.json({
      status: 'no_key',
      message: 'No LTA DataMall AccountKey configured. Set LTA_ACCOUNT_KEY in .env or provide via X-Account-Key header.',
      BusStopCode: busStopCode,
      Services: [],
    });
  }

  try {
    let url = `https://datamall2.mytransport.sg/ltaodataservice/v3/BusArrival?BusStopCode=${encodeURIComponent(busStopCode)}`;
    if (serviceNo) {
      url += `&ServiceNo=${encodeURIComponent(serviceNo)}`;
    }

    let ltaRes = await fetch(url, {
      method: 'GET',
      headers: {
        AccountKey: accountKey,
        accept: 'application/json',
      },
    });

    // Fallback to legacy v2 endpoint if v3 endpoint is not supported by key tier
    if (!ltaRes.ok && ltaRes.status !== 401 && ltaRes.status !== 403) {
      let fallbackUrl = `https://datamall2.mytransport.sg/ltaodataservice/BusArrivalv2?BusStopCode=${encodeURIComponent(busStopCode)}`;
      if (serviceNo) {
        fallbackUrl += `&ServiceNo=${encodeURIComponent(serviceNo)}`;
      }
      const fallbackRes = await fetch(fallbackUrl, {
        method: 'GET',
        headers: {
          AccountKey: accountKey,
          accept: 'application/json',
        },
      });
      if (fallbackRes.ok) {
        ltaRes = fallbackRes;
      }
    }

    if (!ltaRes.ok) {
      const errText = await ltaRes.text();
      return res.status(ltaRes.status).json({
        error: `LTA DataMall API error: ${ltaRes.statusText}`,
        statusCode: ltaRes.status,
        details: errText,
      });
    }

    const data = await ltaRes.json();
    return res.json({
      status: 'success',
      endpoint: url,
      BusStopCode: busStopCode,
      Services: data.Services || [],
    });
  } catch (error: any) {
    return res.status(502).json({
      error: 'Failed to connect to LTA DataMall serverless endpoint',
      message: error.message,
    });
  }
}
