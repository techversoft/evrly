import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import SellerProfile from '../models/SellerProfile.js';

export const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];

      // Decode token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from db, exclude password
      req.user = await User.findById(decoded.id).select('-password');
      if (!req.user) {
        console.error(`[protect] User with ID ${decoded.id} not found in database.`);
        return res.status(401).json({ message: 'Not authorized, user not found' });
      }

      next();
    } catch (error) {
      console.error('[protect] Token verification catch block failed:', error.message);
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    console.warn('[protect] No Bearer token found in request headers.');
    return res.status(401).json({ message: 'Not authorized, no token' });
  }
};

export const seller = (req, res, next) => {
  if (req.user && req.user.role === 'seller') {
    next();
  } else {
    res.status(403).json({ message: 'Access denied: Seller role required' });
  }
};

export const approvedSeller = async (req, res, next) => {
  if (req.user && req.user.role === 'seller') {
    const profile = await SellerProfile.findOne({ user: req.user._id });
    if (profile && profile.isSuspended) {
      return res.status(403).json({ message: 'Access denied: Your seller account has been suspended by the administrator.' });
    }
    if (profile && profile.isApproved) {
      next();
    } else {
      res.status(403).json({ message: 'Access denied: Your seller shop is not approved yet. Please wait for administrator verification.' });
    }
  } else {
    res.status(403).json({ message: 'Access denied: Seller role required' });
  }
};

export const admin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Access denied: Admin role required' });
  }
};

export const sellerOrAdmin = (req, res, next) => {
  if (req.user && (req.user.role === 'seller' || req.user.role === 'admin')) {
    next();
  } else {
    res.status(403).json({ message: 'Access denied: Seller or Admin role required' });
  }
};
