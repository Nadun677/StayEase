const Review = require('./Review');

// POST: Add new rating & review
exports.createReview = async (req, res) => {
    try {
        const { propertyId } = req.params;
        const { customerEmail, overallRating, cleanliness, location, service, comment } = req.body;

        if (!propertyId) {
            return res.status(400).json({ success: false, error: 'Property ID parameter is required.' });
        }

        if (!customerEmail || overallRating === undefined || overallRating === null) {
            return res.status(400).json({ success: false, error: 'Email and overall rating are required.' });
        }

        const parsedOverall = Number(overallRating);
        if (isNaN(parsedOverall) || parsedOverall < 1 || parsedOverall > 5) {
            return res.status(400).json({ success: false, error: 'Overall rating must be between 1 and 5.' });
        }

        const review = new Review({
            propertyId,
            customerEmail,
            overallRating: Math.round(parsedOverall),
            cleanliness: cleanliness ? Number(cleanliness) : 5,
            location: location ? Number(location) : 5,
            service: service ? Number(service) : 5,
            comment: comment || ''
        });

        await review.save();

        return res.status(201).json({
            success: true,
            message: 'Rating submitted successfully!',
            data: review
        });
    } catch (err) {
        console.error("Error creating review:", err);
        return res.status(500).json({ success: false, error: err.message });
    }
};

// GET: Calculate property review metrics & star distribution
exports.getPropertyReviewStats = async (req, res) => {
    try {
        const { propertyId } = req.params;

        if (!propertyId) {
            return res.status(400).json({ success: false, error: 'Property ID parameter is required.' });
        }

        const reviews = await Review.find({ propertyId });

        if (!reviews || reviews.length === 0) {
            return res.json({
                success: true,
                avgRating: "0.0",
                totalReviews: 0,
                starPercentages: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
                categories: { cleanliness: "0.0", location: "0.0", service: "0.0" }
            });
        }

        const totalReviews = reviews.length;

        const sumRating = reviews.reduce((acc, r) => acc + (Number(r.overallRating) || 0), 0);
        const avgRating = (sumRating / totalReviews).toFixed(1);

        const starCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        reviews.forEach(r => {
            const ratingKey = Math.round(Number(r.overallRating));
            if (starCounts[ratingKey] !== undefined) {
                starCounts[ratingKey] += 1;
            }
        });

        const starPercentages = {};
        for (let star = 1; star <= 5; star++) {
            starPercentages[star] = Math.round((starCounts[star] / totalReviews) * 100);
        }

        const sumCleanliness = reviews.reduce((acc, r) => acc + (Number(r.cleanliness) || 5), 0);
        const sumLocation = reviews.reduce((acc, r) => acc + (Number(r.location) || 5), 0);
        const sumService = reviews.reduce((acc, r) => acc + (Number(r.service) || 5), 0);

        return res.json({
            success: true,
            avgRating,
            totalReviews,
            starPercentages,
            categories: {
                cleanliness: (sumCleanliness / totalReviews).toFixed(1),
                location: (sumLocation / totalReviews).toFixed(1),
                service: (sumService / totalReviews).toFixed(1)
            }
        });
    } catch (err) {
        console.error("Error fetching review stats:", err);
        return res.status(500).json({ success: false, error: err.message });
    }
};