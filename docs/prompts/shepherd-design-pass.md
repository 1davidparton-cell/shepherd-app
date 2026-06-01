# Shepherd — Claude Design Pass Brief

## What This Is

Shepherd is a full-stack biblical counseling PWA. A Reformed Baptist counselor uses the Admin Hub to manage counselees, run AI-assisted sessions, and assign homework. Counselees (husbands, wives, disciples) use the User Portal on their phones. The build is complete and functional. This is a design pass — take the wireframe-quality Tailwind and make it feel like a premium pastoral tool.

The standard: this should feel like it belongs in a study lined with theology books. Not a SaaS dashboard. Not a therapy app. A tool that takes Scripture seriously, treats suffering with weight, and looks like it was built by someone who reads Calvin.

---

## Stack Context

- **Frontend:** React + Vite + TypeScript + Tailwind CSS
- **No component library** — all custom Tailwind
- **Two surfaces:** Admin Hub (desktop-first) + User Portal (mobile-first PWA)
- **Existing color tokens in tailwind.config.ts:**

```typescript
colors: {
  shepherd: {
    navy: '#1a2744',
    gold: '#c9a84c',
    cream: '#f9f5ef',
    stone: '#8b7355',
    'navy-light': '#243363',
  },
}
```

---

## Design Language

### Personality
Theologically serious. Pastorally warm. Not clinical. Not corporate. Not modern-minimalist-SaaS. Think: a well-made study Bible. A leather-bound journal. A pastor's desk. Weight and warmth together.

### Typography Direction
- **Headings:** Serif (Georgia is the current fallback — upgrade to a real web serif if available, e.g. Lora, Playfair Display, or Source Serif 4)
- **Body/UI:** Clean sans-serif (Inter or system-ui)
- **Scripture passages:** Serif with generous line-height, slight indent, feels like a page
- **No display fonts, no geometric grotesques, no trendy variable fonts**

