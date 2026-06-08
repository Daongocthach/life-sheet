import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Trash2, Edit2, Check, X, ChevronDown, ChevronUp, Dumbbell, Award } from 'lucide-react';
import { useWorkoutStore } from '../store/useWorkoutStore';
import { useChatStore } from '../store/useChatStore';
import { confirmDelete } from '../utils/confirm';
import { Exercise, WorkoutSession, WorkoutSet } from '../types';

const getDayLabel = (dateStr: string, lang: string) => {
  const isVi = lang === 'vi';
  const labels: Record<string, string> = isVi 
    ? { '1': 'Thứ 2', '2': 'Thứ 3', '3': 'Thứ 4', '4': 'Thứ 5', '5': 'Thứ 6', '6': 'Thứ 7', '7': 'Chủ nhật' }
    : { '1': 'Monday', '2': 'Tuesday', '3': 'Wednesday', '4': 'Thursday', '5': 'Friday', '6': 'Saturday', '7': 'Sunday' };
  return labels[dateStr] || dateStr;
};

export const WorkoutDiaryScreen: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { 
    sessions, 
    updateRoutineName, 
    addExercise, 
    deleteExercise, 
    renameExercise,
    toggleExerciseDone,
    addSet, 
    updateSet, 
    deleteSet 
  } = useWorkoutStore();
  
  const { highlightedTable } = useChatStore();
  const isHighlighted = highlightedTable === 'workout';

  // Lọc chỉ hiển thị các ngày cố định trong tuần (day_1 đến day_7)
  const weeklySessions = React.useMemo(() => {
    return (sessions || []).filter(s => s && s.id && s.id.startsWith('day_'));
  }, [sessions]);

  return (
    <div 
      className={isHighlighted ? 'flash-highlight' : ''} 
      style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        gap: '24px',
        borderRadius: 'var(--rounded-lg)',
        width: '100%'
      }}
    >
      {/* Title & Top Info Bar */}
      <div
        className="glass-card"
        style={{
          padding: '20px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div>
          <h2 style={{ fontSize: '1.45rem', fontWeight: 750, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Dumbbell size={24} style={{ color: 'var(--primary)' }} />
            {t('workout.title')}
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--slate-500)', marginTop: '4px', fontWeight: 500 }}>
            {i18n.language === 'vi' 
              ? 'Lên kế hoạch rèn luyện và tích hoàn thành bài tập từng ngày trong tuần'
              : 'Plan workouts and check off exercises day-by-day throughout the week'}
          </p>
        </div>
      </div>

      {/* Week Grid Layout */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '24px',
          width: '100%'
        }}
      >
        {weeklySessions.map((session) => (
          <NotepadDayCard
            key={session.id}
            session={session}
            lang={i18n.language}
            onRenameRoutine={updateRoutineName}
            onAddExercise={addExercise}
            onDeleteExercise={deleteExercise}
            onRenameExercise={renameExercise}
            onToggleExerciseDone={toggleExerciseDone}
            onAddSet={addSet}
            onUpdateSet={updateSet}
            onDeleteSet={deleteSet}
          />
        ))}
      </div>
    </div>
  );
};

/* --- SUB-COMPONENT: NOTEPAD DAY CARD --- */
interface NotepadDayCardProps {
  session: WorkoutSession;
  lang: string;
  onRenameRoutine: (sessionId: string, newName: string) => void;
  onAddExercise: (sessionId: string, name: string) => string;
  onDeleteExercise: (sessionId: string, id: string) => void;
  onRenameExercise: (sessionId: string, id: string, name: string) => void;
  onToggleExerciseDone: (sessionId: string, id: string) => void;
  onAddSet: (sessionId: string, exerciseId: string, weight: number, reps: number) => void;
  onUpdateSet: (sessionId: string, exerciseId: string, setId: string, updates: Partial<WorkoutSet>) => void;
  onDeleteSet: (sessionId: string, exerciseId: string, setId: string) => void;
}

