import { Routes } from '@angular/router';
import { AppLayout } from './app/layout/component/app.layout';
import { Dashboard } from './app/pages/dashboard/dashboard';
import { Documentation } from './app/pages/documentation/documentation';
import { Landing } from './app/pages/landing/landing';
import { Notfound } from './app/pages/notfound/notfound';
import { AdminLayout } from './app/layout/component/admin.layout';
import { ClientLayout } from './app/layout/component/client.layout';

import { UsersHistory } from './app/pages/usershistory/usershistory';
import { AiDashboard } from './app/pages/ai-dashboard/ai-dashboard';
import { ChatHistoryComponent } from './app/pages/chat-history/chat-history';
import { UsersComponent } from './app/pages/users/users';
import { NewChatroomComponent } from './app/pages/new-chatroom/new-chatroom.component';
import { AuthGuard } from './app/services/auth.guard';
import { Evaluations } from './app/pages/dashboard/evaluations/evaluations';

export const appRoutes: Routes = [
    {
        path: 'dashboard',
        component: AppLayout,
        canActivate: [AuthGuard],
        data: { requiresAdmin: true },
        children: [
            { path: '', component: Dashboard },
            { path: 'users', component: UsersComponent },
            { path: 'evaluations', component: Evaluations },
            { path: 'uikit', loadChildren: () => import('./app/pages/uikit/uikit.routes') },
            { path: 'documentation', component: Documentation },
            { path: 'pages', loadChildren: () => import('./app/pages/pages.routes') }
        ]
    },
    // Also add a lowercase redirect for compatibility with existing links
    {
        path: 'Dashboard',
        redirectTo: 'dashboard',
        pathMatch: 'full'
    },
    {
        path: 'admin',
        component: AdminLayout,
        canActivate: [AuthGuard],
        data: { requiresAdmin: true },
        children: [
            { path: 'users', component: UsersHistory },
            { path: 'dashboard', component: AiDashboard }
        ]
    },
    {
        path: 'chat',
        component: ClientLayout,
        canActivate: [AuthGuard],
        children: [
            { path: '', redirectTo: 'new', pathMatch: 'full' },
            { path: 'new', component: NewChatroomComponent },
            { path: ':id', component: NewChatroomComponent }
        ]
    },

    { path: 'landing', component: Landing },
    { path: 'notfound', component: Notfound },
    // Auth routes should be directly accessible without auth guard
    { path: '', loadChildren: () => import('./app/pages/auth/auth.routes') },
    { path: '**', redirectTo: '/notfound' }
];
