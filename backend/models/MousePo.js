import mongoose from 'mongoose';

const MousePoSchema = new mongoose.Schema(
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
    collection: 'mousepos'
  }
);

// ============================================================
// INDEXES FOR PERFORMANCE
// ============================================================
MousePoSchema.index({ createdAt: -1 });
MousePoSchema.index({ updatedAt: -1 });
MousePoSchema.index({ isActive: 1 });
MousePoSchema.index({ isDeleted: 1, createdAt: -1 });

// ============================================================
// HOOKS
// ============================================================

MousePoSchema.pre('save', function(next) {
  if (this.isModified()) {
    this.metadata.version = (this.metadata.version || 0) + 1;
  }
  next();
});

// ============================================================
// QUERY HELPERS
// ============================================================

MousePoSchema.query.active = function() {
  return this.find({ isActive: true, isDeleted: false });
};

// ============================================================
// STATIC METHODS
// ============================================================

MousePoSchema.statics.findAllActive = async function(options = {}) {
  return this.find({ isActive: true, isDeleted: false })
    .sort(options.sort || { createdAt: -1 })
    .limit(options.limit || 100)
    .skip(options.skip || 0);
};

MousePoSchema.statics.softDelete = async function(id) {
  return this.findByIdAndUpdate(
    id,
    { isDeleted: true },
    { new: true }
  );
};

// ============================================================
// INSTANCE METHODS
// ============================================================

MousePoSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.__v;
  return obj;
};

const MousePo = mongoose.model('MousePo', MousePoSchema);

export default MousePo;
