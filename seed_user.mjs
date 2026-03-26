import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function seed() {
  console.log('Seeding storefront users...');
  
  const hash = await bcrypt.hash('password123', 10);
  const user = {
    name: 'Admin User',
    email: 'admin@starmart.com',
    password_hash: hash,
    phone: '555-123-4567',
    loyalty_points: 1000,
  };

  const { data: existing } = await supabase.from('storefront_users').select('id').eq('email', user.email).single();
  if (!existing) {
    const { error } = await supabase.from('storefront_users').insert(user);
    if (error) console.error('Error:', error.message);
    else console.log('✅ Created admin user:', user.email, '/ password123');
  } else {
    console.log('⚠ Admin user already exists:', user.email);
  }
}

seed().catch(console.error);
