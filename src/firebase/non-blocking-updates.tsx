
'use client';
    
import {
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  increment,
  CollectionReference,
  DocumentReference,
  SetOptions,
  Firestore,
  doc,
  serverTimestamp,
  collection,
} from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

/**
 * Initiates a setDoc operation for a document reference.
 */
export function setDocumentNonBlocking(docRef: DocumentReference, data: any, options: SetOptions) {
  setDoc(docRef, data, options).catch(error => {
    errorEmitter.emit(
      'permission-error',
      new FirestorePermissionError({
        path: docRef.path,
        operation: 'write',
        requestResourceData: data,
      })
    )
  })
}

/**
 * Initiates an addDoc operation for a collection reference.
 */
export function addDocumentNonBlocking(colRef: CollectionReference, data: any) {
  const promise = addDoc(colRef, data)
    .catch(error => {
      errorEmitter.emit(
        'permission-error',
        new FirestorePermissionError({
          path: colRef.path,
          operation: 'create',
          requestResourceData: data,
        })
      )
    });
  return promise;
}

/**
 * Initiates an updateDoc operation for a document reference.
 */
export function updateDocumentNonBlocking(docRef: DocumentReference, data: any) {
  updateDoc(docRef, data)
    .catch(error => {
      errorEmitter.emit(
        'permission-error',
        new FirestorePermissionError({
          path: docRef.path,
          operation: 'update',
          requestResourceData: data,
        })
      )
    });
}

/**
 * Initiates a deleteDoc operation for a document reference.
 */
export function deleteDocumentNonBlocking(docRef: DocumentReference) {
  deleteDoc(docRef)
    .catch(error => {
      errorEmitter.emit(
        'permission-error',
        new FirestorePermissionError({
          path: docRef.path,
          operation: 'delete',
        })
      )
    });
}

/**
 * Records a document download for a specific user and increments global counts.
 */
export function recordDownloadNonBlocking(db: Firestore, userId: string, document: any, userEmail: string) {
  // 1. Increment global download count
  const docRef = doc(db, 'documents', document.id);
  updateDoc(docRef, {
    downloadCount: increment(1),
    updatedAt: serverTimestamp()
  }).catch((serverError) => {
    errorEmitter.emit('permission-error', new FirestorePermissionError({
      path: docRef.path,
      operation: 'update',
      requestResourceData: { downloadCount: 'increment' }
    }));
  });

  // 2. Add to user's personal downloads (idempotent via doc ID)
  const userDownloadRef = doc(db, 'users', userId, 'downloads', document.id);
  setDoc(userDownloadRef, {
    ...document,
    downloadedAt: new Date().toISOString(),
    recordedAt: serverTimestamp()
  }, { merge: true }).catch((serverError) => {
    errorEmitter.emit('permission-error', new FirestorePermissionError({
      path: userDownloadRef.path,
      operation: 'write',
      requestResourceData: { ...document, downloadedAt: '...' }
    }));
  });

  // 3. Log activity
  const logRef = doc(collection(db, 'activityLogs'));
  setDoc(logRef, {
    id: logRef.id,
    userId,
    email: userEmail,
    action: 'document_download',
    timestamp: new Date().toISOString(),
    ipAddress: 'client-side',
    status: 'success',
    details: `Downloaded: ${document.name}`,
    documentId: document.id
  }).catch(() => {});
}

/**
 * Creates a generic activity log entry.
 */
export function createActivityLogNonBlocking(db: Firestore, logData: {
  userId: string;
  email: string;
  action: string;
  details: string;
  status?: 'success' | 'failure';
}) {
  const logRef = doc(collection(db, 'activityLogs'));
  setDoc(logRef, {
    id: logRef.id,
    userId: logData.userId,
    email: logData.email,
    action: logData.action,
    timestamp: new Date().toISOString(),
    ipAddress: 'client-side',
    status: logData.status || 'success',
    details: logData.details
  }).catch(() => {});
}
