import mongoose from 'mongoose';

const CategorySchema = new mongoose.Schema(
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
    collection: 'category'
  }
);

// ============================================================
// INDEXES FOR PERFORMANCE
// ============================================================
CategorySchema.index({ createdAt: -1 });
CategorySchema.index({ updatedAt: -1 });
CategorySchema.index({ isActive: 1 });
CategorySchema.index({ isDeleted: 1, createdAt: -1 });

// ============================================================
// HOOKS
// ============================================================

CategorySchema.pre('save', function(next) {
  if (this.isModified()) {
    this.metadata.version = (this.metadata.version || 0) + 1;
  }
  next();
});

// ============================================================
// QUERY HELPERS
// ============================================================

CategorySchema.query.active = function() {
  return this.find({ isActive: true, isDeleted: false });
};

// ============================================================
// STATIC METHODS
// ============================================================

CategorySchema.statics.findAllActive = async function(options = {}) {
  return this.find({ isActive: true, isDeleted: false })
    .sort(options.sort || { createdAt: -1 })
    .limit(options.limit || 100)
    .skip(options.skip || 0);
};

CategorySchema.statics.softDelete = async function(id) {
  return this.findByIdAndUpdate(
    id,
    { isDeleted: true },
    { new: true }
  );
};

// ============================================================
// INSTANCE METHODS
// ============================================================

CategorySchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.__v;
  return obj;
};

const Category = mongoose.model('Category', CategorySchema);

export default Category;
