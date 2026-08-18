export interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  address?: string;
  phone?: string;
  passwordHash?: string; // Planted bug: leaked hash
  createdAt?: string;
}

export interface Product {
  id: number;
  name: string;
  description: string;
  category: string;
  price: number;
  discount?: number | null;
  stock: number;
  rating: number;
  image: string;
  sku: string;
  reviews?: Review[];
}

export interface Review {
  id: number;
  productId: number;
  userId: number;
  userName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface CartItem {
  id: number;
  userId: number;
  productId: number;
  quantity: number;
  product: Product;
}

export interface OrderItem {
  id: number;
  orderId: number;
  productId: number;
  name: string;
  price: number;
  quantity: number;
  image: string;
}

export interface Order {
  id: number;
  userId: number;
  subtotal: number;
  tax: number;
  shipping: number;
  discountAmount: number;
  totalAmount: number;
  paymentMethod: string;
  status: string;
  shippingAddress: string;
  contactPhone: string;
  createdAt: string;
  orderItems: OrderItem[];
  user?: User;
}
