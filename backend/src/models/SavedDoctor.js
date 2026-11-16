const mongoose = require('mongoose');
const stubSchema = new mongoose.Schema({}, { strict: false });
module.exports = mongoose.models.SavedDoctor || mongoose.model('SavedDoctor', stubSchema);
