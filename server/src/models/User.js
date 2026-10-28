import mongoose from 'mongoose';

const addressSchema = new mongoose.Schema(
  {
    label: { type: String, trim: true, maxlength: 40, default: 'Home' },
    fullName: { type: String, required: true, trim: true, maxlength: 100 },
    phone: { type: String, required: true, trim: true, match: [/^[6-9]\d{9}$/, 'Enter a valid 10-digit mobile number'] },
    line1: { type: String, required: true, trim: true, maxlength: 200 },
    line2: { type: String, trim: true, maxlength: 200, default: '' },
    landmark: { type: String, trim: true, maxlength: 120, default: '' },
    city: { type: String, required: true, trim: true, maxlength: 80 },
    state: { type: String, required: true, trim: true, maxlength: 80 },
    pincode: { type: String, required: true, trim: true, match: [/^[1-9]\d{5}$/, 'Enter a valid 6-digit pincode'] },
    country: { type: String, trim: true, default: 'India' },
    isDefault: { type: Boolean, default: false },
  },
  { timestamps: true },
);

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    name: { type: String, trim: true, maxlength: 100, default: '' },
    phone: { type: String, trim: true, default: '' },
    // scrypt hash (see services/password.service.js). Never returned by queries unless selected.
    passwordHash: { type: String, select: false },
    role: { type: String, enum: ['customer', 'admin'], default: 'customer' },
    addresses: { type: [addressSchema], default: [] },
    lastLoginAt: Date,
  },
  { timestamps: true },
);

userSchema.methods.toPublic = function toPublic() {
  return {
    id: this._id.toString(),
    email: this.email,
    name: this.name,
    phone: this.phone,
    role: this.role,
    addresses: this.addresses.map((a) => ({ id: a._id.toString(), ...a.toObject(), _id: undefined })),
    profileComplete: Boolean(this.name),
    createdAt: this.createdAt,
  };
};

export const User = mongoose.model('User', userSchema);
export { addressSchema };
