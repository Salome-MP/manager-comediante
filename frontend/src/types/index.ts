// Roles
export type Role = 'SUPER_ADMIN' | 'STAFF' | 'ARTIST' | 'USER';

// User
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  artistId?: string | null;
  isApproved?: boolean | null;
}

// Auth
export interface AuthResponse {
  user: User;
  accessToken: string;
}

// Artist
export interface Artist {
  id: string;
  stageName: string;
  slug: string;
  tagline?: string;
  biography?: string;
  profileImage?: string;
  bannerImage?: string;
  isActive: boolean;
  isFeatured: boolean;
  commissionRate: number;
  customizations?: ArtistCustomization[];
  _count?: {
    followers: number;
    artistProducts: number;
    shows: number;
  };
}

// Category
export interface Category {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  sortOrder: number;
  parentId?: string | null;
  children?: Category[];
}

// Product variant
export interface ProductVariant {
  name: string;
  options: string[];
}

// Product (base)
export interface Product {
  id: string;
  name: string;
  slug: string;
  description?: string;
  categoryId: string;
  category?: Category;
  manufacturingCost: number;
  suggestedPrice: number;
  images: string[];
  variants: ProductVariant[];
  isActive: boolean;
}

// Review stats (returned with product listings)
export interface ReviewStats {
  averageRating: number;
  totalReviews: number;
}

// ArtistProduct
export interface ArtistProduct {
  id: string;
  artistId: string;
  productId: string;
  salePrice: number;
  artistCommission: number;
  stock: number;
  isActive: boolean;
  isFeatured: boolean;
  customImages: string[];
  product?: Product;
  artist?: Artist;
  reviewStats?: ReviewStats;
}

// Cart
export interface CartItem {
  id: string;
  artistProductId: string;
  quantity: number;
  variantSelection?: Record<string, string>;
  personalization?: string;
  artistProduct?: ArtistProduct;
  customizations?: CartItemCustomization[];
}

export interface CartItemCustomization {
  id: string;
  type: string;
  price: number;
}

export interface Cart {
  id: string;
  items: CartItem[];
  subtotal: number;
  customizationsTotal: number;
  total: number;
}

// Order
export type OrderStatus = 'PENDING' | 'PAID' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | 'REFUNDED';

export interface Order {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  subtotal: number;
  shippingCost: number;
  tax: number;
  total: number;
  paymentId?: string;
  paymentMethod?: string;
  expiresAt?: string | null;
  trackingNumber?: string;
  carrier?: string;
  shippedAt?: string;
  deliveredAt?: string;
  fulfillmentNotes?: string;
  createdAt: string;
  items?: OrderItem[];
  user?: { id: string; email: string; firstName: string; lastName: string };
  returnRequests?: ReturnRequest[];
}

export interface OrderItem {
  id: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  variantSelection?: Record<string, string>;
  personalization?: string;
  artistProduct?: ArtistProduct;
  customizations?: OrderItemCustomization[];
}

export type CustomizationStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export interface OrderItemCustomization {
  id: string;
  type: string;
  price: number;
  fulfilled: boolean;
  status: CustomizationStatus;
  fulfilledAt?: string;
  fulfilledBy?: string;
  attachmentUrl?: string;
  notes?: string;
  scheduledDate?: string;
  meetingLink?: string;
}

// Show
export type ShowStatus = 'SCHEDULED' | 'CANCELLED' | 'COMPLETED';

export interface Show {
  id: string;
  name: string;
  slug: string;
  description?: string;
  venue: string;
  address?: string;
  city?: string;
  date: string;
  image?: string;
  ticketPrice?: number;
  totalCapacity?: number;
  ticketsEnabled: boolean;
  status: ShowStatus;
  artist?: Artist;
}

// Ticket
export interface Ticket {
  id: string;
  qrCode: string;
  status: string;
  price: number;
  paymentId?: string | null;
  expiresAt?: string | null;
  show?: Show;
}

// Customizations
export type CustomizationType = 'AUTOGRAPH' | 'HANDWRITTEN_LETTER' | 'VIDEO_GREETING' | 'VIDEO_CALL' | 'PRODUCT_PERSONALIZATION';

export interface ArtistCustomization {
  id: string;
  artistId: string;
  type: CustomizationType;
  price: number;
  isActive: boolean;
  description?: string;
  meetingLink?: string;
  callDuration?: number;
  maxPerWeek?: number;
  availabilitySlots?: { dayOfWeek: number; startTime: string; endTime: string }[];
}

