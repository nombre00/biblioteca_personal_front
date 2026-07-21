import { Injectable } from '@angular/core';
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

  constructor() {
    // Se ejecuta automáticamente cada vez que cambia el estado de auth
    // (login, logout, o al recargar la página si Firebase recupera la sesión)
    onAuthStateChanged(firebaseAuth, (user) => {
      this.currentUser = user;
    });
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