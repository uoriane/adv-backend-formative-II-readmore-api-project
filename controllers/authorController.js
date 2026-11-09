const mongoose = require('mongoose');
const Author = require('../models/Author');
const Book = require('../models/Book');

function validateId(id) {
  return mongoose.isValidObjectId(id);
}

async function createAuthor(req, res, next) {
  try {
    const author = await Author.create(req.body);
    res.status(201).json(author);
  } catch (error) {
    next(error);
  }
}

async function getAuthors(req, res, next) {
  try {
    res.json(await Author.find().sort({ name: 1 }));
  } catch (error) {
    next(error);
  }
}

async function getAuthor(req, res, next) {
  try {
    if (!validateId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid author id' });
    }

    const author = await Author.findById(req.params.id);
    if (!author) {
      return res.status(404).json({ message: 'Author not found' });
    }

    return res.json(author);
  } catch (error) {
    return next(error);
  }
}

async function updateAuthor(req, res, next) {
  try {
    if (!validateId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid author id' });
    }

    const author = await Author.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!author) {
      return res.status(404).json({ message: 'Author not found' });
    }

    return res.json(author);
  } catch (error) {
    return next(error);
  }
}

async function deleteAuthor(req, res, next) {
  try {
    if (!validateId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid author id' });
    }

    const author = await Author.findById(req.params.id);
    if (!author) {
      return res.status(404).json({ message: 'Author not found' });
    }

    const bookCount = await Book.countDocuments({ author: author._id });
    if (bookCount > 0) {
      return res.status(409).json({
        message: 'Cannot delete an author who still has books',
        bookCount,
      });
    }

    await author.deleteOne();
    return res.json({ message: 'Author deleted successfully' });
  } catch (error) {
    return next(error);
  }
}

async function getAuthorBooks(req, res, next) {
  try {
    if (!validateId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid author id' });
    }

    const author = await Author.findById(req.params.id);
    if (!author) {
      return res.status(404).json({ message: 'Author not found' });
    }

    const books = await Book.find({ author: author._id })
      .populate('author')
      .sort({ title: 1 });
    return res.json(books);
  } catch (error) {
    return next(error);
  }
}

async function getAuthorStats(req, res, next) {
  try {
    if (!validateId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid author id' });
    }

    const author = await Author.findById(req.params.id);
    if (!author) {
      return res.status(404).json({ message: 'Author not found' });
    }

    const books = await Book.find({ author: author._id }).sort({ price: 1 });
    const averagePrice =
      books.length === 0
        ? null
        : Number(
            (books.reduce((total, book) => total + book.price, 0) / books.length).toFixed(2)
          );

    return res.json({
      author: author.name,
      bookCount: books.length,
      averagePrice,
      cheapestBook: books[0]?.title || null,
      mostExpensiveBook: books[books.length - 1]?.title || null,
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  createAuthor,
  getAuthors,
  getAuthor,
  updateAuthor,
  deleteAuthor,
  getAuthorBooks,
  getAuthorStats,
};
