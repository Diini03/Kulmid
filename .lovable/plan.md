

## Cover Image Gallery for Event Creation

### What You're Getting

A selectable grid of 20 cover images in the Create Event form. Users can either pick from the gallery OR upload their own image. The gallery replaces the current upload-only approach.

### Image Strategy

**Your 5 uploaded images** will be copied into the project as bundled assets.

**15 additional images** will use high-quality Unsplash URLs (free, stable, professional). These are direct image links that never expire and look premium. The mix will cover a variety of aesthetics:

| # | Your Images | Style |
|---|------------|-------|
| 1 | 2026 gold/blue text | Bold, celebratory |
| 2 | Anime cliff scene | Dark, atmospheric |
| 3 | Anime sketch art | Artistic, creative |
| 4 | BMW anime car | Urban, stylish |
| 5 | VR headset portrait | Tech, futuristic |

| # | Unsplash Images (I'll source) | Style |
|---|------------------------------|-------|
| 6 | Abstract dark gradient | Minimal |
| 7 | Neon city lights | Urban night |
| 8 | Concert crowd | Music/Festival |
| 9 | Conference stage | Professional |
| 10 | Mountain landscape | Nature/Outdoor |
| 11 | Abstract wave art | Creative |
| 12 | Workspace/laptop | Workshop/Tech |
| 13 | Sunset skyline | Warm atmosphere |
| 14 | Colorful smoke/powder | Vibrant energy |
| 15 | Microphone on stage | Seminar/Talk |
| 16 | Group collaboration | Meetup/Team |
| 17 | Fireworks/lights | Celebration |
| 18 | Ocean/water abstract | Calm/Webinar |
| 19 | Street photography | Culture |
| 20 | Geometric architecture | Modern/Minimal |

### UI Design

The current "upload only" image section on the left side of the Create form will be replaced with:

1. **Gallery grid** -- 4 columns of thumbnail images, scrollable
2. **Selected state** -- Teal border + checkmark on the selected image (matches your monochrome teal system)
3. **"Upload your own" option** -- A card with upload icon at the end of the gallery, clicking opens file picker (preserving existing upload logic)
4. **Preview** -- Selected/uploaded image shows larger at the top

### Technical Details

**New files:**
- `src/assets/covers/` -- folder for your 5 uploaded images
- `src/constants/coverImages.ts` -- array of 20 image objects with `id`, `src`, and `label`

**Modified files:**
- `src/pages/Create.tsx` -- Replace the left-side image upload section with the gallery picker component. Add state for `selectedCoverUrl`. On submit, if a gallery image is selected (not uploaded), use its URL directly instead of uploading to Supabase storage
- `src/components/admin/EventForm.tsx` -- Same gallery integration for admin form

**Submit logic change:**
- If user picks a gallery image: store the URL directly (no upload needed)
- If user uploads custom image: use existing Supabase storage upload flow
- The `imageFile` state becomes optional -- either `imageFile` OR `selectedCoverUrl` must be set

