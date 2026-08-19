const mongoose = require('mongoose');
require('dotenv').config();

// --- MONGODB CONNECTION SETUP ---
const cloudURI = "mongodb+srv://nadunnimansha067_db_user:qlmrMOWU4uHIbbug@cluster0.kkzg3uk.mongodb.net/stayease?retryWrites=true&w=majority&appName=Cluster0";


if (!cloudURI) {
    console.error("CRITICAL ERROR: MONGO_URI is missing from environment variables.");
    process.exit(1);
}

mongoose.connect(cloudURI)
    .then(() => console.log('Successfully connected to StayEase MongoDB Atlas Cloud Container.'))
    .catch(err => {
        console.error('Database connection error:', err);
        process.exit(1);
    });

// --- SCHEMAS ---
const propertySchema = new mongoose.Schema({
    title: { type: String, required: true },
    location: { type: String, required: true },
    category: { type: String, required: true },
    price: { type: Number, required: true },
    rating: { type: Number, required: true },
    perks: [String],
    image: { type: String, required: true }
});

const reviewSchema = new mongoose.Schema({
    propertyId: { type: String, required: true },
    userName: { type: String, required: true },
    rating: { type: Number, required: true },
    cleanliness: { type: Number, default: 5 },
    location: { type: Number, default: 5 },
    service: { type: Number, default: 5 },
    comment: { type: String, default: '' },
    timestamp: { type: Date, default: Date.now }
});

const Property = mongoose.model('Property', propertySchema);
const Review = mongoose.model('Review', reviewSchema);

// --- EXPANDED SRI LANKA HOTEL OBJECT DATA (12 HOTELS) ---
const sampleHotels = [
    {
        title: "The Grand Ocean Retreat & Spa",
        location: "Bentota, Sri Lanka",
        category: "Beach Resort",
        perks: ["Infinity Pool", "Private Beach", "Breakfast Included"],
        price: 280,
        rating: 4.9,
        image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=700&q=80"
    },
    {
        title: "Sigiriya Rock Sanctuary Villa",
        location: "Sigiriya, Sri Lanka",
        category: "Villa",
        perks: ["Rock View", "Private Pool", "Traditional Spa"],
        price: 240,
        rating: 4.8,
        image: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=700&q=80"
    },
    {
        title: "Mist Hillside Chalet",
        location: "Ella, Sri Lanka",
        category: "Chalet",
        perks: ["Mountain View", "High-Speed WiFi", "Balcony Lounge"],
        price: 160,
        rating: 4.7,
        image: "https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=700&q=80"
    },
    {
        title: "Grand Hillside Villa & Spa",
        location: "Kandy, Sri Lanka",
        category: "Villa",
        perks: ["Infinity Pool", "Mountain View", "Ayurvedic Spa"],
        price: 180,
        rating: 4.9,
        image: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=700&q=80"
    },
    {
        title: "Colonial Heritage Sanctuary",
        location: "Galle Fort, Sri Lanka",
        category: "Boutique Hotel",
        perks: ["Historic Courtyard", "Fine Dining", "Air Conditioning"],
        price: 195,
        rating: 4.8,
        image: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=700&q=80"
    },
    {
        title: "Cloud Nine Tea Bungalow",
        location: "Nuwara Eliya, Sri Lanka",
        category: "Bungalow",
        perks: ["Fireplace", "Tea Garden View", "Heated Pool"],
        price: 210,
        rating: 4.9,
        image: "https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=700&q=80"
    },
    {
        title: "Mirissa Palms Oceanfront Villa",
        location: "Mirissa, Sri Lanka",
        category: "Beach Resort",
        perks: ["Oceanfront", "Whale Watching Access", "Private Chef"],
        price: 310,
        rating: 4.9,
        image: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=700&q=80"
    },
    {
        title: "Yala Wild Safari Lodge",
        location: "Yala, Sri Lanka",
        category: "Chalet",
        perks: ["Game Drives", "Open Air Lounge", "All Inclusive Meals"],
        price: 350,
        rating: 4.8,
        image: "https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?auto=format&fit=crop&w=700&q=80"
    },
    {
        title: "Arugam Bay Surf Resort",
        location: "Arugam Bay, Sri Lanka",
        category: "Beach Resort",
        perks: ["Surf School Access", "Beach Bar", "Yoga Deck"],
        price: 140,
        rating: 4.6,
        image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=700&q=80"
    },
    {
        title: "Tangalle Sunset Cove Villa",
        location: "Tangalle, Sri Lanka",
        category: "Villa",
        perks: ["Private Plunge Pool", "Coconut Grove View", "Spa"],
        price: 290,
        rating: 4.9,
        image: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=700&q=80"
    },
    {
        title: "Colombo City Sky Penthouse",
        location: "Colombo, Sri Lanka",
        category: "Boutique Hotel",
        perks: ["Rooftop Bar", "Skyline View", "Gym & Sauna"],
        price: 220,
        rating: 4.7,
        image: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=700&q=80"
    },
    {
        title: "Trincomalee Coral Beach Resort",
        location: "Trincomalee, Sri Lanka",
        category: "Beach Resort",
        perks: ["Snorkeling Tours", "Sea Facing Suites", "Fresh Seafood"],
        price: 175,
        rating: 4.8,
        image: "https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?auto=format&fit=crop&w=700&q=80"
    }
];

// --- SEED EXECUTION ENGINE ---
async function seedDatabase() {
    try {
        // Clear existing collection entries
        await Property.deleteMany({}); 
        await Review.deleteMany({});
        console.log("Cleared old database entries...");

        // Insert new catalog items
        const insertedProperties = await Property.insertMany(sampleHotels);
        console.log(`Database successfully populated with ${insertedProperties.length} Sri Lankan StayEase items!`);

        process.exit(0);
    } catch (err) {
        console.error("Seeding failed:", err);
        process.exit(1);
    }
}

// Execute seed engine
seedDatabase();