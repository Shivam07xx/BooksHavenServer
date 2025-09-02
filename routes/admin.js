const express = require('express');
const fileHandler = require('../utils/fileHandler');
const jwt = require('jsonwebtoken');

const router = express.Router();
const JWT_SECRET = 'your-secret-key-change-in-production';

// Middleware to authenticate admin
const authenticateAdmin = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

// Get all orders (admin only)
router.get('/orders', authenticateAdmin, async (req, res) => {
  try {
    const orders = await fileHandler.readFile('orders.json');
    res.json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add new book
router.post('/book', authenticateAdmin, async (req, res) => {
  try {
    const bookData = req.body;
    
    if (!bookData.title || !bookData.author || !bookData.price) {
      return res.status(400).json({ message: 'Title, author, and price are required' });
    }

    const newBook = {
      id: Date.now().toString(),
      ...bookData,
      reviews: [],
      createdAt: new Date().toISOString()
    };

    await fileHandler.appendToFile('books.json', newBook);

    res.status(201).json({
      message: 'Book added successfully',
      book: newBook
    });
  } catch (error) {
    console.error('Error adding book:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update book
router.put('/book/:id', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const updatedBook = await fileHandler.updateInFile('books.json', id, updateData);

    if (!updatedBook) {
      return res.status(404).json({ message: 'Book not found' });
    }

    res.json({
      message: 'Book updated successfully',
      book: updatedBook
    });
  } catch (error) {
    console.error('Error updating book:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete book
router.delete('/book/:id', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    await fileHandler.deleteFromFile('books.json', id);

    res.json({ message: 'Book deleted successfully' });
  } catch (error) {
    console.error('Error deleting book:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get dashboard stats
router.get('/stats', authenticateAdmin, async (req, res) => {
  try {
    const books = await fileHandler.readFile('books.json');
    const orders = await fileHandler.readFile('orders.json');
    const users = await fileHandler.readFile('users.json');

    const stats = {
      totalBooks: books.length,
      totalOrders: orders.length,
      totalUsers: users.length,
      totalRevenue: orders.reduce((sum, order) => sum + order.totalAmount, 0),
      lowStockBooks: books.filter(book => book.stock < 5).length
    };

    res.json(stats);
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;