import { Logger } from '@nestjs/common';
import type { CacheService } from '../cache/cache.service';

const FALLBACK_DIESEL_PRICE = 3.85;
const EIA_CACHE_KEY = 'eia:diesel_price';

export class EiaService {
  private readonly logger = new Logger(EiaService.name);

  async getDieselPrice(cache: CacheService): Promise<number> {
    const cached = await cache.get<number>(EIA_CACHE_KEY);
    if (cached !== null) return cached;

    try {
      const apiKey = process.env['EIA_API_KEY'];
      if (!apiKey) throw new Error('EIA_API_KEY not set');

      const url = new URL('https://api.eia.gov/v2/petroleum/pri/gnd/data/');
      url.searchParams.set('api_key', apiKey);
      url.searchParams.set('frequency', 'weekly');
      url.searchParams.set('data[0]', 'value');
      url.searchParams.set('facets[series][]', 'EMD_EPD2D_PTE_NUS_DPG');
      url.searchParams.set('sort[0][column]', 'period');
      url.searchParams.set('sort[0][direction]', 'desc');
      url.searchParams.set('length', '1');

      const res = await fetch(url.toString());
      if (!res.ok) throw new Error(`EIA API returned ${res.status}`);

      const json = await res.json() as {
        response?: { data?: Array<{ value?: unknown }> };
      };
      const price = json?.response?.data?.[0]?.value;

      if (typeof price !== 'number') {
        throw new Error(`Unexpected EIA response shape: ${JSON.stringify(json?.response?.data?.[0])}`);
      }

      await cache.set(EIA_CACHE_KEY, price, 86400);
      this.logger.log(`EIA diesel price fetched: $${price}/gal`);
      return price;
    } catch (err) {
      this.logger.warn(
        `EIA price fetch failed — using fallback $${FALLBACK_DIESEL_PRICE}/gal`,
        err,
      );
      return FALLBACK_DIESEL_PRICE;
    }
  }
}
