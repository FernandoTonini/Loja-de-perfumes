export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  comparePrice?: number | null;
  images: string[];
  categoryId: string;
  category?: Category;
  brand: string;
  ml?: number | null;
  gender: string;
  topNotes?: string | null;
  heartNotes?: string | null;
  baseNotes?: string | null;
  inStock: boolean;
  featured: boolean;
  dropshippingId?: string | null;
  dropshippingSku?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  image?: string | null;
  createdAt?: string;
}

export interface CartItem {
  id: string;
  productId: string;
  name: string;
  brand: string;
  price: number;
  image: string;
  ml?: number | null;
  quantity: number;
}

export interface Order {
  id: string;
  status: string;
  subtotal: number;
  shipping: number;
  total: number;
  shippingName: string;
  shippingEmail: string;
  shippingPhone?: string | null;
  shippingStreet: string;
  shippingNumber: string;
  shippingComplement?: string | null;
  shippingNeighborhood: string;
  shippingCity: string;
  shippingState: string;
  shippingZip: string;
  paymentId?: string | null;
  paymentMethod?: string | null;
  paymentStatus: string;
  dropshippingOrderId?: string | null;
  dropshippingStatus?: string | null;
  trackingCode?: string | null;
  items?: OrderItem[];
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  id: string;
  productId: string;
  quantity: number;
  price: number;
  name: string;
  image?: string | null;
}

export interface CheckoutFormData {
  name: string;
  email: string;
  phone: string;
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  zip: string;
  paymentMethod: "stripe" | "pix";
}

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role: string;
    };
  }
}
