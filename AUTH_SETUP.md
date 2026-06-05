# Authentication Setup Guide

This guide covers the complete authentication system for ShopMecko, including password reset, Google OAuth, and email verification.

## Features Implemented

### 1. **Password Reset / Forgot Password**
- Users can request a password reset link via email
- Secure token-based reset flow with 24-hour expiration
- New password confirmation with validation

**Files:**
- [app/(auth)/forgot-password/page.tsx](app/(auth)/forgot-password/page.tsx) - Forgot password request form
- [app/(auth)/reset-password/page.tsx](app/(auth)/reset-password/page.tsx) - Password reset form

**How it works:**
1. User clicks "Forgot password?" on login page
2. Enters email and receives reset link
3. Link redirects to reset form with valid session
4. User enters new password and confirms
5. Redirects to dashboard on success

### 2. **Google OAuth / Social Authentication**
- One-click Google sign-in and sign-up
- Automatic profile creation for new users
- Role assignment during signup via URL parameter

**Files:**
- [app/api/auth/callback/route.ts](app/api/auth/callback/route.ts) - OAuth callback handler
- [lib/supabase/auth.ts](lib/supabase/auth.ts) - Auth utility functions
- Updated [app/(auth)/login/page.tsx](app/(auth)/login/page.tsx) - Google sign-in button
- Updated [app/(auth)/register/page.tsx](app/(auth)/register/page.tsx) - Google sign-up button

**How it works:**
1. User clicks "Continue with Google"
2. Redirected to Google consent screen
3. Google redirects back to `/api/auth/callback`
4. System exchanges code for session
5. Profile auto-created if new user
6. Redirects to dashboard with session cookies

### 3. **Email Verification**
- Email verification flow for new signups
- Resend verification email functionality
- Automated profile creation on auth trigger

**Files:**
- [app/(auth)/verify-email/page.tsx](app/(auth)/verify-email/page.tsx) - Email verification page
- [supabase-schema.sql](supabase-schema.sql) - Trigger: `on_auth_user_created`

**How it works:**
1. User registers with email and password
2. Verification email sent by Supabase
3. User clicks link in email
4. Confirmation page shows status
5. Can resend email if needed

## Setup Steps

### Step 1: Environment Variables

Add these to `.env.local`:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# OAuth Redirect (optional, for development)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Step 2: Enable Google OAuth in Supabase

1. Go to [Supabase Dashboard](https://app.supabase.com) > Authentication > Providers
2. Enable "Google"
3. Enter your Google OAuth credentials:
   - **Client ID**: From [Google Cloud Console](https://console.cloud.google.com)
   - **Client Secret**: From Google Cloud Console
4. Set Authorized redirect URIs in Google Cloud:
   ```
   https://your-project.supabase.co/auth/v1/callback
   http://localhost:3000/api/auth/callback (for local dev)
   ```

### Step 3: Configure Email Provider

For production, configure a transactional email service in Supabase:

1. Supabase Dashboard > Authentication > Email Templates
2. Edit email templates for:
   - Password reset
   - Email verification (if enabling verification flow)
   - Magic link login (optional)

### Step 4: Deploy Changes

The authentication system is ready to use immediately:

```bash
npm run dev
```

Test endpoints:
- Login: `/login`
- Register: `/register`
- Forgot Password: `/forgot-password`
- Reset Password: `/auth/reset-password` (accessed via email link)
- Email Verification: `/auth/verify-email` (accessed via email link)
- OAuth Callback: `/api/auth/callback` (automatic)

## API Reference

### Authentication Utilities

Located in [lib/supabase/auth.ts](lib/supabase/auth.ts):

```typescript
// Sign in with email/password
signInWithEmail(email: string, password: string)

// Sign up with email/password
signUpWithEmail(email: string, password: string, fullName: string)

// Request password reset
requestPasswordReset(email: string)

// Reset password after email verification
resetPassword(newPassword: string)

// Sign in with Google
signInWithGoogle()

// Get current user
getCurrentUser()

// Sign out
signOut()

// Get user profile
getUserProfile()
```

### Registration API

**Endpoint:** `POST /api/register`

**Request:**
```json
{
  "email": "user@example.com",
  "password": "secure-password",
  "fullName": "John Doe",
  "role": "car_owner"
}
```

**Response:**
```json
{
  "success": true,
  "user_id": "uuid"
}
```

### OAuth Callback

**Endpoint:** `GET /api/auth/callback`

**Query Parameters:**
- `code` (required): Authorization code from provider
- `role` (optional): User role for new signups (car_owner, repairer, parts_seller)
- `state`: OAuth state parameter

## Database Schema

### Profiles Table (Auto-created)

```sql
CREATE TABLE profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id),
  full_name text,
  role user_role DEFAULT 'car_owner',
  email text,
  email_confirmed_at timestamp,
  is_verified boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
)
```

### Auth Trigger

Automatically creates a profile when a user signs up:

```sql
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user()
```

The trigger extracts:
- `full_name` from user metadata
- `role` from user metadata (defaults to 'car_owner')

## Security Features

✅ **Password Security**
- Minimum 8 characters required
- Hashed with bcrypt
- Reset tokens expire after 24 hours

✅ **Session Management**
- Secure HTTP-only cookies
- Automatic token refresh
- CSRF protection via Supabase middleware

✅ **OAuth Security**
- Code exchange (no implicit grant)
- State parameter validation
- Automatic profile creation to prevent privilege escalation

✅ **Email Verification**
- One-time tokens
- Time-limited links
- Server-side validation

## Testing

### Test Forgot Password
1. Go to `/login`
2. Click "Forgot password?"
3. Enter test email
4. Check email for reset link (or Supabase logs in development)
5. Click link to reset password

### Test Google OAuth
1. Go to `/login` or `/register`
2. Click "Continue with Google"
3. Authenticate with Google account
4. Should redirect to dashboard with session

### Test Email Verification
1. Register with `/register`
2. Check email for verification link
3. Click link to verify
4. Should redirect to dashboard

## Troubleshooting

### "Invalid or expired reset link"
- Reset links expire after 24 hours
- User must request a new reset link
- Check that the user session is valid

### Google OAuth redirects to login with error
- Verify Google Client ID and Secret are correct
- Check redirect URIs in Google Cloud Console
- Ensure `NEXT_PUBLIC_SUPABASE_URL` matches Supabase project URL

### Email not being sent
- Check Supabase email settings
- Verify email templates are configured
- Check email provider status
- Review function logs in Supabase dashboard

### User profile not created after OAuth
- Trigger `on_auth_user_created` may have failed
- Manually upsert profile to profiles table
- Check Supabase function logs

## Best Practices

1. **Always use HTTPS** in production for OAuth
2. **Rotate OAuth tokens** regularly
3. **Monitor failed login attempts** for security
4. **Use strong passwords** - enforce policy in registration
5. **Email verification** - enable for critical operations
6. **Rate limiting** - implement on auth endpoints
7. **Audit logs** - track authentication events
8. **Session timeout** - refresh tokens periodically

## Next Steps

Optional enhancements:

- [ ] Email verification requirement (currently skipped for UX)
- [ ] Two-factor authentication (2FA)
- [ ] Social OAuth providers (GitHub, Apple, etc.)
- [ ] Passwordless login (magic links)
- [ ] Account recovery codes
- [ ] Login activity monitoring
- [ ] Security alerts for suspicious activity
- [ ] IP whitelisting for business accounts
