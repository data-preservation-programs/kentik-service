import { ProviderUtil } from '../provider.js';
import dotenv from 'dotenv';
import Cron from '../cron.js';
import Database from '../database.js';
dotenv.config();

await Database.init();
let providers = await ProviderUtil.GetAllProviders(
  process.env.LOTUS_URL, process.env.LOTUS_TOKEN,
  {
    hasPower: true,
    hasMultiAddr: true
  });
let providersUpdatedAt = new Date();
while (true) {
  const cron = new Cron();
  await cron.init();
  const endpointKeys = await cron.ScanNewProviders(providers, 10);
  console.log('Waiting for ' + (Number(process.env.INTERVAL_MS) || 600) + 's...');
  await new Promise(resolve => setTimeout(resolve, Number(process.env.INTERVAL_MS) || 10 * 60 * 1000));
  await cron.UpdateAllTests(endpointKeys);
  console.log('All done!');
  if (cron.globalCreditReached) {
    console.log('Global credit reached. There are more providers to be added in the next loop.');
  }
  await new Promise(resolve => setTimeout(resolve, 60 * 1000));
  if (Date.now() - providersUpdatedAt.getTime() > Number(process.env.PROVIDER_SCAN_INTERVAL_MS) ?? 24 * 60 * 60 * 1000) {
    providers = await ProviderUtil.GetAllProviders(
      process.env.LOTUS_URL, process.env.LOTUS_TOKEN,
      {
        hasPower: true,
        hasMultiAddr: true
      });
    providersUpdatedAt = new Date();
  }
}
