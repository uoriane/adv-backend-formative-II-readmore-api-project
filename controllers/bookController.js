const mongoose = require('mongoose');
const Author = require('../models/Author');
const Book = require('../models/Book');

function validateId(id) {
  return mongoose.isValidObjectId(id);
}

function parseNumber(value, name) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    const error = new Error(`${name} must be a valid number`);
    error.status = 400;
    throw error;
  }
  return parsed;
}

async function ensureAuthorExists(authorId) {
  if (!validateId(authorId)) {
    const error = new Error('Author id is invalid');
    error.status = 400;
    throw error;
  }

  const author = await Author.findById(authorId);
  if (!author) {
    const error = new Error('Author does not exist');
    error.status = 400;
    throw error;
  }
}

async function ensureUniqueTitle(title, authorId, excludedBookId) {
  if (typeof title !== 'string') {
    return;
  }

  const query = {
    author: authorId,
    title: { $regex: `^${title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' },
  };
  if (excludedBookId) {
    query._id = { $ne: excludedBookId };
  }

  if (await Book.exists(query)) {
    const error = new Error('An author cannot have duplicate book titles');
    error.status = 409;
    throw error;
  }
}

function buildBookFilter(query) {
  const filter = {};

  if (query.genre !== undefined) {
    filter.genre = query.genre;
  }
  if (query.author !== undefined) {
    if (!validateId(query.author)) {
      const error = new Error('Author id is invalid');
      error.status = 400;
      throw error;
    }
    filter.author = query.author;
  }
  if (query.search !== undefined) {
    const escapedSearch = query.search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    filter.title = { $regex: escapedSearch, $options: 'i' };
  }
  if (query.minPrice !== undefined || query.maxPrice !== undefined) {
    filter.price = {};
    if (query.minPrice !== undefined) {
      filter.price.$gte = parseNumber(query.minPrice, 'minPrice');
    }
    if (query.maxPrice !== undefined) {
      filter.price.$lte = parseNumber(query.maxPrice, 'maxPrice');
    }
    if (
      filter.price.$gte !== undefined &&
      filter.price.$lte !== undefined &&
      filter.price.$gte > filter.price.$lte
    ) {
      const error = new Error('minPrice cannot be greater than maxPrice');
      error.status = 400;
      throw error;
    }
  }

  return filter;
}

async function createBook(req, res, next) {
  try {
    await ensureAuthorExists(req.body.author);
    await ensureUniqueTitle(req.body.title, req.body.author);
    const book = await Book.create(req.body);
    return res.status(201).json(await book.populate('author'));
  } catch (error) {
    return next(error);
  }
}

async function getBooks(req, res, next) {
  try {
    const filter = buildBookFilter(req.query);
    const page = req.query.page === undefined ? 1 : parseNumber(req.query.page, 'page');
    const limit = req.query.limit === undefined ? 10 : parseNumber(req.query.limit, 'limit');

    if (!Number.isInteger(page) || page < 1 || !Number.isInteger(limit) || limit < 1) {
      const error = new Error('page and limit must be positive integers');
      error.status = 400;
      throw error;
    }

    const sortField = req.query.sort || 'title';
    const allowedSortFields = ['price', 'title', 'publishedYear'];
    if (!allowedSortFields.includes(sortField)) {
      const error = new Error('sort must be price, title, or publishedYear');
      error.status = 400;
      throw error;
    }

    const order = req.query.order || 'asc';
    if (!['asc', 'desc'].includes(order)) {
      const error = new Error('order must be asc or desc');
      error.status = 400;
      throw error;
    }

    const [results, total] = await Promise.all([
      Book.find(filter)
        .populate('author')
        .sort({ [sortField]: order === 'asc' ? 1 : -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Book.countDocuments(filter),
    ]);

    return res.json({ page, limit, total, results });
  } catch (error) {
    return next(error);
  }
}

async function getBook(req, res, next) {
  try {
    if (!validateId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid book id' });
    }

    const book = await Book.findById(req.params.id).populate('author');
    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }

    return res.json(book);
  } catch (error) {
    return next(error);
  }
}

async function updateBook(req, res, next) {
  try {
    if (!validateId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid book id' });
    }

    const currentBook = await Book.findById(req.params.id);
    if (!currentBook) {
      return res.status(404).json({ message: 'Book not found' });
    }

    const authorId = req.body.author || currentBook.author;
    await ensureAuthorExists(authorId);
    await ensureUniqueTitle(req.body.title || currentBook.title, authorId, currentBook._id);

    const book = await Book.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).populate('author');
    return res.json(book);
  } catch (error) {
    return next(error);
  }
}

async function deleteBook(req, res, next) {
  try {
    if (!validateId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid book id' });
    }

    const book = await Book.findByIdAndDelete(req.params.id);
    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }

    return res.json({ message: 'Book deleted successfully' });
  } catch (error) {
    return next(error);
  }
}

module.exports = { createBook, getBooks, getBook, updateBook, deleteBook };
