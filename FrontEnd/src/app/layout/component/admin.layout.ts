import { Component, OnDestroy, Renderer2, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { filter, Subscription } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { AvatarModule } from 'primeng/avatar';
import { DividerModule } from 'primeng/divider';
import { OverlayPanelModule } from 'primeng/overlaypanel';
import { BadgeModule } from 'primeng/badge';
import { AppMenu } from './app.menu';
import { AppTopbar } from './app.topbar';

@Component({
    selector: 'app-admin-layout',
    standalone: true,
    imports: [
        CommonModule, 
        RouterModule, 
        ButtonModule, 
        TooltipModule, 
        AvatarModule, 
        DividerModule, 
        OverlayPanelModule,
        BadgeModule,
        AppMenu,
        AppTopbar
    ],
    template: `
    <div class="min-h-screen flex flex-column surface-section">
        <!-- Top Bar -->
        <app-topbar></app-topbar>

        <div class="flex flex-1">
            <!-- Sidebar -->
            <div class="w-64 border-right-1 surface-border hidden lg:block">
                <div class="sticky top-0 pt-3 h-full">
                    <app-menu></app-menu>
                </div>
            </div>

            <!-- Content -->
            <div class="flex-1 p-4 lg:p-6">
                <router-outlet></router-outlet>
            </div>
        </div>
    </div>
    `
})
export class AdminLayout implements OnDestroy {
    menuOutsideClickListener: any;

    overlayMenuOpenSubscription: Subscription;

    menuClick: boolean = false;

    profileMenuVisible: boolean = false;

    @ViewChild(AppTopbar) appTopbar!: AppTopbar;

    constructor(private renderer: Renderer2, public router: Router) {
        this.overlayMenuOpenSubscription = this.router.events.pipe(filter(event => event instanceof NavigationEnd)).subscribe(() => {
            // Close overlay menu on navigation
            this.profileMenuVisible = false;
        });
    }

    onMenuButtonClick(event: Event) {
        this.menuClick = true;
    }

    onProfileClick() {
        this.profileMenuVisible = !this.profileMenuVisible;
    }

    ngOnDestroy() {
        if (this.overlayMenuOpenSubscription) {
            this.overlayMenuOpenSubscription.unsubscribe();
        }

        if (this.menuOutsideClickListener) {
            this.menuOutsideClickListener();
        }
    }
}
