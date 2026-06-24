import Cart from '../models/Cart.js';
import Product from '../models/Product.js';

// Helper to compare customization values
const isCustomizationMatch = (arr1, arr2) => {
  if (!arr1 || !arr2) return !arr1 && !arr2;
  if (arr1.length !== arr2.length) return false;
  
  // Sort or match values
  const map1 = new Map(arr1.map(item => [item.fieldName, item.value]));
  for (const item of arr2) {
    if (map1.get(item.fieldName) !== item.value) {
      return false;
    }
  }
  return true;
};

// @desc    Get user's cart
// @route   GET /api/cart
// @access  Private
export const getCart = async (req, res) => {
  try {
    let cart = await Cart.findOne({ user: req.user._id })
      .populate({
        path: 'items.product',
        select: 'name slug price compareAtPrice images stock seller customizationFields',
        populate: {
          path: 'seller',
          select: 'name'
        }
      });

    if (!cart) {
      cart = await Cart.create({ user: req.user._id, items: [] });
    }

    res.json(cart);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Add item to cart
// @route   POST /api/cart
// @access  Private
export const addToCart = async (req, res) => {
  const { productId, quantity, customizationValues } = req.body;

  try {
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    let cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      cart = await Cart.create({ user: req.user._id, items: [] });
    }

    // Parse customizations
    const parsedCustomizations = Array.isArray(customizationValues) ? customizationValues : [];

    // Check if item with matching product AND matching customizations already exists
    const existingItemIndex = cart.items.findIndex(
      (item) =>
        item.product.toString() === productId.toString() &&
        isCustomizationMatch(item.customizationValues, parsedCustomizations)
    );

    if (existingItemIndex > -1) {
      // Increment quantity
      cart.items[existingItemIndex].quantity += Number(quantity || 1);
    } else {
      // Add new item
      cart.items.push({
        product: productId,
        quantity: Number(quantity || 1),
        customizationValues: parsedCustomizations,
      });
    }

    await cart.save();
    
    // Return populated cart
    const populatedCart = await Cart.findById(cart._id).populate({
      path: 'items.product',
      select: 'name slug price compareAtPrice images stock seller',
    });

    res.status(201).json(populatedCart);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update cart item quantity or customization
// @route   PUT /api/cart/items/:itemId
// @access  Private
export const updateCartItem = async (req, res) => {
  const { quantity, customizationValues } = req.body;

  try {
    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    const item = cart.items.id(req.params.itemId);
    if (!item) {
      return res.status(404).json({ message: 'Item not found in cart' });
    }

    if (quantity !== undefined) {
      item.quantity = Number(quantity);
    }

    if (customizationValues !== undefined) {
      item.customizationValues = Array.isArray(customizationValues) ? customizationValues : item.customizationValues;
    }

    await cart.save();

    const populatedCart = await Cart.findById(cart._id).populate({
      path: 'items.product',
      select: 'name slug price compareAtPrice images stock seller',
    });

    res.json(populatedCart);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Remove item from cart
// @route   DELETE /api/cart/items/:itemId
// @access  Private
export const removeFromCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    cart.items = cart.items.filter((item) => item._id.toString() !== req.params.itemId);

    await cart.save();

    const populatedCart = await Cart.findById(cart._id).populate({
      path: 'items.product',
      select: 'name slug price compareAtPrice images stock seller',
    });

    res.json(populatedCart);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Clear entire cart
// @route   DELETE /api/cart
// @access  Private
export const clearCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id });
    if (cart) {
      cart.items = [];
      await cart.save();
    }
    res.json({ message: 'Cart cleared successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
