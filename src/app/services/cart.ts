import { Injectable, signal, computed, inject } from '@angular/core';
import { MessageService } from 'primeng/api';
import { Product } from './products';
import { DirectionService } from '../core/services/direction';

// ============================================
// Types / Interfaces
// ============================================

export interface ProductUnit {
  id: string;
  name: string;
  nameAr: string;
  priceModifier: number; // multiplier for price
}

export interface ProductAddition {
  id: string;
  name: string;
  nameAr: string;
  price: number;
}

export interface CartItem {
  id: string; // unique cart item id
  product: Product;
  quantity: number;
  selectedUnit: ProductUnit;
  selectedAdditions: ProductAddition[];
  unitPrice: number;
  totalPrice: number;
  notes?: string;
}

export interface CartSummary {
  subtotal: number;
  discount: number;
  discountPercentage: number;
  tax: number;
  taxPercentage: number;
  total: number;
  itemCount: number;
}

// ============================================
// Toast Messages
// ============================================

interface ToastMessages {
  addedToCart: string;
  addedToCartDetail: string;
  removedFromCart: string;
  cartCleared: string;
  discountApplied: string;
}

const TOAST_MESSAGES_EN: ToastMessages = {
  addedToCart: 'Added to Cart',
  addedToCartDetail: 'has been added to your cart',
  removedFromCart: 'Item removed from cart',
  cartCleared: 'Cart has been cleared',
  discountApplied: 'Discount applied successfully'
};

const TOAST_MESSAGES_AR: ToastMessages = {
  addedToCart: 'تمت الإضافة للسلة',
  addedToCartDetail: 'تمت إضافته إلى سلة التسوق',
  removedFromCart: 'تم حذف المنتج من السلة',
  cartCleared: 'تم مسح السلة',
  discountApplied: 'تم تطبيق الخصم بنجاح'
};

// ============================================
// Static Data
// ============================================

export const PRODUCT_UNITS: ProductUnit[] = [
  { id: 'piece', name: 'Piece', nameAr: 'قطعة', priceModifier: 1 },
  { id: 'half', name: 'Half', nameAr: 'نصف', priceModifier: 0.5 },
  { id: 'quarter', name: 'Quarter', nameAr: 'ربع', priceModifier: 0.25 },
  { id: 'dozen', name: 'Dozen', nameAr: 'درزن', priceModifier: 10 }
];

export const PRODUCT_ADDITIONS: ProductAddition[] = [
  { id: 'extra-sauce', name: 'Extra Sauce', nameAr: 'صوص إضافي', price: 1.5 },
  { id: 'cheese', name: 'Extra Cheese', nameAr: 'جبنة إضافية', price: 2.0 },
  { id: 'spicy', name: 'Spicy', nameAr: 'حار', price: 0.5 },
  { id: 'gift-wrap', name: 'Gift Wrap', nameAr: 'تغليف هدية', price: 3.0 }
];

