import { Component, EventEmitter, Input, Output, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { RippleModule } from 'primeng/ripple';
import { TooltipModule } from 'primeng/tooltip';
import { UiTextService } from '../../core/services/ui-text';
import { DirectionService } from '../../core/services/direction';

export interface SidebarMenuItem {
  labelKey: string;
  icon: string;
  route?: string;
  action?: () => void;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    RouterLinkActive,
    ButtonModule,
    RippleModule,
    TooltipModule
  ],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.scss'
})
export class Sidebar {
  private readonly uiTextService = inject(UiTextService);
  private readonly directionService = inject(DirectionService);

  @Input() collapsed = false;
  @Output() collapsedChange = new EventEmitter<boolean>();
  @Output() logoutClick = new EventEmitter<void>();

  // Expose texts as computed signal for template
  readonly texts = this.uiTextService.texts;
  readonly isRtl = this.directionService.isRtl;

  // Menu items with label keys
  readonly menuItemsConfig: SidebarMenuItem[] = [
    { labelKey: 'dashboard', icon: 'pi pi-th-large', route: '/dashboard' },
    { labelKey: 'pos', icon: 'pi pi-shopping-cart', route: '/pos' },
    { labelKey: 'tables', icon: 'pi pi-table', route: '/tables' },
    { labelKey: 'orders', icon: 'pi pi-list', route: '/orders' },
    { labelKey: 'transactions', icon: 'pi pi-credit-card', route: '/transactions' },
    { labelKey: 'shift', icon: 'pi pi-clock', route: '/shift' },
    { labelKey: 'settings', icon: 'pi pi-cog', route: '/settings' },
    { labelKey: 'schedulerBooking', icon: 'pi pi-calendar', route: '/scheduler-booking' }
  ];
  
  // Computed menu items with resolved labels
  readonly menuItems = computed(() => {
    const currentTexts = this.texts();
    return this.menuItemsConfig.map(item => ({
      ...item,
      label: currentTexts[item.labelKey as keyof typeof currentTexts] as string
    }));
  });

  // Computed logout label
  readonly logoutLabel = computed(() => this.texts().logout);

  // Computed collapse tooltip
  readonly collapseTooltip = computed(() => {
    const texts = this.texts();
    return this.collapsed ? (this.isRtl() ? 'توسيع' : 'Expand') : (this.isRtl() ? 'طي' : 'Collapse');
  });

  toggleCollapse(): void {
    this.collapsed = !this.collapsed;
    this.collapsedChange.emit(this.collapsed);
  }

  onLogout(): void {
    this.logoutClick.emit();
  }
}