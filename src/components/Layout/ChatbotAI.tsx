import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Bot, SendHorizontal, X } from 'lucide-react';
import { useChatStore } from '../../store/useChatStore';
import { useFinanceStore } from '../../store/useFinanceStore';
import { useFoodStore } from '../../store/useFoodStore';
import { useWorkoutStore } from '../../store/useWorkoutStore';
import { useMonthStore } from '../../store/useMonthStore';
import { parseNaturalLanguage } from '../../services/gemini';
import { estimateMacros } from '../../utils/macroCalculator';
import { workoutService } from '../../features/workout-diary/services/workoutService';

interface ChatbotAIProps {
  isOpen: boolean;
  onClose: () => void;
}

const QUICK_SUGGESTIONS: Record<string, { label: string; icon: string; templates: string[] }> = {
  budget: {
    label: 'Ngân sách',
    icon: '💰',
    templates: [
      'thêm ngân sách Ăn uống 5tr',
      'thêm ngân sách Mua sắm 2tr',
      'thêm ngân sách Du lịch 3tr',
    ],
  },
  transaction: {
    label: 'Giao dịch',
    icon: '💸',
    templates: [
      'tiêu ăn trưa 45k',
      'tiêu xăng xe 50k',
      'thu nhập lương 10tr',
    ],
  },
  food: {
    label: 'Thực đơn',
    icon: '🥗',
    templates: [
      'bữa sáng ăn 100g yến mạch',
      'bữa trưa ăn 150g ức gà hết 30k',
      'bữa tối ăn 200g cá hồi hết 90k',
    ],
  },
  workout: {
    label: 'Tập luyện',
    icon: '🏋️‍♂️',
    templates: [
      'set 1 bài đẩy ngực 20kg 12 reps',
      'set 2 bài squat 50kg 10 reps',
      'set 3 bài tạ tay 10kg 15 reps',
    ],
  },
};

