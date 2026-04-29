import mongoose from 'mongoose';

const QuestionSchema = new mongoose.Schema(
  {
    text: { type: String, required: true, trim: true },
    options: {
      type: [String],
      validate: {
        validator: (v) => v.length === 4,
        message: 'Each question must have exactly 4 options',
      },
    },
    correctAnswer: { type: Number, required: true, min: 0, max: 3 },
    timeLimit: { type: Number, default: 15, min: 5, max: 120 },
  },
  { _id: false }
);

const QuizSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    category: { type: String, default: 'General', trim: true, maxlength: 100 },
    difficulty: {
      type: String,
      enum: ['Easy', 'Medium', 'Hard'],
      default: 'Medium',
    },
    questions: {
      type: [QuestionSchema],
      validate: {
        validator: (v) => v.length >= 1,
        message: 'Quiz must have at least one question',
      },
    },
    createdBy: {
      type: String,
      default: 'system',
    },
    isPublished: {
      type: Boolean,
      default: true,
    },
    playCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    collection: 'quizzes',
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

QuizSchema.virtual('questionCount').get(function () {
  return this.questions?.length || 0;
});

export default mongoose.model('Quiz', QuizSchema);
