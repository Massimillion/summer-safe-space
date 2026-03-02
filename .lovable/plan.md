

## Add "Built By" Credit to Footer

**What**: Add a subtle developer credit line in the footer, below the copyright notice.

**Where**: `src/components/layout/Footer.tsx` — append a small line after the existing copyright text.

**Implementation**:
- Add a new line beneath `© 2025 SquirrelBox Storage. All rights reserved.`
- Text like: `Website by [Your Company Name]` with an external link to your company's URL
- Styled smaller and subtler than the copyright (e.g., `text-xs text-muted-foreground/60`)
- Link opens in a new tab (`target="_blank" rel="noopener noreferrer"`)

**Design**: Keeps it professional and non-intrusive — a single line, muted color, small font.

I'll need your **company name** and **website URL** to add the credit.

