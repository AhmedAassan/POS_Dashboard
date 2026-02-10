import { Component, OnInit, OnDestroy, inject, signal, computed, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';

// PrimeNG Modules
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { SelectModule } from 'primeng/select';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { RadioButtonModule } from 'primeng/radiobutton';
import { CheckboxModule } from 'primeng/checkbox';
import { TextareaModule } from 'primeng/textarea';
import { SkeletonModule } from 'primeng/skeleton';
import { BadgeModule } from 'primeng/badge';
import { TooltipModule } from 'primeng/tooltip';
import { DividerModule } from 'primeng/divider';
import { ScrollPanelModule } from 'primeng/scrollpanel';
import { TagModule } from 'primeng/tag';
import { PaginatorModule, PaginatorState } from 'primeng/paginator';
import { MessageModule } from 'primeng/message';
import { RippleModule } from 'primeng/ripple';
import { InputGroupModule } from 'primeng/inputgroup';
import { InputGroupAddonModule } from 'primeng/inputgroupaddon';
import { DrawerModule } from 'primeng/drawer';
import { BadgeDirective } from 'primeng/badge';
import { ProgressSpinnerModule } from 'primeng/progressspinner';

// Services
import { ProductsService, Product } from '../../services/products';
import { CategoriesService, Category } from '../../services/categories';
import {
  CartService,
  CartItem,
  ProductUnit,
  ProductAddition,
  PRODUCT_UNITS,
  PRODUCT_ADDITIONS
} from '../../services/cart';
import { UiTextService } from '../../core/services/ui-text';
import { DirectionService } from '../../core/services/direction';

@Component({
  selector: 'app-pos',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CardModule,
    ButtonModule,
    DialogModule,
    SelectModule,
    InputTextModule,
    InputNumberModule,
    RadioButtonModule,
    CheckboxModule,
    TextareaModule,
    SkeletonModule,
    BadgeModule,
    TooltipModule,
    DividerModule,
    ScrollPanelModule,
    TagModule,
    PaginatorModule,
    MessageModule,
    RippleModule,
    InputGroupModule,
    InputGroupAddonModule,
    DrawerModule,
    BadgeDirective,
    ProgressSpinnerModule
  ],
  templateUrl: './pos.html',
  styleUrl: './pos.scss'
})
export class Pos implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly productsService = inject(ProductsService);
  private readonly categoriesService = inject(CategoriesService);
  private readonly cartService = inject(CartService);
  private readonly uiTextService = inject(UiTextService);
  private readonly directionService = inject(DirectionService);

  private readonly destroy$ = new Subject<void>();
  private readonly searchSubject$ = new Subject<string>();

  // UI Text
  readonly texts = this.uiTextService.texts;
  readonly isRtl = this.directionService.isRtl;

  // Products State
  readonly products = signal<Product[]>([]);
  readonly totalProducts = signal(0);
  readonly isLoading = signal(true);
  readonly hasError = signal(false);
  readonly currentPage = signal(0);
  readonly pageSize = signal(12);

  // Categories State
  readonly categories = signal<Category[]>([]);
  readonly selectedCategory = signal<string | null>(null);
  readonly categoriesLoading = signal(true);

  // Search State
  readonly searchQuery = signal('');

  // Product Dialog State
  readonly showProductDialog = signal(false);
  readonly selectedProduct = signal<Product | null>(null);
  readonly productLoading = signal(false);
  readonly selectedQuantity = signal(1);
  readonly selectedUnit = signal<ProductUnit>(PRODUCT_UNITS[0]);
  readonly selectedAdditions = signal<ProductAddition[]>([]);
  readonly productNotes = signal('');

  // Summary Dialog State
  readonly showSummaryDialog = signal(false);
  readonly discountInput = signal(0);

  // Mobile Cart Sidebar State
  readonly showMobileCart = signal(false);
  readonly isMobileView = signal(false);

  // Cart from service
  readonly cartItems = this.cartService.cartItems;
  readonly cartSummary = this.cartService.summary;
  readonly isCartEmpty = this.cartService.isEmpty;
  readonly cartItemCount = this.cartService.itemCount;

  // Static data
  readonly units = PRODUCT_UNITS;
  readonly additions = PRODUCT_ADDITIONS;

  // Skeleton array for loading state
  readonly skeletonItems = Array.from({ length: 12 }, (_, i) => i + 1);

  // Computed
  readonly showingFrom = computed(() => {
    if (this.totalProducts() === 0) return 0;
    return this.currentPage() * this.pageSize() + 1;
  });

  readonly showingTo = computed(() => 
    Math.min((this.currentPage() + 1) * this.pageSize(), this.totalProducts())
  );

  readonly categoryOptions = computed(() => {
    const allOption = { 
      slug: '', 
      name: this.texts().allCategories, 
      url: '' 
    };
    return [allOption, ...this.categories()];
  });

  readonly calculatedItemPrice = computed(() => {
    const product = this.selectedProduct();
    if (!product) return 0;

    const basePrice = product.price - (product.price * product.discountPercentage / 100);
    const unitPrice = basePrice * this.selectedUnit().priceModifier;
    const additionsPrice = this.selectedAdditions().reduce((sum, add) => sum + add.price, 0);
    return (unitPrice + additionsPrice) * this.selectedQuantity();
  });

  // Mobile cart sidebar position based on RTL
  readonly cartSidebarPosition = computed(() => this.isRtl() ? 'left' : 'right');

  // Check if results are empty (not loading and no products)
  readonly showEmptyState = computed(() => 
    !this.isLoading() && this.products().length === 0
  );

  // Check if we have active filters
  readonly hasActiveFilters = computed(() => 
    !!this.searchQuery() || !!this.selectedCategory()
  );

  constructor() {
    this.checkMobileView();
  }

  @HostListener('window:resize')
  onResize(): void {
    this.checkMobileView();
  }

  private checkMobileView(): void {
    if (typeof window !== 'undefined') {
      this.isMobileView.set(window.innerWidth < 1024);
    }
  }

  ngOnInit(): void {
    this.loadCategories();
    this.setupSearchSubscription();
    this.handleRouteParams();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Toggle mobile cart sidebar
   */
  toggleMobileCart(): void {
    this.showMobileCart.update(v => !v);
  }

  /**
   * Open mobile cart
   */
  openMobileCart(): void {
    this.showMobileCart.set(true);
  }

  /**
   * Close mobile cart
   */
  closeMobileCart(): void {
    this.showMobileCart.set(false);
  }

  /**
   * Setup search debounce subscription
   */
  private setupSearchSubscription(): void {
    this.searchSubject$
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(query => {
        this.searchQuery.set(query);
        this.currentPage.set(0);
        this.loadProducts();
      });
  }

  /**
   * Handle route query params for search
   */
  private handleRouteParams(): void {
    this.route.queryParams
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        if (params['search']) {
          this.searchQuery.set(params['search']);
          this.loadProducts();
        } else {
          this.loadProducts();
        }
      });
  }

  /**
   * Load categories
   */
  private loadCategories(): void {
    this.categoriesLoading.set(true);
    this.categoriesService.getCategories()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (categories) => {
          this.categories.set(categories);
          this.categoriesLoading.set(false);
        },
        error: () => {
          this.categories.set([]);
          this.categoriesLoading.set(false);
        }
      });
  }

  /**
   * Load products based on current filters
   */
  loadProducts(): void {
    this.isLoading.set(true);
    this.hasError.set(false);

    const params = {
      limit: this.pageSize(),
      skip: this.currentPage() * this.pageSize()
    };

    const query = this.searchQuery();
    const category = this.selectedCategory();

    let request$;

    if (query) {
      request$ = this.productsService.searchProducts(query, params);
    } else if (category) {
      request$ = this.productsService.getProductsByCategory(category, params);
    } else {
      request$ = this.productsService.getProducts(params);
    }

    request$
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.products.set(response.products);
          this.totalProducts.set(response.total);
          this.isLoading.set(false);
          this.hasError.set(false);
        },
        error: () => {
          this.isLoading.set(false);
          this.hasError.set(true);
          this.products.set([]);
          this.totalProducts.set(0);
        }
      });
  }

  /**
   * Clear all filters and reload products
   */
  clearFilters(): void {
    this.searchQuery.set('');
    this.selectedCategory.set(null);
    this.currentPage.set(0);
    this.loadProducts();
  }

  /**
   * Handle category change
   */
  onCategoryChange(category: Category | null): void {
    this.selectedCategory.set(category?.slug || null);
    this.searchQuery.set('');
    this.currentPage.set(0);
    this.loadProducts();
  }

  /**
   * Handle search input
   */
  onSearchInput(query: string): void {
    this.searchSubject$.next(query);
  }

  /**
   * Handle pagination
   */
  onPageChange(event: PaginatorState): void {
    this.currentPage.set(event.page || 0);
    this.pageSize.set(event.rows || 12);
    this.loadProducts();
  }

  /**
   * Open product detail dialog
   */
  openProductDialog(product: Product): void {
    this.selectedProduct.set(product);
    this.resetDialogState();
    this.showProductDialog.set(true);
  }

  /**
   * Close product dialog
   */
  closeProductDialog(): void {
    this.showProductDialog.set(false);
    this.selectedProduct.set(null);
    this.resetDialogState();
  }
  
  /**
   * Reset dialog state
   */
  private resetDialogState(): void {
    this.selectedQuantity.set(1);
    this.selectedUnit.set(PRODUCT_UNITS[0]);
    this.selectedAdditions.set([]);
    this.productNotes.set('');
  }


  getFormattedSearchQuery(): string {
  // Good practice to handle potential nulls, though your template @if handles it
  const query = this.searchQuery(); 
  return query ? `"${query}"` : '';
  }


  /**
   * Add current product to cart
   */
  addToCart(): void {
    const product = this.selectedProduct();
    if (!product) return;

    this.cartService.addToCart(
      product,
      this.selectedQuantity(),
      this.selectedUnit(),
      this.selectedAdditions(),
      this.productNotes() || undefined
    );

    this.closeProductDialog();

    // On mobile, show cart after adding
    if (this.isMobileView()) {
      this.openMobileCart();
    }
  }

  /**
   * Toggle addition selection
   */
  toggleAddition(addition: ProductAddition): void {
    const current = this.selectedAdditions();
    const index = current.findIndex(a => a.id === addition.id);

    if (index >= 0) {
      this.selectedAdditions.set(current.filter(a => a.id !== addition.id));
    } else {
      this.selectedAdditions.set([...current, addition]);
    }
  }

  /**
   * Check if addition is selected
   */
  isAdditionSelected(addition: ProductAddition): boolean {
    return this.selectedAdditions().some(a => a.id === addition.id);
  }

  /**
   * Increment cart item quantity
   */
  incrementCartItem(item: CartItem): void {
    this.cartService.incrementQuantity(item.id);
  }

  /**
   * Decrement cart item quantity
   */
  decrementCartItem(item: CartItem): void {
    this.cartService.decrementQuantity(item.id);
  }

  /**
   * Remove item from cart
   */
  removeCartItem(item: CartItem): void {
    this.cartService.removeItem(item.id);
  }

  /**
   * Clear entire cart
   */
  clearCart(): void {
    this.cartService.clearCart();
  }

  /**
   * Open summary dialog
   */
  openSummaryDialog(): void {
    this.discountInput.set(this.cartSummary().discountPercentage);
    this.showSummaryDialog.set(true);
    // Close mobile cart if open
    this.closeMobileCart();
  }

  /**
   * Close summary dialog
   */
  closeSummaryDialog(): void {
    this.showSummaryDialog.set(false);
  }

  /**
   * Apply discount
   */
  applyDiscount(): void {
    this.cartService.setDiscount(this.discountInput());
  }

  /**
   * Place order (placeholder)
   */
  placeOrder(): void {
    this.cartService.clearCart();
    this.closeSummaryDialog();
  }

  /**
   * Get discounted price
   */
  getDiscountedPrice(product: Product): number {
    return this.productsService.calculateDiscountedPrice(product);
  }

  /**
   * Get unit name based on language
   */
  getUnitName(unit: ProductUnit): string {
    return this.isRtl() ? unit.nameAr : unit.name;
  }

  /**
   * Get addition name based on language
   */
  getAdditionName(addition: ProductAddition): string {
    return this.isRtl() ? addition.nameAr : addition.name;
  }

  /**
   * Format price
   */
  formatPrice(price: number): string {
    return `$${price.toFixed(2)}`;
  }

  /**
   * Track by for products
   */
  trackByProductId(index: number, product: Product): number {
    return product.id;
  }

  /**
   * Track by for cart items
   */
  trackByCartItemId(index: number, item: CartItem): string {
    return item.id;
  }

  /**
   * Track by for skeleton items
   */
  trackByIndex(index: number): number {
    return index;
  }

  /**
   * Handle keyboard navigation for product cards
   */
  onProductKeydown(event: KeyboardEvent, product: Product): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.openProductDialog(product);
    }
  }
}