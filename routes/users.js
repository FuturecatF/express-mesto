const router = require('express').Router();
const {
  getUsers,
  getUserById,
  updateProfile,
  updateAvatar,
  getCurrentUser,
} = require('../controllers/users');

router.get('/users/me', getCurrentUser);
router.get('/', getUsers);
router.get('/:userId', getUserById);
router.patch('/me', updateProfile);
router.patch('/me', updateProfile);
router.patch('/me/avatar', updateAvatar);

module.exports = router;