const TAX_PERCENTAGE = 15; // 15% VAT
const CART_STORAGE_KEY = 'pos-cart';

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private readonly messageService = inject(MessageService);
  private readonly directionService = inject(DirectionService);

  // Cart items signal
  private readonly cartItemsSignal = signal<CartItem[]>(this.loadCartFromStorage());

  // Discount percentage signal
  private readonly discountPercentageSignal = signal<number>(this.loadDiscountFromStorage());

  // Public readonly signals
  readonly cartItems = this.cartItemsSignal.asReadonly();
  readonly discountPercentage = this.discountPercentageSignal.asReadonly();

  // Computed values
  readonly itemCount = computed(() => 
    this.cartItemsSignal().reduce((sum, item) => sum + item.quantity, 0)
  );

  readonly subtotal = computed(() =>
    this.cartItemsSignal().reduce((sum, item) => sum + item.totalPrice, 0)
  );

  readonly discount = computed(() => 
    this.subtotal() * (this.discountPercentageSignal() / 100)
  );

  readonly taxableAmount = computed(() => 
    this.subtotal() - this.discount()
  );

  readonly tax = computed(() => 
    this.taxableAmount() * (TAX_PERCENTAGE / 100)
  );

  readonly total = computed(() => 
    this.taxableAmount() + this.tax()
  );

  readonly summary = computed<CartSummary>(() => ({
    subtotal: this.roundPrice(this.subtotal()),
    discount: this.roundPrice(this.discount()),
    discountPercentage: this.discountPercentageSignal(),
    tax: this.roundPrice(this.tax()),
    taxPercentage: TAX_PERCENTAGE,
    total: this.roundPrice(this.total()),
    itemCount: this.itemCount()
  }));

  readonly isEmpty = computed(() => this.cartItemsSignal().length === 0);

  /**
   * Get current toast messages based on language
   */
  private get toastMessages(): ToastMessages {
    return this.directionService.isRtl() ? TOAST_MESSAGES_AR : TOAST_MESSAGES_EN;
  }

  /**
   * Add product to cart
   */
  addToCart(
    product: Product,
    quantity: number = 1,
    selectedUnit: ProductUnit = PRODUCT_UNITS[0],
    selectedAdditions: ProductAddition[] = [],
    notes?: string
  ): void {
    if (!product || quantity <= 0) {
      return;
    }

    const basePrice = product.price - (product.price * product.discountPercentage / 100);
    const unitPrice = basePrice * selectedUnit.priceModifier;
    const additionsPrice = selectedAdditions.reduce((sum, add) => sum + add.price, 0);
    const itemUnitPrice = unitPrice + additionsPrice;
    const totalPrice = itemUnitPrice * quantity;

    const cartItem: CartItem = {
      id: this.generateCartItemId(),
      product,
      quantity,
      selectedUnit,
      selectedAdditions: [...selectedAdditions],
      unitPrice: this.roundPrice(itemUnitPrice),
      totalPrice: this.roundPrice(totalPrice),
      notes
    };

    this.cartItemsSignal.update(items => [...items, cartItem]);
    this.saveCartToStorage();

    // Show success toast
    this.showSuccessToast(
      this.toastMessages.addedToCart,
      `${product.title} ${this.toastMessages.addedToCartDetail}`
    );
  }

  /**
   * Update item quantity
   */
  updateQuantity(cartItemId: string, quantity: number): void {
    if (!cartItemId) {
      return;
    }

    if (quantity <= 0) {
      this.removeItem(cartItemId);
      return;
    }

    this.cartItemsSignal.update(items =>
      items.map(item => {
        if (item.id === cartItemId) {
          const totalPrice = item.unitPrice * quantity;
          return { ...item, quantity, totalPrice: this.roundPrice(totalPrice) };
        }
        return item;
      })
    );
    this.saveCartToStorage();
  }

  /**
   * Increment item quantity
   */
  incrementQuantity(cartItemId: string): void {
    const item = this.cartItemsSignal().find(i => i.id === cartItemId);
    if (item) {
      this.updateQuantity(cartItemId, item.quantity + 1);
    }
  }

  /**
   * Decrement item quantity
   */
  decrementQuantity(cartItemId: string): void {
    const item = this.cartItemsSignal().find(i => i.id === cartItemId);
    if (item) {
      this.updateQuantity(cartItemId, item.quantity - 1);
    }
  }

  /**
   * Remove item from cart
   */
  removeItem(cartItemId: string): void {
    if (!cartItemId) {
      return;
    }

    const item = this.cartItemsSignal().find(i => i.id === cartItemId);
    this.cartItemsSignal.update(items => items.filter(item => item.id !== cartItemId));
    this.saveCartToStorage();

    // Show info toast
    if (item) {
      this.showInfoToast(this.toastMessages.removedFromCart, item.product.title);
    }
  }

  /**
   * Clear entire cart
   */
  clearCart(): void {
    const hadItems = this.cartItemsSignal().length > 0;
    this.cartItemsSignal.set([]);
    this.discountPercentageSignal.set(0);
    this.saveCartToStorage();

    // Show info toast only if cart had items
    if (hadItems) {
      this.showInfoToast(this.toastMessages.cartCleared, '');
    }
  }

  /**
   * Set discount percentage
   */
  setDiscount(percentage: number): void {
    const validPercentage = Math.max(0, Math.min(100, percentage || 0));
    this.discountPercentageSignal.set(validPercentage);
    this.saveCartToStorage();

    if (validPercentage > 0) {
      this.showSuccessToast(this.toastMessages.discountApplied, `${validPercentage}%`);
    }
  }

  /**
   * Get static units
   */
  getUnits(): ProductUnit[] {
    return PRODUCT_UNITS;
  }

  /**
   * Get static additions
   */
  getAdditions(): ProductAddition[] {
    return PRODUCT_ADDITIONS;
  }

  /**
   * Get cart item by ID
   */
  getCartItem(cartItemId: string): CartItem | undefined {
    return this.cartItemsSignal().find(item => item.id === cartItemId);
  }

  /**
   * Check if product is in cart
   */
  isProductInCart(productId: number): boolean {
    return this.cartItemsSignal().some(item => item.product.id === productId);
  }

  /**
   * Show success toast notification
   */
  private showSuccessToast(summary: string, detail: string): void {
    this.messageService.add({
      severity: 'success',
      summary,
      detail,
      life: 3000
    });
  }

  /**
   * Show info toast notification
   */
  private showInfoToast(summary: string, detail: string): void {
    this.messageService.add({
      severity: 'info',
      summary,
      detail,
      life: 2500
    });
  }

  /**
   * Generate unique cart item ID
   */
  private generateCartItemId(): string {
    return `cart-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  }

  /**
   * Round price to 2 decimal places
   */
  private roundPrice(price: number): number {
    return Math.round(price * 100) / 100;
  }

  /**
   * Save cart to localStorage
   */
  private saveCartToStorage(): void {
    if (typeof localStorage === 'undefined') {
      return;
    }

    try {
      const cartData = {
        items: this.cartItemsSignal(),
        discountPercentage: this.discountPercentageSignal()
      };
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartData));
    } catch (error) {
      // Handle localStorage quota exceeded or other errors silently
    }
  }

  /**
   * Load cart from localStorage
   */
  private loadCartFromStorage(): CartItem[] {
    if (typeof localStorage === 'undefined') {
      return [];
    }
    
    try {
      const cartJson = localStorage.getItem(CART_STORAGE_KEY);
      if (!cartJson) {
        return [];
      }

      const cartData = JSON.parse(cartJson);
      return Array.isArray(cartData.items) ? cartData.items : [];
    } catch {
      return [];
    }
  }

  /**
   * Load discount from localStorage
   */
  private loadDiscountFromStorage(): number {
    if (typeof localStorage === 'undefined') {
      return 0;
    }
    
    try {
      const cartJson = localStorage.getItem(CART_STORAGE_KEY);
      if (!cartJson) {
        return 0;
      }

      const cartData = JSON.parse(cartJson);
      return typeof cartData.discountPercentage === 'number' ? cartData.discountPercentage : 0;
    } catch {
      return 0;
    }
  }
}