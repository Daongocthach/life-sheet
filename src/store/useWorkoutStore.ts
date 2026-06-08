import { create } from 'zustand';
import { WorkoutSession, Exercise, WorkoutSet } from '../types';
import { workoutService } from '../features/workout-diary/services/workoutService';

interface WorkoutState {
  sessions: WorkoutSession[];
  currentSessionId: string | null;
  
  // Timer State
  timerSeconds: number;
  isTimerActive: boolean;
  
  // Workout Actions
  initListeners: () => () => void;
  addSession: (routineName: string, date: string) => string;
  deleteSession: (id: string) => void;
  addExercise: (sessionId: string, exerciseName: string) => string;
  deleteExercise: (sessionId: string, exerciseId: string) => void;
  addSet: (sessionId: string, exerciseId: string, weight: number, reps: number) => void;
  updateSet: (sessionId: string, exerciseId: string, setId: string, updates: Partial<WorkoutSet>) => void;
  deleteSet: (sessionId: string, exerciseId: string, setId: string) => void;
  setSessions: (sessions: WorkoutSession[]) => void;
  setCurrentSessionId: (id: string | null) => void;
  
  // Weekly Plan Actions
  updateRoutineName: (sessionId: string, routineName: string) => void;
  resetWeekDone: () => void;
  toggleExerciseDone: (sessionId: string, exerciseId: string) => void;
  renameExercise: (sessionId: string, exerciseId: string, newName: string) => void;
  
  // Timer Actions
  startTimer: (seconds?: number) => void;
  stopTimer: () => void;
  tickTimer: () => void;
}

const seedAndSortSessions = (rawSessions: WorkoutSession[]) => {
  const seeded = [...rawSessions];
  let hasChanges = false;

  for (let i = 1; i <= 7; i++) {
    const id = `day_${i}`;
    if (!seeded.some(s => s.id === id)) {
      seeded.push({
        id,
        date: String(i),
        routineName: i === 7 ? 'Nghỉ ngơi' : `Giáo án Thứ ${i + 1}`,
        exercises: []
      });
      hasChanges = true;
    }
  }

  seeded.sort((a, b) => {
    const aNum = parseInt(a.date);
    const bNum = parseInt(b.date);
    if (!isNaN(aNum) && !isNaN(bNum)) {
      return aNum - bNum;
    }
    return 0;
  });

  if (hasChanges) {
    seeded.forEach(s => {
      if (!rawSessions.some(orig => orig.id === s.id)) {
        workoutService.saveSession(s).catch(err => {
          console.error("Lỗi khi seed session:", err);
        });
      }
    });
  }

  return seeded;
};

