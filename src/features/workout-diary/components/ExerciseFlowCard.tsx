import React from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Trash2, Check, X, Dumbbell } from 'lucide-react';
import { Exercise } from '../../../types';
import { useWorkoutStore } from '../../../store/useWorkoutStore';
import { confirmDelete } from '../../../utils/confirm';

interface ExerciseFlowCardProps {
  sessionId: string;
  exercise: Exercise;
}

export const ExerciseFlowCard: React.FC<ExerciseFlowCardProps> = ({ sessionId, exercise }) => {
  const { t } = useTranslation();
  const { addSet, updateSet, deleteSet, deleteExercise } = useWorkoutStore();

  const handleAddSet = () => {
    // Lấy thông số từ set cuối cùng làm mặc định, nếu chưa có thì dùng tạ 10kg, 12 reps
    const lastSet = exercise.sets[exercise.sets.length - 1];
    const weight = lastSet ? lastSet.weight : 10;
    const reps = lastSet ? lastSet.reps : 12;
    addSet(sessionId, exercise.id, weight, reps);
  };

  const handleUpdateSetField = (setId: string, field: 'weight' | 'reps', value: string) => {
    const num = parseFloat(value);
    if (!isNaN(num) && num >= 0) {
      updateSet(sessionId, exercise.id, setId, { [field]: num });
    }
  };

  const handleToggleDone = (setId: string, currentDone: boolean) => {
    updateSet(sessionId, exercise.id, setId, { done: !currentDone });
  };

  const handleDeleteExercise = () => {
    confirmDelete(
      'Xóa bài tập?',
      `Bạn có chắc chắn muốn xóa bài tập "${exercise.name}" cùng tất cả các hiệp tập liên quan không?`,
      () => deleteExercise(sessionId, exercise.id)
    );
  };

  const handleDeleteSet = (setId: string, setNumber: number) => {
    confirmDelete(
      'Xóa hiệp tập?',
      `Bạn có chắc chắn muốn xóa Set ${setNumber} không?`,
      () => deleteSet(sessionId, exercise.id, setId)
    );
  };

  return (
    <div
      className="glass-card"
      style={{
        padding: '20px',
        backgroundColor: '#ffffff',
        border: '1px solid var(--border)',
        boxShadow: 'var(--shadow-sm)',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
      }}
    >
      {/* Exercise Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Dumbbell size={18} style={{ color: 'var(--primary)' }} />
          {exercise.name}
        </h3>
        <button
          onClick={handleDeleteExercise}
          className="btn-icon"
          title="Xóa bài tập"
          style={{ width: '28px', height: '28px', color: 'var(--error)', borderColor: 'rgba(239, 68, 68, 0.15)' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--error-light)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#ffffff';
          }}
        >
          <Trash2 size={14} />
        </button>
      </div>

      {/* Sets Table */}
      <div className="modern-table-container">
        <table className="modern-table" style={{ minWidth: '100%' }}>
          <thead>
            <tr>
              <th style={{ padding: '8px 10px', fontSize: '0.7rem' }}>{t('workout.set')}</th>
              <th style={{ padding: '8px 10px', fontSize: '0.7rem' }}>{t('workout.weight')}</th>
              <th style={{ padding: '8px 10px', fontSize: '0.7rem' }}>{t('workout.reps')}</th>
              <th style={{ padding: '8px 10px', fontSize: '0.7rem', textAlign: 'center' }}>{t('workout.status')}</th>
              <th style={{ padding: '8px 10px', fontSize: '0.7rem', textAlign: 'center' }}>Xóa</th>
            </tr>
          </thead>
          <tbody>
            {exercise.sets.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', color: 'var(--slate-400)', padding: '12px', fontSize: '0.85rem' }}>
                  Chưa có hiệp tập nào. Click "Thêm Hiệp" bên dưới!
                </td>
              </tr>
            ) : (
              exercise.sets.map((set, index) => (
                <tr key={set.id} style={{ opacity: set.done ? 0.75 : 1, transition: 'opacity 0.2s' }}>
                  <td style={{ fontWeight: 600, color: 'var(--slate-800)', padding: '10px', fontSize: '0.85rem' }}>
                    Set {index + 1}
                  </td>
                  <td style={{ padding: '6px 10px' }}>
                    <input
                      type="number"
                      defaultValue={set.weight}
                      onBlur={(e) => handleUpdateSetField(set.id, 'weight', e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleUpdateSetField(set.id, 'weight', e.currentTarget.value)}
                      disabled={set.done}
                      style={{
                        width: '70px',
                        padding: '6px 8px',
                        borderRadius: '6px',
                        border: '1px solid var(--border)',
                        fontSize: '0.85rem',
                        outline: 'none',
                        color: 'var(--text-main)',
                      }}
                    />
                  </td>
                  <td style={{ padding: '6px 10px' }}>
                    <input
                      type="number"
                      defaultValue={set.reps}
                      onBlur={(e) => handleUpdateSetField(set.id, 'reps', e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleUpdateSetField(set.id, 'reps', e.currentTarget.value)}
                      disabled={set.done}
                      style={{
                        width: '70px',
                        padding: '6px 8px',
                        borderRadius: '6px',
                        border: '1px solid var(--border)',
                        fontSize: '0.85rem',
                        outline: 'none',
                        color: 'var(--text-main)',
                      }}
                    />
                  </td>
                  <td style={{ padding: '6px 10px', textAlign: 'center' }}>
                    <button
                      onClick={() => handleToggleDone(set.id, set.done)}
                      style={{
                        padding: '6px 14px',
                        borderRadius: '9999px',
                        border: 'none',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        backgroundColor: set.done ? 'var(--primary)' : 'var(--slate-100)',
                        color: set.done ? '#ffffff' : 'var(--slate-500)',
                        boxShadow: set.done ? '0 2px 10px rgba(37, 99, 235, 0.3)' : 'none',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '4px',
                      }}
                      onMouseEnter={(e) => {
                        if (!set.done) {
                          e.currentTarget.style.backgroundColor = 'var(--primary-light)';
                          e.currentTarget.style.color = 'var(--primary)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!set.done) {
                          e.currentTarget.style.backgroundColor = 'var(--slate-100)';
                          e.currentTarget.style.color = 'var(--slate-500)';
                        }
                      }}
                    >
                      {set.done && <Check size={12} color="white" />}
                      Done
                    </button>
                  </td>
                  <td style={{ padding: '6px 10px', textAlign: 'center' }}>
                    <button
                      onClick={() => handleDeleteSet(set.id, index + 1)}
                      className="btn-icon"
                      title="Xóa set"
                      style={{ width: '24px', height: '24px', color: 'var(--error)', borderColor: 'rgba(239, 68, 68, 0.15)' }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'var(--error-light)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '#ffffff';
                      }}
                    >
                      <X size={12} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add Set Button */}
      <button
        onClick={handleAddSet}
        style={{
          width: '100%',
          padding: '10px',
          backgroundColor: 'transparent',
          border: '1px dashed var(--primary-accent)',
          borderRadius: '9999px',
          color: 'var(--primary)',
          fontWeight: 600,
          fontSize: '0.85rem',
          cursor: 'pointer',
          transition: 'all 0.2s',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '6px',
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
        <Plus size={16} />
        {t('workout.add_set')}
      </button>
    </div>
  );
};
export default ExerciseFlowCard;
