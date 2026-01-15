import { sql } from '@vercel/postgres';

export interface Restaurant {
  id: number;
  name: string;
  county: string;
  area: string;
  cuisine: string;
  price: string;
  place_id: string | null;
  google_maps_url: string | null;
  is_favorite: boolean;
  created_at: Date;
}

export interface Review {
  id: number;
  restaurant_id: number;
  source: string;
  author: string;
  rating: number;
  text: string;
  date: string;
  created_at: Date;
}

export interface DiaryEntry {
  id: number;
  restaurant_id: number;
  restaurant_name: string;
  photo_url: string;
  comment: string;
  visit_date: string;
  created_at: Date;
}

// Initialize the database tables
export async function initializeDatabase() {
  try {
    // Create restaurants table
    await sql`
      CREATE TABLE IF NOT EXISTS restaurants (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        county TEXT NOT NULL,
        area TEXT NOT NULL,
        cuisine TEXT NOT NULL,
        price TEXT DEFAULT '$$',
        place_id TEXT,
        google_maps_url TEXT,
        is_favorite BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Add is_favorite column if it doesn't exist (for existing tables)
    await sql`
      ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS is_favorite BOOLEAN DEFAULT FALSE
    `;

    // Create reviews table
    await sql`
      CREATE TABLE IF NOT EXISTS reviews (
        id SERIAL PRIMARY KEY,
        restaurant_id INTEGER REFERENCES restaurants(id) ON DELETE CASCADE,
        source TEXT NOT NULL,
        author TEXT,
        rating NUMERIC(2,1),
        text TEXT,
        date TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Create food_diary table
    await sql`
      CREATE TABLE IF NOT EXISTS food_diary (
        id SERIAL PRIMARY KEY,
        restaurant_id INTEGER REFERENCES restaurants(id) ON DELETE SET NULL,
        restaurant_name TEXT NOT NULL,
        photo_url TEXT NOT NULL,
        comment TEXT,
        visit_date DATE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Create indexes for faster queries
    await sql`CREATE INDEX IF NOT EXISTS idx_restaurants_county ON restaurants(county)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_restaurants_area ON restaurants(area)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_restaurants_cuisine ON restaurants(cuisine)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_restaurants_favorite ON restaurants(is_favorite)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_reviews_restaurant_id ON reviews(restaurant_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_food_diary_restaurant_id ON food_diary(restaurant_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_food_diary_visit_date ON food_diary(visit_date)`;

    return { success: true };
  } catch (error) {
    console.error('Database initialization error:', error);
    throw error;
  }
}

// Get all restaurants
export async function getAllRestaurants(): Promise<Restaurant[]> {
  const { rows } = await sql<Restaurant>`
    SELECT * FROM restaurants ORDER BY name
  `;
  return rows;
}

// Get restaurants with filters
export async function getFilteredRestaurants(filters: {
  counties?: string[];
  areas?: string[];
  cuisines?: string[];
  prices?: string[];
}): Promise<Restaurant[]> {
  const { counties, areas, cuisines, prices } = filters;

  let query = 'SELECT * FROM restaurants WHERE 1=1';
  const params: unknown[] = [];
  let paramIndex = 1;

  if (counties && counties.length > 0) {
    query += ` AND county = ANY($${paramIndex})`;
    params.push(counties);
    paramIndex++;
  }

  if (areas && areas.length > 0) {
    query += ` AND area = ANY($${paramIndex})`;
    params.push(areas);
    paramIndex++;
  }

  if (cuisines && cuisines.length > 0) {
    query += ` AND cuisine = ANY($${paramIndex})`;
    params.push(cuisines);
    paramIndex++;
  }

  if (prices && prices.length > 0) {
    query += ` AND price = ANY($${paramIndex})`;
    params.push(prices);
    paramIndex++;
  }

  query += ' ORDER BY name';

  const { rows } = await sql.query(query, params);
  return rows as Restaurant[];
}

// Get random restaurant with filters
export async function getRandomRestaurant(filters: {
  counties?: string[];
  areas?: string[];
  cuisines?: string[];
  prices?: string[];
}): Promise<Restaurant | null> {
  const filtered = await getFilteredRestaurants(filters);
  if (filtered.length === 0) return null;
  return filtered[Math.floor(Math.random() * filtered.length)];
}

// Add new restaurant
export async function addRestaurant(restaurant: {
  name: string;
  county: string;
  area: string;
  cuisine: string;
  price: string;
  place_id?: string;
  google_maps_url?: string;
}): Promise<Restaurant> {
  const { rows } = await sql<Restaurant>`
    INSERT INTO restaurants (name, county, area, cuisine, price, place_id, google_maps_url)
    VALUES (${restaurant.name}, ${restaurant.county}, ${restaurant.area}, ${restaurant.cuisine}, ${restaurant.price}, ${restaurant.place_id || null}, ${restaurant.google_maps_url || null})
    RETURNING *
  `;
  return rows[0];
}

// Delete restaurant
export async function deleteRestaurant(id: number): Promise<boolean> {
  const result = await sql`DELETE FROM restaurants WHERE id = ${id}`;
  return (result.rowCount ?? 0) > 0;
}

// Get filter options
export async function getFilterOptions() {
  const counties = await sql<{ county: string }>`SELECT DISTINCT county FROM restaurants ORDER BY county`;
  const areas = await sql<{ area: string }>`SELECT DISTINCT area FROM restaurants ORDER BY area`;
  const cuisines = await sql<{ cuisine: string }>`SELECT DISTINCT cuisine FROM restaurants ORDER BY cuisine`;

  return {
    counties: counties.rows.map(r => r.county),
    areas: areas.rows.map(r => r.area),
    cuisines: cuisines.rows.map(r => r.cuisine),
  };
}

// Get areas by counties
export async function getAreasByCounties(counties: string[]) {
  if (counties.length === 0) {
    const { rows } = await sql<{ area: string }>`SELECT DISTINCT area FROM restaurants ORDER BY area`;
    return rows.map(r => r.area);
  }
  const { rows } = await sql.query(
    'SELECT DISTINCT area FROM restaurants WHERE county = ANY($1) ORDER BY area',
    [counties]
  );
  return (rows as { area: string }[]).map(r => r.area);
}

// Get cuisines by counties and areas
export async function getCuisinesByFilters(counties: string[], areas: string[]) {
  let query = 'SELECT DISTINCT cuisine FROM restaurants WHERE 1=1';
  const params: unknown[] = [];
  let paramIndex = 1;

  if (counties.length > 0) {
    query += ` AND county = ANY($${paramIndex})`;
    params.push(counties);
    paramIndex++;
  }

  if (areas.length > 0) {
    query += ` AND area = ANY($${paramIndex})`;
    params.push(areas);
    paramIndex++;
  }

  query += ' ORDER BY cuisine';

  const { rows } = await sql.query(query, params);
  return (rows as { cuisine: string }[]).map(r => r.cuisine);
}

// Add review
export async function addReview(review: {
  restaurant_id: number;
  source: string;
  author?: string;
  rating?: number;
  text?: string;
  date?: string;
}): Promise<Review> {
  const { rows } = await sql<Review>`
    INSERT INTO reviews (restaurant_id, source, author, rating, text, date)
    VALUES (${review.restaurant_id}, ${review.source}, ${review.author || null}, ${review.rating || null}, ${review.text || null}, ${review.date || null})
    RETURNING *
  `;
  return rows[0];
}

// Get reviews for a restaurant
export async function getReviewsForRestaurant(restaurantId: number): Promise<Review[]> {
  const { rows } = await sql<Review>`
    SELECT * FROM reviews WHERE restaurant_id = ${restaurantId} ORDER BY created_at DESC
  `;
  return rows;
}

// Get restaurant count
export async function getRestaurantCount(): Promise<number> {
  const { rows } = await sql<{ count: string }>`SELECT COUNT(*) as count FROM restaurants`;
  return parseInt(rows[0].count, 10);
}

// Check if restaurant already exists (for duplicate detection)
export async function checkRestaurantExists(name: string, county: string): Promise<Restaurant | null> {
  const { rows } = await sql<Restaurant>`
    SELECT * FROM restaurants
    WHERE LOWER(name) = LOWER(${name}) AND county = ${county}
    LIMIT 1
  `;
  return rows[0] || null;
}

// Toggle favorite status
export async function toggleFavorite(id: number): Promise<Restaurant | null> {
  const { rows } = await sql<Restaurant>`
    UPDATE restaurants
    SET is_favorite = NOT is_favorite
    WHERE id = ${id}
    RETURNING *
  `;
  return rows[0] || null;
}

// Get favorite restaurants
export async function getFavoriteRestaurants(): Promise<Restaurant[]> {
  const { rows } = await sql<Restaurant>`
    SELECT * FROM restaurants WHERE is_favorite = TRUE ORDER BY name
  `;
  return rows;
}

// Get filtered restaurants with favorites option
export async function getFilteredRestaurantsWithFavorites(filters: {
  counties?: string[];
  areas?: string[];
  cuisines?: string[];
  prices?: string[];
  favoritesOnly?: boolean;
}): Promise<Restaurant[]> {
  const { counties, areas, cuisines, prices, favoritesOnly } = filters;

  let query = 'SELECT * FROM restaurants WHERE 1=1';
  const params: unknown[] = [];
  let paramIndex = 1;

  if (favoritesOnly) {
    query += ' AND is_favorite = TRUE';
  }

  if (counties && counties.length > 0) {
    query += ` AND county = ANY($${paramIndex})`;
    params.push(counties);
    paramIndex++;
  }

  if (areas && areas.length > 0) {
    query += ` AND area = ANY($${paramIndex})`;
    params.push(areas);
    paramIndex++;
  }

  if (cuisines && cuisines.length > 0) {
    query += ` AND cuisine = ANY($${paramIndex})`;
    params.push(cuisines);
    paramIndex++;
  }

  if (prices && prices.length > 0) {
    query += ` AND price = ANY($${paramIndex})`;
    params.push(prices);
    paramIndex++;
  }

  query += ' ORDER BY name';

  const { rows } = await sql.query(query, params);
  return rows as Restaurant[];
}

// Food Diary Functions

// Add diary entry
export async function addDiaryEntry(entry: {
  restaurant_id?: number;
  restaurant_name: string;
  photo_url: string;
  comment?: string;
  visit_date: string;
}): Promise<DiaryEntry> {
  const { rows } = await sql<DiaryEntry>`
    INSERT INTO food_diary (restaurant_id, restaurant_name, photo_url, comment, visit_date)
    VALUES (${entry.restaurant_id || null}, ${entry.restaurant_name}, ${entry.photo_url}, ${entry.comment || null}, ${entry.visit_date})
    RETURNING *
  `;
  return rows[0];
}

// Get all diary entries
export async function getDiaryEntries(): Promise<DiaryEntry[]> {
  const { rows } = await sql<DiaryEntry>`
    SELECT * FROM food_diary ORDER BY visit_date DESC, created_at DESC
  `;
  return rows;
}

// Get diary entries for a specific restaurant
export async function getDiaryEntriesForRestaurant(restaurantId: number): Promise<DiaryEntry[]> {
  const { rows } = await sql<DiaryEntry>`
    SELECT * FROM food_diary WHERE restaurant_id = ${restaurantId} ORDER BY visit_date DESC
  `;
  return rows;
}

// Delete diary entry
export async function deleteDiaryEntry(id: number): Promise<boolean> {
  const result = await sql`DELETE FROM food_diary WHERE id = ${id}`;
  return (result.rowCount ?? 0) > 0;
}
