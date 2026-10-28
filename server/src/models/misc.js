import mongoose from 'mongoose';

/** Monotonic counters (e.g. order numbers). */
const counterSchema = new mongoose.Schema({ _id: String, seq: { type: Number, default: 0 } });
export const Counter = mongoose.model('Counter', counterSchema);

export async function nextSequence(name) {
  const doc = await Counter.findOneAndUpdate({ _id: name }, { $inc: { seq: 1 } }, { upsert: true, returnDocument: 'after' });
  return doc.seq;
}

const reviewSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    displayName: { type: String, required: true, trim: true, maxlength: 60 },
    rating: { type: Number, required: true, min: 1, max: 5 },
    title: { type: String, trim: true, maxlength: 120, default: '' },
    body: { type: String, required: true, trim: true, maxlength: 2000 },
    verifiedPurchase: { type: Boolean, default: false },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  },
  { timestamps: true },
);
reviewSchema.index({ product: 1, user: 1 }, { unique: true });
reviewSchema.index({ status: 1, rating: -1, createdAt: -1 });
export const Review = mongoose.model('Review', reviewSchema);

const newsletterSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    source: { type: String, default: 'website' },
    status: { type: String, enum: ['subscribed', 'unsubscribed'], default: 'subscribed' },
  },
  { timestamps: true },
);
export const NewsletterSubscriber = mongoose.model('NewsletterSubscriber', newsletterSchema);

const contactMessageSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    email: { type: String, required: true, lowercase: true, trim: true },
    phone: { type: String, trim: true, default: '' },
    subject: { type: String, trim: true, maxlength: 150, default: '' },
    message: { type: String, required: true, trim: true, maxlength: 3000 },
    status: { type: String, enum: ['new', 'read', 'resolved'], default: 'new' },
  },
  { timestamps: true },
);
export const ContactMessage = mongoose.model('ContactMessage', contactMessageSchema);

const jobSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    department: { type: String, trim: true, default: '' },
    location: { type: String, trim: true, default: '' },
    type: { type: String, trim: true, default: 'Full-time' },
    summary: { type: String, trim: true, default: '' },
    description: { type: String, trim: true, default: '' },
    responsibilities: { type: [String], default: [] },
    requirements: { type: [String], default: [] },
    isOpen: { type: Boolean, default: true },
  },
  { timestamps: true },
);
export const Job = mongoose.model('Job', jobSchema);

const jobApplicationSchema = new mongoose.Schema(
  {
    job: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true },
    name: { type: String, required: true, trim: true, maxlength: 100 },
    email: { type: String, required: true, lowercase: true, trim: true },
    phone: { type: String, required: true, trim: true },
    resumeUrl: { type: String, trim: true, default: '' },
    coverLetter: { type: String, trim: true, maxlength: 3000, default: '' },
    status: { type: String, enum: ['new', 'reviewing', 'shortlisted', 'rejected', 'hired'], default: 'new' },
  },
  { timestamps: true },
);
jobApplicationSchema.index({ job: 1, email: 1 }, { unique: true });
export const JobApplication = mongoose.model('JobApplication', jobApplicationSchema);
