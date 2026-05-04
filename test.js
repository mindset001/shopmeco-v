import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

async function run() {
  const { data, error } = await supabase
    .from('products')
    .select('id, name, description, images, category, brand, condition, street, city, state, stock_quantity, price, seller_id, compatible_cars, created_at, profiles(id, full_name, avatar_url, city, state, latitude, longitude)')
    .eq('id', '616917d7-3092-45d3-bf9d-42c40d9fb89c')
    .single()
    
  console.log('Error:', error)
  console.log('Data:', data)
}
run()
