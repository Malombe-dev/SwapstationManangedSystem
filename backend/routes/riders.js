const express = require('express');
const router = express.Router();
const {
  getAllRiders,
  createRider,
  getRiderById,
  updateRider,
  deleteRider
} = require('../controllers/riderController');

router.route('/')
  .get(getAllRiders)
  .post(createRider);

router.route('/:id')
  .get(getRiderById)
  .put(updateRider)
  .delete(deleteRider);

module.exports = router;