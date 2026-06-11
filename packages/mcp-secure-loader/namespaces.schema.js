const mongoose = require('mongoose');

const NamespaceSchema = new mongoose.Schema({
  namespace: {
    type: String,
    required: true,
    unique: true, // Prevents anyone else from squatting on your domain
    trim: true,
    match: /^io\.github\.[a-zA-Z0-9-_]+$/ // Validates domain syntax
  },
  ownerId: {
    type: String,
    required: true // Numeric GitHub Profile ID from OAuth
  },
  publicKey: {
    type: String,
    required: true // The Ed25519 Public Key block string
  },
  status: {
    type: String,
    enum: ['ACTIVE', 'SUSPENDED', 'REVOKED'],
    default: 'ACTIVE' // Instant administrative kill switch if a key leaks
  }
}, {
  timestamps: true // Automatically tracks createdAt & updatedAt
});

// Explicit single-field index for namespace lookup performance
NamespaceSchema.index({ namespace: 1 });

module.exports = mongoose.model('namespace_collection', NamespaceSchema);