import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding BugMart database...');

  // Clean existing data
  await prisma.review.deleteMany({});
  await prisma.orderItem.deleteMany({});
  await prisma.order.deleteMany({});
  await prisma.cartItem.deleteMany({});
  await prisma.coupon.deleteMany({});
  await prisma.product.deleteMany({});
  await prisma.user.deleteMany({});

  // Seed Password Hash
  const passwordHash = await bcrypt.hash('Password123', 10);
  const adminPasswordHash = await bcrypt.hash('Admin123!', 10);

  // Seed Users
  const user1 = await prisma.user.create({
    data: {
      name: 'Alex Mercer',
      email: 'user@bugmart.com',
      password: passwordHash,
      role: 'CUSTOMER',
      age: 28,
      address: '742 Evergreen Terrace, Springfield',
      phone: '9876543210'
    }
  });

  const user2 = await prisma.user.create({
    data: {
      name: 'Jane Doe',
      email: 'jane@bugmart.com',
      password: passwordHash,
      role: 'CUSTOMER',
      age: 24,
      address: '221B Baker Street, London',
      phone: '9876543211'
    }
  });

  const admin = await prisma.user.create({
    data: {
      name: 'Admin User',
      email: 'admin@bugmart.com',
      password: adminPasswordHash,
      role: 'ADMIN',
      age: 35,
      address: '100 Tech Park, Silicon Valley',
      phone: '9876543299'
    }
  });

  console.log('Seeded Users:', { user1: user1.email, user2: user2.email, admin: admin.email });

  // Seed Coupons
  await prisma.coupon.createMany({
    data: [
      {
        code: 'WELCOME10',
        discountPercent: 10,
        minOrderAmount: 1000,
        expiryDate: new Date('2026-12-31')
      },
      {
        code: 'SUPER20',
        discountPercent: 20,
        minOrderAmount: 2000,
        expiryDate: new Date('2026-12-31')
      },
      {
        code: 'SAVE100',
        discountPercent: 0,
        discountAmount: 100,
        minOrderAmount: 500,
        expiryDate: new Date('2026-12-31')
      },
      {
        code: 'EXPIRED50',
        discountPercent: 50,
        minOrderAmount: 1000,
        expiryDate: new Date('2025-01-01')
      }
    ]
  });

  // Seed 32 Fake Products across categories
  const productsData = [
    // Electronics
    {
      name: 'Pro Wireless Headphones',
      description: 'High-fidelity audio with active noise cancellation and 30-hour battery life.',
      category: 'Electronics',
      price: 4999.00,
      discount: 10,
      stock: 15,
      rating: 4.5,
      image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&auto=format&fit=crop',
      sku: 'ELEC-PRO-001'
    },
    {
      name: 'Ultra Slim Laptop 15"',
      description: 'Intel i7 12th Gen, 16GB RAM, 512GB SSD, Ultra HD IPS display.',
      category: 'Electronics',
      price: 64999.00,
      discount: 5,
      stock: 8,
      rating: 4.8,
      image: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=500&auto=format&fit=crop',
      sku: 'ELEC-LAP-002'
    },
    {
      name: 'Mechanical Gaming Keyboard',
      description: 'RGB Backlit mechanical keyboard with tactile blue switches.',
      category: 'Electronics',
      price: 3499.00,
      discount: 15,
      stock: 25,
      rating: 4.3,
      image: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=500&auto=format&fit=crop',
      sku: 'ELEC-KEY-003'
    },
    {
      name: 'Ergonomic Optical Mouse',
      description: 'Precision wireless mouse with adjustable DPI and silent clicks.',
      category: 'Electronics',
      price: 1299.00,
      discount: 0,
      stock: 40,
      rating: 4.1,
      image: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=500&auto=format&fit=crop',
      sku: 'ELEC-MOU-004'
    },
    {
      name: '4K Ultra HD Monitor 27"',
      description: 'IPS panel with 144Hz refresh rate, HDR400, and ultra-thin bezels.',
      category: 'Electronics',
      price: 22999.00,
      discount: 12,
      stock: 6,
      rating: 4.7,
      image: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=500&auto=format&fit=crop',
      sku: 'ELEC-MON-005'
    },
    {
      name: 'Smart Fitness Watch',
      description: 'Heart rate monitor, step counter, sleep tracker, and GPS built-in.',
      category: 'Electronics',
      price: 3499.00, // BUG-037: Displayed as 2999 in frontend mock, but backend price is 3499
      discount: 0,
      stock: 20,
      rating: 4.4,
      image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&auto=format&fit=crop',
      sku: 'ELEC-WAT-006'
    },
    {
      name: 'Portable Bluetooth Speaker',
      description: 'Waterproof IPX7 speaker with deep bass and 12-hour playtime.',
      category: 'Electronics',
      price: 2499.00,
      discount: 20,
      stock: 18,
      rating: 4.2,
      image: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=500&auto=format&fit=crop',
      sku: 'ELEC-SPK-007'
    },
    {
      name: 'Wireless Noise-Canceling Earbuds',
      description: 'Compact true wireless earbuds with touch control and wireless charging case.',
      category: 'Electronics',
      price: 3999.00,
      discount: 10,
      stock: 12,
      rating: 4.6,
      image: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df-broken.pngg', // BUG-008: Intentional broken image URL
      sku: 'ELEC-EAR-008'
    },

    // Clothing
    {
      name: 'Classic Cotton Denim Jacket',
      description: '100% organic cotton denim jacket with vintage wash finish.',
      category: 'Clothing',
      price: 2999.00,
      discount: 10,
      stock: 14,
      rating: 4.5,
      image: 'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=500&auto=format&fit=crop',
      sku: 'CLOT-JAC-009'
    },
    {
      name: 'Casual Slim Fit T-Shirt',
      description: 'Soft breathable crew neck t-shirt available in premium charcoal black.',
      category: 'Clothing',
      price: 799.00,
      discount: 0,
      stock: 50,
      rating: 4.2,
      image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=500&auto=format&fit=crop',
      sku: 'CLOT-TSH-010'
    },
    {
      name: 'Lightweight Hooded Sweatshirt',
      description: 'Cozy fleece lined hoodie with drawstring hood and kangaroo pocket.',
      category: 'Clothing',
      price: 1899.00,
      discount: 15,
      stock: 22,
      rating: 4.6,
      image: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=500&auto=format&fit=crop',
      sku: 'CLOT-HOD-011'
    },
    {
      name: 'Tailored Formal Dress Shirt',
      description: 'Wrinkle-free cotton shirt tailored for business and formal occasions.',
      category: 'Clothing',
      price: 1599.00,
      discount: 5,
      stock: 30,
      rating: 4.3,
      image: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=500&auto=format&fit=crop',
      sku: 'CLOT-SHI-012'
    },
    {
      name: 'Athletic Jogger Sweatpants',
      description: 'Stretchable moisture-wicking joggers with elastic waistband.',
      category: 'Clothing',
      price: 1299.00,
      discount: 0,
      stock: 0, // BUG-033: Out of stock item
      rating: 4.0,
      image: 'https://images.unsplash.com/photo-1552902865-b72c031ac5ea?w=500&auto=format&fit=crop',
      sku: 'CLOT-JOG-013'
    },
    {
      name: 'Winter Puffer Jacket',
      description: 'Windproof and water-resistant down jacket for extreme cold weather.',
      category: 'Clothing',
      price: 4599.00,
      discount: 25,
      stock: 7,
      rating: 4.7,
      image: 'https://images.unsplash.com/photo-1544441893-675973e31985?w=500&auto=format&fit=crop',
      sku: 'CLOT-PUF-014'
    },

    // Books
    {
      name: 'The Pragmatic Programmer: 20th Anniversary Edition',
      description: 'Essential guide for software engineers covering career and coding best practices.',
      category: 'Books',
      price: 999.00,
      discount: 10,
      stock: 25,
      rating: 4.9,
      image: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=500&auto=format&fit=crop',
      sku: 'BOOK-PRG-015'
    },
    {
      name: 'Clean Code: A Handbook of Agile Software Craftsmanship',
      description: 'A classic manual by Robert C. Martin on writing readable and maintainable code.',
      category: 'Books',
      price: 1199.00,
      discount: 5,
      stock: 19,
      rating: 4.8,
      image: 'https://images.unsplash.com/photo-1532012197267-da84d127e765?w=500&auto=format&fit=crop',
      sku: 'BOOK-CLN-016'
    },
    {
      name: 'Designing Data-Intensive Applications',
      description: 'The definitive guide to distributed systems, storage, and reliability architecture.',
      category: 'Books',
      price: 1499.00,
      discount: 0,
      stock: 11,
      rating: 4.9,
      image: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=500&auto=format&fit=crop',
      sku: 'BOOK-DDIA-017'
    },
    {
      name: 'Software Testing Foundations: A Study Guide',
      description: 'Comprehensive overview of ISTQB concepts, black-box testing, and bug tracking.',
      category: 'Books',
      price: 699.00,
      discount: 20,
      stock: 35,
      rating: 4.4,
      image: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=500&auto=format&fit=crop',
      sku: 'BOOK-TEST-018'
    },
    {
      name: 'Mastering TypeScript & Modern JavaScript',
      description: 'Step-by-step guide to building production-ready scalable web applications.',
      category: 'Books',
      price: 849.00,
      discount: 10,
      stock: 16,
      rating: 4.6,
      image: 'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?w=500&auto=format&fit=crop',
      sku: 'BOOK-TSJS-019'
    },

    // Accessories
    {
      name: 'Genuine Leather Minimalist Wallet',
      description: 'RFID blocking slim bi-fold wallet made from full-grain leather.',
      category: 'Accessories',
      price: 999.00,
      discount: 10,
      stock: 40,
      rating: 4.4,
      image: 'https://images.unsplash.com/photo-1627123424574-724758594e93?w=500&auto=format&fit=crop',
      sku: 'ACC-WAL-020'
    },
    {
      name: 'Water-Resistant Laptop Backpack 15.6"',
      description: 'Spacious multi-compartment backpack with USB charging port.',
      category: 'Accessories',
      price: 2199.00,
      discount: 15,
      stock: 14,
      rating: 4.6,
      image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500&auto=format&fit=crop',
      sku: 'ACC-BPK-021'
    },
    {
      name: 'Polarized Aviator Sunglasses',
      description: 'UV400 protection metal frame classic sunglasses for men and women.',
      category: 'Accessories',
      price: 1499.00,
      discount: 25,
      stock: 28,
      rating: 4.3,
      image: 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=500&auto=format&fit=crop',
      sku: 'ACC-SUN-022'
    },
    {
      name: 'Stainless Steel Water Bottle 1L',
      description: 'Vacuum insulated flask that keeps drinks cold for 24 hours or hot for 12 hours.',
      category: 'Accessories',
      price: 799.00,
      discount: 0,
      stock: 60,
      rating: 4.7,
      image: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=500&auto=format&fit=crop',
      sku: 'ACC-BOT-023'
    },
    {
      name: 'Automatic Stainless Steel Chronograph Watch',
      description: 'Precision mechanical movement watch with sapphire crystal glass.',
      category: 'Accessories',
      price: 8999.00,
      discount: 5,
      stock: 4,
      rating: 4.9,
      image: 'https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=500&auto=format&fit=crop',
      sku: 'ACC-WAT-024'
    },

    // Home
    {
      name: 'Smart Ceramic Electric Kettle 1.7L',
      description: 'Fast boiling kettle with precise temperature control and auto shutoff.',
      category: 'Home',
      price: 2499.00,
      discount: 10,
      stock: 12,
      rating: 4.4,
      image: 'https://images.unsplash.com/photo-1594212699903-ec8a3eca50f6?w=500&auto=format&fit=crop',
      sku: 'HOME-KET-025'
    },
    {
      name: 'Air Purifier with True HEPA Filter',
      description: 'Filters 99.97% of dust, pollen, smoke, and odors in rooms up to 500 sq ft.',
      category: 'Home',
      price: 7999.00,
      discount: 15,
      stock: 9,
      rating: 4.6,
      image: 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=500&auto=format&fit=crop',
      sku: 'HOME-AIR-026'
    },
    {
      name: 'Non-Stick Ceramic Cookware Set 5-Piece',
      description: 'PFOA-free eco-friendly frying pans and saucepans with tempered glass lids.',
      category: 'Home',
      price: 3999.00,
      discount: 20,
      stock: 15,
      rating: 4.5,
      image: 'https://images.unsplash.com/photo-1584992236310-6edddc08acff?w=500&auto=format&fit=crop',
      sku: 'HOME-COOK-027'
    },
    {
      name: 'Ergonomic Memory Foam Pillow',
      description: 'Cervical contour pillow for neck pain relief and comfortable sleeping.',
      category: 'Home',
      price: 1299.00,
      discount: 0,
      stock: 35,
      rating: 4.2,
      image: 'https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?w=500&auto=format&fit=crop',
      sku: 'HOME-PIL-028'
    },
    {
      name: 'Smart LED Desk Lamp with Wireless Charger',
      description: 'Dimmable desk lamp with 5 color modes and built-in Qi wireless charging pad.',
      category: 'Home',
      price: 1799.00,
      discount: 10,
      stock: 20,
      rating: 4.5,
      image: 'https://images.unsplash.com/photo-1534353473418-4cfa6c56fd38?w=500&auto=format&fit=crop',
      sku: 'HOME-LMP-029'
    },
    {
      name: 'Ultra-High Definition Noise Cancelling Wireless Headphones Pro Max',
      description: 'Very long title product test for responsive layout overflow bugs.',
      category: 'Electronics',
      price: 12999.00,
      discount: 5,
      stock: 10,
      rating: 4.9,
      image: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=500&auto=format&fit=crop',
      sku: 'ELEC-LNG-030'
    },
    {
      name: 'Minimalist Wooden Wall Clock',
      description: 'Silent non-ticking quartz movement 12 inch decorative wall clock.',
      category: 'Home',
      price: 899.00,
      discount: 0,
      stock: 18,
      rating: 4.1,
      image: 'https://images.unsplash.com/photo-1563861826100-9cb868fdbe1c?w=500&auto=format&fit=crop',
      sku: 'HOME-CLK-031'
    },
    {
      name: 'Compact Espresso Coffee Machine',
      description: '15-bar Italian pump espresso maker with milk frother wand.',
      category: 'Home',
      price: 6499.00,
      discount: 10,
      stock: 7,
      rating: 4.7,
      image: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=500&auto=format&fit=crop',
      sku: 'HOME-COF-032'
    }
  ];

  for (const prod of productsData) {
    await prisma.product.create({ data: prod });
  }

  console.log(`Seeded ${productsData.length} products successfully!`);

  // Seed sample order for user1
  const prod1 = await prisma.product.findFirst({ where: { sku: 'ELEC-PRO-001' } });
  if (prod1) {
    await prisma.order.create({
      data: {
        userId: user1.id,
        subtotal: 4499.10,
        tax: 809.84,
        shipping: 99.00,
        discountAmount: 0,
        totalAmount: 5407.94,
        paymentMethod: 'Test Card',
        status: 'SHIPPED',
        shippingAddress: user1.address || 'Default Address',
        contactPhone: user1.phone || '9876543210',
        orderItems: {
          create: [
            {
              productId: prod1.id,
              name: prod1.name,
              price: prod1.price * 0.9,
              quantity: 1,
              image: prod1.image
            }
          ]
        }
      }
    });
  }

  console.log('Database seeding complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
