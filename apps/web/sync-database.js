import { createClient } from '@supabase/supabase-js';
import { FLEET, DEFAULT_WHATSAPP_NUMBER } from './src/data/fleetData.js';

const url = 'https://veiigiakrhclunafkwgz.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZlaWlnaWFrcmhjbHVuYWZrd2d6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU2MTI0NzAsImV4cCI6MjEwMTE4ODQ3MH0.wUfDUxiPRx4z-PLOero_oyTfnOitCXXREsccyWqc7eQ';

const supabase = createClient(url, key);

async function syncDatabase() {
  console.log('Logging in as Admin...');
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'admin@taxijohor.com',
    password: 'Password123!',
  });

  if (authError) {
    console.error('Admin login failed:', authError.message);
    process.exit(1);
  }

  console.log('Logged in successfully as:', authData.user.email);

  // 1. Update site_settings
  console.log('Updating site_settings...');
  const { error: settingsErr } = await supabase
    .from('site_settings')
    .upsert({ key: 'DEFAULT_WHATSAPP_NUMBER', value: DEFAULT_WHATSAPP_NUMBER }, { onConflict: 'key' });
  if (settingsErr) {
    console.error('Failed to update site_settings:', settingsErr.message);
  } else {
    console.log('DEFAULT_WHATSAPP_NUMBER set to:', DEFAULT_WHATSAPP_NUMBER);
  }

  // 2. Fetch existing fleets from database to check for obsolete IDs
  const { data: dbFleets, error: fetchErr } = await supabase.from('fleets').select('id');
  if (fetchErr) {
    console.error('Failed to fetch existing fleets:', fetchErr.message);
  }

  const validIds = new Set(FLEET.map((f) => f.id));

  // Delete obsolete fleets not in fleetData.js
  if (dbFleets) {
    const obsoleteFleets = dbFleets.filter((df) => !validIds.has(df.id));
    for (const ob of obsoleteFleets) {
      console.log(`Deleting obsolete fleet from DB: ${ob.id}`);
      const { error: delErr } = await supabase.from('fleets').delete().eq('id', ob.id);
      if (delErr) {
        console.error(`Failed to delete ${ob.id}:`, delErr.message);
      }
    }
  }

  // 3. Upsert fleets from FLEET array
  console.log(`Syncing ${FLEET.length} vehicles to Supabase 'fleets' table...`);
  for (let i = 0; i < FLEET.length; i++) {
    const item = FLEET[i];
    const fleetPayload = {
      id: item.id,
      name: item.name,
      driver_name: item.driverName,
      rate: item.rate,
      seats: item.seats,
      luggage: item.luggage,
      whatsapp_number: item.whatsappNumber,
      image_url: item.image,
      display_order: i + 1,
      is_published: true,
      updated_at: new Date().toISOString(),
    };

    console.log(`[${i + 1}/${FLEET.length}] Upserting: ${item.id} (${item.driverName} - ${item.name})`);
    const { error: upsertErr } = await supabase
      .from('fleets')
      .upsert(fleetPayload, { onConflict: 'id' });

    if (upsertErr) {
      console.error(`Failed to upsert ${item.id}:`, upsertErr.message);
    }
  }

  console.log('Database sync complete!');

  // Verify sync
  const { data: finalFleets } = await supabase.from('fleets').select('id, name, driver_name, rate, seats, luggage, whatsapp_number, image_url').order('display_order');
  console.log('\n--- VERIFIED LIVE DATABASE FLEETS ---');
  console.table(finalFleets);
}

syncDatabase().catch((err) => {
  console.error('Unhandled error during sync:', err);
  process.exit(1);
});