### Color Usage
- **Navy (#1a2744):** Primary — headers, sidebars, CTAs, active states
- **Gold (#c9a84c):** Accent — active nav indicators, highlight borders, key actions, status dots
- **Cream (#f9f5ef):** Warm background — portal pages, card backgrounds where appropriate
- **Stone (#8b7355):** Secondary text, scripture references, de-emphasized labels
- **White:** Card backgrounds in admin hub
- **Gray-50/100/200:** Borders and dividers

### Tone Cues by Surface
- **Admin Hub** — precise, organized, counselor's workspace. Dense but not cramped. Clean information hierarchy.
- **User Portal** — warm, safe, personal. Like opening a devotional. The AI chat should feel like speaking to a wise pastor, not a chatbot.

---

## File Map

All files to restyle live at `/Users/daveparton/shepherd-app/client/src/`

```
pages/
  auth/LoginPage.tsx
  admin/
    AdminLayout.tsx          ← sidebar nav + wrapper
    AdminDashboard.tsx       ← stat cards + recent notes
    AdminUsers.tsx           ← table + add user modal
    AdminSettings.tsx        ← AI provider config form
    AdminChat.tsx            ← split-panel counseling chat
    AdminHomework.tsx        ← assignment list + modal
    AdminResponses.tsx       ← response review + AI synthesis
  portal/
    PortalLayout.tsx         ← mobile bottom-nav + header
    PortalHome.tsx           ← welcome + quick links
    PortalChat.tsx           ← personal AI chat
    PortalHomework.tsx       ← homework cards + response input
    PortalScripture.tsx      ← ESV reader + audio player
```

---

## Screen-by-Screen Brief

### Login Page (`LoginPage.tsx`)
**Current state:** Navy full-screen, centered card with Google SSO button, shepherd's staff SVG icon, "Shepherd" wordmark.

**Design goal:** This should be the most beautiful screen. A user's first impression. It should feel like opening a Bible app, not logging into Slack.
- Full navy background is correct. Keep it.
- The wordmark "Shepherd" should be large, prominent, serif, gold or white
- Consider a subtle texture or pattern in the background (SVG crosshatch, linen-like, or subtle radial gradient — not gradients for the sake of it, just warmth)
- The Google button should be clean — white pill on the dark background
- "Access is by invitation only" should read like a meaningful statement, not a disclaimer

---

### Admin Layout + Nav (`AdminLayout.tsx`)
**Current state:** 224px fixed sidebar, navy background, nav items with SVG icons, user name + logout at bottom.

**Design goal:** The counselor's control room. Organized, trustworthy, not oppressive.
- Keep the navy sidebar. Consider adding a very subtle left-border gold accent on the active state (2px left border in gold)
- The "Shepherd" wordmark in the sidebar header — make it feel intentional. Small serif, maybe the staff SVG icon to the left of it.
- Nav icon + label alignment should feel tight and confident
- Bottom user section: name in cream/white, logout in muted state

---

### Admin Dashboard (`AdminDashboard.tsx`)
**Current state:** Three stat cards (users, homework, sessions), recent notes list.

**Design goal:**
- Stat cards should feel like a counselor's at-a-glance view — not SaaS KPI boxes. Consider a very subtle warm card treatment with a thin gold top-border accent on hover
- Recent session notes: the border-left gold accent treatment is already there — lean into it. Small serif blockquote feel.
- Page heading "Admin Hub" — serif, large, paired with a small subtitle in stone/muted

---

### Admin Chat (`AdminChat.tsx`)
**Current state:** Left panel with counselee list. Right panel with message bubbles and input. Typing indicator with bounce dots.

**Design goal:** This is the most-used screen. It needs to feel purposeful, not generic.
- Left panel: counselee list should have enough breathing room. Active selection: gold left-border + slight cream background
- Chat bubbles: counselor messages (user) in navy. AI responses in white with a thin border. **AI responses deserve special treatment** — consider a very subtle left-border gold accent or a slightly cream background to signal "this is pastoral counsel, not just a chat app"
- The typing indicator (three bouncing dots) should be tasteful — not playful. Small, stone-colored, calm.
- Input area: clean, no chrome. Placeholder text should be pastoral ("What does John need this week? Generate questions, compare responses...")
- Consider: a small Scripture reference watermark or subtle cross motif somewhere in the empty state

---

### Admin Users (`AdminUsers.tsx`)
**Current state:** Filter pills, table with name/role/email/homework columns, Add Person modal.

**Design goal:**
- Role badges: each role should have a distinct but harmonious color treatment. Not traffic-light colors. Something like: husband/wife → warm stone pill, disciple → navy pill, admin → gold pill
- Table rows: clean, generous padding, hover state in very light cream
- Add Person modal: clean form, good field spacing, a sense of care in the design (this is where someone's pastoral care journey begins)
- Filter pills: the active state should be decisive — filled navy, not just a border change

---

### Admin Settings (`AdminSettings.tsx`)
**Current state:** AI provider select, model select (Google/OpenAI only), API key input with reveal toggle, test connection button.

**Design goal:**
- This is a trust-critical screen. The design should communicate security and care.
- "Key saved" indicator: small green dot + text, feels like a lock icon moment
- Reveal button: treat it like a secondary action — not prominent, but clearly available
- Test connection success/fail states: green vs red with appropriate iconography
- The form should be unhurried — good vertical spacing, clear labels

---

### Admin Homework (`AdminHomework.tsx`)
**Current state:** Homework list with colored completion dots, Assign Homework modal.

**Design goal:**
- Pending items: gold dot. Completed: green dot. The dot should feel intentional, not just status.
- Each homework card: consider a left-border accent in gold for pending, in green for completed
- The scripture reference should feel like a real Scripture citation — small caps treatment, stone color, slightly italic
- Modal: clear type hierarchy (title → scripture ref → instructions → due date)

---

### Admin Responses (`AdminResponses.tsx`)
**Current state:** Grouped by user, AI Synthesis button, raw responses shown as blockquotes.

**Design goal:**
- Each response should feel like a journal entry — generous typography, leading, a sense of weight
- The "AI Synthesis" section: distinct background (cream), small caps label "AI Synthesis", serif body
- Counselee name/role header: clean, name prominent, role as a small label
- The AI synthesis text especially should feel pastoral — like a counselor's case notes

---

### Portal Layout (`PortalLayout.tsx`)
**Current state:** Sticky navy header with name + logout, cream background, fixed bottom nav with 4 icons.

**Design goal:** Mobile app, not mobile website.
- Header: keep the navy. Name in cream. App name "Shepherd" as the center wordmark on the header (currently left-aligned — consider centering on mobile)
- Bottom nav: active tab should be visually decisive. Consider: active icon fills navy (currently using text-color only). A small label below the icon is correct — make them feel intentional.
- The cream background for portal pages is correct. Keep it.

---

### Portal Home (`PortalHome.tsx`)
**Current state:** Greeting with first name, three quick-link cards (Chat, Homework, Scripture).

**Design goal:**
- The greeting ("Welcome back / {first name}") should feel warm. The name especially should be large, serif, navy — like seeing your name written in ink.
- Three cards: clean, tappable, generous touch targets. Left icon accent in the card's relevant color (navy, gold, stone). Right chevron arrow.
- Consider a gentle warm shadow on cards to give the cream background some depth
- A subtle horizontal rule or divider between sections

---

### Portal Chat (`PortalChat.tsx`)
**Current state:** Welcome message in navy-tinted card, message bubbles, textarea + send button.

**Design goal:** This is the most intimate screen in the app. A woman sharing her grief. A husband confessing his failures. It needs to feel like a confessional, not a chatbot.
- Welcome message card: keep the navy-tinted box. Make the text feel significant — serif, generous line-height
- User messages: navy pill, right-aligned. Keep clean.
- AI responses: **this is the money.** White card, shadow, a slim gold left-border accent. The text should be readable — generous leading, serif if possible for the AI response text itself. This is pastoral counsel. It should look like it.
- Input: simple, generous padding, soft border. Placeholder: "Share what's on your heart..."
- No send icon that looks like a paper plane missile. Consider a simple right-arrow or "Send" text button.

---

### Portal Homework (`PortalHomework.tsx`)
**Current state:** Accordion cards (tap to expand), response textarea, submit button.

**Design goal:**
- Pending homework card: clean header with title + scripture ref + due date. Gold left-border accent.
- Expanded state: instructions in body serif text, response textarea feels like a journal page (maybe a very subtle ruled-line background treatment or at minimum generous font size and line-height)
- Submit button: full-width, navy, confident
- Completed section: muted, struck-through title, green check. Not sad — accomplished.

---

### Portal Scripture (`PortalScripture.tsx`)
**Current state:** Book/chapter selectors, passage text display, audio player, speed controls.

**Design goal:** Model the FCBH audio Bible player. This should be the most polished screen.
- Book/chapter selector: clean, readable, generous touch targets
- Passage display: **this is Scripture.** Serif font. 18–20px. 1.8 line-height. Generous padding. Verse numbers in superscript stone/muted. Feels like a printed Bible page.
- Audio player: custom-styled, not the browser default `<audio>` element. A clean play/pause button, progress bar (thin, gold fill), time display.
- Speed controls: pill buttons. Active speed in navy fill. Compact row.
- The whole scripture display area: cream/warm white background. Feels like paper.

---

## Component Patterns to Define

### Cards
- Default: white background, 1px gray-200 border, 12px radius, 16–20px padding
- Active/selected: thin gold left-border or gold top-border accent
- Hover: border darkens slightly, subtle shadow

### Buttons
- Primary: navy fill, white text, 8px radius, 14px font, 16px horizontal padding
- Secondary: white fill, gray-200 border, gray-700 text
- Danger: red-50 background, red-700 text
- No rounded-full pills for primary actions — just `rounded-lg`

### Form fields
- Input: gray-200 border, 8px radius, focus state shifts to navy-30 border
- Label: 12px, medium weight, gray-700
- Error: red-500 text below field

### Chat bubbles
- User: `bg-shepherd-navy text-white rounded-2xl rounded-br-sm`
- AI: `bg-white border border-gray-200 rounded-2xl rounded-bl-sm shadow-sm` — consider thin gold left-border treatment

### Role badges
- husband / wife: `bg-amber-50 text-amber-800`
- male_disciple / female_disciple: `bg-shepherd-navy/10 text-shepherd-navy`
- admin: `bg-shepherd-gold/20 text-shepherd-stone`

---

## What to Upgrade in Tailwind Config

Add to `tailwind.config.ts`:

```typescript
fontFamily: {
  serif: ['Lora', 'Source Serif 4', 'Georgia', 'serif'],
  sans: ['Inter', 'system-ui', 'sans-serif'],
},
boxShadow: {
  card: '0 1px 3px 0 rgb(0 0 0 / 0.04), 0 1px 2px -1px rgb(0 0 0 / 0.04)',
  'card-hover': '0 4px 6px -1px rgb(0 0 0 / 0.06), 0 2px 4px -2px rgb(0 0 0 / 0.04)',
},
```

Add Google Fonts link to `client/index.html`:
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,500;0,600;1,400&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
```

---

## Design Decisions Already Made — Do Not Override

- Navy (`#1a2744`) sidebar for admin — keep it
- Cream (`#f9f5ef`) portal backgrounds — keep it
- No emoji anywhere in the UI
- No rounded-full on primary action buttons
- The chat typing indicator stays tasteful (no bouncy cartoon dots)
- Auth is Google only — the login page has no username/password fields

---

## Inspirations

- **YouVersion Bible app** — how Scripture is presented on mobile (generous typography, clean navigation)
- **FCBH audio Bible reader** — the audio player UX, specifically the speed controls and progress bar
- **Day One journal app** — warmth, serif typography, the feeling that what you write here matters
- **Linear** (for the admin hub only) — dense information, clean table design, sidebar navigation precision

---

## Deliver

Restyle every screen listed above. Update `tailwind.config.ts` with the font and shadow additions. Add the Google Fonts link to `index.html`. All changes must be in the existing files — do not create new components unless a shared primitive is clearly warranted (e.g., a `<ScriptureBlock>` or `<ChatBubble>` component pulled out for reuse).

When done: `npm run build` should pass clean. No TypeScript errors.
