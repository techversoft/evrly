import mongoose from 'mongoose';
import Product from '../models/Product.js';
import Category from '../models/Category.js';
import Review from '../models/Review.js';
import SellerProfile from '../models/SellerProfile.js';
import { uploadToCloudinary } from '../services/cloudinaryService.js';

// @desc    Get all products (with search, filters, pagination, sorting)
// @route   GET /api/products
// @access  Public
export const getProducts = async (req, res) => {
  try {
    const pageSize = Number(req.query.limit) || 12;
    const page = Number(req.query.page) || 1;

    // Build filter query supporting status: Active and legacy products
    const query = {
      $or: [
        { status: 'Active' },
        { status: { $exists: false }, isApproved: true, isActive: true }
      ]
    };

    // Search Keyword
    if (req.query.keyword) {
      query.$text = { $search: req.query.keyword };
    }

    // Category Filter (can be category slug or category ID)
    if (req.query.category) {
      // Find category by slug first
      const cat = await Category.findOne({ slug: req.query.category });
      if (cat) {
        query.category = cat._id;
      } else if (req.query.category.match(/^[0-9a-fA-F]{24}$/)) {
        query.category = req.query.category;
      }
    }

    // Price Range Filter
    if (req.query.minPrice || req.query.maxPrice) {
      query.price = {};
      if (req.query.minPrice) query.price.$gte = Number(req.query.minPrice);
      if (req.query.maxPrice) query.price.$lte = Number(req.query.maxPrice);
    }

    // Rating Filter
    if (req.query.rating) {
      query.rating = { $gte: Number(req.query.rating) };
    }

    // Customization Filter
    if (req.query.customizable === 'true') {
      query.customizationFields = { $exists: true, $not: { $size: 0 } };
    } else if (req.query.customizable === 'false') {
      query.customizationFields = { $size: 0 };
    }

    // Sorting
    let sort = { createdAt: -1 }; // default newest
    if (req.query.sortBy) {
      if (req.query.sortBy === 'priceAsc') {
        sort = { price: 1 };
      } else if (req.query.sortBy === 'priceDesc') {
        sort = { price: -1 };
      } else if (req.query.sortBy === 'rating') {
        sort = { rating: -1 };
      } else if (req.query.sortBy === 'popularity') {
        sort = { numReviews: -1 };
      }
    }

    // Get active (approved and non-suspended) sellers
    const activeSellers = await mongoose.model('SellerProfile').find({ isApproved: true, isSuspended: false }).select('user');
    const activeSellerIds = activeSellers.map(s => s.user);
    query.seller = { $in: activeSellerIds };

    const count = await Product.countDocuments(query);
    const products = await Product.find(query)
      .populate('seller', '_id') // Hide seller name
      .populate('category', 'name slug')
      .sort(sort)
      .limit(pageSize)
      .skip(pageSize * (page - 1));

    res.json({
      products,
      page,
      pages: Math.ceil(count / pageSize),
      total: count,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get product by slug
// @route   GET /api/products/:slug
// @access  Public
export const getProductBySlug = async (req, res) => {
  try {
    const product = await Product.findOne({ slug: req.params.slug })
      .populate('category', 'name slug')
      .populate({
        path: 'seller',
        select: '_id', // Hide seller name
      });

    if (product) {
      // Verify seller is approved and not suspended
      const sellerProfile = await mongoose.model('SellerProfile').findOne({ user: product.seller._id });
      if (!sellerProfile || !sellerProfile.isApproved || sellerProfile.isSuspended) {
        return res.status(404).json({ message: 'Product not found' });
      }

      // Fetch reviews
      const reviews = await Review.find({ product: product._id })
        .populate('user', 'name')
        .sort({ createdAt: -1 });

      res.json({ product, reviews, shopName: sellerProfile?.shopName || 'Evrly - Your Customized GiftStore' });
    } else {
      res.status(404).json({ message: 'Product not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a product
// @route   POST /api/products
// @access  Private/Seller
export const createProduct = async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      compareAtPrice,
      categoryName,
      stock,
      customizationFields,
    } = req.body;

    // Verify category exists
    const categoryObj = await Category.findOne({ name: categoryName }) || await Category.findById(categoryName);
    if (!categoryObj) {
      return res.status(400).json({ message: 'Invalid category specified' });
    }

    // Slug generation
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') + '-' + Math.random().toString(36).substring(2, 7);

    // Image upload handling
    const imageUrls = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const url = await uploadToCloudinary(file.buffer, 'surprizo/products');
        imageUrls.push(url);
      }
    } else if (req.body.images && Array.isArray(req.body.images)) {
      imageUrls.push(...req.body.images);
    } else if (req.body.image) {
      imageUrls.push(req.body.image);
    }

    if (imageUrls.length === 0) {
      // Fallback placeholder image
      imageUrls.push('https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=800');
    }

    // Customization parsing
    let parsedFields = [];
    if (customizationFields) {
      parsedFields = typeof customizationFields === 'string' 
        ? JSON.parse(customizationFields) 
        : customizationFields;
    }

    const productStatus = Number(stock) === 0 ? 'Out of Stock' : 'Pending Approval';

    const product = new Product({
      seller: req.user._id,
      name,
      slug,
      description,
      price: Number(price),
      compareAtPrice: compareAtPrice ? Number(compareAtPrice) : undefined,
      category: categoryObj._id,
      images: imageUrls,
      stock: Number(stock) || 0,
      customizationFields: parsedFields,
      isApproved: false, // Must be approved by Admin
      isActive: true,
      status: productStatus,
    });

    const createdProduct = await product.save();
    res.status(201).json(createdProduct);
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update a product
// @route   PUT /api/products/:id
// @access  Private/Seller
export const updateProduct = async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      compareAtPrice,
      category,
      stock,
      customizationFields,
      isActive,
      status,
    } = req.body;

    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Authorization check
    if (product.seller.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to update this product' });
    }

    // Image upload handling (new images appended)
    const imageUrls = [...(product.images || [])];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const url = await uploadToCloudinary(file.buffer, 'surprizo/products');
        imageUrls.push(url);
      }
    }

    product.name = name || product.name;
    product.description = description || product.description;
    product.price = price !== undefined ? Number(price) : product.price;
    product.compareAtPrice = compareAtPrice !== undefined ? Number(compareAtPrice) : product.compareAtPrice;
    product.stock = stock !== undefined ? Number(stock) : product.stock;
    product.isActive = isActive !== undefined ? isActive : product.isActive;

    if (status) {
      product.status = status;
    }

    // Sync status based on stock level
    if (product.stock === 0 && (!status || status === 'Active')) {
      product.status = 'Out of Stock';
    } else if (product.stock > 0 && product.status === 'Out of Stock') {
      product.status = product.isApproved ? 'Active' : 'Pending Approval';
    }

    // Sync isApproved & isActive for legacy codes
    if (product.status === 'Active') {
      product.isApproved = true;
      product.isActive = true;
    } else if (product.status === 'Pending Approval') {
      product.isApproved = false;
    } else if (product.status === 'Draft' || product.status === 'Inactive') {
      product.isActive = false;
    }

    if (category) {
      const categoryObj = await Category.findOne({ name: category }) || await Category.findById(category);
      if (categoryObj) product.category = categoryObj._id;
    }

    if (customizationFields) {
      product.customizationFields = typeof customizationFields === 'string' 
        ? JSON.parse(customizationFields) 
        : customizationFields;
    }

    if (imageUrls.length > 0) {
      product.images = imageUrls;
    }

    const updatedProduct = await product.save();
    res.json(updatedProduct);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a product
// @route   DELETE /api/products/:id
// @access  Private/Seller
export const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Authorization check
    if (product.seller.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to delete this product' });
    }

    await Product.findByIdAndDelete(req.params.id);
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a product review
// @route   POST /api/products/:id/reviews
// @access  Private/Customer
export const createProductReview = async (req, res) => {
  const { rating, comment } = req.body;

  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const alreadyReviewed = await Review.findOne({
      product: product._id,
      user: req.user._id,
    });

    if (alreadyReviewed) {
      return res.status(400).json({ message: 'Product already reviewed' });
    }

    const review = await Review.create({
      user: req.user._id,
      product: product._id,
      rating: Number(rating),
      comment: comment || '',
    });

    // Update product rating stats
    const reviews = await Review.find({ product: product._id });
    product.numReviews = reviews.length;
    product.rating = reviews.reduce((acc, item) => item.rating + acc, 0) / reviews.length;

    await product.save();

    res.status(201).json({ message: 'Review added successfully', review });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Upload customization image
// @route   POST /api/products/upload
// @access  Public (or Private)
export const uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    const url = await uploadToCloudinary(req.file.buffer, 'surprizo/custom-uploads');
    res.json({ url });
  } catch (error) {
    console.error('File upload error:', error);
    res.status(500).json({ message: error.message });
  }
};
