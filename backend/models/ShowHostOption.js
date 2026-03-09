import mongoose from 'mongoose';

const ShowHostOptionSchema = new mongoose.Schema(
  {
    // Fields defined,
    // Metadata
    isActive: {
      type: Boolean,
      default: true,
      index: true
    },
    isDeleted: {
      type: Boolean,
      default: false,
      index: true
    },
    metadata: {
      createdBy: mongoose.Schema.Types.ObjectId,
      updatedBy: mongoose.Schema.Types.ObjectId,
      version: { type: Number, default: 1 },
      tags: [String]
    }
  },
  {
    timestamps: true,
    collection: 'showhostoptions'
  }
);

// ============================================================
// INDEXES FOR PERFORMANCE
// ============================================================
ShowHostOptionSchema.index({ createdAt: -1 });
ShowHostOptionSchema.index({ updatedAt: -1 });
ShowHostOptionSchema.index({ isActive: 1 });
ShowHostOptionSchema.index({ isDeleted: 1, createdAt: -1 });

// ============================================================
// HOOKS
// ============================================================

ShowHostOptionSchema.pre('save', function(next) {
  if (this.isModified()) {
    this.metadata.version = (this.metadata.version || 0) + 1;
  }
  next();
});

// ============================================================
// QUERY HELPERS
// ============================================================

ShowHostOptionSchema.query.active = function() {
  return this.find({ isActive: true, isDeleted: false });
};

// ============================================================
// STATIC METHODS
// ============================================================

ShowHostOptionSchema.statics.findAllActive = async function(options = {}) {
  return this.find({ isActive: true, isDeleted: false })
    .sort(options.sort || { createdAt: -1 })
    .limit(options.limit || 100)
    .skip(options.skip || 0);
};

ShowHostOptionSchema.statics.softDelete = async function(id) {
  return this.findByIdAndUpdate(
    id,
    { isDeleted: true },
    { new: true }
  );
};

// ============================================================
// INSTANCE METHODS
// ============================================================

ShowHostOptionSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.__v;
  return obj;
};

const ShowHostOption = mongoose.model('ShowHostOption', ShowHostOptionSchema);

export default ShowHostOption;
