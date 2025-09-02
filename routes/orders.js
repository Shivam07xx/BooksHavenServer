const express = require('express');
const fileHandler = require('../utils/fileHandler');
const jwt = require('jsonwebtoken');

const router = express.Router();
const JWT_SECRET = 'your-secret-key-change-in-production';

// Middleware to authenticate user
const authenticateUser = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

// Create a new order
router.post('/', authenticateUser, async (req, res) => {
  try {
    const { items, totalAmount, shippingAddress, paymentMethod } = req.body;

    if (!items || !items.length) {
      return res.status(400).json({ message: 'Order items are required' });
    }

    const newOrder = {
      id: Date.now().toString(),
      userId: req.user.userId,
      items,
      totalAmount,
      shippingAddress,
      paymentMethod,
      status: 'confirmed',
      orderDate: new Date().toISOString(),
      estimatedDelivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // +7 days
    };

    // Save order to file
    await fileHandler.appendToFile('orders.json', newOrder);

    // Update user's order history
    const users = await fileHandler.readFile('users.json');
    const userIndex = users.findIndex(u => u.id === req.user.userId);
    if (userIndex !== -1) {
      users[userIndex].orders = users[userIndex].orders || [];
      users[userIndex].orders.push(newOrder.id);
      await fileHandler.writeFile('users.json', users);
    }

    res.status(201).json({
      message: 'Order created successfully',
      order: newOrder
    });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all orders for logged-in user
router.get('/user', authenticateUser, async (req, res) => {
  try {
    const orders = await fileHandler.readFile('orders.json');
    const userOrders = orders.filter(order => order.userId === req.user.userId);

    res.json(userOrders);
  } catch (error) {
    console.error('Error fetching user orders:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get a specific order by ID
router.get('/:id', authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;
    const orders = await fileHandler.readFile('orders.json');
    const order = orders.find(o => o.id === id);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Check if user is owner or admin
    if (order.userId !== req.user.userId && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(order);
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
