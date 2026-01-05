const express = require('express');
const cors = require('cors');
const Database = require('better-sqlite3');
const fetch = require('node-fetch');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Google API Key - use environment variable in production
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY || 'AIzaSyD0jQ2FOVaChHbZqM67Ut9QLkc-88ws3xQ';

// Ensure data directory exists for persistent storage
const DATA_DIR = process.env.DATA_DIR || '.';
const DB_PATH = path.join(DATA_DIR, 'restaurants.db');
if (DATA_DIR !== '.' && !fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Initialize SQLite Database
const db = new Database(DB_PATH);
console.log(`Database initialized at: ${DB_PATH}`);

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS restaurants (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    county TEXT NOT NULL,
    area TEXT NOT NULL,
    cuisine TEXT NOT NULL,
    price TEXT DEFAULT '$$',
    place_id TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// Check if we need to seed initial data
const count = db.prepare('SELECT COUNT(*) as count FROM restaurants').get();
if (count.count === 0) {
  console.log('Seeding initial restaurant data...');
  seedInitialData();
}

function seedInitialData() {
  const initialRestaurants = [
    {county:"LA",area:"Ktown",cuisine:"Korean",name:"MDK",price:"$"},
    {county:"LA",area:"Ktown",cuisine:"Korean",name:"LASUNG TOFU & POT RICE",price:"$$"},
    {county:"LA",area:"Ktown",cuisine:"Korean",name:"Baekjeong",price:"$$"},
    {county:"LA",area:"Ktown",cuisine:"Chinese",name:"Liu's Cafe",price:"$"},
    {county:"LA",area:"Ktown",cuisine:"Korean",name:"Borit Gogae",price:"$$"},
    {county:"LA",area:"Ktown",cuisine:"Korean",name:"Twozone Chicken",price:"$"},
    {county:"LA",area:"Ktown",cuisine:"Korean",name:"Master HA Korean Restaurant",price:"$$$"},
    {county:"LA",area:"Ktown",cuisine:"Korean",name:"Yetgol",price:"$"},
    {county:"LA",area:"Ktown",cuisine:"Korean",name:"Wako Donkatsu",price:"$"},
    {county:"LA",area:"Ktown",cuisine:"Korean",name:"Baro Kimbap",price:"$"},
    {county:"LA",area:"Ktown",cuisine:"Korean",name:"T Equals Fish",price:"$$$"},
    {county:"LA",area:"Ktown",cuisine:"Korean",name:"Park's BBQ",price:"$"},
    {county:"LA",area:"Ktown",cuisine:"Korean",name:"Crab House",price:"$$"},
    {county:"LA",area:"Ktown",cuisine:"Korean",name:"Dae Sung Ro",price:"$$"},
    {county:"LA",area:"Ktown",cuisine:"Korean",name:"LEE GA",price:"$"},
    {county:"LA",area:"Ktown",cuisine:"Korean",name:"Sun Nong Dan",price:"$$"},
    {county:"LA",area:"Ktown",cuisine:"Korean",name:"Hanu K BBQ",price:"$$"},
    {county:"LA",area:"Ktown",cuisine:"Korean",name:"DGM",price:"$"},
    {county:"LA",area:"Ktown",cuisine:"Korean",name:"Chang Hwa Dang LA",price:"$"},
    {county:"LA",area:"Ktown",cuisine:"Korean",name:"Jjukku Jjukku BBQ",price:"$$"},
    {county:"LA",area:"Ktown",cuisine:"Korean",name:"Jjamppong zizon",price:"$"},
    {county:"LA",area:"Ktown",cuisine:"Western",name:"Boiling Crab",price:"$$"},
    {county:"LA",area:"Ktown",cuisine:"Korean",name:"Hangari Kalguksu",price:"$"},
    {county:"LA",area:"Ktown",cuisine:"Korean",name:"Yangji Gamjatang",price:"$"},
    {county:"LA",area:"Ktown",cuisine:"Korean",name:"Louders",price:"$$"},
    {county:"LA",area:"Ktown",cuisine:"Korean",name:"Dan Sung Sa",price:"$$"},
    {county:"LA",area:"Ktown",cuisine:"Korean",name:"Bonjuk",price:"$"},
    {county:"LA",area:"Ktown",cuisine:"Korean",name:"Ahgassi Gopchang",price:"$$"},
    {county:"LA",area:"Ktown",cuisine:"Korean",name:"Jeong Yuk Jeom Korean BBQ LA",price:"$$$"},
    {county:"LA",area:"Ktown",cuisine:"Korean",name:"Daedo Sikdang",price:"$$$"},
    {county:"LA",area:"Ktown",cuisine:"Korean",name:"jilli modern sool jib",price:"$$"},
    {county:"LA",area:"Ktown",cuisine:"Korean",name:"SOOKDAL",price:"$$$"},
    {county:"LA",area:"Ktown",cuisine:"Korean",name:"Joopocha Gastropub",price:"$$"},
    {county:"LA",area:"Ktown",cuisine:"Korean",name:"Ten-BBQ",price:"$$$"},
    {county:"LA",area:"Ktown",cuisine:"Korean",name:"Jun Won Dak",price:"$"},
    {county:"LA",area:"Ktown",cuisine:"Korean",name:"J-korean restaurant",price:"$$"},
    {county:"LA",area:"Silverlake",cuisine:"Chinese",name:"Woon",price:"$"},
    {county:"LA",area:"Ktown",cuisine:"Korean",name:"Budonoki",price:"$$$"},
    {county:"LA",area:"Larchmont",cuisine:"Western",name:"Etra",price:"$$$"},
    {county:"LA",area:"Echo Park",cuisine:"Japanese",name:"Gyoza Bar",price:"$$"},
    {county:"LA",area:"Echo Park",cuisine:"Western",name:"Quarter Sheets",price:"$"},
    {county:"LA",area:"Echo Park",cuisine:"Western",name:"Donna's",price:"$$$"},
    {county:"LA",area:"Echo Park",cuisine:"Western",name:"Triple Beam Pizza",price:"$"},
    {county:"LA",area:"Echo Park",cuisine:"Western",name:"The Lonely Oyster",price:"$$$"},
    {county:"LA",area:"Silverlake",cuisine:"Japanese",name:"Izakaya Osen",price:"$$$"},
    {county:"LA",area:"Silverlake",cuisine:"Western",name:"Heavy Handed",price:"$"},
    {county:"LA",area:"Silverlake",cuisine:"Japanese",name:"Omakase by Osen",price:"$$$$"},
    {county:"LA",area:"Silverlake",cuisine:"Thai",name:"The Silver Lake House",price:"$"},
    {county:"LA",area:"Silverlake",cuisine:"Western",name:"Bacari Silverlake",price:"$$$"},
    {county:"LA",area:"Silverlake",cuisine:"Japanese",name:"Santo Silverlake",price:"$$$"},
    {county:"LA",area:"Silverlake",cuisine:"Mexican",name:"Casita Del Campo",price:"$"},
    {county:"LA",area:"Los Feliz",cuisine:"Western",name:"Found Oyster",price:"$$$"},
    {county:"LA",area:"East Hollywood",cuisine:"Western",name:"Mirate",price:"$$$"},
    {county:"LA",area:"Los Feliz",cuisine:"Western",name:"Little Dom's",price:"$$"},
    {county:"LA",area:"Silverlake",cuisine:"Western",name:"Blair's Restaurant",price:"$$"},
    {county:"LA",area:"Ktown",cuisine:"Korean",name:"Butnal",price:"$$"},
    {county:"LA",area:"Ktown",cuisine:"Korean",name:"Soban",price:"$$"},
    {county:"LA",area:"Mid Wilshire",cuisine:"Mexican",name:"Leo's Tacos Truck",price:"$"},
    {county:"LA",area:"Mid Wilshire",cuisine:"Western",name:"Apollonia's Pizzeria",price:"$$"},
    {county:"LA",area:"Mid Wilshire",cuisine:"Mexican",name:"El Cartel",price:"$"},
    {county:"LA",area:"Larchmont",cuisine:"Chinese",name:"Sua",price:"$$"},
    {county:"LA",area:"Grove",cuisine:"Western",name:"Savta",price:"$$"},
    {county:"LA",area:"Grove",cuisine:"Western",name:"Angelini Osteria",price:"$$"},
    {county:"LA",area:"Grove",cuisine:"Mexican",name:"Escuela Taqueria",price:"$"},
    {county:"LA",area:"Melrose/Fairfax",cuisine:"Western",name:"Mamie Italian Kitchen",price:"$"},
    {county:"LA",area:"Melrose/Fairfax",cuisine:"Western",name:"Pura Vita",price:"$$"},
    {county:"LA",area:"WEHO",cuisine:"Western",name:"Casa Madera West Hollywood",price:"$$$$"},
    {county:"LA",area:"WEHO",cuisine:"Japanese",name:"Toku Unagi & Sushi",price:"$$$$"},
    {county:"LA",area:"WEHO",cuisine:"Brunch",name:"The Butcher, The Baker, The Cappuccino Maker",price:"$$"},
    {county:"LA",area:"Beverly Grove",cuisine:"Western",name:"Burrata House",price:"$"},
    {county:"LA",area:"Beverly Grove",cuisine:"Japanese",name:"TAKAGI COFFEE WEST THIRD",price:"$$"},
    {county:"LA",area:"Beverly Grove",cuisine:"Western",name:"ABSteak by Chef Akira Back",price:"$$$$"},
    {county:"LA",area:"Robertson Pico",cuisine:"Western",name:"Pizzeria Sei",price:"$"},
    {county:"LA",area:"BH",cuisine:"Western",name:"Matu",price:"$$$$"},
    {county:"LA",area:"WEHO",cuisine:"Western",name:"Cecconi's West Hollywood",price:"$$$"},
    {county:"LA",area:"WEHO",cuisine:"Western",name:"LAVO Los Angeles",price:"$$$$"},
    {county:"LA",area:"BH",cuisine:"Japanese",name:"Nozawa Bar",price:"$$$$"},
    {county:"LA",area:"BH",cuisine:"Japanese",name:"Sugarfish",price:"$$"},
    {county:"LA",area:"BH",cuisine:"Mexican",name:"The Hideaway Beverly Hills",price:"$$$"},
    {county:"LA",area:"BH",cuisine:"Western",name:"Lorenzo California",price:"$"},
    {county:"LA",area:"BH",cuisine:"Western",name:"Il Pastaio",price:"$$$"},
    {county:"LA",area:"Melrose/Fairfax",cuisine:"Western",name:"Jon & Vinny's Fairfax",price:"$$"},
    {county:"LA",area:"BH",cuisine:"Western",name:"Gucci Osteria da Massimo Bottura",price:"$$$$"},
    {county:"LA",area:"Brentwood",cuisine:"Western",name:"Great White",price:"$$"},
    {county:"LA",area:"Century City",cuisine:"Japanese",name:"Ramen Nagi",price:"$"},
    {county:"LA",area:"Century City",cuisine:"Western",name:"Eataly",price:"$$"},
    {county:"LA",area:"Century City",cuisine:"Chinese",name:"HDL",price:"$$"},
    {county:"LA",area:"Arcadia",cuisine:"Chinese",name:"HDL",price:"$$"},
    {county:"LA",area:"Sawtelle",cuisine:"Japanese",name:"Tsujita LA Artisan Noodles",price:"$"},
    {county:"LA",area:"Sawtelle",cuisine:"Japanese",name:"Hide Sushi",price:"$$"},
    {county:"LA",area:"Sawtelle",cuisine:"Japanese",name:"Killer Noodle Tsujita",price:"$"},
    {county:"LA",area:"Sawtelle",cuisine:"Chinese",name:"dan modern chinese - sawtelle",price:"$$"},
    {county:"LA",area:"Sawtelle",cuisine:"Chinese",name:"DongTing Noodle",price:"$"},
    {county:"LA",area:"Sawtelle",cuisine:"Western",name:"Sobuneh",price:"$"},
    {county:"LA",area:"Sawtelle",cuisine:"Japanese",name:"Asakura",price:"$$$$"},
    {county:"LA",area:"Brentwood",cuisine:"Western",name:"Toscana Brentwood",price:"$$$"},
    {county:"LA",area:"Brentwood",cuisine:"Western",name:"Pizzana",price:"$"},
    {county:"LA",area:"Brentwood",cuisine:"Japanese",name:"Sugarfish",price:"$$"},
    {county:"LA",area:"Westwood",cuisine:"Japanese",name:"Kazunori",price:"$$"},
    {county:"LA",area:"Mid Wilshire",cuisine:"Japanese",name:"Kazunori",price:"$$"},
    {county:"LA",area:"Brentwood",cuisine:"Western",name:"Mendocino Farms",price:"$"},
    {county:"LA",area:"Grove",cuisine:"Western",name:"Mendocino Farms",price:"$"},
    {county:"LA",area:"Mid City",cuisine:"Western",name:"Cento",price:"$$$"},
    {county:"LA",area:"Culver City",cuisine:"Japanese",name:"MENSHO TOKYO",price:"$"},
    {county:"LA",area:"Culver City",cuisine:"Western",name:"Piccalilli",price:"$$$"},
    {county:"LA",area:"Culver City",cuisine:"Japanese",name:"n/naka",price:"$$$$"},
    {county:"LA",area:"Culver City",cuisine:"Western",name:"The Doughroom",price:"$"},
    {county:"LA",area:"Sawtelle",cuisine:"Mexican",name:"Brothers Cousins Tacos",price:"$"},
    {county:"LA",area:"Eagle Rock",cuisine:"Mexican",name:"Avenue 26 Tacos",price:"$"},
    {county:"LA",area:"Sawtelle",cuisine:"Japanese",name:"WADAYA",price:"$"},
    {county:"LA",area:"Santa Monica",cuisine:"Brunch",name:"Blueys Santa Monica",price:"$"},
    {county:"LA",area:"Santa Monica",cuisine:"Brunch",name:"Tartine Santa Monica",price:"$"},
    {county:"LA",area:"Santa Monica",cuisine:"Western",name:"Calabra",price:"$$$"},
    {county:"LA",area:"Santa Monica",cuisine:"Western",name:"FIG RESTAURANT",price:"$$$"},
    {county:"LA",area:"Santa Monica",cuisine:"Western",name:"LouLou Santa Monica",price:"$$$"},
    {county:"LA",area:"Santa Monica",cuisine:"Western",name:"The Lobster",price:"$$$$"},
    {county:"LA",area:"Santa Monica",cuisine:"Western",name:"Elephante",price:"$$$"},
    {county:"LA",area:"Santa Monica",cuisine:"SEA",name:"Cobi's",price:"$$$"},
    {county:"LA",area:"Venice",cuisine:"Western",name:"Coucou",price:"$$$"},
    {county:"LA",area:"Marina Del Rey",cuisine:"Japanese",name:"UO NIGIRI",price:"$$$"},
    {county:"LA",area:"Marina Del Rey",cuisine:"Japanese",name:"SOBAR",price:"$$"},
    {county:"LA",area:"Echo Park",cuisine:"Western",name:"Gra",price:"$$"},
    {county:"LA",area:"Chinatown",cuisine:"Chinese",name:"firstborn",price:"$$"},
    {county:"LA",area:"Chinatown",cuisine:"Western",name:"Philippe The Original",price:"$"},
    {county:"LA",area:"Chinatown",cuisine:"Mexican",name:"Homegirl Cafe",price:"$"},
    {county:"LA",area:"Chinatown",cuisine:"Western",name:"Howlin' Ray's Hot Chicken",price:"$"},
    {county:"LA",area:"Arts District",cuisine:"Western",name:"Bestia",price:"$$$"},
    {county:"LA",area:"Arts District",cuisine:"Japanese",name:"kodo",price:"$$"},
    {county:"LA",area:"Arts District",cuisine:"Japanese",name:"YESS",price:"$$$$"},
    {county:"LA",area:"Arts District",cuisine:"Chinese",name:"Bang Bang Noodles",price:"$$"},
    {county:"LA",area:"Arts District",cuisine:"Brunch",name:"Cafe 2001",price:"$"},
    {county:"LA",area:"Arts District",cuisine:"Western",name:"Bavel",price:"$$$"},
    {county:"LA",area:"Arts District",cuisine:"Japanese",name:"Hayato",price:"$$"},
    {county:"LA",area:"Arts District",cuisine:"Western",name:"Zinc Cafe & Bar",price:"$"},
    {county:"LA",area:"Arts District",cuisine:"Western",name:"Camphor",price:"$$$$"},
    {county:"LA",area:"Arts District",cuisine:"Western",name:"De La Nonna",price:"$$"},
    {county:"LA",area:"Little Tokyo",cuisine:"Japanese",name:"Pasta e Pasta by Allegro",price:"$$"},
    {county:"LA",area:"Little Tokyo",cuisine:"Japanese",name:"Sushi Gen",price:"$$$"},
    {county:"LA",area:"Little Tokyo",cuisine:"Japanese",name:"KAMINARI GYOZA BAR",price:"$"},
    {county:"LA",area:"Little Tokyo",cuisine:"Japanese",name:"Bar Sawa",price:"$$$$"},
    {county:"LA",area:"Little Tokyo",cuisine:"Japanese",name:"Daikokuya Little Tokyo",price:"$"},
    {county:"LA",area:"DTLA",cuisine:"Fusion",name:"BROKEN MOUTH",price:"$"},
    {county:"LA",area:"Westwood",cuisine:"Western",name:"In n Out",price:"$"},
    {county:"LA",area:"Hollywood",cuisine:"Western",name:"In n Out",price:"$"},
    {county:"LA",area:"Glendale",cuisine:"Korean",name:"Jincook",price:"$"},
    {county:"LA",area:"Atwater",cuisine:"Western",name:"Spina",price:"$$"},
    {county:"LA",area:"Atwater",cuisine:"Thai",name:"Holy Basil Market",price:"$"},
    {county:"LA",area:"Atwater",cuisine:"Cuban",name:"Baracoa Cuban Cafe",price:"$"},
    {county:"LA",area:"Atwater",cuisine:"Japanese",name:"Morihiro",price:"$$$$"},
    {county:"LA",area:"Highland Park",cuisine:"Western",name:"Amiga Amore",price:"$$$"},
    {county:"LA",area:"Highland Park",cuisine:"Taiwanese",name:"Joy",price:"$"},
    {county:"LA",area:"Eagle Rock",cuisine:"Western",name:"Wallflour Pizza",price:"$"},
    {county:"LA",area:"Larchmont",cuisine:"Peruvian",name:"Mario's Peruvian & Seafood",price:"$"},
    {county:"LA",area:"Larchmont",cuisine:"Japanese",name:"TONCHIN LA",price:"$$"},
    {county:"LA",area:"Pasadena",cuisine:"Chinese",name:"Noodle St",price:"$"},
    {county:"LA",area:"Pasadena",cuisine:"Japanese",name:"Bone Kettle",price:"$"},
    {county:"LA",area:"Pasadena",cuisine:"Japanese",name:"MAMA M SUSHI",price:"$$"},
    {county:"LA",area:"Pasadena",cuisine:"Japanese",name:"Osawa",price:"$$$"},
    {county:"LA",area:"Pasadena",cuisine:"SEA",name:"Star Leaf",price:"$$$"},
    {county:"LA",area:"Pasadena",cuisine:"Western",name:"UOVO",price:"$$"},
    {county:"LA",area:"Pasadena",cuisine:"Japanese",name:"Sugarfish",price:"$$"},
    {county:"LA",area:"Pasadena",cuisine:"Argentinean",name:"Malbec Argentinean Cuisine",price:"$$$"},
    {county:"LA",area:"Pasadena",cuisine:"Thai",name:"Chim!",price:"$"},
    {county:"LA",area:"Arcadia",cuisine:"Chinese",name:"Garden Cafe",price:"$"},
    {county:"LA",area:"Temple City",cuisine:"Chinese",name:"Alice's Kitchen",price:"$"},
    {county:"LA",area:"Monterey Park",cuisine:"Chinese",name:"Hong Kong Cafe",price:"$$"},
    {county:"LA",area:"Arcadia",cuisine:"Taiwanese",name:"Blue Magpie",price:"$$$"},
    {county:"LA",area:"Pasadena",cuisine:"Taiwanese",name:"Boiling Point",price:"$"},
    {county:"LA",area:"Alhambra",cuisine:"Chinese",name:"Chong Yuen Fong",price:"$"},
    {county:"LA",area:"Alhambra",cuisine:"Chinese",name:"NBC Seafood Restaurant",price:"$$"},
    {county:"LA",area:"Arcadia",cuisine:"Chinese",name:"Bafang Dumpling",price:"$"},
    {county:"LA",area:"Temple City",cuisine:"Chinese",name:"Bafang Dumpling",price:"$"},
    {county:"LA",area:"Alhambra",cuisine:"Chinese",name:"Meow Rice Noodle",price:"$"},
    {county:"LA",area:"Monterey Park",cuisine:"Chinese",name:"Ten Seconds Yunnan Rice Noodle",price:"$"},
    {county:"LA",area:"Alhambra",cuisine:"Chinese",name:"Lunasia Dim Sum House",price:"$"},
    {county:"LA",area:"San Gabriel",cuisine:"Japanese",name:"Yama Sushi Marketplace",price:"$$"},
    {county:"LA",area:"Huntington Park",cuisine:"Mexican",name:"Tacos Los poblanos",price:"$"},
    {county:"LA",area:"Boyle Heights",cuisine:"Mexican",name:"Mariscos 4 Vientos",price:"$"},
    {county:"LA",area:"Ktown",cuisine:"Korean",name:"BCD",price:"$"},
    {county:"LA",area:"Pasadena",cuisine:"Brunch",name:"Urth Cafe",price:"$"},
    {county:"LA",area:"Arts District",cuisine:"Brunch",name:"Urth Cafe",price:"$"},
    {county:"LA",area:"Melrose/Fairfax",cuisine:"Brunch",name:"Urth Cafe",price:"$"},
    {county:"LA",area:"Mid Wilshire",cuisine:"Western",name:"UOVO",price:"$$"},
    {county:"LA",area:"Century City",cuisine:"Taiwanese",name:"DTF",price:"$$"},
    {county:"LA",area:"Arcadia",cuisine:"Taiwanese",name:"DTF",price:"$$"},
    {county:"LA",area:"Glendale",cuisine:"Taiwanese",name:"DTF",price:"$$"},
    {county:"LA",area:"Ktown",cuisine:"Chinese",name:"Potato Love Noodle",price:"$"},
    {county:"LA",area:"Westwood",cuisine:"Japanese",name:"Hamasaku",price:"$$$"},
    {county:"LA",area:"East Hollywood",cuisine:"Filipino",name:"LA Rose Cafe",price:"$"},
    {county:"LA",area:"Echo Park",cuisine:"Japanese",name:"OTOTO",price:"$$$"},
    {county:"LA",area:"Monterey Park",cuisine:"Japanese",name:"Chubby Cattle",price:"$$$"},
    {county:"LA",area:"Santa Monica",cuisine:"Brunch",name:"Layla Bagels",price:"$"},
    {county:"LA",area:"Venice",cuisine:"French",name:"Coucou",price:"$$$"},
    {county:"LA",area:"Venice",cuisine:"Western",name:"Dudley Market",price:"$$$"},
    {county:"LA",area:"Venice",cuisine:"Mediterranean",name:"Alisa wine & friends",price:"$$$"},
    {county:"LA",area:"Venice",cuisine:"Mexican",name:"Bootleg Tacos",price:"$"},
    {county:"LA",area:"Venice",cuisine:"Mexican",name:"Talo Organic",price:"$"},
    {county:"LA",area:"Santa Monica",cuisine:"Western",name:"Citrin Restaurant",price:"$$$"},
    {county:"LA",area:"Santa Monica",cuisine:"Western",name:"Bread Head",price:"$$"},
    {county:"LA",area:"Ktown",cuisine:"Korean",name:"Jook Hyang",price:"$$"},
    {county:"LA",area:"Temple City",cuisine:"Chinese",name:"Bristo Na's",price:"$$$"},
    {county:"LA",area:"Temple City",cuisine:"Vietnamese",name:"Summer Rolls",price:"$"},
    {county:"LA",area:"DTLA",cuisine:"French",name:"Camelia",price:"$$$"},
    {county:"LA",area:"City of Industry",cuisine:"Japanese",name:"Sushi Yuen",price:"$$$$"},
    {county:"LA",area:"Rowland Heights",cuisine:"Japanese",name:"Yumiyaki Sukiyaki",price:"$$$"},
    {county:"VAN",area:"Kitsilano",cuisine:"Chinese",name:"HDL",price:"$$"},
    {county:"VAN",area:"Kitsilano",cuisine:"Japanese",name:"Itosugi Kappo Cuisine",price:"$$$"},
    {county:"VAN",area:"Point Grey",cuisine:"Western",name:"Jo's Italian Deli",price:"$"},
    {county:"VAN",area:"Kitsilano",cuisine:"Western",name:"Nook Kitsilano",price:"$$"},
    {county:"VAN",area:"Kitsilano",cuisine:"Japanese",name:"Raisu",price:"$$$"},
    {county:"VAN",area:"Kitsilano",cuisine:"Mexican",name:"Las Margaritas",price:"$"},
    {county:"VAN",area:"Kitsilano",cuisine:"Mexican",name:"Mi Casa Mexicana",price:"$"},
    {county:"VAN",area:"Kitsilano",cuisine:"Japanese",name:"New Fuji",price:"$$"},
    {county:"VAN",area:"Kitsilano",cuisine:"Japanese",name:"Toyokan",price:"$$"},
    {county:"VAN",area:"Kitsilano",cuisine:"Japanese",name:"Octopus' Garden Restaurant",price:"$$$$"},
    {county:"VAN",area:"Fairview",cuisine:"Western",name:"Mangia's Sandwiches",price:"$"},
    {county:"VAN",area:"Fairview",cuisine:"Western",name:"Gary's",price:"$$"},
    {county:"VAN",area:"Fairview",cuisine:"Korean",name:"Royal Seoul House Restaurant",price:"$$"},
    {county:"VAN",area:"Fairview",cuisine:"Japanese",name:"Junzushi",price:"$$$$"},
    {county:"VAN",area:"Fairview",cuisine:"Mexican",name:"COMEDOR By La Taqueria",price:"$$"},
    {county:"VAN",area:"Cambie",cuisine:"Japanese",name:"Alley 16",price:"$$"},
    {county:"VAN",area:"Cambie",cuisine:"Western",name:"Osteria Elio Volpe",price:"$$"},
    {county:"VAN",area:"Cambie",cuisine:"Western",name:"June",price:"$$$$"},
    {county:"VAN",area:"Cambie",cuisine:"Fusion",name:"Miso Taco",price:"$"},
    {county:"VAN",area:"Cambie",cuisine:"Chinese",name:"Cafe Gloucester",price:"$"},
    {county:"VAN",area:"Cambie",cuisine:"Thai",name:"Thai Away Home on Cambie",price:"$"},
    {county:"VAN",area:"Cambie",cuisine:"Chinese",name:"Dong Tai Xiang Shanghai Dim Sum",price:"$"},
    {county:"VAN",area:"Cambie",cuisine:"Spanish",name:"Casa Molina",price:"$$"},
    {county:"VAN",area:"Fairview",cuisine:"Mexican",name:"Ophelia",price:"$$"},
    {county:"VAN",area:"Fairview",cuisine:"Western",name:"Dear Gus Snack Bar",price:"$$"},
    {county:"VAN",area:"DT",cuisine:"Western",name:"Au Petit Comptoir",price:"$$"},
    {county:"VAN",area:"DT",cuisine:"Vietnamese",name:"Linh Cafe",price:"$$"},
    {county:"VAN",area:"DT",cuisine:"Western",name:"Autostrada Osteria Vancouver House",price:"$$"},
    {county:"VAN",area:"DT",cuisine:"Brunch",name:"Maxine's Cafe & Bar",price:"$"},
    {county:"VAN",area:"Yaletown",cuisine:"Mediterranean",name:"Nuba in Yaletown",price:"$$"},
    {county:"VAN",area:"DT",cuisine:"Korean",name:"Sura",price:"$$"},
    {county:"VAN",area:"Yaletown",cuisine:"Korean",name:"Mapo Pancake House",price:"$$"},
    {county:"VAN",area:"Yaletown",cuisine:"Western",name:"La Terrazza",price:"$$$$"},
    {county:"VAN",area:"Yaletown",cuisine:"Western",name:"Brix and Mortar",price:"$$$"},
    {county:"VAN",area:"Yaletown",cuisine:"Japanese",name:"Minami",price:"$$$"},
    {county:"VAN",area:"Yaletown",cuisine:"Japanese",name:"Sushi Okeya Kyujiro",price:"$$$"},
    {county:"VAN",area:"Yaletown",cuisine:"Western",name:"Cactus Club Cafe",price:"$"},
    {county:"VAN",area:"Yaletown",cuisine:"Western",name:"The Flying Pig Yaletown",price:"$$"},
    {county:"VAN",area:"Yaletown",cuisine:"Western",name:"Dovetail",price:"$$"},
    {county:"VAN",area:"DT",cuisine:"Western",name:"Dovetail",price:"$$"},
    {county:"VAN",area:"Yaletown",cuisine:"Brunch",name:"123Dough Organic Cafe",price:"$"},
    {county:"VAN",area:"Yaletown",cuisine:"Mediterranean",name:"The Greek Yaletown",price:"$$"},
    {county:"VAN",area:"Yaletown",cuisine:"Mexican",name:"Tacofino Yaletown",price:"$"},
    {county:"VAN",area:"Yaletown",cuisine:"Western",name:"Robba da Matti (Yaletown)",price:"$$"},
    {county:"VAN",area:"Yaletown",cuisine:"Western",name:"SOCIAL CORNER YALETOWN",price:"$$"},
    {county:"VAN",area:"DT",cuisine:"Japanese",name:"Maruhachi Ra-men Central Library",price:"$"},
    {county:"VAN",area:"DT",cuisine:"Korean",name:"JINMI",price:"$$$"},
    {county:"VAN",area:"Westend",cuisine:"Brazilian",name:"Rio Brazilian Steakhouse",price:"$$"},
    {county:"VAN",area:"Westend",cuisine:"Japanese",name:"Sushi Aboard",price:"$"},
    {county:"VAN",area:"Westend",cuisine:"Western",name:"Robba da Matti (Westend)",price:"$$"},
    {county:"VAN",area:"Westend",cuisine:"Japanese",name:"Kingyo Izakaya",price:"$$"},
    {county:"VAN",area:"Westend",cuisine:"Japanese",name:"Tetsu Sushi Bar",price:"$$$$"},
    {county:"VAN",area:"Westend",cuisine:"Korean",name:"Ta Bom Korean Cuisine",price:"$"},
    {county:"VAN",area:"Westend",cuisine:"Korean",name:"Hongdae Pocha Korean BBQ",price:"$$"},
    {county:"VAN",area:"Westend",cuisine:"Korean",name:"Nom Nom",price:"$"},
    {county:"VAN",area:"Westend",cuisine:"Japanese",name:"Guu with Garlic",price:"$$"},
    {county:"VAN",area:"Westend",cuisine:"Chinese",name:"Dinesty Dumpling House",price:"$"},
    {county:"VAN",area:"DT",cuisine:"Western",name:"Carlino Restaurant",price:"$$"},
    {county:"VAN",area:"DT",cuisine:"Japanese",name:"Lucky Sushi",price:"$"},
    {county:"OC",area:"Westminster",cuisine:"Vietnamese",name:"Quan Nhii",price:"$"},
    {county:"OC",area:"Westminster",cuisine:"Korean",name:"Kaju Soft Tofu",price:"$"},
    {county:"OC",area:"Westminster",cuisine:"Vietnamese",name:"Brodard Chateau",price:"$"},
    {county:"OC",area:"Westminster",cuisine:"Korean",name:"Mo Ran Gak",price:"$$"},
    {county:"OC",area:"Garden Grove",cuisine:"Vietnamese",name:"Oc & Lau 2",price:"$$"},
    {county:"OC",area:"Garden Grove",cuisine:"Vietnamese",name:"Thien Dang Veg",price:"$"},
    {county:"OC",area:"Garden Grove",cuisine:"Vietnamese",name:"Pho Kuroshi",price:"$"},
    {county:"OC",area:"Garden Grove",cuisine:"Vietnamese",name:"Que Em Que Anh",price:"$"},
    {county:"OC",area:"Garden Grove",cuisine:"Vietnamese",name:"Pho 79",price:"$"},
    {county:"OC",area:"Westminster",cuisine:"Vietnamese",name:"Banh Khot Lady",price:"$"},
    {county:"OC",area:"Irvine",cuisine:"Korean",name:"Yoo's Place",price:"$"},
    {county:"OC",area:"Irvine",cuisine:"Japanese",name:"Izakaya Onsen",price:"$$$"},
    {county:"OC",area:"Irvine",cuisine:"Vietnamese",name:"Sup Noodle",price:"$"},
    {county:"OC",area:"Irvine",cuisine:"Brunch",name:"Stacks Pancake",price:"$"},
    {county:"OC",area:"Irvine",cuisine:"Chinese",name:"JA Jiaozi",price:"$"},
    {county:"OC",area:"Tustin",cuisine:"Japanese",name:"Sushi Damu",price:"$$"},
    {county:"OC",area:"Tustin",cuisine:"Japanese",name:"Tanakaya",price:"$"},
    {county:"OC",area:"Orange",cuisine:"Mexican",name:"Jardin Autentica Cocina",price:"$"},
    {county:"OC",area:"Costa Mesa",cuisine:"Japanese",name:"Meiji seimen",price:"$"},
    {county:"OC",area:"Irvine",cuisine:"Japanese",name:"Mikiya",price:"$$$"},
    {county:"OC",area:"Tustin",cuisine:"Japanese",name:"Okidoki by Meji",price:"$$"}
  ];

  const insert = db.prepare(`
    INSERT INTO restaurants (name, county, area, cuisine, price) 
    VALUES (@name, @county, @area, @cuisine, @price)
  `);

  const insertMany = db.transaction((restaurants) => {
    for (const r of restaurants) {
      insert.run(r);
    }
  });

  insertMany(initialRestaurants);
  console.log(`Seeded ${initialRestaurants.length} restaurants`);
}

// ============ API ROUTES ============

// Get all restaurants
app.get('/api/restaurants', (req, res) => {
  try {
    const restaurants = db.prepare('SELECT * FROM restaurants ORDER BY name').all();
    res.json(restaurants);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get filter options
app.get('/api/filters', (req, res) => {
  try {
    const counties = db.prepare('SELECT DISTINCT county FROM restaurants ORDER BY county').all();
    const areas = db.prepare('SELECT DISTINCT area FROM restaurants ORDER BY area').all();
    const cuisines = db.prepare('SELECT DISTINCT cuisine FROM restaurants ORDER BY cuisine').all();
    
    res.json({
      counties: counties.map(c => c.county),
      areas: areas.map(a => a.area),
      cuisines: cuisines.map(c => c.cuisine)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get random restaurant with filters
app.get('/api/restaurants/random', (req, res) => {
  try {
    const { county, area, cuisine, price } = req.query;
    
    let query = 'SELECT * FROM restaurants WHERE 1=1';
    const params = {};
    
    if (county) {
      query += ' AND county = @county';
      params.county = county;
    }
    if (area) {
      query += ' AND area = @area';
      params.area = area;
    }
    if (cuisine) {
      query += ' AND cuisine = @cuisine';
      params.cuisine = cuisine;
    }
    if (price) {
      query += ' AND price = @price';
      params.price = price;
    }
    
    query += ' ORDER BY RANDOM() LIMIT 1';
    
    const restaurant = db.prepare(query).get(params);
    
    if (!restaurant) {
      return res.status(404).json({ error: 'No restaurants match your filters' });
    }
    
    res.json(restaurant);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add new restaurant
app.post('/api/restaurants', (req, res) => {
  try {
    const { name, county, area, cuisine, price, place_id } = req.body;
    
    if (!name || !county || !area || !cuisine) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const result = db.prepare(`
      INSERT INTO restaurants (name, county, area, cuisine, price, place_id) 
      VALUES (@name, @county, @area, @cuisine, @price, @place_id)
    `).run({ name, county, area, cuisine, price: price || '$$', place_id: place_id || null });
    
    const newRestaurant = db.prepare('SELECT * FROM restaurants WHERE id = ?').get(result.lastInsertRowid);
    
    res.status(201).json(newRestaurant);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete restaurant
app.delete('/api/restaurants/:id', (req, res) => {
  try {
    const { id } = req.params;
    const result = db.prepare('DELETE FROM restaurants WHERE id = ?').run(id);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Restaurant not found' });
    }
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============ GOOGLE PLACES API PROXY ============

// Search for a place and get its details including photos
app.get('/api/places/search', async (req, res) => {
  try {
    const { query } = req.query;
    
    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }

    // Use Places API (New) Text Search
    const response = await fetch('https://places.googleapis.com/v1/places:searchText', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': GOOGLE_API_KEY,
        'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.photos,places.googleMapsUri,places.rating,places.userRatingCount'
      },
      body: JSON.stringify({
        textQuery: query,
        maxResultCount: 1
      })
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Places API error:', error);
      return res.status(response.status).json({ error: 'Places API request failed' });
    }

    const data = await response.json();
    
    if (!data.places || data.places.length === 0) {
      return res.status(404).json({ error: 'Place not found' });
    }

    res.json(data.places[0]);
  } catch (error) {
    console.error('Places search error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get photo from Places API
app.get('/api/places/photo', async (req, res) => {
  try {
    const { photoName, maxWidth = 800, maxHeight = 600 } = req.query;
    
    if (!photoName) {
      return res.status(400).json({ error: 'Photo name is required' });
    }

    const photoUrl = `https://places.googleapis.com/v1/${photoName}/media?maxHeightPx=${maxHeight}&maxWidthPx=${maxWidth}&key=${GOOGLE_API_KEY}`;
    
    const response = await fetch(photoUrl);
    
    if (!response.ok) {
      return res.status(response.status).json({ error: 'Failed to fetch photo' });
    }

    // Get the final URL after redirects
    res.json({ url: response.url });
  } catch (error) {
    console.error('Photo fetch error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============ SERVE FRONTEND ============
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`🍽️  Restaurant Randomizer server running at http://localhost:${PORT}`);
});
