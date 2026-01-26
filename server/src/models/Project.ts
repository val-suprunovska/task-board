import mongoose, { Document, Schema } from 'mongoose';
import { IProject } from '../types';

export interface IProjectDocument extends IProject, Document {}

const projectSchema = new Schema<IProjectDocument>({
  name: {
    type: String,
    required: [true, 'Project name is required'],
    trim: true,
    minlength: [1, 'Project name must be at least 1 character long'],
    maxlength: [100, 'Project name cannot exceed 100 characters']
  },
  description: {
    type: String,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Автоматическое обновление updatedAt
projectSchema.pre('save', function() {
  const doc = this as IProjectDocument;
  doc.updatedAt = new Date();
});

projectSchema.pre('findOneAndUpdate', function() {
  this.set({ updatedAt: new Date() });
});

export const Project = mongoose.model<IProjectDocument>('Project', projectSchema);