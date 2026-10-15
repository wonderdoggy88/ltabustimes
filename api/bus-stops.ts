import type { Request, Response } from 'express';

export default async function handler(req: Request, res: Response) {
  const skip = req.query.skip || req.query.$skip || '0';
  const clientKey = (req.headers['x-account-key'] || req.headers['accountkey']) as string | undefined;
  const accountKey = clientKey?.trim() || process.env.LTA_ACCOUNT_KEY?.trim() || process.env.LTA_DATAMALL_API_KEY?.trim();

  if (!accountKey) {
    return res.json({
      status: 'no_key',
      message: 'No LTA DataMall AccountKey configured.',
      value: [],
    });
  }

  try {
    const url = `https://datamall2.mytransport.sg/ltaodataservice/BusStops?$skip=${skip}`;
    const ltaRes = await fetch(url, {
      headers: {
        AccountKey: accountKey,
        accept: 'application/json',
      },
    });

    if (!ltaRes.ok) {
      return res.status(ltaRes.status).json({ error: `LTA API error: ${ltaRes.statusText}` });
    }

    const data = await ltaRes.json();
    return res.json(data);
  } catch (error: any) {
    return res.status(502).json({ error: error.message });
  }
}