export const ChatbotAI: React.FC<ChatbotAIProps> = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [activeQuickTab, setActiveQuickTab] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSelectTemplate = (val: string) => {
    setInputValue(val);
    setActiveQuickTab(null);
    setTimeout(() => {
      inputRef.current?.focus();
    }, 50);
  };

  const { messages, isLoading, addMessage, setLoading, triggerHighlight } = useChatStore();
  const { addTransaction, budgets, addBudgetCategory, updateBudgetLimit } = useFinanceStore();
  const { addFoodEntry } = useFoodStore();
  const { sessions, currentSessionId, addSession, addExercise, addSet, updateSet } = useWorkoutStore();
  const { selectedMonth } = useMonthStore();

  // Auto scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const userText = inputValue;
    setInputValue('');

    // 1. Thêm tin nhắn của User vào store
    addMessage({ role: 'user', content: userText });
    setLoading(true);

    try {
      // Lấy các danh mục của tháng hiện tại để chuyển cho AI
      const currentMonthBudgets = budgets.filter(b => selectedMonth === 'all' || b.month === selectedMonth);
      const activeCategories = currentMonthBudgets.map(b => b.category);

      // 2. Gọi API Gemini (hoặc Regex fallback) để parse câu lệnh
      const result = await parseNaturalLanguage(userText, activeCategories);

      // 3. Thực hiện dispatch hành động dựa trên kết quả phân tích NLP
      if (result.type === 'finance' && result.payload) {
        addTransaction({
          date: result.payload.date || new Date().toISOString(),
          type: result.payload.type,
          amount: result.payload.amount,
          category: result.payload.category,
          notes: result.payload.notes,
        });
        triggerHighlight('finance');
      } 
      else if (result.type === 'budget' && result.payload) {
        const targetMonth = result.payload.month || selectedMonth || new Date().toISOString().substring(0, 7);
        const activeMonth = targetMonth === 'all' ? new Date().toISOString().substring(0, 7) : targetMonth;
        const exists = budgets.some(
          b => b.category.toLowerCase() === result.payload.category.toLowerCase() && b.month === activeMonth
        );
        if (exists) {
          updateBudgetLimit(result.payload.category, result.payload.limit, activeMonth);
        } else {
          addBudgetCategory(result.payload.category, result.payload.limit, activeMonth);
        }
        triggerHighlight('finance');
      }
      else if (result.type === 'food' && result.payload) {
        // Tự động tính Macros bằng helper
        const baseName = result.payload.name.replace(/^\d+g\s+/i, ''); // Lấy tên thực phẩm sạch
        const gramMatch = result.payload.name.match(/^(\d+)g/i);
        const grams = gramMatch ? parseInt(gramMatch[1]) : 100;
        
        const macros = estimateMacros(baseName, grams);

        addFoodEntry({
          meal: result.payload.meal,
          name: result.payload.name,
          protein: macros.protein,
          carbs: macros.carbs,
          fat: macros.fat,
          calories: macros.calories,
          price: result.payload.price,
          date: result.payload.date || new Date().toISOString().split('T')[0],
        });
        triggerHighlight('food');
      } 
      else if (result.type === 'workout' && result.payload) {
        let activeSessionId = currentSessionId;
        const todayStr = new Date().toISOString().split('T')[0];

        // Tạo session mới nếu chưa có
        if (!activeSessionId) {
          activeSessionId = addSession('Tập luyện tự do', todayStr);
        }

        const session = sessions.find(s => s.id === activeSessionId) || sessions[0];
        
        if (session) {
          // Sao chép session để tránh biến đổi trạng thái trực tiếp
          const updatedSession = { 
            ...session, 
            exercises: [...(session.exercises || [])] 
          };

          // Tìm xem bài tập đã tồn tại chưa
          let exercise = updatedSession.exercises.find(
            e => e.name.toLowerCase().includes(result.payload.exerciseName.toLowerCase())
          );

          if (!exercise) {
            exercise = {
              id: Math.random().toString(36).substring(2, 9),
              name: result.payload.exerciseName,
              sets: []
            };
            updatedSession.exercises.push(exercise);
          }

          // Đảm bảo thuộc tính sets là một mảng
          if (!exercise.sets) {
            exercise.sets = [];
          }

          const targetSetIndex = result.payload.setIndex - 1; // 0-indexed
          const currentSetsCount = exercise.sets.length;

          // Thêm các sets cho đủ số lượng nếu cần
          if (currentSetsCount <= targetSetIndex) {
            for (let i = currentSetsCount; i <= targetSetIndex; i++) {
              exercise.sets.push({
                id: Math.random().toString(36).substring(2, 9),
                weight: result.payload.weight,
                reps: result.payload.reps,
                done: i === targetSetIndex
              });
            }
          } else {
            // Cập nhật lại set đã tồn tại
            const targetSet = exercise.sets[targetSetIndex];
            if (targetSet) {
              targetSet.weight = result.payload.weight;
              targetSet.reps = result.payload.reps;
              targetSet.done = true;
            }
          }

          // Lưu buổi tập đã cập nhật qua service
          workoutService.saveSession(updatedSession).catch(err => {
            console.error("Lỗi khi lưu/cập nhật buổi tập qua chatbot:", err);
          });

          // Kích hoạt bộ đếm thời gian nghỉ 60s
          setTimeout(() => useWorkoutStore.getState().startTimer(60), 0);
        }
        triggerHighlight('workout');
      }

      // 4. Thêm tin nhắn của AI trả lời vào store
      addMessage({ role: 'ai', content: result.reply });
    } catch (err) {
      console.error(err);
      addMessage({
        role: 'ai',
        content: 'Đã xảy ra lỗi khi trợ lý xử lý dữ liệu. Vui lòng thử lại.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <aside
      className={`chat-container ${isOpen ? 'open' : ''}`}
      style={{
        width: '380px',
        borderLeft: '1px solid var(--border)',
        backgroundColor: '#ffffff',
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        zIndex: 95,
        transition: 'transform 0.3s ease',
      }}
    >
      {/* Chat header */}
      <div
        style={{
          padding: '16px 20px',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: '#ffffff',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Bot size={20} color="var(--primary)" />
          <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>
            {t('chatbot.title')}
          </span>
        </div>
        
        {/* Mobile close button */}
        <button
          className="mobile-close-chat"
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            display: 'none',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: 'var(--slate-400)',
          }}
        >
          <X size={18} />
        </button>
      </div>

      {/* Message List */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          backgroundColor: 'var(--slate-50)/30',
        }}
      >
        {messages.map((msg) => {
          const isAI = msg.role === 'ai';
          const content = msg.content.startsWith('chatbot.') ? t(msg.content) : msg.content;
          return (
            <div
              key={msg.id}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: isAI ? 'flex-start' : 'flex-end',
                maxWidth: '85%',
                alignSelf: isAI ? 'flex-start' : 'flex-end',
              }}
            >
              <div
                style={{
                  padding: '12px 16px',
                  borderRadius: '16px',
                  fontSize: '0.925rem',
                  lineHeight: '1.4',
                  whiteSpace: 'pre-line',
                  backgroundColor: isAI ? 'var(--slate-100)' : 'var(--primary)',
                  color: isAI ? 'var(--slate-800)' : '#ffffff',
                  borderBottomLeftRadius: isAI ? '4px' : '16px',
                  borderBottomRightRadius: isAI ? '16px' : '4px',
                  boxShadow: isAI ? 'none' : '0 2px 8px rgba(37, 99, 235, 0.15)',
                }}
                dangerouslySetInnerHTML={{ __html: content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }}
              />
              <span
                style={{
                  fontSize: '0.7rem',
                  color: 'var(--slate-400)',
                  marginTop: '4px',
                  padding: '0 4px',
                }}
              >
                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          );
        })}
        {isLoading && (
          <div
            style={{
              alignSelf: 'flex-start',
              padding: '12px 16px',
              borderRadius: '16px',
              borderBottomLeftRadius: '4px',
              backgroundColor: 'var(--slate-100)',
              color: 'var(--slate-500)',
              fontSize: '0.9rem',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Bot size={16} color="var(--slate-500)" />
            <span className="dot-flashing">AI đang phân tích câu lệnh...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Suggestions Panel */}
      <div
        style={{
          borderTop: '1px solid var(--border-light)',
          backgroundColor: 'var(--slate-50)',
          padding: '10px 16px 8px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
        }}
      >
        {/* Scrollable category tabs */}
        <div
          style={{
            display: 'flex',
            gap: '8px',
            overflowX: 'auto',
            paddingBottom: '4px',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
          }}
          className="no-scrollbar"
        >
          {Object.entries(QUICK_SUGGESTIONS).map(([key, data]) => {
            const isActive = activeQuickTab === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setActiveQuickTab(isActive ? null : key)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 12px',
                  borderRadius: '9999px',
                  fontSize: '0.8rem',
                  fontWeight: 550,
                  whiteSpace: 'nowrap',
                  cursor: 'pointer',
                  border: '1.5px solid',
                  borderColor: isActive ? 'var(--primary)' : 'var(--slate-200)',
                  backgroundColor: isActive ? 'var(--primary-light)' : '#ffffff',
                  color: isActive ? 'var(--primary)' : 'var(--slate-700)',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
                  outline: 'none',
                }}
              >
                <span>{data.icon}</span>
                <span>{data.label}</span>
              </button>
            );
          })}
        </div>

        {/* Suggestion templates list */}
        {activeQuickTab && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
              animation: 'slideUp 0.2s ease-out',
            }}
          >
            {QUICK_SUGGESTIONS[activeQuickTab].templates.map((tmpl, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSelectTemplate(tmpl)}
                className="template-button"
                style={{
                  textAlign: 'left',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: '1px dashed var(--slate-300)',
                  backgroundColor: '#ffffff',
                  fontSize: '0.825rem',
                  fontFamily: 'var(--font-sans)',
                  color: 'var(--slate-700)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '8px',
                  outline: 'none',
                }}
              >
                <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {tmpl}
                </span>
                <span
                  style={{
                    fontSize: '0.7rem',
                    color: 'var(--primary)',
                    fontWeight: 600,
                    backgroundColor: 'var(--primary-light)',
                    padding: '2px 6px',
                    borderRadius: '4px',
                  }}
                >
                  Chọn
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Input section */}
      <form
        onSubmit={handleSendMessage}
        style={{
          padding: '16px 20px',
          borderTop: '1px solid var(--border)',
          display: 'flex',
          gap: '10px',
          backgroundColor: '#ffffff',
        }}
      >
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder={t('chatbot.placeholder')}
          disabled={isLoading}
          style={{
            flex: 1,
            padding: '10px 14px',
            borderRadius: '10px',
            border: '1px solid var(--border)',
            fontSize: '0.9rem',
            outline: 'none',
            transition: 'border-color 0.2s',
          }}
          onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
          onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
        />
        <button
          type="submit"
          disabled={isLoading || !inputValue.trim()}
          style={{
            padding: '10px 16px',
            borderRadius: '10px',
            backgroundColor: 'var(--primary)',
            color: '#ffffff',
            border: 'none',
            fontWeight: 600,
            fontSize: '0.9rem',
            cursor: 'pointer',
            transition: 'background-color 0.2s',
            opacity: !inputValue.trim() || isLoading ? 0.6 : 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <SendHorizontal size={16} color="white" />
        </button>
      </form>

      {/* CSS Styles phụ cho chat */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media (max-width: 768px) {
          .chat-container {
            position: fixed;
            top: 0;
            right: 0;
            width: 100vw !important;
            transform: translateX(100%);
          }
          .chat-container.open {
            transform: translateX(0);
          }
          .mobile-close-chat {
            display: flex !important;
          }
        }
        .dot-flashing {
          animation: flash-text 1.5s infinite alternate;
        }
        @keyframes flash-text {
          0% { opacity: 0.5; }
          100% { opacity: 1; }
        }
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(6px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .template-button:hover {
          border-color: var(--primary) !important;
          background-color: var(--slate-50) !important;
          transform: translateX(3px);
        }
      `}} />
    </aside>
  );
};
