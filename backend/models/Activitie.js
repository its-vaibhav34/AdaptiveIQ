import mongoose from 'mongoose';

const ActivitieSchema = new mongoose.Schema(
  {
    color: { type: String, trim: true },
    icon: { type: String, trim: true },
    text: { type: String, trim: true },
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
    collection: 'activities'
  }
);

// ============================================================
// INDEXES FOR PERFORMANCE
// ============================================================
ActivitieSchema.index({ createdAt: -1 });
ActivitieSchema.index({ updatedAt: -1 });
ActivitieSchema.index({ isActive: 1 });
ActivitieSchema.index({ isDeleted: 1, createdAt: -1 });

// ============================================================
// HOOKS
// ============================================================

ActivitieSchema.pre('save', function(next) {
  if (this.isModified()) {
    this.metadata.version = (this.metadata.version || 0) + 1;
  }
  next();
});

// ============================================================
// QUERY HELPERS
// ============================================================

ActivitieSchema.query.active = function() {
  return this.find({ isActive: true, isDeleted: false });
};

// ============================================================
// STATIC METHODS
// ============================================================

ActivitieSchema.statics.findAllActive = async function(options = {}) {
  return this.find({ isActive: true, isDeleted: false })
    .sort(options.sort || { createdAt: -1 })
    .limit(options.limit || 100)
    .skip(options.skip || 0);
};

ActivitieSchema.statics.softDelete = async function(id) {
  return this.findByIdAndUpdate(
    id,
    { isDeleted: true },
    { new: true }
  );
};

// ============================================================
// INSTANCE METHODS
// ============================================================

ActivitieSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.__v;
  return obj;
};

const Activitie = mongoose.model('Activitie', ActivitieSchema);

export default Activitie;
