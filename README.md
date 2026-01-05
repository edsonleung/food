# 🍽️ Restaurant Randomizer

A beautiful web app to help you decide where to eat! Features Google Maps photos, persistent storage, and smart filtering.

## Features

- **Random Restaurant Picker** - Filter by county, area, cuisine, and price point
- **Google Maps Photos** - See real photos from Google Maps in a beautiful grid layout
- **Persistent Database** - Restaurants are stored in SQLite and persist forever
- **Add New Restaurants** - Easily add restaurants manually or via Google Maps link
- **Rating Display** - Shows Google Maps ratings when available
- **Responsive Design** - Works great on desktop and mobile

## Quick Deploy to Railway (Recommended)

1. Push this folder to a GitHub repository
2. Go to [railway.app](https://railway.app)
3. Click "New Project" → "Deploy from GitHub repo"
4. Add environment variable: `GOOGLE_API_KEY` = your API key
5. Click "Generate Domain" to get your public URL

## Local Development

### Prerequisites

- Node.js 18+ installed
- A Google Cloud API key with **Places API (New)** enabled

### Installation

```bash
cd restaurant-app
npm install
npm start
```

Open http://localhost:3000

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | 3000 |
| `GOOGLE_API_KEY` | Google Places API key | (embedded) |
| `DATA_DIR` | Directory for database file | . |

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/restaurants` | Get all restaurants |
| GET | `/api/restaurants/random` | Get random restaurant (with filters) |
| POST | `/api/restaurants` | Add new restaurant |
| DELETE | `/api/restaurants/:id` | Delete restaurant |
| GET | `/api/places/search` | Search Google Places |
| GET | `/api/places/photo` | Get photo URL |

## Color Palette

- Hot Pink: `#DA62B0`
- Burgundy: `#823E50`  
- Desert Sun: `#B28260`
- Rose Quartz: `#FADCDC`

Enjoy your meals! 🎲🍜
