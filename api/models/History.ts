import mongoose, { Schema, Document } from 'mongoose';
import type { Environment } from '../../shared/types.js';

interface IHistory extends Document {
  featureId: mongoose.Types.ObjectId;
  featureName: string;
  operation: 'create' | 'update' | 'delete';
  environment?: Environment;
  operator: string;
  changes: Record<string, { old: any; new: any }>;
  timestamp: Date;
}

const historySchema = new Schema<IHistory>({
  featureId: {
    type: Schema.Types.ObjectId,
    ref: 'Feature',
    required: true,
    index: true
  },
  featureName: { type: String, required: true },
  operation: {
    type: String,
    enum: ['create', 'update', 'delete'],
    required: true,
    index: true
  },
  environment: {
    type: String,
    enum: ['development', 'testing', 'production']
  },
  operator: { type: String, default: 'system' },
  changes: { type: Schema.Types.Mixed, default: {} },
  timestamp: { type: Date, default: Date.now, index: true }
});

historySchema.index({ featureId: 1, timestamp: -1 });
historySchema.index({ timestamp: -1 });

export const History = mongoose.model<IHistory>('History', historySchema);
