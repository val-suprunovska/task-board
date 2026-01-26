import mongoose, { Document, Schema } from 'mongoose';
import { ITask } from '../types';

export interface ITaskDocument extends ITask, Document {}

const taskSchema = new Schema<ITaskDocument>({
  title: {
    type: String,
    required: [true, 'Task title is required'],
    trim: true,
    minlength: [1, 'Task title must be at least 1 character long'],
    maxlength: [200, 'Task title cannot exceed 200 characters'],
  },
  description: {
    type: String,
    maxlength: [1000, 'Description cannot exceed 1000 characters'],
  },
  status: {
    type: String,
    enum: {
      values: ['todo', 'inProgress', 'done'],
      message: 'Status must be either todo, inProgress, or done',
    },
    default: 'todo',
  },
  projectId: {
    type: Schema.Types.ObjectId,
    ref: 'Project',
    required: [true, 'Project ID is required'],
    index: true,
  },
  position: {
    type: Number,
    default: 0,
    min: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Индексы для оптимизации запросов
taskSchema.index({ projectId: 1, status: 1, position: 1 });
taskSchema.index({ projectId: 1, position: 1 });

// Автоматическое обновление updatedAt
taskSchema.pre('save', function () {
  const doc = this as ITaskDocument;
  doc.updatedAt = new Date();
});

taskSchema.pre('findOneAndUpdate', function () {
  this.set({ updatedAt: new Date() });
});

export const Task = mongoose.model<ITaskDocument>('Task', taskSchema);
