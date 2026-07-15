// Quotes Pool
const quotes = [
    { text: "Small daily improvements over time lead to stunning results.", author: "Robin Sharma" },
    { text: "We are what we repeatedly do. Excellence, then, is not an act, but a habit.", author: "Aristotle" },
    { text: "It is easier to prevent bad habits than to break them.", author: "Benjamin Franklin" },
    { text: "Motivation is what gets you started. Habit is what keeps you going.", author: "Jim Ryun" },
    { text: "All big things come from small beginnings.", author: "James Clear" },
    { text: "Your habits will determine your future.", author: "Jack Canfield" },
    { text: "Drop by drop is the water pot filled.", author: "Buddha" }
];

// Milestones / Badges definition
const badgeDefinitions = [
    { id: 'first_step', name: 'First Step', desc: 'Complete your first habit check-in', icon: '🌱', check: (state) => state.totalCompletions >= 1 },
    { id: 'streak_3', name: 'Streak Starter', desc: 'Achieve a 3-day streak on any habit', icon: '🔥', check: (state) => state.bestStreak >= 3 },
    { id: 'streak_7', name: 'Unstoppable', desc: 'Achieve a 7-day streak on any habit', icon: '⚡', check: (state) => state.bestStreak >= 7 },
    { id: 'habit_master', name: 'Habit Master', desc: 'Have 5 or more active habits', icon: '👑', check: (state) => state.activeCount >= 5 },
    { id: 'perfect_day', name: 'Perfect Day', desc: 'Complete all active habits in a single day', icon: '✨', check: (state) => state.perfectDays >= 1 }
];

// App State
let state = {
    habits: [],
    selectedCategory: 'Health',
    selectedColor: '260, 85%, 65%',
    currentTab: 'dashboard'
};

// Initialize App
window.addEventListener('DOMContentLoaded', () => {
    loadData();
    displayQuote();
    render();
    
    // Refresh date headings
    updateGreetings();
    
    // Start Geolocation Background Tracking
    initGpsTracking();
});

// Switch Dashboard tabs
function switchTab(tabId) {
    state.currentTab = tabId;
    
    // Update sidebar UI classes
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
    document.getElementById(`nav-${tabId}`).classList.add('active');
    
    // Hide/show tabs
    document.getElementById('dashboard-tab').style.display = tabId === 'dashboard' ? 'flex' : 'none';
    document.getElementById('analytics-tab').style.display = tabId === 'analytics' ? 'flex' : 'none';
    document.getElementById('badges-tab').style.display = tabId === 'badges' ? 'flex' : 'none';
    
    if (tabId === 'analytics') {
        renderAnalytics();
    } else if (tabId === 'badges') {
        renderBadges();
    }
}

// Display Random Quote
function displayQuote() {
    const randomIndex = Math.floor(Math.random() * quotes.length);
    const quote = quotes[randomIndex];
    document.getElementById('daily-quote').innerText = `"${quote.text}"`;
    document.getElementById('daily-quote-author').innerText = `— ${quote.author}`;
}

// Dynamic Greetings
function updateGreetings() {
    const hour = new Date().getHours();
    let greeting = "Good morning";
    if (hour >= 12 && hour < 17) greeting = "Good afternoon";
    if (hour >= 17) greeting = "Good evening";
    
    document.getElementById('greeting-title').innerText = `${greeting}, Champion`;
}

// Generate the past 7 days list (rolling calendar)
function getPast7Days() {
    const days = [];
    const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        days.push({
            dateString: d.toISOString().split('T')[0], // YYYY-MM-DD
            label: weekdays[d.getDay()],
            isToday: i === 0
        });
    }
    return days;
}

// Load from LocalStorage
function loadData() {
    const saved = localStorage.getItem('aurahabit_state');
    if (saved) {
        try {
            state.habits = JSON.parse(saved);
        } catch (e) {
            console.error("Failed to parse habits data", e);
            state.habits = [];
        }
    } else {
        // Mock habits for a fresh wow factor
        state.habits = [
            {
                id: '1',
                name: 'Morning Meditation',
                category: 'Mind',
                color: '260, 85%, 65%',
                history: {}
            },
            {
                id: '2',
                name: 'Drink 3L Water',
                category: 'Health',
                color: '200, 95%, 55%',
                history: {}
            }
        ];
        
        // Mark yesterday as complete to show streaks working
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];
        state.habits[0].history[yesterdayStr] = true;
        
        saveToLocalStorage();
    }
}

