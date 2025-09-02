const express = require('express');
const fileHandler = require('../utils/fileHandler');

const router = express.Router();

// Get all books with optional filtering and search
router.get('/', async (req, res) => {
  try {
    const { search, genre, minPrice, maxPrice, sortBy = 'title' } = req.query;
    let books = await fileHandler.readFile('books.json');

    // Apply search filter
    if (search) {
      const searchTerm = search.toLowerCase();
      books = books.filter(book =>
        book.title.toLowerCase().includes(searchTerm) ||
        book.author.toLowerCase().includes(searchTerm) ||
        book.genre.toLowerCase().includes(searchTerm)
      );
    }

    // Apply genre filter
    if (genre && genre !== 'all') {
      books = books.filter(book =>
        book.genre.toLowerCase() === genre.toLowerCase()
      );
    }

    // Apply price filters
    if (minPrice) {
      books = books.filter(book => book.price >= parseFloat(minPrice));
    }
    if (maxPrice) {
      books = books.filter(book => book.price <= parseFloat(maxPrice));
    }

    // Apply sorting
    books.sort((a, b) => {
      switch (sortBy) {
        case 'price-low':
          return a.price - b.price;
        case 'price-high':
          return b.price - a.price;
        case 'rating':
          return b.rating - a.rating;
        case 'title':
        default:
          return a.title.localeCompare(b.title);
      }
    });

    res.json(books);
  } catch (error) {
    console.error('Error fetching books:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single book by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const books = await fileHandler.readFile('books.json');
    const book = books.find(b => b.id === id);

    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }

    res.json(book);
  } catch (error) {
    console.error('Error fetching book:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get featured books (top rated)
router.get('/featured/top', async (req, res) => {
  try {
    const books = await fileHandler.readFile('books.json');
    const featuredBooks = books
      .sort((a, b) => b.rating - a.rating)
      .slice(0, 4);

    res.json(featuredBooks);
  } catch (error) {
    console.error('Error fetching featured books:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;