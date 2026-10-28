import { Router } from 'express';
import { validate } from '../middleware/validate.js';
import * as v from '../validators/index.js';
import * as admin from '../controllers/admin.controller.js';
import { uploadImage, uploadSingle } from '../controllers/upload.controller.js';

/** Admin-only APIs. Mounted behind requireAuth + requireAdmin (role is granted via ADMIN_EMAILS). */
const router = Router();
const id = validate({ params: v.idParam });

router.get('/stats', admin.adminStats);
router.post('/uploads', uploadSingle, uploadImage);
router.get('/customers', admin.adminListCustomers);

router.get('/products', admin.adminListProducts);
router.get('/products/:id', id, admin.adminGetProduct);
router.post('/products', validate({ body: v.adminProductSchema }), admin.adminCreateProduct);
router.patch('/products/:id', validate({ params: v.idParam, body: v.adminProductUpdateSchema }), admin.adminUpdateProduct);
router.delete('/products/:id', id, admin.adminDeleteProduct);
router.patch('/products/:id/inventory', validate({ params: v.idParam, body: v.inventorySchema }), admin.adminUpdateInventory);

router.get('/categories', admin.categoryAdmin.list);
router.post('/categories', admin.categoryAdmin.create);
router.patch('/categories/:id', id, admin.categoryAdmin.update);
router.delete('/categories/:id', id, admin.categoryAdmin.remove);

router.get('/collections', admin.collectionAdmin.list);
router.post('/collections', admin.collectionAdmin.create);
router.patch('/collections/:id', id, admin.collectionAdmin.update);
router.delete('/collections/:id', id, admin.collectionAdmin.remove);

router.get('/orders', admin.adminListOrders);
router.get('/orders/:id', id, admin.adminGetOrder);
router.patch('/orders/:id/status', validate({ params: v.idParam, body: v.adminOrderStatusSchema }), admin.adminUpdateOrderStatus);

router.get('/reviews', admin.adminListReviews);
router.patch('/reviews/:id', validate({ params: v.idParam, body: v.reviewModerationSchema }), admin.adminModerateReview);

router.get('/jobs', admin.jobAdmin.list);
router.post('/jobs', admin.jobAdmin.create);
router.patch('/jobs/:id', id, admin.jobAdmin.update);
router.get('/job-applications', admin.adminListApplications);
router.patch('/job-applications/:id', id, admin.adminUpdateApplication);

router.get('/newsletter', admin.adminListSubscribers);
router.get('/contact-messages', admin.adminListMessages);
router.patch('/contact-messages/:id', id, admin.adminUpdateMessage);

export default router;
