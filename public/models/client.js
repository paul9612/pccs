const mongoose = require('mongoose');

const clientSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: String,
    address: String,
    createdAt: { type: Date, default: Date.now }
});
module.exports = mongoose.model('Client', clientSchema);