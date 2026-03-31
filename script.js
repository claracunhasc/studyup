// ---------- STORAGE KEYS ----------
const STORAGE_SUBJECTS = 'studyup_subjects';
const STORAGE_NOTICES = 'studyup_notices';
const STORAGE_GOALS = 'studyup_goals';
const STORAGE_TIMER = 'studyup_timer_state';

// ---------- GLOBALS TIMER ----------
let timerSeconds = 0;
let timerInterval = null;
let timerRunning = false;

// Elementos DOM
const timerDisplay = document.getElementById('timerDisplay');
const startBtn = document.getElementById('startTimerBtn');
const pauseBtn = document.getElementById('pauseTimerBtn');
const resetBtn = document.getElementById('resetTimerBtn');

// Matérias
const subjectInput = document.getElementById('subjectNameInput');
const addSubjectBtn = document.getElementById('addSubjectBtn');
const subjectsList = document.getElementById('subjectsList');

// Avisos
const noticesContainer = document.getElementById('noticesContainer');
const noticeInput = document.getElementById('noticeInput');
const addNoticeBtn = document.getElementById('addNoticeBtn');

// Metas
const goalsContainer = document.getElementById('goalsContainer');
const goalNameInput = document.getElementById('goalNameInput');
const addGoalBtn = document.getElementById('addGoalBtn');
const completedCountSpan = document.getElementById('completedCount');
const totalGoalsCountSpan = document.getElementById('totalGoalsCount');

// ---------- FUNÇÕES AUXILIARES TIMER ----------
function formatTime(secs) {
    const hours = Math.floor(secs / 3600);
    const minutes = Math.floor((secs % 3600) / 60);
    const seconds = secs % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

function updateTimerDisplay() {
    timerDisplay.textContent = formatTime(timerSeconds);
}

function startTimer() {
    if (timerInterval) return;
    timerRunning = true;
    timerInterval = setInterval(() => {
        timerSeconds++;
        updateTimerDisplay();
        saveTimerStateToLocal();
    }, 1000);
}

function pauseTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
        timerRunning = false;
        saveTimerStateToLocal();
    }
}

function resetTimer() {
    pauseTimer();
    timerSeconds = 0;
    updateTimerDisplay();
    saveTimerStateToLocal();
}

function saveTimerStateToLocal() {
    const state = {
        seconds: timerSeconds,
        running: timerRunning
    };
    localStorage.setItem(STORAGE_TIMER, JSON.stringify(state));
}

function loadTimerState() {
    const saved = localStorage.getItem(STORAGE_TIMER);
    if (saved) {
        try {
            const state = JSON.parse(saved);
            timerSeconds = state.seconds || 0;
            updateTimerDisplay();
            if (state.running === true) {
                startTimer();
            } else {
                if (timerInterval) {
                    clearInterval(timerInterval);
                    timerInterval = null;
                }
                timerRunning = false;
            }
        } catch(e) { console.warn(e); }
    } else {
        timerSeconds = 0;
        updateTimerDisplay();
        timerRunning = false;
    }
}

// ---------- MATÉRIAS (CRUD) ----------
let subjects = [];

function renderSubjects() {
    if (!subjectsList) return;
    if (subjects.length === 0) {
        subjectsList.innerHTML = '<li class="empty-message">Nenhuma matéria adicionada ainda.</li>';
        return;
    }
    subjectsList.innerHTML = subjects.map((subj, idx) => `
        <li>
            <span>📖 ${escapeHtml(subj)}</span>
            <button class="delete-subj" data-index="${idx}" title="Remover matéria">🗑️</button>
        </li>
    `).join('');
    
    document.querySelectorAll('.delete-subj').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const idx = parseInt(btn.getAttribute('data-index'), 10);
            if (!isNaN(idx)) {
                subjects.splice(idx, 1);
                saveSubjects();
                renderSubjects();
            }
        });
    });
}

function saveSubjects() {
    localStorage.setItem(STORAGE_SUBJECTS, JSON.stringify(subjects));
}

function loadSubjects() {
    const stored = localStorage.getItem(STORAGE_SUBJECTS);
    if (stored) {
        try {
            subjects = JSON.parse(stored);
            if (!Array.isArray(subjects)) subjects = [];
        } catch(e) { subjects = []; }
    } else {
        subjects = [];
    }
    renderSubjects();
}

function addSubject() {
    let newSubject = subjectInput.value.trim();
    if (newSubject === "") {
        alert("Digite o nome da matéria!");
        return;
    }
    subjects.push(newSubject);
    saveSubjects();
    renderSubjects();
    subjectInput.value = "";
    subjectInput.focus();
}

// ---------- AVISOS ----------
let notices = [];

function renderNotices() {
    if (!noticesContainer) return;
    if (notices.length === 0) {
        noticesContainer.innerHTML = '<div class="empty-message">Sem avisos por enquanto.</div>';
        return;
    }
    noticesContainer.innerHTML = notices.map((notice, idx) => `
        <div class="notice-item">
            <div>
                <div class="notice-text">📌 ${escapeHtml(notice.text)}</div>
                <div class="notice-date">${escapeHtml(notice.date)}</div>
            </div>
            <button class="delete-notice" data-idx="${idx}" style="background:none; color:#dc2626; font-size:1.2rem;">✖</button>
        </div>
    `).join('');
    
    document.querySelectorAll('.delete-notice').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const idx = parseInt(btn.getAttribute('data-idx'), 10);
            if (!isNaN(idx)) {
                notices.splice(idx, 1);
                saveNotices();
                renderNotices();
            }
        });
    });
}

