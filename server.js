const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());

// Helper function to escape special characters for regex matching
const escapeRegex = (text) => text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');

// --- MONGODB CONNECTION SETUP ---
const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://nadunnimansha067_db_user:qlmrMOWU4uHIbbug@cluster0.kkzg3uk.mongodb.net/stayease?retryWrites=true&w=majority&appName=Cluster0";

if (!MONGO_URI) {
    console.error("CRITICAL ERROR: MONGO_URI is not defined in environment variables.");
    process.exit(1);
}

mongoose.connect(MONGO_URI)
    .then(() => console.log("Successfully connected to StayEase MongoDB Atlas Cloud Container."))
    .catch(err => console.error("MongoDB initialization connection error:", err));

// --- MONGOOSE MODELS & SCHEMAS ---

// 1. Property Schema
const propertySchema = new mongoose.Schema({
    title: { type: String, required: true },
    location: { type: String, required: true },
    price: { type: Number, required: true },
    rating: { type: Number, default: 5.0 },
    perks: [String],
    image: { type: String, required: true }
});
const Property = mongoose.model('Property', propertySchema);

// 2. Booking Schema
const bookingSchema = new mongoose.Schema({
    propertyTitle: { type: String, required: true },
    baseRate: { type: Number, default: 0 },
    totalPaid: { type: Number, default: 0 },
    customerName: { type: String, required: true },
    customerEmail: { type: String },
    customerPhone: { type: String },
    guestsSummary: { type: String },
    rooms: { type: Number, default: 1 },
    checkIn: { type: String, required: true },
    checkOut: { type: String, required: true },
    additionalInfo: { type: String },
    customRequirements: [String],
    paymentMethodSelected: { type: String, default: 'Inquiry Request' },
    timestamp: { type: Date, default: Date.now }
});
const Booking = mongoose.model('Booking', bookingSchema);