export const useWorkoutStore = create<WorkoutState>((set, get) => ({
  sessions: [],
  currentSessionId: null,
  
  // Timer default values
  timerSeconds: 0,
  isTimerActive: false,

  initListeners: () => {
    const unsub = workoutService.subscribeSessions((sessions) => {
      const processed = seedAndSortSessions(sessions);
      set({ 
        sessions: processed,
        currentSessionId: get().currentSessionId === null 
          ? (processed[0]?.id || null) 
          : get().currentSessionId 
      });
    });

    const handleStorageChange = () => {
      const local = localStorage.getItem('lifesheet_workout_sessions');
      if (local) {
        const parsed = JSON.parse(local);
        const processed = seedAndSortSessions(parsed);
        set({ 
          sessions: processed,
          currentSessionId: get().currentSessionId === null ? (processed[0]?.id || null) : get().currentSessionId
        });
      }
    };
    window.addEventListener('storage', handleStorageChange);

    return () => {
      unsub();
      window.removeEventListener('storage', handleStorageChange);
    };
  },
  
  addSession: (routineName, date) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newSession: WorkoutSession = {
      id,
      date,
      routineName,
      exercises: [],
    };
    
    workoutService.saveSession(newSession).catch(err => {
      console.error("Lỗi khi thêm session qua service:", err);
    });
    set({ currentSessionId: id });
    return id;
  },
  
  deleteSession: (id) => {
    workoutService.deleteSession(id).catch(err => {
      console.error("Lỗi khi xóa session qua service:", err);
    });
    set((state) => {
      const nextSessions = state.sessions.filter((s) => s.id !== id);
      return {
        currentSessionId: state.currentSessionId === id 
          ? (nextSessions[0]?.id || null) 
          : state.currentSessionId,
      };
    });
  },
  
  addExercise: (sessionId, exerciseName) => {
    const exerciseId = Math.random().toString(36).substring(2, 9);
    const session = get().sessions.find(s => s.id === sessionId);
    if (!session) return '';

    const newExercise: Exercise = {
      id: exerciseId,
      name: exerciseName,
      sets: [],
    };

    const updatedSession = {
      ...session,
      exercises: [...(session.exercises || []), newExercise]
    };

    workoutService.saveSession(updatedSession).catch(err => {
      console.error("Lỗi khi lưu bài tập mới qua service:", err);
    });
    return exerciseId;
  },
  
  deleteExercise: (sessionId, exerciseId) => {
    const session = get().sessions.find(s => s.id === sessionId);
    if (!session) return;

    const updatedSession = {
      ...session,
      exercises: (session.exercises || []).filter(e => e.id !== exerciseId)
    };

    workoutService.saveSession(updatedSession).catch(err => {
      console.error("Lỗi khi xóa bài tập qua service:", err);
    });
  },
  
  addSet: (sessionId, exerciseId, weight, reps) => {
    const session = get().sessions.find(s => s.id === sessionId);
    if (!session) return;

    const setId = Math.random().toString(36).substring(2, 9);
    const updatedSession = {
      ...session,
      exercises: (session.exercises || []).map((e) => {
        if (e.id !== exerciseId) return e;
        const newSet: WorkoutSet = {
          id: setId,
          weight,
          reps,
          done: false,
        };
        return {
          ...e,
          sets: [...(e.sets || []), newSet],
        };
      })
    };

    workoutService.saveSession(updatedSession).catch(err => {
      console.error("Lỗi khi thêm set qua service:", err);
    });
  },
  
  updateSet: (sessionId, exerciseId, setId, updates) => {
    const session = get().sessions.find(s => s.id === sessionId);
    if (!session) return;

    let triggerTimer = false;

    const updatedSession = {
      ...session,
      exercises: (session.exercises || []).map((e) => {
        if (e.id !== exerciseId) return e;
        return {
          ...e,
          sets: (e.sets || []).map((st) => {
            if (st.id !== setId) return st;
            
            // Kích hoạt Timer 60s khi Done chuyển từ false sang true
            if (updates.done === true && !st.done) {
              triggerTimer = true;
            }
            
            return { ...st, ...updates };
          }),
        };
      })
    };

    workoutService.saveSession(updatedSession).catch(err => {
      console.error("Lỗi khi cập nhật set qua service:", err);
    });

    if (triggerTimer) {
      setTimeout(() => get().startTimer(60), 0);
    }
  },
  
  deleteSet: (sessionId, exerciseId, setId) => {
    const session = get().sessions.find(s => s.id === sessionId);
    if (!session) return;

    const updatedSession = {
      ...session,
      exercises: (session.exercises || []).map((e) => {
        if (e.id !== exerciseId) return e;
        return {
          ...e,
          sets: (e.sets || []).filter((st) => st.id !== setId),
        };
      })
    };

    workoutService.saveSession(updatedSession).catch(err => {
      console.error("Lỗi khi xóa set qua service:", err);
    });
  },
  
  setSessions: (sessions) => set({ sessions }),
  setCurrentSessionId: (id) => set({ currentSessionId: id }),
  
  updateRoutineName: (sessionId, routineName) => {
    const session = get().sessions.find(s => s.id === sessionId);
    if (!session) return;
    const updatedSession = { ...session, routineName };
    workoutService.saveSession(updatedSession).catch(err => {
      console.error("Lỗi khi cập nhật tên giáo án:", err);
    });
  },
  
  resetWeekDone: () => {
    const updatedSessions = get().sessions.map(session => {
      if (!session.id.startsWith('day_')) return session;
      return {
        ...session,
        exercises: (session.exercises || []).map(exercise => ({
          ...exercise,
          done: false,
          sets: (exercise.sets || []).map(set => ({
            ...set,
            done: false
          }))
        }))
      };
    });
    
    updatedSessions.forEach(session => {
      workoutService.saveSession(session).catch(err => {
        console.error("Lỗi khi reset session:", err);
      });
    });
  },

  toggleExerciseDone: (sessionId, exerciseId) => {
    const session = get().sessions.find(s => s.id === sessionId);
    if (!session) return;
    
    const updatedSession = {
      ...session,
      exercises: (session.exercises || []).map(e => {
        if (e.id !== exerciseId) return e;
        
        const sets = e.sets || [];
        const isDone = sets.length > 0 
          ? sets.every(s => s.done) 
          : !!e.done;
          
        const targetState = !isDone;
        
        return {
          ...e,
          done: targetState,
          sets: sets.map(s => ({ ...s, done: targetState }))
        };
      })
    };
    
    workoutService.saveSession(updatedSession).catch(err => {
      console.error("Lỗi khi toggle bài tập qua service:", err);
    });
  },
  
  renameExercise: (sessionId, exerciseId, newName) => {
    const session = get().sessions.find(s => s.id === sessionId);
    if (!session) return;
    const updatedSession = {
      ...session,
      exercises: (session.exercises || []).map(e => e.id === exerciseId ? { ...e, name: newName } : e)
    };
    workoutService.saveSession(updatedSession).catch(err => {
      console.error("Lỗi khi đổi tên bài tập:", err);
    });
  },
  
  // Timer actions
  startTimer: (seconds = 60) => {
    set({
      timerSeconds: seconds,
      isTimerActive: true,
    });
  },
  
  stopTimer: () => {
    set({
      isTimerActive: false,
      timerSeconds: 0,
    });
  },
  
  tickTimer: () => {
    const { timerSeconds, isTimerActive } = get();
    if (!isTimerActive) return;
    
    if (timerSeconds <= 1) {
      set({
        timerSeconds: 0,
        isTimerActive: false,
      });
    } else {
      set({
        timerSeconds: timerSeconds - 1,
      });
    }
  },
}));
