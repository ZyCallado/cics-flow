'use client';
import {
  Auth,
  signInAnonymously,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from 'firebase/auth';

/** 
 * Initiate anonymous sign-in (non-blocking). 
 * @param authInstance The Firebase Auth instance.
 * @param onError Optional callback for error handling.
 */
export function initiateAnonymousSignIn(authInstance: Auth, onError?: (error: any) => void): void {
  // CRITICAL: Call signInAnonymously directly. Do NOT use 'await'.
  signInAnonymously(authInstance).catch(onError);
}

/** 
 * Initiate email/password sign-up (non-blocking). 
 * @param authInstance The Firebase Auth instance.
 * @param email User email.
 * @param password User password.
 * @param onError Optional callback for error handling.
 */
export function initiateEmailSignUp(authInstance: Auth, email: string, password: string, onError?: (error: any) => void): void {
  // CRITICAL: Call createUserWithEmailAndPassword directly. Do NOT use 'await'.
  createUserWithEmailAndPassword(authInstance, email, password).catch(onError);
}

/** 
 * Initiate email/password sign-in (non-blocking). 
 * @param authInstance The Firebase Auth instance.
 * @param email User email.
 * @param password User password.
 * @param onError Optional callback for error handling.
 */
export function initiateEmailSignIn(authInstance: Auth, email: string, password: string, onError?: (error: any) => void): void {
  // CRITICAL: Call signInWithEmailAndPassword directly. Do NOT use 'await'.
  signInWithEmailAndPassword(authInstance, email, password).catch(onError);
}
