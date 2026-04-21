# Image Storage Setup Instructions

If images are not uploading or displaying properly in ShopMecko, follow these steps to configure Supabase Storage:

## 1. Create Storage Buckets

Go to your Supabase project dashboard → Storage → Buckets and create these public buckets:
- `avatars` - for user profile pictures
- `products` - for product images
- `cars` - for car images
- `shops` - for shop/workshop photos

## 2. Configure CORS for Each Bucket

For each bucket, you need to set CORS (Cross-Origin Resource Sharing) headers:

1. Click on the bucket name
2. Click on the three dots menu (⋯) → Edit bucket
3. Ensure "File size limit" is set appropriately (e.g., 10 MB)
4. Click on the "CORS" tab (if available) and set:

```json
[
  {
    "origin": "*",
    "methods": ["GET", "POST", "PUT", "DELETE", "HEAD"],
    "allowedHeaders": ["Content-Type", "Authorization"]
  }
]
```

Or if CORS is in the bucket policy, update the bucket policy in the SQL editor:

```sql
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true),
       ('products', 'products', true),
       ('shops', 'shops', true),
       ('cars', 'cars', true)
ON CONFLICT DO NOTHING;

-- Set public access policies
CREATE POLICY "Allow public read access"
ON storage.objects FOR SELECT USING (bucket_id IN ('avatars', 'products', 'shops', 'cars'));

CREATE POLICY "Allow authenticated uploads"
ON storage.objects FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow users to delete their own objects"
ON storage.objects FOR DELETE USING (auth.uid()::text = (storage.foldername(name))[1]);
```

## 3. Test Image Upload

1. Create your profile on ShopMecko
2. Upload a profile picture
3. Check if it displays on your profile page
4. If not showing, check browser Console for errors (F12)

## 4. Troubleshooting

### Images upload but don't display:
- Check CORS configuration in Supabase Storage settings
- Verify bucket is set to PUBLIC
- Check if URL format is: `https://[projectid].supabase.co/storage/v1/object/public/[bucket]/[path]`

### Upload fails:
- Check Supabase auth token is valid
- Verify bucket exists and is named correctly
- Check file size is below limit
- Check storage quota is not exceeded

### Browser Console errors:
- "CORS error" → Fix CORS settings as shown above
- "401 Unauthorized" → Check Supabase API key and auth
- "404 Not Found" → Verify bucket name and file path

## 5. Environment Variables

Ensure these are set in `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=https://[projectid].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[your-anon-key]
```

If you're still experiencing issues, check the Supabase documentation: https://supabase.com/docs/guides/storage
