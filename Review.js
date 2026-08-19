const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
    propertyId: { type: String, required: true, index: true },
    customerEmail: { type: String, required: true },
    overallRating: { type: Number, required: true, min: 1, max: 5 },
    cleanliness: { type: Number, default: 5, min: 1, max: 5 },
    location: { type: Number, default: 5, min: 1, max: 5 },
    service: { type: Number, default: 5, min: 1, max: 5 },
    comment: { type: String, default: "" },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Review', reviewSchema);