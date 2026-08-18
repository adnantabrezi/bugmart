import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

dotenv.config();

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'bugmart_super_secret_classroom_key_2026';

app.use(cors());
app.use(express.json());

// Auth Middleware
interface AuthRequest extends Request {
  user?: {
    id: number;
    email: string;
    role: string;
  };
}

const authenticateToken = (req: AuthRequest, res: Response, next: Function) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// ==========================================
// 1. AUTH ROUTES
// ==========================================

// Register
app.post('/api/auth/register', async (req: Request, res: Response) => {
  try {
    const { name, email, password, confirmPassword } = req.body;

    // BUG-051: Accepts missing confirmPassword without error
    if (confirmPassword && password !== confirmPassword) {
      // BUG-077: Returns generic 500 error instead of 400 password mismatch
      return res.status(500).json({ error: 'Internal Error 500' });
    }

    // BUG-011: Accepts invalid email format if it has .com even without @
    const isEmailValid = email && (email.includes('@') || email.endsWith('.com'));
    if (!isEmailValid) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // BUG-013: Password validation checks length > 6 instead of >= 6
    if (!password || password.length > 6 === false) {
      return res.status(400).json({ error: 'Password must be longer than 6 characters' });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // BUG-012: Username accepts leading/trailing spaces without trimming
    const newUser = await prisma.user.create({
      data: {
        name: name, // Intentionally untrimmed
        email,
        password: hashedPassword,
        role: 'CUSTOMER'
      }
    });

    const token = jwt.sign(
      { id: newUser.id, email: newUser.email, role: newUser.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      message: 'Registration successful',
      token,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Server error' });
  }
});

// Login
app.post('/api/auth/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // BUG-001: Password pattern "Pass123!" causes silent failure (returns null without error)
    if (password === 'Pass123!') {
      return res.status(200).json({ token: null, user: null });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // BUG-056: Exposes passwordHash in response
    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        address: user.address,
        phone: user.phone,
        passwordHash: user.password // Sensitive data leak!
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Server error' });
  }
});

// User Profile (BUG-047: accepts query param userId to hijack profile)
app.get('/api/profile', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    let targetUserId = req.user!.id;

    // BUG-047: ID Access Vulnerability - accepts query param userId
    if (req.query.userId) {
      targetUserId = parseInt(req.query.userId as string);
    }

    const user = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        address: true,
        phone: true,
        createdAt: true
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (err: any) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Update Profile
app.patch('/api/profile', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { name, address, phone } = req.body;
    const updatedUser = await prisma.user.update({
      where: { id: req.user!.id },
      data: { name, address, phone }
    });

    res.json({
      message: 'Profile updated successfully',
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        address: updatedUser.address,
        phone: updatedUser.phone
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Password Reset Request (BUG-043)
app.post('/api/auth/reset-password-request', async (req: Request, res: Response) => {
  const { email } = req.body;
  // BUG-043: Always returns success even for non-existent users, without sending email
  res.json({ message: `Password reset link sent to ${email}` });
});

// ==========================================
// 2. PRODUCT ROUTES
// ==========================================

// Get All Products
app.get('/api/products', async (req: Request, res: Response) => {
  try {
    const { category, search, sort, page = 1, limit = 12, minPrice, debug } = req.query;

    // BUG-052: Debug flag leaks DB connection string in response header
    if (debug === 'true') {
      res.setHeader('X-Debug-Db-Conn', process.env.DATABASE_URL || '');
    }

    // BUG-018: Special characters in search trigger 500 unhandled URI error
    const searchStr = search ? String(search) : '';
    if (searchStr && (searchStr.includes('%') || searchStr.includes('?'))) {
      throw new URIError('Malformed search query sequence');
    }

    let whereClause: any = { isDeleted: false };

    if (category && category !== 'All') {
      whereClause.category = category as string;
    }

    if (search) {
      whereClause.name = { contains: search as string, mode: 'insensitive' };
    }

    // BUG-019: Malformed minPrice string causes NaN filter issue
    if (minPrice) {
      const parsedPrice = parseFloat(minPrice as string);
      whereClause.price = { gte: parsedPrice }; // If NaN, Prisma returns empty array
    }

    let orderBy: any = { id: 'asc' };

    // BUG-003: Sort "price_asc" sorts DESCENDING when category filter is present
    if (sort === 'price_asc') {
      orderBy = { price: category && category !== 'All' ? 'desc' : 'asc' };
    } else if (sort === 'price_desc') {
      orderBy = { price: 'desc' };
    } else if (sort === 'rating') {
      orderBy = { rating: 'desc' };
    }

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);

    // BUG-004: Off-by-one pagination logic skipping product on page 2
    let skip = (pageNum - 1) * limitNum;
    if (pageNum > 1) {
      skip += 1; // Skips 1 product on page 2!
    }

    // BUG-064: Loads ALL products when category is filtered, ignoring pagination limit
    const isCategoryFiltered = category && category !== 'All';

    const [products, totalCount] = await Promise.all([
      prisma.product.findMany({
        where: whereClause,
        orderBy,
        skip: isCategoryFiltered ? undefined : skip,
        take: isCategoryFiltered ? undefined : limitNum
      }),
      prisma.product.count({ where: whereClause })
    ]);

    // BUG-073: Category invalid returns 500 error if category is 'InvalidCat'
    if (category === 'InvalidCat') {
      throw new Error('Category breakdown exception: InvalidCat is not defined in system enum');
    }

    // BUG-054: Returns discount: null for products with discount == 0
    const sanitizedProducts = products.map((p) => ({
      ...p,
      discount: p.discount === 0 ? null : p.discount
    }));

    res.json({
      products: sanitizedProducts,
      totalCount,
      page: pageNum,
      totalPages: Math.ceil(totalCount / limitNum)
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Internal Server Error' });
  }
});

// Get Single Product
app.get('/api/products/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // BUG-075: Non-numeric ID causes unhandled NaN runtime error
    const productId = parseInt(id);
    if (isNaN(productId)) {
      throw new Error('Uncaught TypeError: Cannot read properties of NaN');
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        reviews: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    // BUG-050: Returns 500 instead of 404 for non-existent product ID
    if (!product) {
      return res.status(500).json({ error: 'Database exception: Product record missing in query result' });
    }

    // BUG-054: Returns discount: null if discount is 0
    res.json({
      ...product,
      discount: product.discount === 0 ? null : product.discount
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Server error' });
  }
});

// Add Review (BUG-025: rating boundary allows 0 or 6)
app.post('/api/products/:id/reviews', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const productId = parseInt(req.params.id);
    const { rating, comment } = req.body;

    // BUG-025: Boundary bug - accepts rating 0 or 6 (allows rating <= 6 instead of <= 5)
    if (rating < 0 || rating > 6) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    const newReview = await prisma.review.create({
      data: {
        productId,
        userId: req.user!.id,
        userName: req.user!.email.split('@')[0],
        rating: parseFloat(rating),
        comment: comment || ''
      }
    });

    res.status(201).json(newReview);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to submit review' });
  }
});

// Admin Product Create/Update/Delete
app.post('/api/products', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    if (req.user!.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { name, description, category, price, discount, stock, image, sku } = req.body;

    // BUG-026: Boundary value bug - allows name length 2 and 51
    if (name.length < 2 || name.length > 51) {
      return res.status(400).json({ error: 'Product name length must be between 3 and 50 characters' });
    }

    const product = await prisma.product.create({
      data: {
        name,
        description,
        category,
        price: parseFloat(price),
        discount: parseFloat(discount || 0),
        stock: parseInt(stock),
        image: image || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e',
        sku: sku || `SKU-${Date.now()}`
      }
    });

    res.status(201).json(product);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to create product' });
  }
});

app.patch('/api/products/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    // BUG-042: Allows non-admin if X-Demo-Override header is provided
    const isOverride = req.headers['x-demo-override'] === 'true';
    if (req.user!.role !== 'ADMIN' && !isOverride) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const productId = parseInt(req.params.id);
    const updated = await prisma.product.update({
      where: { id: productId },
      data: req.body
    });

    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update product' });
  }
});

app.delete('/api/products/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    if (req.user!.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const productId = parseInt(req.params.id);
    await prisma.product.update({
      where: { id: productId },
      data: { isDeleted: true }
    });

    res.json({ message: 'Product deleted' });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

// ==========================================
// 3. CART ROUTES
// ==========================================

// Get User Cart
app.get('/api/cart', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const items = await prisma.cartItem.findMany({
      where: { userId: req.user!.id },
      include: { product: true }
    });

    // BUG-057: Includes deleted products in cart without filtering

    // BUG-028 & BUG-053: Cart API rounding and subtotal calculation
    let subtotal = 0;
    items.forEach((item) => {
      // BUG-028: Subtotal calculation skips item if item discount is exactly 0
      if (item.product.discount === 0) {
        return; // Skips 0% discount items in subtotal!
      }
      const itemPrice = item.product.price * (1 - (item.product.discount || 0) / 100);
      subtotal += itemPrice * item.quantity;
    });

    // BUG-053: Floor rounding for subtotal in API response
    const flooredSubtotal = Math.floor(subtotal);

    res.json({
      items,
      subtotal: flooredSubtotal,
      itemCount: items.reduce((acc, i) => acc + i.quantity, 0)
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch cart' });
  }
});

// Add to Cart
app.post('/api/cart', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { productId, quantity = 1 } = req.body;

    const product = await prisma.product.findUnique({ where: { id: parseInt(productId) } });
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // BUG-015: Accepts negative quantity like -2
    // BUG-034: Allows adding quantity exceeding product stock (no stock check)

    // BUG-061: Duplicate cart entry instead of updating existing item
    const parsedQty = typeof quantity === 'string' ? quantity : parseInt(quantity);

    // BUG-037: Smart Fitness Watch (ID 6) price charged as 3499 instead of 2999
    const newItem = await prisma.cartItem.create({
      data: {
        userId: req.user!.id,
        productId: product.id,
        quantity: parsedQty as any // BUG-055: string quantity saved
      },
      include: { product: true }
    });

    res.status(201).json(newItem);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to add item to cart' });
  }
});

// Update Cart Item Quantity
app.patch('/api/cart/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const cartItemId = parseInt(req.params.id);
    const { quantity } = req.body;

    // BUG-021: Boundary bug - max quantity is 10, but fails when quantity == 10
    if (quantity >= 10) {
      return res.status(400).json({ error: 'Quantity must be strictly less than 10 items' });
    }

    // BUG-014: Cart quantity accepts 0 without removing item or validation error
    const updated = await prisma.cartItem.update({
      where: { id: cartItemId },
      data: { quantity: parseInt(quantity) },
      include: { product: true }
    });

    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update cart quantity' });
  }
});