// Save to LocalStorage
function saveToLocalStorage() {
    localStorage.setItem('aurahabit_state', JSON.stringify(state.habits));
}

// Calculate streaks for a habit
function calculateStreak(habit) {
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;
    
    // Sort all completion dates
    const completedDates = Object.keys(habit.history)
        .filter(date => habit.history[date])
        .sort((a, b) => new Date(a) - new Date(b));
        
    if (completedDates.length === 0) {
        return { current: 0, best: 0 };
    }
    
    // Calculate best & current streak
    let prevDate = null;
    completedDates.forEach(dateStr => {
        const currentDate = new Date(dateStr);
        if (prevDate === null) {
            tempStreak = 1;
        } else {
            const diffTime = Math.abs(currentDate - prevDate);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            if (diffDays === 1) {
                tempStreak++;
            } else if (diffDays > 1) {
                if (tempStreak > longestStreak) longestStreak = tempStreak;
                tempStreak = 1;
            }
        }
        prevDate = currentDate;
    });
    
    if (tempStreak > longestStreak) longestStreak = tempStreak;
    
    // Check if current streak is still active (completed today or yesterday)
    const todayStr = new Date().toISOString().split('T')[0];
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    
    if (habit.history[todayStr] || habit.history[yesterdayStr]) {
        currentStreak = tempStreak;
    } else {
        currentStreak = 0;
    }
    
    return { current: currentStreak, best: longestStreak };
}

// Global metrics helper
function getMetrics() {
    let totalCompletions = 0;
    let bestStreak = 0;
    let activeCount = state.habits.length;
    let completedTodayCount = 0;
    
    const todayStr = new Date().toISOString().split('T')[0];
    
    state.habits.forEach(habit => {
        const streakInfo = calculateStreak(habit);
        if (streakInfo.best > bestStreak) bestStreak = streakInfo.best;
        
        totalCompletions += Object.values(habit.history).filter(v => v).length;
        if (habit.history[todayStr]) completedTodayCount++;
    });
    
    const completionRate = activeCount > 0 ? Math.round((completedTodayCount / activeCount) * 100) : 0;
    
    // Approximate perfect days logic (days where all active habits were completed)
    // Gather all historical completion dates
    const allDates = new Set();
    state.habits.forEach(h => Object.keys(h.history).forEach(d => allDates.add(d)));
    let perfectDays = 0;
    allDates.forEach(dateStr => {
        let allDone = true;
        state.habits.forEach(h => {
            if (!h.history[dateStr]) allDone = false;
        });
        if (allDone && state.habits.length > 0) perfectDays++;
    });
    
    return {
        totalCompletions,
        bestStreak,
        activeCount,
        completedTodayCount,
        completionRate,
        perfectDays
    };
}

// Render Dashboard & General UI
function render() {
    renderHabitsList();
    renderStats();
    
    // Re-trigger Lucide icons parsing
    if (window.lucide) {
        window.lucide.createIcons();
    }
}

// Render Stats Cards & Progress Ring
function renderStats() {
    const metrics = getMetrics();
    
    document.getElementById('stat-total-active').innerText = metrics.activeCount;
    document.getElementById('stat-current-streak').innerText = `${metrics.bestStreak} days`;
    document.getElementById('stat-completion-rate').innerText = `${metrics.completionRate}%`;
    
    // Update SVG Progress Circle
    const circle = document.getElementById('overall-progress-ring');
    const percentText = document.getElementById('progress-ring-percent');
    
    const radius = 58;
    const circumference = 2 * Math.PI * radius; // ~364.42
    
    const offset = circumference - (metrics.completionRate / 100) * circumference;
    circle.style.strokeDashoffset = offset;
    percentText.innerText = `${metrics.completionRate}%`;
}

