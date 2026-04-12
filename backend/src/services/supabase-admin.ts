import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || 'https://ghgilnuwkbiqmdhzzznq.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdoZ2lsbnV3a2JpcW1kaHp6em5xIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTg5MDA3OCwiZXhwIjoyMDkxNDY2MDc4fQ.p6c9Ut9Or37IY14H-eIHc6_-ouSBAbutkW4zBoZuA1g';

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export async function getUserByEmail(email: string) {
  const { data, error } = await supabaseAdmin
    .from('User')
    .select('*')
    .eq('email', email)
    .single();
  
  if (error) return null;
  return data;
}

export async function getRestaurantBySlug(slug: string) {
  const { data, error } = await supabaseAdmin
    .from('Restaurant')
    .select('*')
    .eq('slug', slug)
    .single();
  
  if (error) return null;
  return data;
}

export async function getMenuByRestaurantId(restaurantId: string) {
  const { data: categories, error: catError } = await supabaseAdmin
    .from('MenuCategory')
    .select('*, items:MenuItem(*)')
    .eq('restaurantId', restaurantId)
    .order('sortOrder');

  if (catError) return [];
  return categories || [];
}

export async function createOrder(order: any) {
  const { data, error } = await supabaseAdmin
    .from('Order')
    .insert(order)
    .select()
    .single();
  
  return { data, error };
}

export async function updateOrderStatus(orderId: string, status: string) {
  const { data, error } = await supabaseAdmin
    .from('Order')
    .update({ status, updatedAt: new Date().toISOString() })
    .eq('id', orderId)
    .select()
    .single();
  
  return { data, error };
}