// Referral
export interface Referral {
  id: string;
  code: string;
  ownerId: string;
  commissionRate: number;
  totalClicks: number;
  createdAt: string;
  owner?: { firstName: string; lastName: string; email: string };
  referredUsers?: { id: string; firstName: string; lastName: string; createdAt: string }[];
  commissions?: Commission[];
  totalEarnings?: number;
  pendingEarnings?: number;
  _count?: { referredUsers: number; orders: number; commissions: number };
}

// Commission
export type CommissionStatus = 'PENDING' | 'PAID';

export interface Commission {
  id: string;
  orderId?: string;
  ticketId?: string;
  amount: number;
  rate: number;
  type: string;
  status: CommissionStatus;
  paidAt?: string;
  createdAt: string;
  artist?: { id: string; stageName: string; slug: string };
  order?: { orderNumber: string; total: number; createdAt: string };
  ticket?: { id: string; price: number; show?: { name: string } };
  referral?: { code: string; owner?: { firstName: string; lastName: string } };
}

// Return Request
export type ReturnRequestStatus = 'OPEN' | 'REVIEWING' | 'APPROVED' | 'REJECTED' | 'RESOLVED';

export interface ReturnRequest {
  id: string;
  orderId: string;
  userId: string;
  reason: string;
  description?: string;
  images: string[];
  status: ReturnRequestStatus;
  adminNotes?: string;
  resolvedAt?: string;
  resolvedBy?: string;
  createdAt: string;
  updatedAt: string;
  order?: Order;
  user?: { id: string; firstName: string; lastName: string; email: string };
}

// Video Call Slot
export interface VideoCallSlot {
  id: string;
  artistCustomizationId: string;
  orderCustomizationId?: string;
  date: string;
  duration: number;
  isBooked: boolean;
}

// Notification
export type NotificationType = 'NEW_SALE' | 'ORDER_CONFIRMATION' | 'NEW_SHOW' | 'NEW_PRODUCT' | 'TICKET_PURCHASED' | 'REFERRAL_COMMISSION' | 'GENERAL' | 'CUSTOMIZATION_FULFILLED' | 'ORDER_SHIPPED' | 'ORDER_DELIVERED' | 'VIDEO_CALL_SCHEDULED' | 'RETURN_REQUEST_UPDATE';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  data?: Record<string, any>;
  createdAt: string;
}

// Payment preference
export interface PaymentPreference {
  preferenceId: string;
  initPoint: string;
  sandboxInitPoint: string;
}

// Community
export type CommunityMessageType = 'ANNOUNCEMENT' | 'CHAT';
export interface CommunityMessage {
  id: string;
  artistId: string;
  senderId: string;
  type: CommunityMessageType;
  content: string;
  isPinned: boolean;
  createdAt: string;
  sender: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

export interface CommunityArtist {
  id: string;
  stageName: string;
  slug: string;
  profileImage?: string;
  tagline?: string;
  _count: {
    communityMembers: number;
    communityMessages: number;
  };
}

// Commission Summary (admin liquidaciones)
export interface CommissionSummary {
  pendingAmount: number;
  pendingCount: number;
  paidThisMonthAmount: number;
  paidThisMonthCount: number;
  generatedThisMonthAmount: number;
  generatedThisMonthCount: number;
  totalPaidAllTime: number;
}

export interface BeneficiaryBreakdown {
  type: string;
  amount: number;
  count: number;
}

export interface ArtistPending {
  artistId: string;
  stageName: string;
  slug: string;
  profileImage: string | null;
  pendingAmount: number;
  pendingCount: number;
  breakdown: BeneficiaryBreakdown[];
}

export interface ReferrerPending {
  referralId: string;
  code: string;
  ownerName: string;
  pendingAmount: number;
  pendingCount: number;
  breakdown: BeneficiaryBreakdown[];
}

export interface BeneficiariesPendingResponse {
  artists: ArtistPending[];
  referrers: ReferrerPending[];
}

// Ticket Verification (public)
export interface TicketVerification {
  ticketId: string;
  status: string;
  price: number;
  isPaid: boolean;
  purchasedAt: string;
  buyerName: string;
  show: {
    id: string;
    name: string;
    slug: string;
    venue: string;
    address?: string;
    city?: string;
    date: string;
    image?: string;
    status: ShowStatus;
    artist: {
      id: string;
      stageName: string;
      slug: string;
      profileImage?: string;
    };
  };
}

// Paginated response
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}
