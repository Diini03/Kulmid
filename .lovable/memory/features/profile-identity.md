---
name: Profile Identity & Avatars
description: Username-based URLs (/u/:username), avatar cropper, social links, and avatars storage bucket
type: feature
---
# Profile Identity System

## URLs
- Public profile URL: `/u/:username` (lowercase, 3-20 chars, [a-z0-9_])
- Legacy `/profile/:userId` redirects via `/u/lookup/:userId` → resolves to `/u/:username`
- Username auto-generated on profile insert via DB trigger `assign_username_on_profile_insert`
- Username uniqueness: case-insensitive partial unique index on `LOWER(username)`

## Avatars
- Storage bucket: `avatars` (public). Path pattern: `{user_id}/avatar-{timestamp}.jpg`
- RLS on storage.objects checks `auth.uid()::text = (storage.foldername(name))[1]`
- Always cropped to 1:1 square via `react-easy-crop` (`AvatarCropper.tsx`)
- Use `<UserAvatar>` component everywhere — never raw `<Avatar>` from shadcn directly for user faces
- Cache-buster query string `?t={timestamp}` appended to avatar URLs after upload

## Profile fields
- `username` (text, unique), `social_links` (jsonb)
- Existing: `bio`, `location`, `website`, `twitter`, `linkedin`, `instagram`, `avatar_url`

## Username availability check
- 500ms debounce in `ProfileSettings.tsx`
- Validates regex `/^[a-z0-9_]{3,20}$/` then queries profiles table case-insensitively