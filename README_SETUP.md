# Virtual Museum of Ukraine - Telegram Mini App

A fully functional Telegram Mini App showcasing Ukrainian cultural heritage with real-time statistics, achievements, donations, and XP-based ranking system.

## Features

### Core Features
- **Telegram Authentication**: Automatic authentication via Telegram WebApp SDK
- **User Profiles**: Real-time statistics including time spent, artifacts viewed, and donations
- **Session Tracking**: Automatic session tracking when opening/closing the app
- **XP & Ranking System**: 
  - 1 minute = 1 XP
  - 1 artifact view = 5 XP
  - 1 currency donated = 1 XP
  - Ranks: Novice → Explorer → Historian → Patron → Museum Legend

### Content
- **8 Featured Artifacts**: Iconic Ukrainian cultural items
- **Historical Timeline**: 5 key events in Ukrainian history
- **Bilingual Support**: Ukrainian and English
- **Search & Filter**: Find artifacts by category or text

### User Features
- **Artifact Tracking**: Track which artifacts users view
- **Donation System**: Accept donations via Telegram Stars
- **Achievements**: Unlock badges based on user activity
- **Statistics Dashboard**: View personal stats and progress
- **Premium Status**: Display user membership tier

## Tech Stack

**Frontend:**
- React 18 with TypeScript
- Vite (build tool)
- Tailwind CSS (styling)
- Motion (animations)
- Telegram WebApp SDK

**Backend:**
- Supabase (PostgreSQL database)
- Supabase Edge Functions (serverless API)
- PostgreSQL with RLS policies

## Database Schema

### Tables
- **users**: User profiles with Telegram data
- **activity_sessions**: Time tracking sessions
- **artifact_views**: Artifact viewing history
- **donations**: Donation records
- **achievements**: User achievements

### Key Features
- Row-Level Security (RLS) for data protection
- Automatic timestamp tracking
- Indexed queries for performance

## API Endpoints

All endpoints are handled via Supabase Edge Function at `/functions/v1/museum`

### Authentication
- `POST /museum/auth` - Authenticate/register user

### Profile
- `GET /museum/profile/:telegram_id` - Get user profile with stats

### Sessions
- `POST /museum/session/start` - Start activity session
- `POST /museum/session/end` - End session and calculate XP

### Artifacts
- `POST /museum/artifact/view` - Track artifact view

### Donations
- `POST /museum/donation` - Record donation and update XP

## Setup Instructions

### Prerequisites
- Node.js 16+
- npm or pnpm
- Supabase project (already configured)

### Local Development

1. **Install dependencies:**
```bash
npm install
```

2. **Start development server:**
```bash
npm run dev
```

3. **Type checking:**
```bash
npm run typecheck
```

4. **Build for production:**
```bash
npm run build
```

## Environment Variables

The following variables are automatically configured in `.env`:

```
VITE_SUPABASE_URL=<your-supabase-url>
VITE_SUPABASE_ANON_KEY=<your-supabase-key>
```

## File Structure

```
src/
├── App.tsx                 # Main app component
├── main.tsx               # React entry point
├── index.css              # Tailwind styles
├── lib/
│   ├── telegram.ts        # Telegram WebApp SDK wrapper
│   └── api.ts             # Museum API client
└── vite-env.d.ts          # Vite environment types

supabase/
└── functions/
    └── museum/
        └── index.ts       # Supabase Edge Function (API)
```

## Component Structure

### Screens
1. **HomeScreen**: Featured artifacts, collections, eras overview
2. **MuseumScreen**: Searchable artifact collection with grid/list views
3. **TimelineScreen**: Historical timeline with key events
4. **ProfileScreen**: User stats, achievements, donations history
5. **SupportScreen**: Donation interface and museum info

### Key Components
- `GlassCard`: Glassmorphism UI component
- `ArtifactCard`: Artifact preview with metadata

## XP & Ranking System

### XP Calculation
```
Total XP = (session_minutes × 1) + (artifacts_viewed × 5) + (donation_amount × 1)
```

### Rank Levels
| Level | XP Range | Name (UA) | Name (EN) |
|-------|----------|-----------|-----------|
| 1 | 0-99 | Новачок | Novice |
| 2 | 100-499 | Дослідник | Explorer |
| 3 | 500-1,999 | Історик | Historian |
| 4 | 2,000-4,999 | Патрон | Patron |
| 5 | 5,000+ | Легенда музею | Museum Legend |

## Achievement System

Users can unlock achievements:
- `FIRST_VISIT` - First time in museum
- `ONE_HOUR` - Spend 1 hour in museum
- `TEN_ARTIFACTS` - View 10 artifacts
- `FIRST_DONATION` - Make first donation
- `DONATED_100` - Donate 100+ currency
- `DONATED_1000` - Donate 1000+ currency

## Deployment

### Frontend
The frontend is already deployed on Render. Redeploy with:
```bash
npm run build
# Upload dist/ folder to Render
```

### Backend (Edge Functions)
The Supabase Edge Function is already deployed. To update:
```bash
# Modify supabase/functions/museum/index.ts
# Deploy automatically via Supabase CLI or MCP tools
```

## Telegram Mini App Setup

To add this as a Telegram Mini App:

1. Contact @BotFather on Telegram
2. Create a new bot or select existing one
3. Set the Mini App URL to your deployment URL
4. Users can access via `/app` command in the bot

### Bot Commands
```
/start - Launch mini app
/help - Show help
/profile - Go to profile
/donate - Go to donations
```

## Security

### Authentication
- No JWT tokens needed - Telegram WebApp provides built-in security
- All requests validated server-side using Telegram user ID
- RLS policies prevent cross-user data access

### Data Protection
- Row-Level Security enabled on all tables
- User data isolation via `auth.uid()` equivalent
- Sensitive operations validated server-side

## Performance Optimizations

- Static artifact data (no API calls needed)
- Efficient database queries with indexes
- Image optimization via Unsplash CDN
- CSS-in-JS with Tailwind (optimized bundle)
- Code splitting via Vite

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Telegram built-in browser

## Troubleshooting

### App not loading
- Check Telegram WebApp SDK is loaded
- Verify Supabase credentials in .env
- Check browser console for errors

### Data not syncing
- Verify network connection
- Check Supabase Edge Function logs
- Ensure user is authenticated

### Styling issues
- Clear browser cache
- Rebuild with `npm run build`
- Check Tailwind CSS configuration

## Future Enhancements

- [ ] CryptoBot API integration (TON, USDT, BTC)
- [ ] 3D artifact viewers
- [ ] Leaderboards
- [ ] User-generated content
- [ ] Push notifications
- [ ] Social sharing features
- [ ] Merchandise store
- [ ] Virtual tours with audio guides

## Contributing

For contributions, please:
1. Fork the repository
2. Create a feature branch
3. Commit changes
4. Push to the branch
5. Create a Pull Request

## License

MIT License - see LICENSE file for details

## Support

For issues or questions:
- Check the troubleshooting section
- Review Supabase documentation
- Check Telegram Mini App documentation

## Credits

- UI Design inspired by modern museum experiences
- Images from Unsplash
- Ukrainian cultural data from historical sources
- Built with React, Supabase, and Vite
