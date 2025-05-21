import { Routes } from '@angular/router';
import { Access } from './access';
import { Login } from './login';
import { Error } from './error';
import { Register } from './register';
import { GoogleCallback } from './google-callback';

export default [
    { path: 'access', component: Access },
    { path: 'error', component: Error },
    { path: 'register', component: Register },
    { path: 'auth/google/callback', component: GoogleCallback },
    { path: '', component: Login }
] as Routes;
