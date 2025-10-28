import fs from 'fs/promises';
import path from 'path';
import { connectDatabase, closeDatabase } from '../src/db/connection';
import { monetizationAnalyticsService } from '../src/services/MonetizationAnalyticsService';
import { logger } from '../src/utils/logger';

interface CliOptions {
  days: number;
  outPath?: string;
}

function parseArgs(argv: string[]): CliOptions {
  const options: CliOptions = { days: 14 };

  for (const arg of argv) {
    if (arg.startsWith('--days=')) {
      const parsed = Number(arg.split('=')[1]);
      if (Number.isFinite(parsed) && parsed > 0) {
        options.days = Math.floor(parsed);
      }
    } else if (arg.startsWith('--out=')) {
      options.outPath = arg.substring('--out='.length);
    }
  }

  return options;
}

function toCsv(metrics: Awaited<ReturnType<typeof monetizationAnalyticsService.getDailyMetrics>>): string {
  const header = [
    'date',
    'shop_tab_impressions',
    'shop_views',
    'shop_visit_rate',
    'quest_claim_starts',
    'quest_claim_success',
    'quest_claim_success_rate',
    'daily_boost_upsell_views',
    'daily_boost_upsell_clicks',
    'daily_boost_upsell_ctr',
  ];

  const rows = metrics.daily.map(day => {
    return [
      day.date,
      day.shopTabImpressions,
      day.shopViews,
      day.shopVisitRate !== null ? day.shopVisitRate.toFixed(4) : '',
      day.questClaimStarts,
      day.questClaimSuccess,
      day.questClaimSuccessRate !== null ? day.questClaimSuccessRate.toFixed(4) : '',
      day.dailyBoostUpsellViews,
      day.dailyBoostUpsellClicks,
      day.dailyBoostUpsellCtr !== null ? day.dailyBoostUpsellCtr.toFixed(4) : '',
    ].join(',');
  });

  return [header.join(','), ...rows].join('\n');
}

async function ensureOutputDirectory(outPath: string) {
  const directory = path.dirname(outPath);
  await fs.mkdir(directory, { recursive: true });
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  logger.info('Generating monetization report', options);

  await connectDatabase();

  try {
    const metrics = await monetizationAnalyticsService.getDailyMetrics(options.days);

    if (!options.outPath) {
      // eslint-disable-next-line no-console
      console.log(JSON.stringify(metrics, null, 2));
      return;
    }

    const resolvedOutPath = path.resolve(process.cwd(), options.outPath);
    await ensureOutputDirectory(resolvedOutPath);
    await fs.writeFile(resolvedOutPath, toCsv(metrics), { encoding: 'utf-8' });
    logger.info('Monetization metrics written', { outPath: resolvedOutPath });
  } finally {
    await closeDatabase().catch(error => {
      logger.warn('Failed to close database after monetization report generation', {
        error: error instanceof Error ? error.message : error,
      });
    });
  }
}

if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch(error => {
      logger.error('Failed to generate monetization report', {
        error: error instanceof Error ? error.message : error,
      });
      process.exit(1);
    });
}