// 3. Review Schema (Updated propertyId to String for custom string IDs like 'prop123')
const reviewSchema = new mongoose.Schema({
    propertyId: { type: String, required: true, index: true },
    userName: { type: String, required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    cleanliness: { type: Number, default: 5, min: 1, max: 5 },
    location: { type: Number, default: 5, min: 1, max: 5 },
    service: { type: Number, default: 5, min: 1, max: 5 },
    comment: { type: String, default: '' },
    timestamp: { type: Date, default: Date.now }
});
const Review = mongoose.model('Review', reviewSchema);


// --- API ROUTE PORTALS ---

// 1a. Get properties catalog list
app.get('/api/properties', async (req, res) => {
    try {
        const cloudProperties = await Property.find({});
        res.json(cloudProperties);
    } catch (err) {
        console.error("Error reading catalog from database:", err);
        res.status(500).json({ success: false, message: "Failed to read property database." });
    }
});

// 1b. Add new property listing
app.post('/api/properties', async (req, res) => {
    const { title, location, price, rating, perks, image } = req.body;

    if (!title || !location || !price || !image) {
        return res.status(400).json({ success: false, message: "Missing required property details." });
    }

    try {
        const newProperty = new Property({
            title,
            location,
            price,
            rating: rating || 5.0,
            perks: perks || [],
            image
        });

        const savedProperty = await newProperty.save();
        res.status(201).json({ success: true, property: savedProperty });
    } catch (err) {
        console.error("Error creating property listing:", err);
        res.status(500).json({ success: false, message: "Failed to save property." });
    }
});

// 2. Write customer checkout reservation / inquiry into MongoDB
app.post('/api/bookings', async (req, res) => {
    const { 
        propertyTitle, 
        baseRate, 
        totalPaid, 
        customerName, 
        customerEmail,
        customerPhone, 
        guestsSummary,
        rooms,
        checkIn, 
        checkOut, 
        additionalInfo,
        customRequirements, 
        paymentMethodSelected 
    } = req.body;

    if (!propertyTitle || !customerName || !checkIn || !checkOut) {
        return res.status(400).json({ 
            success: false, 
            message: "Missing required booking fields (propertyTitle, customerName, checkIn, checkOut)." 
        });
    }

    try {
        const newReservationRecord = new Booking({
            propertyTitle,
            baseRate: baseRate || 0,
            totalPaid: totalPaid || 0,
            customerName,
            customerEmail: customerEmail || '',
            customerPhone: customerPhone || '',
            guestsSummary: guestsSummary || '1 Guest',
            rooms: rooms || 1,
            checkIn,
            checkOut,
            additionalInfo: additionalInfo || '',
            customRequirements: customRequirements || [],
            paymentMethodSelected: paymentMethodSelected || 'Inquiry Request'
        });

        const savedRecord = await newReservationRecord.save();

        res.status(201).json({ 
            success: true, 
            message: "Payload securely pushed into core database repository collections.",
            bookingId: savedRecord._id,
            booking: savedRecord
        });
    } catch (err) {
        console.error("Error committing booking payload to Atlas:", err);
        res.status(500).json({ success: false, message: "Database write failure." });
    }
});

// 3. Fetch booking history by Email, Phone, or Name
app.get('/api/bookings/history', async (req, res) => {
    const { email, phone, name } = req.query;

    try {
        let filter = {};
        if (email) {
            filter.customerEmail = { $regex: escapeRegex(email), $options: 'i' };
        } else if (phone) {
            filter.customerPhone = phone;
        } else if (name) {
            filter.customerName = { $regex: escapeRegex(name), $options: 'i' };
        }

        const history = await Booking.find(filter).sort({ timestamp: -1 });
        res.json({ success: true, count: history.length, bookings: history });
    } catch (err) {
        console.error("Error fetching booking history:", err);
        res.status(500).json({ success: false, message: "Failed to retrieve booking history." });
    }
});

// 4. Admin dashboard portal endpoint
app.get('/api/admin/bookings', async (req, res) => {
    try {
        const liveBookings = await Booking.find({}).sort({ timestamp: -1 });
        res.json(liveBookings);
    } catch (err) {
        console.error("Failed to fetch logs from MongoDB:", err);
        res.status(500).json({ success: false, message: "Database cluster read failure." });
    }
});

// 5. Update an existing booking record in MongoDB Atlas
app.put('/api/admin/bookings/:id', async (req, res) => {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return res.status(400).json({ success: false, message: "Invalid booking ID structure." });
    }

    try {
        const updatedBooking = await Booking.findByIdAndUpdate(
            req.params.id, 
            { $set: req.body }, 
            { new: true, runValidators: true }
        );
        if (!updatedBooking) {
            return res.status(404).json({ success: false, message: "Booking record not found." });
        }
        res.json({ success: true, message: "Reservation updated successfully!", updatedBooking });
    } catch (err) {
        console.error("Error updating document:", err);
        res.status(500).json({ success: false, message: "Database update failure." });
    }
});

// 6. Delete a booking record from MongoDB Atlas
app.delete('/api/admin/bookings/:id', async (req, res) => {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return res.status(400).json({ success: false, message: "Invalid booking ID structure." });
    }

    try {
        const deletedBooking = await Booking.findByIdAndDelete(req.params.id);
        if (!deletedBooking) {
            return res.status(404).json({ success: false, message: "Booking record not found." });
        }
        res.json({ success: true, message: "Reservation successfully cleared from cloud collections." });
    } catch (err) {
        console.error("Error deleting document:", err);
        res.status(500).json({ success: false, message: "Database deletion failure." });
    }
});

// --- REVIEWS & RATINGS ENDPOINTS ---

// 8a. Post a new guest review
app.post('/api/reviews', async (req, res) => {
    const { propertyId, userName, rating, cleanliness, location, service, comment } = req.body;

    if (!propertyId || !userName || !rating) {
        return res.status(400).json({ success: false, message: "Missing required review fields." });
    }

    try {
        const newReview = new Review({
            propertyId: String(propertyId),
            userName,
            rating: Number(rating),
            cleanliness: cleanliness ? Number(cleanliness) : 5,
            location: location ? Number(location) : 5,
            service: service ? Number(service) : 5,
            comment: comment || ''
        });

        const savedReview = await newReview.save();

        // Calculate and update parent property aggregate rating if property exists
        const stats = await Review.aggregate([
            { $match: { propertyId: String(propertyId) } },
            { $group: { _id: null, avgRating: { $avg: '$rating' } } }
        ]);

        if (stats.length > 0 && mongoose.Types.ObjectId.isValid(propertyId)) {
            const newAvg = Number(stats[0].avgRating.toFixed(1));
            await Property.findByIdAndUpdate(propertyId, { rating: newAvg });
        }

        res.status(201).json({ success: true, message: "Review posted successfully!", review: savedReview });
    } catch (err) {
        console.error("Error creating review:", err);
        res.status(500).json({ success: false, message: "Failed to post review." });
    }
});