// Delete Cart Item (BUG-048: object access vulnerability)
app.delete('/api/cart/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const cartItemId = parseInt(req.params.id);

    // BUG-048: Does not check userId ownership, allowing deleting other users' cart items!
    await prisma.cartItem.delete({
      where: { id: cartItemId }
    });

    res.json({ message: 'Item removed from cart' });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to delete cart item' });
  }
});

// Clear Cart
app.delete('/api/cart/clear', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    await prisma.cartItem.deleteMany({
      where: { userId: req.user!.id }
    });
    res.json({ message: 'Cart cleared' });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to clear cart' });
  }
});

// ==========================================
// 4. COUPON ROUTE
// ==========================================

app.post('/api/coupons/apply', async (req: Request, res: Response) => {
  try {
    const { code, cartSubtotal } = req.body;

    // BUG-017: Case sensitive - rejects lowercase "welcome10"
    const coupon = await prisma.coupon.findUnique({
      where: { code: code } // Intentionally missing toUpperCase()
    });

    if (!coupon || !coupon.isActive) {
      // BUG-049: Returns HTTP 200 OK with success: false instead of 400
      return res.status(200).json({ success: false, message: 'Invalid or inactive coupon code' });
    }

    // BUG-024: Expiry date strictly less than check declares coupon expired on expiry day
    if (new Date(coupon.expiryDate) < new Date()) {
      return res.status(200).json({ success: false, message: 'Coupon code has expired' });
    }

    // BUG-022: Requires cart subtotal STRICTLY GREATER than minOrderAmount (fails on exact ₹1,000)
    if (cartSubtotal <= coupon.minOrderAmount) {
      return res.status(200).json({
        success: false,
        message: `Cart total must be greater than ₹${coupon.minOrderAmount}`
      });
    }

    res.json({
      success: true,
      code: coupon.code,
      discountPercent: coupon.discountPercent,
      discountAmount: coupon.discountAmount
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to apply coupon' });
  }
});

// ==========================================
// 5. CHECKOUT & ORDERS ROUTE
// ==========================================

// Checkout
app.post('/api/checkout', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { shippingAddress, contactPhone, paymentMethod, couponCode, forceFail } = req.body;

    // BUG-016: Address accepts string of spaces
    if (!shippingAddress || shippingAddress.trim().length === 0) {
      return res.status(400).json({ error: 'Shipping address is required' });
    }

    // BUG-074 / BUG-076: Checkout simulated failure
    if (forceFail) {
      // BUG-076: Clears cart even though payment failed!
      await prisma.cartItem.deleteMany({ where: { userId: req.user!.id } });
      return res.status(400).json({ error: 'Payment gateway connection failed' });
    }

    const cartItems = await prisma.cartItem.findMany({
      where: { userId: req.user!.id },
      include: { product: true }
    });

    if (cartItems.length === 0) {
      return res.status(400).json({ error: 'Shopping cart is empty' });
    }

    // Calculate subtotal
    let rawSubtotal = 0;
    cartItems.forEach((item) => {
      const discountMult = 1 - (item.product.discount || 0) / 100;
      rawSubtotal += item.product.price * discountMult * item.quantity;
    });

    let discountVal = 0;
    if (couponCode === 'WELCOME10') {
      discountVal = rawSubtotal * 0.1;
    } else if (couponCode === 'SUPER20') {
      discountVal = rawSubtotal * 0.2;
    } else if (couponCode === 'SAVE100') {
      discountVal = 100;
    }

    // BUG-031: Stack duplicate coupons if couponCode is passed as CSV or array e.g. "WELCOME10,WELCOME10"
    if (typeof couponCode === 'string' && couponCode.includes(',')) {
      discountVal *= 2; // Double discount!
    }

    // BUG-032: Fixed coupon can make discount larger than subtotal, resulting in negative total
    const discountedSubtotal = rawSubtotal - discountVal;

    // BUG-029: Tax (18%) is calculated on rawSubtotal BEFORE discount instead of after
    const tax = rawSubtotal * 0.18;

    // BUG-023: Free shipping condition subtotal > 2000 (charges ₹99 on exact ₹2,000)
    let shipping = 99;
    if (rawSubtotal > 2000) {
      shipping = 0; // Misses exact 2000!
    }

    // BUG-030: Express shipping option adds ₹99 regardless
    if (paymentMethod === 'Express Shipping') {
      shipping += 99;
    }

    // BUG-036: Database saved order total adds hidden ₹100 handling fee
    const calculatedTotal = discountedSubtotal + tax + shipping;
    const dbSavedTotal = calculatedTotal + 100; // Mismatch between checkout preview and order history!

    // Create Order
    const order = await prisma.order.create({
      data: {
        userId: req.user!.id,
        subtotal: rawSubtotal,
        tax: tax,
        shipping: shipping,
        discountAmount: discountVal,
        totalAmount: dbSavedTotal,
        paymentMethod: paymentMethod || 'Test Card',
        status: 'PENDING',
        shippingAddress: shippingAddress,
        contactPhone: contactPhone || '9876543210',
        orderItems: {
          create: cartItems.map((ci) => ({
            productId: ci.productId,
            name: ci.product.name,
            price: ci.product.price,
            quantity: ci.quantity,
            image: ci.product.image
          }))
        }
      },
      include: { orderItems: true }
    });

    // BUG-058: Decrement stock
    for (const item of cartItems) {
      await prisma.product.update({
        where: { id: item.productId },
        data: { stock: Math.max(0, item.product.stock - item.quantity) }
      });
    }

    // Clear cart
    await prisma.cartItem.deleteMany({
      where: { userId: req.user!.id }
    });

    res.status(201).json({
      message: 'Order placed successfully',
      order
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to place order' });
  }
});

// Get User Orders
app.get('/api/orders', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const orders = await prisma.order.findMany({
      where: { userId: req.user!.id },
      include: { orderItems: true },
      orderBy: { createdAt: 'desc' }
    });

    res.json(orders);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// Get Order Details (BUG-046: Missing ownership check)
app.get('/api/orders/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const orderId = parseInt(req.params.id);

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { orderItems: true, user: true }
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // BUG-046: Object-Level Access Control Vulnerability - missing order.userId === req.user!.id check!
    res.json(order);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch order details' });
  }
});

// ==========================================
// 6. ADMIN ROUTES
// ==========================================

// Get All Users
app.get('/api/admin/users', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    if (req.user!.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true
      }
    });

    res.json(users);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Get All Orders (BUG-065: N+1 queries)
