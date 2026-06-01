import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema(
  {
    matchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Match',
      required: true,
      index: true
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    messageType: {
      type: String,
      enum: ['text', 'image'],
      default: 'text'
    },
    content: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: ''
    },
    imageUrl: {
      type: String,
      trim: true
    },
    read: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

messageSchema.pre('validate', function (next) {
  if (this.messageType === 'image') {
    if (!this.imageUrl) {
      return next(new Error('Image URL is required for image messages'));
    }
    return next();
  }
  if (!this.content || !String(this.content).trim()) {
    return next(new Error('Message content is required'));
  }
  next();
});

messageSchema.index({ matchId: 1, createdAt: 1 });
messageSchema.index({ receiver: 1, read: 1 });

const Message = mongoose.model('Message', messageSchema);

export default Message;