function saveNotices() {
    localStorage.setItem(STORAGE_NOTICES, JSON.stringify(notices));
}

function loadNotices() {
    const stored = localStorage.getItem(STORAGE_NOTICES);
    if (stored) {
        try {
            notices = JSON.parse(stored);
            if (!Array.isArray(notices)) notices = [];
        } catch(e) { notices = []; }
    } else {
        notices = [
            { text: "Revisar física toda quarta", date: new Date().toLocaleDateString() },
            { text: "Simulado ENEM no sábado", date: new Date().toLocaleDateString() }
        ];
        saveNotices();
    }
    renderNotices();
}

function addNotice() {
    let text = noticeInput.value.trim();
    if (text === "") {
        alert("Digite o conteúdo do aviso!");
        return;
    }
    const newNotice = {
        text: text,
        date: new Date().toLocaleString()
    };
    notices.unshift(newNotice);
    saveNotices();
    renderNotices();
    noticeInput.value = "";
}

// ---------- METAS ----------
let goals = [];

function updateMetaStats() {
    const total = goals.length;
    const completed = goals.filter(g => g.completed === true).length;
    completedCountSpan.textContent = completed;
    totalGoalsCountSpan.textContent = total;
}

function renderGoals() {
    if (!goalsContainer) return;
    if (goals.length === 0) {
        goalsContainer.innerHTML = '<div class="empty-message">Nenhuma meta definida. Crie uma meta e marque como concluída!</div>';
        updateMetaStats();
        return;
    }
    goalsContainer.innerHTML = goals.map(goal => `
        <div class="goal-item" data-goal-id="${goal.id}">
            <div class="goal-info">
                <span class="goal-name">🎯 ${escapeHtml(goal.name)}</span>
                <span class="goal-status ${goal.completed ? 'completed' : 'pending'}">
                    ${goal.completed ? '✔️ Cumprida' : '⏳ Pendente'}
                </span>
            </div>
            <div class="goal-actions">
                ${!goal.completed ? `<button class="complete-goal-btn" data-id="${goal.id}" style="background:#22c55e; color:white;">✅ Marcar cumprida</button>` : 
                                    `<button class="undo-goal-btn" data-id="${goal.id}" style="background:#94a3b8; color:white;">↩️ Desmarcar</button>`}
                <button class="delete-goal-btn" data-id="${goal.id}" style="background:#ef4444; color:white;">🗑️ Remover</button>
            </div>
        </div>
    `).join('');

    document.querySelectorAll('.complete-goal-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = btn.getAttribute('data-id');
            const goal = goals.find(g => g.id === id);
            if (goal) {
                goal.completed = true;
                saveGoals();
                renderGoals();
            }
        });
    });
    document.querySelectorAll('.undo-goal-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = btn.getAttribute('data-id');
            const goal = goals.find(g => g.id === id);
            if (goal) {
                goal.completed = false;
                saveGoals();
                renderGoals();
            }
        });
    });
    document.querySelectorAll('.delete-goal-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = btn.getAttribute('data-id');
            goals = goals.filter(g => g.id !== id);
            saveGoals();
            renderGoals();
        });
    });
    updateMetaStats();
}

function saveGoals() {
    localStorage.setItem(STORAGE_GOALS, JSON.stringify(goals));
}

function loadGoals() {
    const stored = localStorage.getItem(STORAGE_GOALS);
    if (stored) {
        try {
            goals = JSON.parse(stored);
            if (!Array.isArray(goals)) goals = [];
            goals = goals.map(g => ({ ...g, completed: g.completed === true, id: g.id || crypto.randomUUID?.() || Date.now()+Math.random() }));
        } catch(e) { goals = []; }
    } else {
        goals = [
            { id: 'goal1', name: 'Estudar 2h de matemática', completed: false },
            { id: 'goal2', name: 'Revisar anotações de português', completed: true },
            { id: 'goal3', name: 'Completar exercícios de química', completed: false }
        ];
        saveGoals();
    }
    renderGoals();
}

function addGoal() {
    let goalName = goalNameInput.value.trim();
    if (goalName === "") {
        alert("Escreva o nome da meta!");
        return;
    }
    const newGoal = {
        id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString() + Math.random().toString(36),
        name: goalName,
        completed: false
    };
    goals.push(newGoal);
    saveGoals();
    renderGoals();
    goalNameInput.value = "";
}

// Escapar HTML para evitar injeção
function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    }).replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, function(c) {
        return c;
    });
}

window.addEventListener('beforeunload', () => {
    if (timerInterval) {
        saveTimerStateToLocal();
    } else {
        saveTimerStateToLocal();
    }
});

// Inicialização geral
function init() {
    loadTimerState();
    loadSubjects();
    loadNotices();
    loadGoals();

    startBtn.addEventListener('click', startTimer);
    pauseBtn.addEventListener('click', pauseTimer);
    resetBtn.addEventListener('click', resetTimer);
    addSubjectBtn.addEventListener('click', addSubject);
    subjectInput.addEventListener('keypress', (e) => { if(e.key === 'Enter') addSubject(); });
    addNoticeBtn.addEventListener('click', addNotice);
    noticeInput.addEventListener('keypress', (e) => { if(e.key === 'Enter') addNotice(); });
    addGoalBtn.addEventListener('click', addGoal);
    goalNameInput.addEventListener('keypress', (e) => { if(e.key === 'Enter') addGoal(); });
}

init();