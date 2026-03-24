// REST routes for creating, reading, and updating documents.
// These endpoints are used by the React frontend to load and save content.

const express = require('express');
const router = express.Router();

const Document = require('../models/Document');

// Helper: find or create a document with the given ID
async function findOrCreateDocument(id) {
  if (!id) return null;

  const existing = await Document.findById(id).exec();
  if (existing) return existing;

  // Create a new document with empty content
  return await Document.create({ _id: id, content: '' });
}

// GET /api/documents/:id - fetch a document by id, creating it if it doesn't exist
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const document = await findOrCreateDocument(id);
    if (!document) {
      return res.status(400).json({ message: 'Invalid document id' });
    }
    res.json(document);
  } catch (err) {
    console.error('Error fetching document', err);
    res.status(500).json({ message: 'Server error fetching document' });
  }
});

// PUT /api/documents/:id - update the document content
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { content } = req.body;

  try {
    const document = await Document.findByIdAndUpdate(
      id,
      { content },
      { new: true, upsert: true } // upsert ensures doc is created if missing
    ).exec();

    res.json({
      message: 'Document saved',
      document,
    });
  } catch (err) {
    console.error('Error saving document', err);
    res.status(500).json({ message: 'Server error saving document' });
  }
});

module.exports = router;

