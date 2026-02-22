

# Red Color Scheme + SquirrelBox Logo Update

## What's Changing

### 1. Add the SquirrelBox Logo
- Copy the uploaded logo (`user-uploads://IMG_9283.png`) to `src/assets/squirrelbox-logo.png`
- Also copy to `public/favicon.png` for the browser tab icon
- Replace the squirrel emoji with the actual logo image in:
  - Navbar (header)
  - Footer
  - Admin layout header
- Update `index.html` to use the new favicon

### 2. Switch Color Scheme from Orange to Red
Update `src/index.css` CSS variables to shift the primary hue from orange (hue ~24) to red (hue ~0):

**Light mode changes:**
- `--primary`: 24 90% 50% → 0 85% 50% (red)
- `--accent`: 24 90% 96% → 0 85% 96%
- `--accent-foreground`: 24 90% 30% → 0 85% 30%
- `--ring`: 24 90% 50% → 0 85% 50%
- Sidebar primary/ring values updated similarly

**Dark mode changes:**
- Same hue shift applied to all dark-mode primary/accent/ring variables

### 3. Files Modified
- `src/index.css` -- color variables
- `src/components/layout/Navbar.tsx` -- logo image
- `src/components/layout/Footer.tsx` -- logo image
- `src/components/admin/AdminLayout.tsx` -- logo image
- `index.html` -- favicon reference
- New files: `src/assets/squirrelbox-logo.png`, `public/favicon.png`

## Technical Details

The logo will be imported as an ES module in React components:
```typescript
import squirrelboxLogo from "@/assets/squirrelbox-logo.png";
// Used as: <img src={squirrelboxLogo} alt="SquirrelBox" className="h-8 w-8" />
```

The emoji "🐿️" text will be removed from all locations and replaced with the `<img>` tag. The "SquirrelBox" text branding stays the same, just the accent color shifts from orange to red.

