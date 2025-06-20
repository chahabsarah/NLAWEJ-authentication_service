const Location = require('../models/Location');
const Offer = require('../models/Offre');
const Service = require('../models/Service');
const User = require('../models/User');
const Position = require('../models/Position');
const { default: mongoose } = require('mongoose');

const haversineDistance = (lat1, lon1, lat2, lon2) => {
  const toRad = angle => (angle * Math.PI) / 180;
  const R = 6371; // Radius of the Earth in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};
const calculateDistance = async (req, res) => {
  const { from, to } = req.query;

  if (!from || !to) {
    return res.status(400).json({ error: 'from and to are required in format "lng,lat"' });
  }

  try {
    const fromParts = from.split(',').map(Number);
    const toParts = to.split(',').map(Number);
    console.log('from',fromParts);
    console.log('to',toParts);
    if (
      fromParts.length !== 2 || toParts.length !== 2 ||
      fromParts.some(isNaN) || toParts.some(isNaN)
    ) {
      return res.status(400).json({ error: 'Invalid coordinates. Use format "lng,lat"' });
    }

    const [lat1, lon1] = fromParts;
    const [lat2, lon2] = toParts;

    const distanceKm = haversineDistance(lat1, lon1, lat2, lon2);

    return res.json({ distanceKm });
  } catch (error) {
    console.error("Erreur lors du calcul de la distance :", error);
    return res.status(500).json({ error: "Erreur interne du serveur" });
  }
};

const getAllCityNames = async (req, res) => {
  const cities = await Location.find({}, { name: 1});
  res.json(cities.map(c => c.name));
};
const getAllCities = async (req, res) => {
  const cities = await Location.find({}, { name: 1 });
  res.json(cities);
};
const getCities = async (req, res) => {
  const cities = await Location.find({});
  res.json(cities);
};
const getOffersNearCity = async (req, res) => {
  const { cityName, maxDistance } = req.query;

  const city = await Location.findOne({ name: cityName });
  if (!city) return res.status(404).json({ error: 'City not found' });

  const offers = await Offer.find()
    .populate({
      path: 'location',
      match: {
        coordinates: {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: city.coordinates.coordinates
            },
            $maxDistance: maxDistance ? parseInt(maxDistance) : 20000 
          }
        }
      }
    })
    .populate('service')
    .populate('artisan');

  const nearbyOffers = offers.filter(o => o.location);

  res.json(nearbyOffers);
};

const saveUserLocation = async (req, res) => {
  try {
    const { longitude, latitude, userId } = req.body;

    if (!latitude || !longitude) {
      return res.status(400).json({ error: 'Latitude and longitude are required' });
    }

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const pos = await Position.findOne({userId});
    if (pos){
      try {
    const result = await Position.findOneAndDelete({userId}
    );
    console.log("Position deleted:", result);
  } catch (err) {
    console.error("Erreur lors de l'enregistrement de la position:", err);
  }
    }
    const newPosition = new Position({
      userId: new mongoose.Types.ObjectId(userId),
      coordinates: {
        type: 'Point',
        coordinates: [longitude, latitude],
      },
    });

    await newPosition.save();

    res.status(200).json({ message: 'New position saved successfully', position: newPosition });
  } catch (error) {
    console.error('Error saving position:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

const getOffersNearUser = async (req, res) => {
  try {
    const { userId, maxDistance } = req.query;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    const userPosition = await Position.findOne({ userId });

    if (!userPosition) {
      return res.status(404).json({ error: 'You have to activate your position first!' });
    }

    // Recherche des locations proches de la position de l'utilisateur
    const nearbyLocations = await Location.find({
      coordinates: {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: userPosition.coordinates.coordinates
          },
          $maxDistance: maxDistance ? parseInt(maxDistance) : 500000
        }
      }
    });

    const locationIds = nearbyLocations.map(loc => loc._id);

    // Recherche des offres liées à ces locations
    const offers = await Offer.find({ location: { $in: locationIds } })
      .populate('location')
      .populate('service')
      .populate('artisan');

    res.json(offers);
  } catch (error) {
    console.error('Error fetching offers near user:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports={getOffersNearCity,getAllCityNames,calculateDistance,getAllCities,
saveUserLocation,getOffersNearUser,getCities}
