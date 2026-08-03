import { createClient } from '@supabase/supabase-js';

const url = 'https://veiigiakrhclunafkwgz.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZlaWlnaWFrcmhjbHVuYWZrd2d6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU2MTI0NzAsImV4cCI6MjEwMTE4ODQ3MH0.wUfDUxiPRx4z-PLOero_oyTfnOitCXXREsccyWqc7eQ';

const supabase = createClient(url, key);

async function test() {
  console.log('Testing driver login...');
  const res1 = await supabase.auth.signInWithPassword({
    email: 'driver@taxijohor.com',
    password: 'Password123!',
  });
  console.log('Driver Login Result:', res1.error ? res1.error.message : 'SUCCESS!');

  if (res1.error) {
    console.log('Attempting driver signup via Auth API...');
    const signUpRes = await supabase.auth.signUp({
      email: 'driver@taxijohor.com',
      password: 'Password123!',
      options: {
        data: { full_name: 'Mr. Razali', role: 'driver' }
      }
    });
    console.log('SignUp Result:', JSON.stringify(signUpRes, null, 2));
  }
}

test();
