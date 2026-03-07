import { db, COLLECTIONS } from './firebase';
import { collection, addDoc, query, where, orderBy, onSnapshot, doc, updateDoc, serverTimestamp, getDoc, getDocs, writeBatch, QuerySnapshot, DocumentData } from 'firebase/firestore';

export interface Notification {
  id: string;
  userId: string;
  type: 'booking' | 'message' | 'review' | 'system' | 'promotion';
  title: string;
  body: string;
  read: boolean;
  data?: Record<string, any>;
  createdAt: any;
}

// Create a notification for a user
export const createNotification = async (
  userId: string,
  type: Notification['type'],
  title: string,
  body: string,
  data?: Record<string, any>
) => {
  try {
    await addDoc(collection(db, COLLECTIONS.NOTIFICATIONS), {
      userId,
      type,
      title,
      body,
      data: data || {},
      read: false,
      createdAt: serverTimestamp(),
    });
    return true;
  } catch (error) {
    console.error('Error creating notification:', error);
    return false;
  }
};

// Notify escort of new booking
export const notifyEscortOfBooking = async (
  escortId: string,
  clientName: string,
  service: string,
  date: string,
  bookingId: string
) => {
  return createNotification(
    escortId,
    'booking',
    'New Booking Request',
    `${clientName} wants to book you for ${service} on ${date}`,
    { bookingId, clientName, service, date }
  );
};

// Notify client of booking status change
export const notifyClientOfBookingStatus = async (
  clientId: string,
  escortName: string,
  status: 'accepted' | 'declined' | 'completed',
  bookingId: string
) => {
  const statusMessages = {
    accepted: 'accepted your booking request',
    declined: 'declined your booking request',
    completed: 'has completed your booking',
  };
  
  return createNotification(
    clientId,
    'booking',
    'Booking Update',
    `${escortName} ${statusMessages[status]}`,
    { bookingId, escortName, status }
  );
};

// Notify user of new message
export const notifyUserOfMessage = async (
  userId: string,
  senderName: string,
  senderType: string,
  chatRoomId: string
) => {
  return createNotification(
    userId,
    'message',
    'New Message',
    `You have a new message from ${senderName}`,
    { chatRoomId, senderName, senderType }
  );
};

// Notify escort of new review
export const notifyEscortOfReview = async (
  escortId: string,
  clientName: string,
  rating: number,
  reviewId: string
) => {
  return createNotification(
    escortId,
    'review',
    'New Review',
    `${clientName} gave you a ${rating}-star rating`,
    { reviewId, clientName, rating }
  );
};

// Get notifications for a user (real-time)
export const subscribeToNotifications = (
  userId: string,
  callback: (notifications: Notification[]) => void
) => {
  const q = query(
    collection(db, COLLECTIONS.NOTIFICATIONS),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  );

  return onSnapshot(q, (snapshot) => {
    const notifications: Notification[] = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      notifications.push({
        id: doc.id,
        userId: data.userId,
        type: data.type,
        title: data.title,
        body: data.body,
        read: data.read,
        data: data.data,
        createdAt: data.createdAt,
      });
    });
    callback(notifications);
  });
};

// Mark notification as read
export const markNotificationAsRead = async (notificationId: string) => {
  try {
    await updateDoc(doc(db, COLLECTIONS.NOTIFICATIONS, notificationId), {
      read: true,
    });
    return true;
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return false;
  }
};

// Mark all notifications as read for a user
export const markAllNotificationsAsRead = async (userId: string) => {
  try {
    // Get all notifications for this user and mark them as read
    const q = query(
      collection(db, COLLECTIONS.NOTIFICATIONS),
      where('userId', '==', userId)
    );
    
    const snapshot = await getDocs(q);
    
    // Use batch to update multiple documents
    const batch = writeBatch(db);
    let count = 0;
    
    snapshot.docs.forEach((d) => {
      const data = d.data();
      if (!data.read) {
        batch.update(d.ref, { read: true });
        count++;
      }
    });
    
    if (count > 0) {
      await batch.commit();
    }
    return true;
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    return false;
  }
};
