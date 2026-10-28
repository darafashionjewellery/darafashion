import { publicSiteConfig } from '../config/site.js';
import { NewsletterSubscriber, ContactMessage, Job, JobApplication } from '../models/index.js';
import { ApiError } from '../utils/ApiError.js';

export function getConfig(_req, res) {
  res.json(publicSiteConfig());
}

export async function subscribe(req, res) {
  const { email, source } = req.valid.body;
  await NewsletterSubscriber.findOneAndUpdate(
    { email },
    { $set: { status: 'subscribed' }, $setOnInsert: { email, source: source || 'website' } },
    { upsert: true },
  );
  res.status(201).json({ message: 'Thank you for subscribing to DARA!' });
}

export async function submitContact(req, res) {
  await ContactMessage.create(req.valid.body);
  res.status(201).json({ message: 'Thank you for reaching out. Our team will get back to you soon.' });
}

const serializeJob = (j, full = false) => ({
  id: j._id.toString(),
  title: j.title,
  slug: j.slug,
  department: j.department,
  location: j.location,
  type: j.type,
  summary: j.summary,
  ...(full ? { description: j.description, responsibilities: j.responsibilities, requirements: j.requirements } : {}),
  createdAt: j.createdAt,
});

export async function listJobs(_req, res) {
  const jobs = await Job.find({ isOpen: true }).sort({ createdAt: -1 });
  res.json({ items: jobs.map((j) => serializeJob(j)) });
}

export async function getJob(req, res) {
  const job = await Job.findOne({ slug: req.valid.params.slug, isOpen: true });
  if (!job) throw ApiError.notFound('This position is no longer open');
  res.json({ job: serializeJob(job, true) });
}

export async function applyToJob(req, res) {
  const job = await Job.findOne({ slug: req.valid.params.slug, isOpen: true });
  if (!job) throw ApiError.notFound('This position is no longer open');
  try {
    await JobApplication.create({ ...req.valid.body, job: job._id });
  } catch (err) {
    if (err?.code === 11000) throw ApiError.conflict('You have already applied for this position.');
    throw err;
  }
  res.status(201).json({ message: 'Thank you for applying! Our team will review your application.' });
}
