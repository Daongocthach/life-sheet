import {
  ref,
  set,
  remove,
  onValue,
  off
} from 'firebase/database';
import { db, auth, isFirebaseConfigured } from '../../../services/firebase';
import { WorkoutSession } from '../../../types';

const LOCAL_STORAGE_WORKOUT_KEY = 'lifesheet_workout_sessions';

const getUserId = () => auth?.currentUser?.uid || 'guest';

export const workoutRepository = {
  subscribeSessions(onUpdate: (sessions: WorkoutSession[]) => void): () => void {
    if (!isFirebaseConfigured || !db) {
      const local = localStorage.getItem(LOCAL_STORAGE_WORKOUT_KEY);
      onUpdate(local ? JSON.parse(local) : []);
      return () => {};
    }

    const sessionsRef = ref(db, `users/${getUserId()}/workoutSessions`);
    const unsubscribe = onValue(sessionsRef, (snapshot) => {
      const data = snapshot.val();
      const sessions: WorkoutSession[] = [];
      if (data) {
        Object.keys(data).forEach((key) => {
          sessions.push(data[key] as WorkoutSession);
        });
      }
      // Sắp xếp: nếu cả hai là ngày trong tuần (1-7) thì sắp xếp tăng dần, ngược lại dùng Date
      sessions.sort((a, b) => {
        const aNum = parseInt(a.date);
        const bNum = parseInt(b.date);
        if (!isNaN(aNum) && !isNaN(bNum)) {
          return aNum - bNum;
        }
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      });
      onUpdate(sessions);
    }, (error) => {
      console.error("Lỗi khi tải workout sessions từ Realtime DB:", error);
    });

    return () => off(sessionsRef, 'value', unsubscribe);
  },

  async saveSession(session: WorkoutSession): Promise<void> {
    if (!isFirebaseConfigured || !db) {
      const local = localStorage.getItem(LOCAL_STORAGE_WORKOUT_KEY);
      const sessions: WorkoutSession[] = local ? JSON.parse(local) : [];
      const index = sessions.findIndex(s => s.id === session.id);
      
      let updated: WorkoutSession[];
      if (index >= 0) {
        updated = [...sessions];
        updated[index] = session;
      } else {
        updated = [session, ...sessions];
      }
      localStorage.setItem(LOCAL_STORAGE_WORKOUT_KEY, JSON.stringify(updated));
      window.dispatchEvent(new Event('storage'));
      return;
    }
    await set(ref(db, `users/${getUserId()}/workoutSessions/${session.id}`), session);
  },

  async deleteSession(sessionId: string): Promise<void> {
    if (!isFirebaseConfigured || !db) {
      const local = localStorage.getItem(LOCAL_STORAGE_WORKOUT_KEY);
      if (local) {
        const sessions: WorkoutSession[] = JSON.parse(local);
        const updated = sessions.filter(s => s.id !== sessionId);
        localStorage.setItem(LOCAL_STORAGE_WORKOUT_KEY, JSON.stringify(updated));
        window.dispatchEvent(new Event('storage'));
      }
      return;
    }
    await remove(ref(db, `users/${getUserId()}/workoutSessions/${sessionId}`));
  }
};
export default workoutRepository;
