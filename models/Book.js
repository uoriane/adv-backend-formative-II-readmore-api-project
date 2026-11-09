const mongoose = require('mongoose');

const currentYear = () => new Date().getFullYear();

const bookSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Book title is required'],
      trim: true,
    },
    genre: {
      type: String,
      required: [true, 'Book genre is required'],
      trim: true,
    },
    price: {
      type: Number,
      required: [true, 'Book price is required'],
      validate: {
        validator: (value) => value > 0,
        message: 'Price must be greater than zero',
      },
    },
    publishedYear: {
      type: Number,
      required: [true, 'Published year is required'],
      validate: {
        validator: (value) => value >= 1450 && value <= currentYear(),
        message: `Published year must be between 1450 and ${currentYear()}`,
      },
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Author',
      required: [true, 'Author is required'],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Book', bookSchema);
