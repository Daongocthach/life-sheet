import { workoutRepository } from '../repositories/workoutRepository';
import { WorkoutSession } from '../../../types';

export const workoutService = {
  subscribeSessions(onUpdate: (sessions: WorkoutSession[]) => void): () => void {
    return workoutRepository.subscribeSessions(onUpdate);
  },

  async addSession(routineName: string, date: string): Promise<string> {
    const id = Math.random().toString(36).substring(2, 9);
    const newSession: WorkoutSession = {
      id,
      date,
      routineName: routineName.trim() || 'Tập luyện tự do',
      exercises: [],
    };
    
    await workoutRepository.saveSession(newSession);
    return id;
  },

  async saveSession(session: WorkoutSession): Promise<void> {
    return workoutRepository.saveSession(session);
  },

  async deleteSession(sessionId: string): Promise<void> {
    if (!sessionId) throw new Error("ID buổi tập không hợp lệ");
    return workoutRepository.deleteSession(sessionId);
  }
};
export default workoutService;
