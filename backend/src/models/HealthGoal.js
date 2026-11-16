const mongoose = require('mongoose');
const stubSchema = new mongoose.Schema({}, { strict: false });
module.exports = mongoose.models.HealthGoal || mongoose.model('HealthGoal', stubSchema);