// Render Habits list
function renderHabitsList() {
    const container = document.getElementById('habits-list-container');
    container.innerHTML = '';
    
    if (state.habits.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">
                    <i data-lucide="calendar"></i>
                </div>
                <h3>No habits added yet</h3>
                <p>Build consistency by tracking your first daily habit.</p>
                <button class="btn-primary" style="margin-top: 0.5rem;" onclick="openAddHabitModal()">
                    Add Habit Now
                </button>
            </div>
        `;
        return;
    }
    
    const past7Days = getPast7Days();
    
    state.habits.forEach(habit => {
        const streaks = calculateStreak(habit);
        
        const card = document.createElement('div');
        card.className = 'habit-card';
        card.style.setProperty('--habit-color', habit.color);
        // compute gradient alternate
        const parts = habit.color.split(',');
        const hue = parts[0].trim();
        const sat = parts[1].trim();
        const light = parseInt(parts[2]) - 10;
        card.style.setProperty('--habit-color-alt', `${hue}, ${sat}, ${light}%`);
        
        // build day nodes
        let daysHtml = '';
        past7Days.forEach(day => {
            const isCompleted = !!habit.history[day.dateString];
            const checkedClass = isCompleted ? 'checked' : '';
            const checkIcon = isCompleted ? '<i data-lucide="check"></i>' : '';
            
            daysHtml += `
                <div class="weekly-day">
                    <span class="day-label">${day.label}</span>
                    <div class="day-checkbox ${checkedClass}" onclick="toggleHabitDay('${habit.id}', '${day.dateString}')">
                        ${checkIcon}
                    </div>
                </div>
            `;
        });
        
        const todayStr = new Date().toISOString().split('T')[0];
        let trackerWidgetHtml = '';
        
        const type = habit.trackingType || (habit.gps ? 'gps' : 'manual');
        const target = habit.targetVal || habit.gpsDistance || 0;
        
        if (type === 'gps') {
            const currentDist = (habit.history_gps_distance && habit.history_gps_distance[todayStr]) || 0;
            const pct = Math.min(Math.round((currentDist / target) * 100), 100);
            
            trackerWidgetHtml = `
                <div class="tracker-widget" style="margin-top: 0.25rem; margin-bottom: 0.25rem; background: rgba(255,255,255,0.02); padding: 0.75rem; border-radius: 10px; border: 1px solid rgba(255,255,255,0.04);">
                    <div style="display: flex; justify-content: space-between; font-size: 0.75rem; color: var(--text-secondary); margin-bottom: 6px;">
                        <span><i data-lucide="navigation" style="width: 12px; height: 12px; display: inline-block; vertical-align: middle; margin-right: 4px; color: #10b981;"></i> GPS Tracking</span>
                        <span style="font-weight: 600;">${currentDist.toFixed(2)} / ${target.toFixed(2)} km (${pct}%)</span>
                    </div>
                    <div style="width: 100%; height: 6px; background: rgba(255,255,255,0.03); border-radius: 3px; overflow: hidden;">
                        <div style="width: ${pct}%; height: 100%; background: linear-gradient(to right, #10b981, #00f0ff); border-radius: 3px; transition: width 0.3s ease;"></div>
                    </div>
                </div>
            `;
        } else if (type === 'sleep') {
            const progress = (habit.dailyProgress && habit.dailyProgress[todayStr]) || 0;
            const isSleeping = !!habit.sleepStart;
            
            let sleepStatus = '';
            let btnLabel = '';
            let btnColor = '';
            let iconName = '';
            
            if (isSleeping) {
                sleepStatus = `<span style="color: #60a5fa; font-weight: 600; font-size: 0.8rem; animation: pulse 1.5s infinite;">Ticking: sleeping...</span>`;
                btnLabel = 'Wake Up';
                btnColor = 'rgba(239, 68, 68, 0.15)';
                iconName = 'sun';
            } else {
                sleepStatus = `<span style="font-size: 0.8rem; color: var(--text-secondary);">Logged Today: <strong>${progress}h</strong> / ${target}h</span>`;
                btnLabel = 'Start Sleep';
                btnColor = 'rgba(139, 92, 246, 0.15)';
                iconName = 'moon';
            }
            
            trackerWidgetHtml = `
                <div class="tracker-widget" style="margin-top: 0.25rem; margin-bottom: 0.25rem; display: flex; align-items: center; justify-content: space-between; background: rgba(255,255,255,0.02); padding: 0.75rem; border-radius: 10px; border: 1px solid rgba(255,255,255,0.04);">
                    <div style="display: flex; flex-direction: column; gap: 2px;">
                        <span style="font-size: 0.75rem; color: var(--text-muted); display: flex; align-items: center; gap: 4px;"><i data-lucide="moon" style="width: 12px;"></i> Sleep Monitor</span>
                        ${sleepStatus}
                    </div>
                    <button class="btn" onclick="${isSleeping ? `stopSleep('${habit.id}')` : `startSleep('${habit.id}')`}" style="width: auto; padding: 0.5rem 1rem; font-size: 0.75rem; background: ${btnColor}; color: white; border: 1px solid rgba(255,255,255,0.05); display: flex; align-items: center; gap: 6px;">
                        <i data-lucide="${iconName}" style="width: 14px; height: 14px;"></i> ${btnLabel}
                    </button>
                </div>
            `;
        } else if (type === 'focus') {
            const isTimerRunning = !!habit.focusActive;
            const remaining = habit.focusRemaining !== undefined ? habit.focusRemaining : target * 60;
            const mins = Math.floor(remaining / 60).toString().padStart(2, '0');
            const secs = (remaining % 60).toString().padStart(2, '0');
            
            trackerWidgetHtml = `
                <div class="tracker-widget" style="margin-top: 0.25rem; margin-bottom: 0.25rem; display: flex; align-items: center; justify-content: space-between; background: rgba(255,255,255,0.02); padding: 0.75rem; border-radius: 10px; border: 1px solid rgba(255,255,255,0.04);">
                    <div style="display: flex; flex-direction: column; gap: 2px;">
                        <span style="font-size: 0.75rem; color: var(--text-muted); display: flex; align-items: center; gap: 4px;"><i data-lucide="hourglass" style="width: 12px;"></i> Focus Timer</span>
                        <span id="timer-display-${habit.id}" style="font-weight: 700; font-size: 1.1rem; color: #ec4899; text-shadow: 0 0 10px rgba(236,72,153,0.3);">${mins}:${secs}</span>
                    </div>
                    <button class="btn" onclick="toggleFocus('${habit.id}')" style="width: auto; padding: 0.5rem 1rem; font-size: 0.75rem; background: rgba(236,72,153,0.15); color: white; border: 1px solid rgba(255,255,255,0.05); display: flex; align-items: center; gap: 6px;">
                        <i data-lucide="${isTimerRunning ? 'pause' : 'play'}" style="width: 14px; height: 14px;"></i> ${isTimerRunning ? 'Pause' : 'Start'}
                    </button>
                </div>
            `;
        } else if (type === 'counter') {
            const progress = (habit.dailyProgress && habit.dailyProgress[todayStr]) || 0;
            
            trackerWidgetHtml = `
                <div class="tracker-widget" style="margin-top: 0.25rem; margin-bottom: 0.25rem; display: flex; align-items: center; justify-content: space-between; background: rgba(255,255,255,0.02); padding: 0.75rem; border-radius: 10px; border: 1px solid rgba(255,255,255,0.04);">
                    <div style="display: flex; flex-direction: column; gap: 2px;">
                        <span style="font-size: 0.75rem; color: var(--text-muted); display: flex; align-items: center; gap: 4px;"><i data-lucide="hash" style="width: 12px;"></i> Quick Logger</span>
                        <span style="font-size: 0.8rem; color: var(--text-secondary);">Logged Today: <strong style="color: #60a5fa;">${progress}</strong> / ${target} ${habit.unit || 'counts'}</span>
                    </div>
                    <div style="display: flex; gap: 6px;">
                        <button class="btn" onclick="adjustCounter('${habit.id}', -1)" style="width: 32px; height: 32px; padding: 0; display: flex; align-items: center; justify-content: center; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.05); color: white; font-weight: bold; border-radius: 8px;">-</button>
                        <button class="btn" onclick="adjustCounter('${habit.id}', 1)" style="width: 32px; height: 32px; padding: 0; display: flex; align-items: center; justify-content: center; background: rgba(96, 165, 250, 0.15); border: 1px solid rgba(255,255,255,0.05); color: white; font-weight: bold; border-radius: 8px;">+</button>
                    </div>
                </div>
            `;
        }

        card.innerHTML = `
            <div class="habit-header">
                <div class="habit-details">
                    <div class="habit-category-icon">
                        <i data-lucide="${getCategoryIcon(habit.category)}"></i>
                    </div>
                    <div class="habit-title-wrapper">
                        <span class="habit-title">${habit.name}</span>
                        <span class="habit-category">${habit.category}</span>
                    </div>
                </div>
                <div class="habit-actions-top">
                    <button class="habit-btn" onclick="openEditHabitModal('${habit.id}')" title="Edit habit">
                        <i data-lucide="edit-3" style="width: 16px; height: 16px;"></i>
                    </button>
                    <button class="habit-btn delete" onclick="deleteHabit('${habit.id}')" title="Delete habit">
                        <i data-lucide="trash-2" style="width: 16px; height: 16px;"></i>
                    </button>
                </div>
            </div>
            
            ${trackerWidgetHtml}
            
            <div class="habit-weekly-grid">
                ${daysHtml}
            </div>
            
            <div class="habit-footer-stats">
                <span class="habit-streak">
                    <i data-lucide="flame" style="width: 14px; height: 14px; fill: currentColor;"></i>
                    Streak: ${streaks.current} days
                </span>
                <span>Best: ${streaks.best} days</span>
            </div>
        `;
        
        container.appendChild(card);
    });
}

// Get icon name based on category
function getCategoryIcon(cat) {
    switch (cat) {
        case 'Health': return 'activity';
        case 'Mind': return 'brain';
        case 'Work': return 'briefcase';
        case 'Fitness': return 'dumbbell';
        case 'Social': return 'users';
        default: return 'check-circle';
    }
}

// Toggle habit day check status
function toggleHabitDay(habitId, dateString) {
    const habit = state.habits.find(h => h.id === habitId);
    if (!habit) return;
    
    const wasChecked = !!habit.history[dateString];
    habit.history[dateString] = !wasChecked;
    
    // Play satisfying sound if checked
    if (!wasChecked) {
        const sound = document.getElementById('completion-sound');
        if (sound) {
            sound.currentTime = 0;
            sound.play().catch(err => console.log('Audio playback context needs interaction first.'));
        }
    }
    
    saveToLocalStorage();
    render();
    
    // If currently on other tabs, update them too
    if (state.currentTab === 'analytics') renderAnalytics();
    if (state.currentTab === 'badges') renderBadges();
}

// Modal open/close functions
function openAddHabitModal() {
    document.getElementById('modal-action-title').innerText = "Create New Habit";
    document.getElementById('edit-habit-id').value = "";
    document.getElementById('habit-name').value = "";
    
    // Reset selection defaults
    state.selectedCategory = 'Health';
    state.selectedColor = '260, 85%, 65%';
    
    // Reset tracking type select
    document.getElementById('habit-tracking-type').value = 'manual';
    handleTrackingTypeChange('manual');
    
    // Reset inputs
    document.getElementById('input-target-gps').value = '5.0';
    document.getElementById('input-target-sleep').value = '8.0';
    document.getElementById('input-target-focus').value = '25';
    document.getElementById('input-target-counter').value = '8';
    document.getElementById('input-unit-counter').value = 'glasses';
    
    updateCategorySelectors();
    updateThemeSelectors();
    
    document.getElementById('habit-modal').classList.add('active');
}

function openEditHabitModal(habitId) {
    const habit = state.habits.find(h => h.id === habitId);
    if (!habit) return;
    
    document.getElementById('modal-action-title').innerText = "Edit Habit";
    document.getElementById('edit-habit-id').value = habit.id;
    document.getElementById('habit-name').value = habit.name;
    
    state.selectedCategory = habit.category;
    state.selectedColor = habit.color;
    
    // Set tracking type values
    const trackingType = habit.trackingType || 'manual';
    document.getElementById('habit-tracking-type').value = trackingType;
    handleTrackingTypeChange(trackingType);
    
    if (trackingType === 'gps') {
        document.getElementById('input-target-gps').value = habit.targetVal || '5.0';
    } else if (trackingType === 'sleep') {
        document.getElementById('input-target-sleep').value = habit.targetVal || '8.0';
    } else if (trackingType === 'focus') {
        document.getElementById('input-target-focus').value = habit.targetVal || '25';
    } else if (trackingType === 'counter') {
        document.getElementById('input-target-counter').value = habit.targetVal || '8';
        document.getElementById('input-unit-counter').value = habit.unit || 'glasses';
    }
    
    updateCategorySelectors();
    updateThemeSelectors();
    
    document.getElementById('habit-modal').classList.add('active');
}

function closeHabitModal() {
    document.getElementById('habit-modal').classList.remove('active');
}

function selectCategory(elem) {
    document.querySelectorAll('.category-option').forEach(opt => opt.classList.remove('selected'));
    elem.classList.add('selected');
    state.selectedCategory = elem.getAttribute('data-category');
}

function updateCategorySelectors() {
    document.querySelectorAll('.category-option').forEach(opt => {
        if (opt.getAttribute('data-category') === state.selectedCategory) {
            opt.classList.add('selected');
        } else {
            opt.classList.remove('selected');
        }
    });
}

function updateThemeSelectors() {
    document.querySelectorAll('.color-option').forEach(opt => {
        if (opt.getAttribute('data-color') === state.selectedColor) {
            opt.classList.add('selected');
        } else {
            opt.classList.remove('selected');
        }
    });
    
    // Add click listeners
    document.querySelectorAll('.color-option').forEach(opt => {
        opt.onclick = function() {
            document.querySelectorAll('.color-option').forEach(o => o.classList.remove('selected'));
            this.classList.add('selected');
            state.selectedColor = this.getAttribute('data-color');
        };
    });
}

// Form Submit Handler (Save or Update)
function saveHabit(e) {
    e.preventDefault();
    
    const habitId = document.getElementById('edit-habit-id').value;
    const name = document.getElementById('habit-name').value.trim();
    
    if (!name) return;
    
    const trackingType = document.getElementById('habit-tracking-type').value;
    let targetVal = 0;
    let unit = '';
    
    if (trackingType === 'gps') {
        targetVal = parseFloat(document.getElementById('input-target-gps').value) || 5.0;
    } else if (trackingType === 'sleep') {
        targetVal = parseFloat(document.getElementById('input-target-sleep').value) || 8.0;
    } else if (trackingType === 'focus') {
        targetVal = parseFloat(document.getElementById('input-target-focus').value) || 25;
    } else if (trackingType === 'counter') {
        targetVal = parseInt(document.getElementById('input-target-counter').value) || 8;
        unit = document.getElementById('input-unit-counter').value.trim() || 'glasses';
    }
    
    if (habitId) {
        // Edit mode
        const habit = state.habits.find(h => h.id === habitId);
        if (habit) {
            habit.name = name;
            habit.category = state.selectedCategory;
            habit.color = state.selectedColor;
            habit.trackingType = trackingType;
            habit.targetVal = targetVal;
            habit.unit = unit;
            
            // Backwards compatibility legacy fields
            habit.gps = trackingType === 'gps';
            habit.gpsDistance = trackingType === 'gps' ? targetVal : 0;
        }
    } else {
        // Add Mode
        const newHabit = {
            id: Date.now().toString(),
            name: name,
            category: state.selectedCategory,
            color: state.selectedColor,
            trackingType: trackingType,
            targetVal: targetVal,
            unit: unit,
            history: {},
            dailyProgress: {},
            
            // Backwards compatibility legacy fields
            gps: trackingType === 'gps',
            gpsDistance: trackingType === 'gps' ? targetVal : 0,
            history_gps_distance: {}
        };
        state.habits.push(newHabit);
    }
    
    saveToLocalStorage();
    closeHabitModal();
    render();
}

// Delete Habit
function deleteHabit(habitId) {
    if (confirm("Are you sure you want to delete this habit?")) {
        state.habits = state.habits.filter(h => h.id !== habitId);
        saveToLocalStorage();
        render();
    }
}

// Export habits data as JSON
function exportData() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state.habits));
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute("href", dataStr);
    dlAnchorElem.setAttribute("download", `aurahabit-backup-${new Date().toISOString().split('T')[0]}.json`);
    dlAnchorElem.click();
}

// Render Analytics Chart
function renderAnalytics() {
    const container = document.getElementById('analytics-chart-container');
    container.innerHTML = '';
    
    const past7Days = getPast7Days();
    const activeCount = state.habits.length;
    
    if (activeCount === 0) {
        container.innerHTML = `<div style="margin: auto; color: var(--text-muted);">Add habits to populate stats trend.</div>`;
        document.getElementById('heatmap-container').innerHTML = `<div style="grid-column: span 10; color: var(--text-muted); font-size: 0.9rem;">Add habits to view activity map.</div>`;
        return;
    }
    
    past7Days.forEach(day => {
        let completedOnDay = 0;
        state.habits.forEach(h => {
            if (h.history[day.dateString]) completedOnDay++;
        });
        
        const pct = Math.round((completedOnDay / activeCount) * 100);
        
        const barWrapper = document.createElement('div');
        barWrapper.style.flex = '1';
        barWrapper.style.display = 'flex';
        barWrapper.style.flexDirection = 'column';
        barWrapper.style.alignItems = 'center';
        barWrapper.style.height = '100%';
        barWrapper.style.justifyContent = 'flex-end';
        barWrapper.title = `${completedOnDay}/${activeCount} completed (${pct}%)`;
        
        const barVal = document.createElement('span');
        barVal.innerText = `${pct}%`;
        barVal.style.fontSize = '0.65rem';
        barVal.style.color = pct > 0 ? '#a78bfa' : 'var(--text-muted)';
        barVal.style.marginBottom = '4px';
        
        const bar = document.createElement('div');
        bar.style.width = '100%';
        bar.style.maxWidth = '24px';
        bar.style.height = `${Math.max(pct, 5)}%`; // min height to show bar outline
        bar.style.background = pct > 0 ? 'linear-gradient(to top, #7c3aed, #ec4899)' : 'rgba(255,255,255,0.03)';
        bar.style.borderRadius = '6px';
        bar.style.transition = 'height 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
        
        barWrapper.appendChild(barVal);
        barWrapper.appendChild(bar);
        container.appendChild(barWrapper);
    });

    // Render Heatmap (Past 30 Days)
    const heatmapContainer = document.getElementById('heatmap-container');
    heatmapContainer.innerHTML = '';
    
    for (let i = 29; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        
        let completedCount = 0;
        state.habits.forEach(h => {
            if (h.history[dateStr]) completedCount++;
        });
        
        const completionRatio = activeCount > 0 ? completedCount / activeCount : 0;
        
        const cell = document.createElement('div');
        cell.style.width = '24px';
        cell.style.height = '24px';
        cell.style.borderRadius = '6px';
        cell.style.transition = 'all 0.3s ease';
        
        // Intensity styling
        if (completionRatio === 0) {
            cell.style.background = 'rgba(255, 255, 255, 0.03)';
            cell.style.border = '1px solid rgba(255, 255, 255, 0.05)';
        } else {
            const opacity = 0.2 + (completionRatio * 0.8);
            cell.style.background = `rgba(16, 185, 129, ${opacity})`;
            cell.style.boxShadow = `0 0 10px rgba(16, 185, 129, ${completionRatio * 0.5})`;
            cell.style.border = '1px solid rgba(16, 185, 129, 0.3)';
        }
        
        cell.title = `${dateStr}: ${completedCount}/${activeCount} completed`;
        heatmapContainer.appendChild(cell);
    }
}

// Render Badges
function renderBadges() {
    const grid = document.getElementById('badges-grid');
    grid.innerHTML = '';
    
    const metrics = getMetrics();
    
    badgeDefinitions.forEach(badge => {
        const isUnlocked = badge.check(metrics);
        const unlockedClass = isUnlocked ? 'unlocked' : '';
        
        const div = document.createElement('div');
        div.className = `badge-item ${unlockedClass}`;
        div.title = badge.desc;
        div.innerHTML = `
            <div class="badge-icon">${badge.icon}</div>
            <div class="badge-name">${badge.name}</div>
            <span style="font-size: 0.6rem; color: var(--text-muted); margin-top: 2px;">${badge.desc}</span>
        `;
        
        grid.appendChild(div);
    });
}

// GPS Geolocation Services
let lastPosition = null;
let gpsWatcherId = null;

function initGpsTracking() {
    if (!("geolocation" in navigator)) {
        console.log("Geolocation not supported by this browser.");
        return;
    }
    
    // Request permission and watch position
    gpsWatcherId = navigator.geolocation.watchPosition(
        (position) => {
            const currentCoords = position.coords;
            if (lastPosition) {
                const distanceKm = calculateDistance(
                    lastPosition.latitude,
                    lastPosition.longitude,
                    currentCoords.latitude,
                    currentCoords.longitude
                );
                
                // Track small movements but filter static jitter
                if (distanceKm > 0.002 && distanceKm < 0.5) { // between 2m and 500m per update
                    updateGpsHabitsDistance(distanceKm);
                }
            }
            lastPosition = currentCoords;
        },
        (error) => {
            console.warn("GPS tracking warning: ", error);
        },
        {
            enableHighAccuracy: true,
            maximumAge: 1000,
            timeout: 10000
        }
    );
}

// Haversine formula to compute distance in km
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
        Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

function updateGpsHabitsDistance(distanceKm) {
    const todayStr = new Date().toISOString().split('T')[0];
    let updatedAny = false;
    
    state.habits.forEach(habit => {
        if (habit.gps && !habit.history[todayStr]) {
            if (!habit.history_gps_distance) {
                habit.history_gps_distance = {};
            }
            const current = habit.history_gps_distance[todayStr] || 0;
            const updated = current + distanceKm;
            habit.history_gps_distance[todayStr] = parseFloat(updated.toFixed(3));
            
            // Check if target reached
            if (updated >= habit.gpsDistance) {
                habit.history[todayStr] = true;
                
                // Play completion sound
                const sound = document.getElementById('completion-sound');
                if (sound) {
                    sound.currentTime = 0;
                    sound.play().catch(err => {});
                }
            }
            updatedAny = true;
        }
    });
    
    if (updatedAny) {
        saveToLocalStorage();
        render();
    }
}

function handleTrackingTypeChange(val) {
    document.querySelectorAll('.tracking-details-group').forEach(g => g.style.display = 'none');
    if (val !== 'manual') {
        const targetGroup = document.getElementById(`group-${val}`);
        if (targetGroup) targetGroup.style.display = 'flex';
    }
}

// Global 1-second Interval for active timers
let globalTimerInterval = setInterval(() => {
    let updatedAny = false;
    const todayStr = new Date().toISOString().split('T')[0];
    
    state.habits.forEach(habit => {
        // Focus countdown logic
        if (habit.trackingType === 'focus' && habit.focusActive) {
            if (habit.focusRemaining > 0) {
                habit.focusRemaining--;
                updatedAny = true;
                
                if (habit.focusRemaining === 0) {
                    habit.focusActive = false;
                    habit.history[todayStr] = true;
                    
                    const sound = document.getElementById('completion-sound');
                    if (sound) {
                        sound.currentTime = 0;
                        sound.play().catch(() => {});
                    }
                }
            }
        }
    });
    
    if (updatedAny) {
        // Render only the time updates in card DOM to prevent layout stutter
        state.habits.forEach(h => {
            if (h.trackingType === 'focus' && h.focusActive) {
                const timerElem = document.getElementById(`timer-display-${h.id}`);
                if (timerElem) {
                    const mins = Math.floor(h.focusRemaining / 60).toString().padStart(2, '0');
                    const secs = (h.focusRemaining % 60).toString().padStart(2, '0');
                    timerElem.innerText = `${mins}:${secs}`;
                }
            }
        });
    }
}, 1000);

// Sleep Track Handlers
function startSleep(habitId) {
    const habit = state.habits.find(h => h.id === habitId);
    if (!habit) return;
    
    habit.sleepStart = Date.now();
    saveToLocalStorage();
    render();
}

function stopSleep(habitId) {
    const habit = state.habits.find(h => h.id === habitId);
    if (!habit || !habit.sleepStart) return;
    
    const elapsedMs = Date.now() - habit.sleepStart;
    const elapsedHours = parseFloat((elapsedMs / (1000 * 60 * 60)).toFixed(2));
    
    const todayStr = new Date().toISOString().split('T')[0];
    if (!habit.dailyProgress) habit.dailyProgress = {};
    
    const currentProgress = habit.dailyProgress[todayStr] || 0;
    const newProgress = parseFloat((currentProgress + elapsedHours).toFixed(2));
    habit.dailyProgress[todayStr] = newProgress;
    habit.sleepStart = null; // reset
    
    if (newProgress >= habit.targetVal) {
        habit.history[todayStr] = true;
        const sound = document.getElementById('completion-sound');
        if (sound) {
            sound.currentTime = 0;
            sound.play().catch(() => {});
        }
    }
    
    saveToLocalStorage();
    render();
}

// Focus Timer Toggle
function toggleFocus(habitId) {
    const habit = state.habits.find(h => h.id === habitId);
    if (!habit) return;
    
    if (!habit.focusActive) {
        // Start or resume
        habit.focusActive = true;
        if (habit.focusRemaining === undefined || habit.focusRemaining <= 0) {
            habit.focusRemaining = habit.targetVal * 60;
        }
    } else {
        // Pause
        habit.focusActive = false;
    }
    
    saveToLocalStorage();
    render();
}

// Quick Log Counter Handler
function adjustCounter(habitId, delta) {
    const habit = state.habits.find(h => h.id === habitId);
    if (!habit) return;
    
    const todayStr = new Date().toISOString().split('T')[0];
    if (!habit.dailyProgress) habit.dailyProgress = {};
    
    const current = habit.dailyProgress[todayStr] || 0;
    const updated = Math.max(0, current + delta);
    habit.dailyProgress[todayStr] = updated;
    
    // Auto check-in if target reached
    if (updated >= habit.targetVal && !habit.history[todayStr]) {
        habit.history[todayStr] = true;
        const sound = document.getElementById('completion-sound');
        if (sound) {
            sound.currentTime = 0;
            sound.play().catch(() => {});
        }
    } else if (updated < habit.targetVal && habit.history[todayStr]) {
        // Uncheck if reduced below target
        habit.history[todayStr] = false;
    }
    
    saveToLocalStorage();
    render();
}


