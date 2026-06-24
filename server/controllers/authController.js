import User from '../models/User.js';
import SellerProfile from '../models/SellerProfile.js';
import Cart from '../models/Cart.js';
import generateToken from '../utils/generateToken.js';

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
export const registerUser = async (req, res) => {
  let { name, email, password, role, shopName, shopDescription } = req.body;

  // Input Validation
  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Name, email, and password are required.' });
  }

  // Trimming & Sanitization
  name = name.trim();
  email = email.trim().toLowerCase();
  if (shopName) shopName = shopName.trim();
  if (shopDescription) shopDescription = shopDescription.trim();

  // Validate Email Regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ message: 'Please enter a valid email address.' });
  }

  // Enforce password length
  if (password.length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters long.' });
  }

  try {
    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Determine role (default to customer if invalid, restrict admin register)
    const userRole = ['customer', 'seller'].includes(role) ? role : 'customer';

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      role: userRole,
    });

    if (user) {
      // If seller, create a SellerProfile
      if (user.role === 'seller') {
        if (!shopName) {
          // Delete user if shop name is not provided
          await User.findByIdAndDelete(user._id);
          return res.status(400).json({ message: 'Shop name is required for seller registration' });
        }

        // Verify shop name unique
        const shopExists = await SellerProfile.findOne({ shopName });
        if (shopExists) {
          await User.findByIdAndDelete(user._id);
          return res.status(400).json({ message: 'Shop name is already taken' });
        }

        await SellerProfile.create({
          user: user._id,
          shopName,
          shopDescription: shopDescription || '',
          isApproved: false, // Requires Admin approval
        });
      }

      // Initialize empty Cart for the user
      await Cart.create({ user: user._id, items: [] });

      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
        token: generateToken(user._id),
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
export const authUser = async (req, res) => {
  let { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  email = email.trim().toLowerCase();

  try {
    const user = await User.findOne({ email });

    if (user && (await user.matchPassword(password))) {
      // If seller, check if they have a profile
      let sellerApproved = false;
      if (user.role === 'seller') {
        const profile = await SellerProfile.findOne({ user: user._id });
        sellerApproved = profile ? profile.isApproved : false;
      }

      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
        sellerApproved,
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Sync / Authenticate user via Google OAuth (called by NextAuth backend callback)
// @route   POST /api/auth/google-login
// @access  Public
export const googleLogin = async (req, res) => {
  const { name, email, googleId } = req.body;

  try {
    let user = await User.findOne({ email });

    if (!user) {
      // Create user with a random secure password since they log in via Google
      const randomPassword = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      user = await User.create({
        name,
        email,
        password: randomPassword,
        role: 'customer', // Google signup default is customer
        isVerified: true,
      });

      // Initialize empty Cart for the user
      await Cart.create({ user: user._id, items: [] });
    }

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isVerified: user.isVerified,
      token: generateToken(user._id),
    });
  } catch (error) {
    console.error('Google login controller error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get user profile details
// @route   GET /api/auth/me
// @access  Private
export const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      let sellerDetails = null;
      if (user.role === 'seller') {
        sellerDetails = await SellerProfile.findOne({ user: user._id });
      }

      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
        sellerDetails,
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Upgrade existing customer to seller
// @route   POST /api/auth/become-seller
// @access  Private
export const becomeSeller = async (req, res) => {
  let { shopName, shopDescription } = req.body;

  if (!shopName) {
    return res.status(400).json({ message: 'Shop name is required for seller registration' });
  }

  shopName = shopName.trim();
  if (shopDescription) shopDescription = shopDescription.trim();

  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.role === 'seller') {
      return res.status(400).json({ message: 'User is already a seller' });
    }

    // Verify shop name unique
    const shopExists = await SellerProfile.findOne({ shopName });
    if (shopExists) {
      return res.status(400).json({ message: 'Shop name is already taken' });
    }

    // Create Seller Profile
    await SellerProfile.create({
      user: user._id,
      shopName,
      shopDescription: shopDescription || '',
      isApproved: false,
    });

    // Update user role
    user.role = 'seller';
    await user.save();

    res.status(200).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isVerified: user.isVerified,
      sellerApproved: false,
      token: generateToken(user._id),
    });
  } catch (error) {
    console.error('Become seller error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
export const updateUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      user.name = req.body.name || user.name;
      user.email = req.body.email || user.email;
      user.phoneNumber = req.body.phoneNumber || user.phoneNumber;

      if (req.body.password) {
        user.password = req.body.password;
      }

      const updatedUser = await user.save();

      res.json({
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        phoneNumber: updatedUser.phoneNumber,
        isVerified: updatedUser.isVerified,
        token: generateToken(updatedUser._id),
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get user addresses
// @route   GET /api/auth/addresses
// @access  Private
export const getUserAddresses = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user.addresses || []);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Add user address
// @route   POST /api/auth/addresses
// @access  Private
export const addUserAddress = async (req, res) => {
  const { name, phone, street, city, state, zipCode, country, isDefault } = req.body;
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (isDefault) {
      user.addresses.forEach(addr => addr.isDefault = false);
    }

    user.addresses.push({
      name,
      phone,
      street,
      city,
      state,
      zipCode,
      country: country || 'India',
      isDefault: isDefault || false,
    });

    await user.save();
    res.status(201).json(user.addresses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update user address
// @route   PUT /api/auth/addresses/:addressId
// @access  Private
export const updateUserAddress = async (req, res) => {
  const { name, phone, street, city, state, zipCode, country, isDefault } = req.body;
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const addr = user.addresses.id(req.params.addressId);
    if (!addr) {
      return res.status(404).json({ message: 'Address not found' });
    }

    if (isDefault) {
      user.addresses.forEach(a => a.isDefault = false);
    }

    addr.name = name || addr.name;
    addr.phone = phone || addr.phone;
    addr.street = street || addr.street;
    addr.city = city || addr.city;
    addr.state = state || addr.state;
    addr.zipCode = zipCode || addr.zipCode;
    addr.country = country || addr.country;
    addr.isDefault = isDefault !== undefined ? isDefault : addr.isDefault;

    await user.save();
    res.json(user.addresses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete user address
// @route   DELETE /api/auth/addresses/:addressId
// @access  Private
export const deleteUserAddress = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.addresses = user.addresses.filter(addr => addr._id.toString() !== req.params.addressId);
    await user.save();
    res.json(user.addresses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get user wishlist
// @route   GET /api/auth/wishlist
// @access  Private
export const getWishlist = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate({
      path: 'wishlist',
      select: 'name slug price compareAtPrice images stock rating'
    });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user.wishlist || []);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Add product to wishlist
// @route   POST /api/auth/wishlist
// @access  Private
export const addToWishlist = async (req, res) => {
  const { productId } = req.body;
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!user.wishlist.includes(productId)) {
      user.wishlist.push(productId);
      await user.save();
    }
    
    res.status(200).json({ message: 'Added to wishlist', wishlist: user.wishlist });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Remove product from wishlist
// @route   DELETE /api/auth/wishlist/:productId
// @access  Private
export const removeFromWishlist = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.wishlist = user.wishlist.filter(id => id.toString() !== req.params.productId);
    await user.save();
    
    res.status(200).json({ message: 'Removed from wishlist', wishlist: user.wishlist });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
