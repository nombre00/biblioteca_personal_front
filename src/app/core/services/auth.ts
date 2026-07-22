import { Injectable, signal } from '@angular/core';
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User
} from 'firebase/auth';
import { firebaseAuth } from '../firebase.config';

@Injectable({
  providedIn: 'root'
})
export class Auth {
  private currentUser: User | null = null;
  private authReady: Promise<User | null>;

  readonly isLoggedInSignal = signal(false);

  constructor() {
    this.authReady = new Promise((resolve) => {
      const unsubscribe = onAuthStateChanged(firebaseAuth, (user) => {
        this.currentUser = user;
        this.isLoggedInSignal.set(user !== null);
        resolve(user);
        unsubscribe();
      });
    });

    onAuthStateChanged(firebaseAuth, (user) => {
      this.currentUser = user;
      this.isLoggedInSignal.set(user !== null);
    });
  }

  waitForAuthReady(): Promise<User | null> {
    return this.authReady;
  }

  login(email: string, password: string) {
    return signInWithEmailAndPassword(firebaseAuth, email, password);
  }

  logout() {
    return signOut(firebaseAuth);
  }

  isLoggedIn(): boolean {
    return this.currentUser !== null;
  }

  async getIdToken(): Promise<string | null> {
    if (!this.currentUser) return null;
    return await this.currentUser.getIdToken();
  }
}