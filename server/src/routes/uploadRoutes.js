const { Router } = require('express');
const { authenticate, authorize } = require('../middleware/auth');
const { signUpload } = require('../controllers/uploadController');

const router = Router();

// Only ADMIN can get a signed upload URL
router.post('/sign', authenticate, authorize('ADMIN'), signUpload);

module.exports = router;
