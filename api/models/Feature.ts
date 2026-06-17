import mongoose, { Schema, Document } from 'mongoose';
import type { Environment, EnvironmentConfig } from '../../shared/types.js';

interface IEnvironmentConfig extends EnvironmentConfig {}

interface IFeature extends Document {
  name: string;
  key: string;
  description: string;
  environments: Record<Environment, IEnvironmentConfig>;
  createdAt: Date;
  updatedAt: Date;
}

const environmentConfigSchema = new Schema<IEnvironmentConfig>({
  enabled: { type: Boolean, required: true },
  rolloutPercentage: { type: Number, required: true, min: 0, max: 100 },
  whitelist: { type: [String], default: [] }
}, { _id: false });

const featureSchema = new Schema<IFeature>({
  name: { type: String, required: true, trim: true },
  key: { type: String, required: true, unique: true, trim: true },
  description: { type: String, default: '' },
  environments: {
    development: { type: environmentConfigSchema, required: true },
    testing: { type: environmentConfigSchema, required: true },
    production: { type: environmentConfigSchema, required: true }
  }
}, { timestamps: true });

featureSchema.index({ key: 1 }, { unique: true });

export const Feature = mongoose.model<IFeature>('Feature', featureSchema);