// 8b. Get calculated review statistics & progress bar percentages for a property
app.get('/api/properties/:propertyId/reviews', async (req, res) => {
    const propId = String(req.params.propertyId);

    try {
        const stats = await Review.aggregate([
            { $match: { propertyId: propId } },
            {
                $facet: {
                    overallStats: [
                        {
                            $group: {
                                _id: null,
                                totalReviews: { $sum: 1 },
                                avgRating: { $avg: '$rating' },
                                avgCleanliness: { $avg: '$cleanliness' },
                                avgLocation: { $avg: '$location' },
                                avgService: { $avg: '$service' }
                            }
                        }
                    ],
                    starCounts: [
                        {
                            $group: {
                                _id: '$rating',
                                count: { $sum: 1 }
                            }
                        }
                    ],
                    recentReviews: [
                        { $sort: { timestamp: -1 } },
                        { $limit: 10 }
                    ]
                }
            }
        ]);

        const result = stats[0];
        const overall = result.overallStats[0] || {
            totalReviews: 0,
            avgRating: 5.0,
            avgCleanliness: 5.0,
            avgLocation: 5.0,
            avgService: 5.0
        };

        const total = overall.totalReviews || 1;

        const starPercentages = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        result.starCounts.forEach(item => {
            const roundedStar = Math.round(Number(item._id));
            if (starPercentages.hasOwnProperty(roundedStar)) {
                starPercentages[roundedStar] = Math.round((item.count / total) * 100);
            }
        });

        res.json({
            success: true,
            totalReviews: overall.totalReviews,
            avgRating: Number((overall.avgRating || 0).toFixed(1)),
            categories: {
                cleanliness: Number((overall.avgCleanliness || 0).toFixed(1)),
                location: Number((overall.avgLocation || 0).toFixed(1)),
                service: Number((overall.avgService || 0).toFixed(1))
            },
            starPercentages,
            reviews: result.recentReviews
        });
    } catch (err) {
        console.error("Error retrieving review statistics:", err);
        res.status(500).json({ success: false, message: "Failed to calculate review analytics." });
    }
});

// 7. AI Chatbot endpoint
app.post('/api/chat', async (req, res) => {
    const { userPrompt } = req.body;

    if (!userPrompt) {
        return res.status(400).json({ success: false, reply: "Please provide a valid question." });
    }

    const query = userPrompt.toLowerCase();
    let reply = "";

    if (query.includes('cancel') || query.includes('refund')) {
        reply = "You can cancel or modify your stay free of charge up to 48 hours prior to check-in directly through your StayEase dashboard.";
    } else if (query.includes('host') || query.includes('earn') || query.includes('list')) {
        reply = "To list your luxury property, head over to the 'Premium Hosting' section in the top menu to estimate your earnings and register!";
    } else if (query.includes('pay') || query.includes('card') || query.includes('price')) {
        reply = "StayEase supports all major credit/debit card providers (Visa, MasterCard, Amex) and major digital payments securely.";
    } else if (query.includes('book') || query.includes('reserve')) {
        reply = "To reserve a stay, select your preferred property card from the catalog and click 'View Details' to navigate to checkout.";
    } else {
        reply = "Thank you for reaching out to StayEase Support! Your request has been logged, and our concierge team will assist you shortly.";
    }

    res.json({ success: true, reply });
});

// --- ENGINE INITIALIZATION ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`StayEase Core Pipeline system live on port: http://localhost:${PORT}`);
});