const NotepadDayCard: React.FC<NotepadDayCardProps> = ({
  session,
  lang,
  onRenameRoutine,
  onAddExercise,
  onDeleteExercise,
  onRenameExercise,
  onToggleExerciseDone,
  onAddSet,
  onUpdateSet,
  onDeleteSet,
}) => {
  const { t } = useTranslation();
  const [isEditingRoutine, setIsEditingRoutine] = useState(false);
  const [routineInput, setRoutineInput] = useState(session.routineName || '');
  
  const [isAddingExercise, setIsAddingExercise] = useState(false);
  const [exerciseInput, setExerciseInput] = useState('');
  
  const [expandedExerciseId, setExpandedExerciseId] = useState<string | null>(null);
  const [editingExerciseId, setEditingExerciseId] = useState<string | null>(null);
  const [editExerciseInput, setEditExerciseInput] = useState('');

  const routineInputRef = useRef<HTMLInputElement>(null);
  const exerciseInputRef = useRef<HTMLInputElement>(null);
  const editExerciseInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditingRoutine) {
      routineInputRef.current?.focus();
      routineInputRef.current?.select();
    }
  }, [isEditingRoutine]);

  useEffect(() => {
    if (isAddingExercise) {
      exerciseInputRef.current?.focus();
    }
  }, [isAddingExercise]);

  useEffect(() => {
    if (editingExerciseId) {
      editExerciseInputRef.current?.focus();
      editExerciseInputRef.current?.select();
    }
  }, [editingExerciseId]);

  // Sync routine input state if session changes
  useEffect(() => {
    setRoutineInput(session.routineName || '');
  }, [session.routineName]);

  const handleSaveRoutine = () => {
    const trimmed = routineInput.trim();
    if (trimmed) {
      onRenameRoutine(session.id, trimmed);
    } else {
      setRoutineInput(session.routineName || '');
    }
    setIsEditingRoutine(false);
  };

  const handleAddExerciseSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const name = exerciseInput.trim();
    if (name) {
      onAddExercise(session.id, name);
      setExerciseInput('');
    }
    setIsAddingExercise(false);
  };

  const handleRenameExerciseSubmit = (exerciseId: string) => {
    const name = editExerciseInput.trim();
    if (name) {
      onRenameExercise(session.id, exerciseId, name);
    }
    setEditingExerciseId(null);
  };

  const handleExerciseCheckbox = (e: React.MouseEvent, exerciseId: string) => {
    e.stopPropagation();
    onToggleExerciseDone(session.id, exerciseId);
  };

  const dayLabel = getDayLabel(session.date, lang);
  const exercises = session.exercises || [];

  return (
    <div
      className="notepad-card"
      style={{
        backgroundColor: '#ffffff',
        borderLeft: '2px dashed #cbd5e1',
        borderRight: '2px dashed #cbd5e1',
        borderRadius: '16px',
        padding: '24px 20px',
        boxShadow: '0 8px 20px -6px rgba(37, 99, 235, 0.06), 0 2px 8px -2px rgba(0, 0, 0, 0.04)',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        minHeight: '380px',
        transition: 'transform 0.2s, box-shadow 0.2s',
      }}
    >
      {/* Decorative notebook pin dots */}
      <div style={{ position: 'absolute', top: '12px', left: '16px', width: '10px', height: '10px', borderRadius: '50%', backgroundColor: 'var(--primary-accent)', opacity: 0.8 }} />
      <div style={{ position: 'absolute', top: '12px', right: '16px', width: '10px', height: '10px', borderRadius: '50%', backgroundColor: 'var(--primary-accent)', opacity: 0.8 }} />

      {/* Ribbon tape heading */}
      <div
        style={{
          backgroundColor: 'var(--primary-light)',
          color: 'var(--primary)',
          padding: '6px 22px',
          fontWeight: 800,
          fontSize: '0.925rem',
          borderRadius: '4px',
          margin: '0 auto 12px auto',
          textAlign: 'center',
          boxShadow: '0 2px 4px rgba(37, 99, 235, 0.08)',
          width: 'fit-content',
          letterSpacing: '0.2px',
          transform: 'rotate(-1deg)'
        }}
      >
        {dayLabel}
      </div>

      {/* Routine name (clickable routine text or edit form) */}
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        {isEditingRoutine ? (
          <input
            ref={routineInputRef}
            type="text"
            value={routineInput}
            onChange={(e) => setRoutineInput(e.target.value)}
            onBlur={handleSaveRoutine}
            onKeyDown={(e) => e.key === 'Enter' && handleSaveRoutine()}
            style={{
              fontSize: '0.85rem',
              fontWeight: 650,
              color: 'var(--primary-hover)',
              textAlign: 'center',
              backgroundColor: 'var(--primary-light)',
              border: '1px solid var(--primary-accent)',
              borderRadius: '6px',
              padding: '2px 8px',
              outline: 'none',
              maxWidth: '85%'
            }}
          />
        ) : (
          <div
            onClick={() => setIsEditingRoutine(true)}
            className="routine-title-container"
            style={{
              fontSize: '0.85rem',
              fontWeight: 650,
              color: 'var(--primary)',
              opacity: 0.85,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '2px 8px',
              borderRadius: '6px',
              transition: 'background-color 0.2s',
            }}
            title={lang === 'vi' ? 'Nhấp để sửa giáo án' : 'Click to edit routine'}
          >
            <span>{session.routineName || (lang === 'vi' ? 'Chưa có giáo án' : 'Rest day')}</span>
            <Edit2 size={12} className="routine-edit-icon" style={{ opacity: 0.5 }} />
          </div>
        )}
      </div>

      {/* Exercises checklist layout on ruled notepad lines */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {exercises.length === 0 ? (
          <div
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--slate-400)',
              opacity: 0.8,
              fontSize: '0.85rem',
              fontStyle: 'italic',
              textAlign: 'center',
              padding: '30px 10px',
              lineHeight: '1.4',
              whiteSpace: 'pre-line'
            }}
          >
            {lang === 'vi' ? 'Không có bài tập nào\nClick nút + bên dưới để thêm!' : 'No exercises planned.\nClick + below to add!'}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {exercises.map((ex) => {
              const isExpanded = expandedExerciseId === ex.id;
              const isEditing = editingExerciseId === ex.id;
              
              const sets = ex.sets || [];
              const hasSets = sets.length > 0;
              const isDone = hasSets ? sets.every(s => s.done) : !!ex.done;

              return (
                <div key={ex.id} style={{ display: 'flex', flexDirection: 'column' }}>
                  {/* Ruled paper line */}
                  <div
                    className="notepad-item-line"
                    onClick={() => setExpandedExerciseId(isExpanded ? null : ex.id)}
                    style={{
                      borderBottom: '1px solid var(--border-light)',
                      display: 'flex',
                      alignItems: 'center',
                      padding: '10px 4px',
                      gap: '10px',
                      cursor: 'pointer',
                      minHeight: '42px',
                      transition: 'background-color 0.15s'
                    }}
                  >
                    {/* Checkbox */}
                    <div
                      onClick={(e) => handleExerciseCheckbox(e, ex.id)}
                      style={{
                        width: '18px',
                        height: '18px',
                        border: '1.5px solid var(--primary)',
                        borderRadius: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: isDone ? 'var(--primary)' : 'transparent',
                        transition: 'all 0.2s',
                        cursor: 'pointer',
                        flexShrink: 0
                      }}
                    >
                      {isDone && <Check size={12} color="#fff" strokeWidth={3} />}
                    </div>

                    {/* Exercise Name (or editing input) */}
                    <div style={{ flex: 1, overflow: 'hidden' }}>
                      {isEditing ? (
                        <input
                          ref={editExerciseInputRef}
                          type="text"
                          value={editExerciseInput}
                          onChange={(e) => setEditExerciseInput(e.target.value)}
                          onBlur={() => handleRenameExerciseSubmit(ex.id)}
                          onKeyDown={(e) => e.key === 'Enter' && handleRenameExerciseSubmit(ex.id)}
                          onClick={(e) => e.stopPropagation()}
                          style={{
                            width: '100%',
                            fontSize: '0.9rem',
                            fontWeight: 600,
                            color: '#1e293b',
                            border: 'none',
                            borderBottom: '1.5px solid var(--primary)',
                            backgroundColor: 'transparent',
                            outline: 'none',
                            padding: '2px 0'
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            fontSize: '0.9rem',
                            fontWeight: 600,
                            color: isDone ? '#94a3b8' : '#334155',
                            textDecoration: isDone ? 'line-through' : 'none',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                          }}
                        >
                          {ex.name}
                          {hasSets && (
                            <span 
                              style={{ 
                                fontSize: '0.725rem', 
                                color: isDone ? 'var(--slate-400)' : 'var(--primary)', 
                                backgroundColor: isDone ? 'var(--slate-100)' : 'var(--primary-light)', 
                                padding: '1px 6px', 
                                borderRadius: '12px',
                                fontWeight: 500
                              }}
                            >
                              {sets.length}s
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Actions and Chevron indicator */}
                    <div 
                      className="notepad-item-actions"
                      style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={() => {
                          setEditingExerciseId(ex.id);
                          setEditExerciseInput(ex.name || '');
                        }}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--slate-500)',
                          cursor: 'pointer',
                          padding: '2px',
                          opacity: 0.6,
                          transition: 'opacity 0.2s',
                          display: 'flex',
                          alignItems: 'center'
                        }}
                        title={lang === 'vi' ? 'Đổi tên' : 'Rename'}
                        onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                        onMouseLeave={(e) => e.currentTarget.style.opacity = '0.6'}
                      >
                        <Edit2 size={13} />
                      </button>
                      <button
                        onClick={() => {
                          confirmDelete(
                            lang === 'vi' ? 'Xóa bài tập?' : 'Delete exercise?',
                            lang === 'vi' 
                              ? `Bạn muốn xóa bài tập "${ex.name}" khỏi ngày này?`
                              : `Remove "${ex.name}" from this day?`,
                            () => onDeleteExercise(session.id, ex.id)
                          );
                        }}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--error)',
                          cursor: 'pointer',
                          padding: '2px',
                          opacity: 0.6,
                          transition: 'opacity 0.2s',
                          display: 'flex',
                          alignItems: 'center'
                        }}
                        title={lang === 'vi' ? 'Xóa bài tập' : 'Delete exercise'}
                        onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                        onMouseLeave={(e) => e.currentTarget.style.opacity = '0.6'}
                      >
                        <Trash2 size={13} />
                      </button>
                      
                      {/* Expansion Indicator */}
                      <div style={{ color: 'var(--primary)', opacity: 0.8, display: 'flex', alignItems: 'center', marginLeft: '2px' }} onClick={() => setExpandedExerciseId(isExpanded ? null : ex.id)}>
                        {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </div>
                    </div>
                  </div>

                  {/* Expanded Sets Tracker Panel */}
                  {isExpanded && (
                    <div
                      style={{
                        padding: '12px 8px',
                        backgroundColor: 'var(--primary-light)',
                        borderBottom: '1px solid var(--border-light)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px',
                        animation: 'fadeIn 0.2s ease'
                      }}
                    >
                      {/* Sets grid head */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 2fr 2fr 2fr 0.8fr', gap: '6px', fontSize: '0.725rem', color: 'var(--primary)', fontWeight: 700, paddingBottom: '4px', borderBottom: '1px dashed rgba(37, 99, 235, 0.2)' }}>
                        <div>Set</div>
                        <div>Tạ (kg)</div>
                        <div>Reps</div>
                        <div style={{ textAlign: 'center' }}>Done</div>
                        <div></div>
                      </div>

                      {/* Sets list */}
                      {sets.length === 0 ? (
                        <div style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--slate-500)', opacity: 0.7, padding: '10px 0' }}>
                          {lang === 'vi' ? 'Chưa có hiệp tập nào. Thêm bên dưới!' : 'No sets tracked yet. Add one below!'}
                        </div>
                      ) : (
                        sets.map((set, setIndex) => (
                          <div 
                            key={set.id} 
                            style={{ 
                              display: 'grid', 
                              gridTemplateColumns: '1.2fr 2fr 2fr 2fr 0.8fr', 
                              gap: '6px', 
                              alignItems: 'center',
                              opacity: set.done ? 0.65 : 1,
                              transition: 'opacity 0.2s'
                            }}
                          >
                            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569' }}>
                              S{setIndex + 1}
                            </div>
                            
                            <div>
                              <input
                                type="number"
                                defaultValue={set.weight}
                                onBlur={(e) => {
                                  const val = parseFloat(e.target.value);
                                  if (!isNaN(val) && val >= 0) {
                                    onUpdateSet(session.id, ex.id, set.id, { weight: val });
                                  }
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    const val = parseFloat(e.currentTarget.value);
                                    if (!isNaN(val) && val >= 0) {
                                      onUpdateSet(session.id, ex.id, set.id, { weight: val });
                                      e.currentTarget.blur();
                                    }
                                  }
                                }}
                                disabled={set.done}
                                style={{
                                  width: '90%',
                                  padding: '3px 4px',
                                  fontSize: '0.75rem',
                                  border: '1px solid var(--border)',
                                  backgroundColor: '#fff',
                                  borderRadius: '4px',
                                  outline: 'none',
                                  textAlign: 'center'
                                }}
                              />
                            </div>

                            <div>
                              <input
                                type="number"
                                defaultValue={set.reps}
                                onBlur={(e) => {
                                  const val = parseInt(e.target.value);
                                  if (!isNaN(val) && val >= 0) {
                                    onUpdateSet(session.id, ex.id, set.id, { reps: val });
                                  }
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    const val = parseInt(e.currentTarget.value);
                                    if (!isNaN(val) && val >= 0) {
                                      onUpdateSet(session.id, ex.id, set.id, { reps: val });
                                      e.currentTarget.blur();
                                    }
                                  }
                                }}
                                disabled={set.done}
                                style={{
                                  width: '90%',
                                  padding: '3px 4px',
                                  fontSize: '0.75rem',
                                  border: '1px solid var(--border)',
                                  backgroundColor: '#fff',
                                  borderRadius: '4px',
                                  outline: 'none',
                                  textAlign: 'center'
                                }}
                              />
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'center' }}>
                              <button
                                onClick={() => onUpdateSet(session.id, ex.id, set.id, { done: !set.done })}
                                style={{
                                  padding: '2px 8px',
                                  borderRadius: '9999px',
                                  border: 'none',
                                  fontSize: '0.7rem',
                                  fontWeight: 700,
                                  cursor: 'pointer',
                                  backgroundColor: set.done ? 'var(--primary)' : 'var(--slate-100)',
                                  color: set.done ? '#ffffff' : 'var(--slate-600)',
                                  transition: 'all 0.2s',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '2px',
                                }}
                              >
                                {set.done && <Check size={8} color="#fff" strokeWidth={3} />}
                                Done
                              </button>
                            </div>

                            <div>
                              <button
                                onClick={() => onDeleteSet(session.id, ex.id, set.id)}
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  color: 'var(--error)',
                                  cursor: 'pointer',
                                  padding: '2px',
                                  display: 'flex',
                                  alignItems: 'center',
                                }}
                              >
                                <X size={12} />
                              </button>
                            </div>
                          </div>
                        ))
                      )}

                      {/* Add Set Button */}
                      <button
                        onClick={() => {
                          const lastSet = sets[sets.length - 1];
                          const w = lastSet ? lastSet.weight : 10;
                          const r = lastSet ? lastSet.reps : 12;
                          onAddSet(session.id, ex.id, w, r);
                        }}
                        style={{
                          marginTop: '6px',
                          padding: '4px',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          backgroundColor: 'transparent',
                          border: '1px dashed var(--primary)',
                          borderRadius: '6px',
                          color: 'var(--primary)',
                          cursor: 'pointer',
                          transition: 'background-color 0.2s',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '4px'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--primary-light)'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                      >
                        <Plus size={12} />
                        {t('workout.add_set')}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Inline input for adding a new exercise */}
        <div style={{ marginTop: 'auto', paddingTop: '12px' }}>
          {isAddingExercise ? (
            <form onSubmit={handleAddExerciseSubmit} style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--border)', padding: '6px 4px' }}>
              <div style={{ width: '18px', height: '18px', border: '1.5px dashed var(--primary)', borderRadius: '4px', flexShrink: 0 }} />
              <input
                ref={exerciseInputRef}
                type="text"
                value={exerciseInput}
                onChange={(e) => setExerciseInput(e.target.value)}
                placeholder={lang === 'vi' ? 'Nhập tên bài tập...' : 'Enter exercise...'}
                onBlur={handleAddExerciseSubmit}
                style={{
                  flex: 1,
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  color: '#334155',
                  border: 'none',
                  backgroundColor: 'transparent',
                  outline: 'none',
                  padding: 0
                }}
              />
            </form>
          ) : (
            <button
              onClick={() => setIsAddingExercise(true)}
              style={{
                width: '100%',
                padding: '8px 10px',
                backgroundColor: 'transparent',
                border: '1px dashed var(--primary-accent)',
                borderRadius: '8px',
                color: 'var(--primary)',
                fontWeight: 700,
                fontSize: '0.825rem',
                cursor: 'pointer',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--primary-light)';
                e.currentTarget.style.borderColor = 'var(--primary)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.borderColor = 'var(--primary-accent)';
              }}
            >
              <Plus size={14} />
              {lang === 'vi' ? 'Thêm bài tập' : 'Add Exercise'}
            </button>
          )}
        </div>
      </div>

      {/* Embedded CSS Animations */}
      <style dangerouslySetInnerHTML={{ __html: `
        .notepad-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 28px -6px rgba(37, 99, 235, 0.08), 0 4px 12px -2px rgba(0, 0, 0, 0.05) !important;
        }
        .notepad-item-line:hover {
          background-color: rgba(37, 99, 235, 0.05);
        }
        .notepad-item-actions {
          opacity: 0.15;
          transition: opacity 0.2s;
        }
        .notepad-item-line:hover .notepad-item-actions {
          opacity: 1;
        }
        .routine-title-container:hover {
          background-color: var(--primary-light);
        }
        .routine-title-container:hover .routine-edit-icon {
          opacity: 1 !important;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}} />
    </div>
  );
};
