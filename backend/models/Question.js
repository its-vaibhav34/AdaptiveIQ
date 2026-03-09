import mongoose from 'mongoose';

const QuestionSchema = new mongoose.Schema(
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
    collection: 'questions'
  }
);

// ============================================================
// INDEXES FOR PERFORMANCE
// ============================================================
QuestionSchema.index({ createdAt: -1 });
QuestionSchema.index({ updatedAt: -1 });
QuestionSchema.index({ isActive: 1 });
QuestionSchema.index({ isDeleted: 1, createdAt: -1 });

// ============================================================
// HOOKS
// ============================================================

QuestionSchema.pre('save', function(next) {
  if (this.isModified()) {
    this.metadata.version = (this.metadata.version || 0) + 1;
  }
  next();
});

// ============================================================
// QUERY HELPERS
// ============================================================

QuestionSchema.query.active = function() {
  return this.find({ isActive: true, isDeleted: false });
};

// ============================================================
// STATIC METHODS
// ============================================================

QuestionSchema.statics.findAllActive = async function(options = {}) {
  return this.find({ isActive: true, isDeleted: false })
    .sort(options.sort || { createdAt: -1 })
    .limit(options.limit || 100)
    .skip(options.skip || 0);
};

QuestionSchema.statics.softDelete = async function(id) {
  return this.findByIdAndUpdate(
    id,
    { isDeleted: true },
    { new: true }
  );
};

// ============================================================
// INSTANCE METHODS
// ============================================================

QuestionSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.__v;
  return obj;
};

const Question = mongoose.model('Question', QuestionSchema);

export default Question;