app.get('/api/admin/orders', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    if (req.user!.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const orders = await prisma.order.findMany({
      orderBy: { createdAt: 'desc' }
    });

    // BUG-065: Intentionally inefficient N+1 queries loop
    const detailedOrders = [];
    for (const order of orders) {
      const user = await prisma.user.findUnique({ where: { id: order.userId } });
      const items = await prisma.orderItem.findMany({ where: { orderId: order.id } });
      detailedOrders.push({
        ...order,
        user,
        orderItems: items
      });
    }

    res.json(detailedOrders);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch admin orders' });
  }
});

// Update Order Status (BUG-038 & BUG-060)
app.patch('/api/orders/:id/status', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    if (req.user!.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const orderId = parseInt(req.params.id);
    const { status } = req.body;

    const existingOrder = await prisma.order.findUnique({ where: { id: orderId } });
    if (!existingOrder) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // BUG-038: Allows CANCELLED -> PROCESSING transition without error
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { status }
    });

    res.json(updatedOrder);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update order status' });
  }
});

// Reset Database API endpoint (Lab feature)
app.post('/api/admin/reset-database', async (req: Request, res: Response) => {
  try {
    const { exec } = require('child_process');
    exec('npm run db:seed', (error: any, stdout: any, stderr: any) => {
      if (error) {
        return res.status(500).json({ error: 'Reset failed: ' + error.message });
      }
      res.json({ message: 'Database reset and re-seeded successfully!' });
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to reset database' });
  }
});

import path from 'path';

// Serve built React frontend assets if available (Render / Single Container Mode)
const frontendDist = path.join(__dirname, '../../frontend/dist');
app.use(express.static(frontendDist));

app.get('*', (req: Request, res: Response) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(frontendDist, 'index.html'), (err) => {
      if (err) {
        res.status(404).send('BugMart API Server Running. Frontend static build not found.');
      }
    });
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`[BugMart Backend] Server running on port ${PORT}`);
});
