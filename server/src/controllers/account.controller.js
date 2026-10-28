import { ApiError } from '../utils/ApiError.js';

export async function updateProfile(req, res) {
  const { name, phone } = req.valid.body;
  req.user.name = name;
  if (phone !== undefined) req.user.phone = phone;
  await req.user.save();
  res.json({ user: req.user.toPublic() });
}

function applyDefault(user, address) {
  if (address.isDefault || user.addresses.length === 1) {
    user.addresses.forEach((a) => { a.isDefault = a._id.equals(address._id); });
  }
}

export async function addAddress(req, res) {
  if (req.user.addresses.length >= 10) throw ApiError.badRequest('You can save up to 10 addresses.');
  req.user.addresses.push(req.valid.body);
  const address = req.user.addresses[req.user.addresses.length - 1];
  applyDefault(req.user, address);
  await req.user.save();
  res.status(201).json({ user: req.user.toPublic(), addressId: address._id.toString() });
}

export async function updateAddress(req, res) {
  const address = req.user.addresses.id(req.valid.params.addressId);
  if (!address) throw ApiError.notFound('Address not found');
  address.set(req.valid.body);
  applyDefault(req.user, address);
  await req.user.save();
  res.json({ user: req.user.toPublic() });
}

export async function deleteAddress(req, res) {
  const address = req.user.addresses.id(req.valid.params.addressId);
  if (!address) throw ApiError.notFound('Address not found');
  const wasDefault = address.isDefault;
  address.deleteOne();
  if (wasDefault && req.user.addresses.length) req.user.addresses[0].isDefault = true;
  await req.user.save();
  res.json({ user: req.user.toPublic() });
}
