# Bon Appe-Pick

A restaurant randomizer web app with Google Places integration. Spin. Pick. Eat.

## Features

- **Multi-select filters**: Filter by county (LA, OC, Vancouver), area, cuisine, and price
- **Restaurant randomizer**: Pick a random restaurant from your filtered selection
- **Google Places integration**: Photos, ratings, and reviews from Google Maps
- **Yelp integration**: Additional reviews from Yelp (optional)
- **Add restaurants**: Add new restaurants via Google Maps link or manually
- **Link parsing**: Extract restaurant info from Google Maps, TikTok, and Instagram links
- **Persistent database**: Vercel Postgres for reliable data storage
- **Beautiful UI**: Responsive design with a modern, clean aesthetic

## Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: Vercel Postgres
- **APIs**: Google Places API (New), Yelp Fusion API

## Getting Started

### Prerequisites

- Node.js 18+
- A Vercel account
- Google Cloud account with Places API enabled
- (Optional) Yelp API key for reviews

### Installation

1. Clone the repository:
   ```bash
   git clone <your-repo-url>
   cd bon-appe-pick
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env.local` file with your credentials:
   ```
   # Vercel Postgres (auto-configured when you create a Postgres database in Vercel)
   POSTGRES_URL=your_postgres_url

   # Google Places API
   GOOGLE_PLACES_API_KEY=your_google_api_key

   # Yelp API (optional)
   YELP_API_KEY=your_yelp_api_key
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000)

### Database Setup

1. Create a Postgres database in Vercel Dashboard
2. Link it to your project
3. Run the seed script to populate initial data:
   ```bash
   npm run db:seed
   ```

## Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Import the project in Vercel Dashboard
3. Configure environment variables:
   - `GOOGLE_PLACES_API_KEY`: Your Google Places API key
   - `YELP_API_KEY`: (Optional) Your Yelp API key
4. Create a Vercel Postgres database and link it to your project
5. Deploy!

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `POSTGRES_URL` | Yes | Auto-configured by Vercel Postgres |
| `GOOGLE_PLACES_API_KEY` | Yes | Google Places API key for photos and reviews |
| `YELP_API_KEY` | No | Yelp Fusion API key for additional reviews |

## API Routes

| Route | Method | Description |
|-------|--------|-------------|
| `/api/restaurants` | GET | Get all restaurants (with optional filters) |
| `/api/restaurants` | POST | Add a new restaurant |
| `/api/restaurants/[id]` | DELETE | Delete a restaurant |
| `/api/restaurants/random` | GET | Get a random restaurant |
| `/api/filters` | GET | Get filter options |
| `/api/places/search` | GET | Search for a place on Google |
| `/api/places/photo` | GET | Get photo URL from Google |
| `/api/places/parse-link` | POST | Parse Google Maps/TikTok/Instagram links |
| `/api/reviews` | GET | Get reviews from Google and Yelp |
| `/api/db/init` | POST | Initialize database tables |

## Data Structure

### Restaurant

```typescript
interface Restaurant {
  id: number;
  name: string;
  county: string;      // LA, OC, VAN
  area: string;        // e.g., Ktown, Silverlake, etc.
  cuisine: string;     // e.g., Korean, Japanese, Western
  price: string;       // $, $$, $$$, $$$$
  place_id?: string;   // Google Place ID
  google_maps_url?: string;
  created_at: Date;
}
```

## Color Palette

- Hot Pink: `#DA62B0`
- Burgundy: `#823E50`
- Desert Sun: `#B28260`
- Rose Quartz: `#FADCDC`

## License

MIT
