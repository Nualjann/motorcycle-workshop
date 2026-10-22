const express = require('express');
const router = express.Router();

const partCtrl = require('../controllers/partController');
const jobCtrl = require('../controllers/jobController');
const authCtrl = require('../controllers/authController');
const inventoryCtrl = require('../controllers/inventoryController');
const transactionCtrl = require('../controllers/transactionController');
const backupCtrl = require('../controllers/backupController');
const paymentCtrl = require('../controllers/paymentController');
const settingsCtrl = require('../controllers/settingsController');
const { authenticateToken, requireRole } = require('../middleware/authMiddleware');

// Authentication
router.post('/auth/login', authCtrl.login);
router.get('/auth/me', authenticateToken, authCtrl.getMe);
router.post('/auth/register', authenticateToken, requireRole('admin'), authCtrl.register);
router.get('/auth/users', authenticateToken, requireRole('admin'), authCtrl.getAllUsers);
router.put('/auth/users/:id', authenticateToken, requireRole('admin'), authCtrl.updateUser);
router.delete('/auth/users/:id', authenticateToken, requireRole('admin'), authCtrl.deleteUser);

// Categories are owned by inventoryController.
router.get('/categories', authenticateToken, inventoryCtrl.getCategories);
router.post('/categories', authenticateToken, requireRole('admin'), inventoryCtrl.createCategory);
router.delete('/categories/:name', authenticateToken, requireRole('admin'), inventoryCtrl.deleteCategory);

// Parts are owned by partController.
router.get('/parts', authenticateToken, partCtrl.getParts);
router.post('/parts', authenticateToken, requireRole('admin'), partCtrl.createPart);
router.put('/parts/:id', authenticateToken, requireRole('admin'), partCtrl.updatePart);
router.delete('/parts/:id', authenticateToken, requireRole('admin'), partCtrl.deletePart);
router.post('/parts/import', authenticateToken, requireRole('admin'), partCtrl.importParts);

router.get('/admin/backup', authenticateToken, requireRole('admin'), backupCtrl.downloadBackup);
router.post('/admin/restore', authenticateToken, requireRole('admin'), backupCtrl.restoreBackup);
router.post('/payments/verify-slip', authenticateToken, paymentCtrl.verifySlip);
router.get('/settings', authenticateToken, settingsCtrl.getSettings);
router.put('/settings', authenticateToken, requireRole('admin'), settingsCtrl.updateSettings);

// Jobs and POS are owned by transactionController.
router.get('/public/jobs/track', transactionCtrl.trackJobs);
router.get('/jobs', authenticateToken, transactionCtrl.getJobs);
router.post('/jobs', authenticateToken, transactionCtrl.createJob);
router.put('/jobs/:id/status', authenticateToken, transactionCtrl.updateJobStatus);
router.put('/jobs/:id/issue', authenticateToken, transactionCtrl.updateJobIssue);
router.put('/jobs/:id/close', authenticateToken, transactionCtrl.closeJob);
router.put('/jobs/:id/archive', authenticateToken, transactionCtrl.archiveJob);
router.post('/jobs/use-part', authenticateToken, jobCtrl.usePartInJob);
router.post('/jobs/remove-part', authenticateToken, jobCtrl.removePartFromJob);

router.get('/pos', authenticateToken, transactionCtrl.getPosSales);
router.post('/pos', authenticateToken, transactionCtrl.createPosSale);

// Staff list used by the frontend.
router.get('/users', authenticateToken, transactionCtrl.getUsers);

module.exports = router;
