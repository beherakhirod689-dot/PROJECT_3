// Mongoose model for a collaborative document
// Each document has an id, text content, and timestamps.

const mongoose = require('mongoose');

const DocumentSchema = new mongoose.Schema(
  {
    // String _id so that we can use URL-safe custom IDs if we want
    _id: {
      type: String,
      required: true,
    },
    content: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true, // adds createdAt and updatedAt automatically
    _id: false, // since we define _id ourselves as a string
  }
);

module.exports = mongoose.model('Document', DocumentSchema);

