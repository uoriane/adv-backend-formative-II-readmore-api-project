const express = require('express');
const {
  createAuthor,
  getAuthors,
  getAuthor,
  updateAuthor,
  deleteAuthor,
  getAuthorBooks,
  getAuthorStats,
} = require('../controllers/authorController');

const router = express.Router();

router.post('/', createAuthor);
router.get('/', getAuthors);
router.get('/:id/books', getAuthorBooks);
router.get('/:id/stats', getAuthorStats);
router.get('/:id', getAuthor);
router.put('/:id', updateAuthor);
router.delete('/:id', deleteAuthor);

module.exports = router;
