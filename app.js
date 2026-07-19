/**
 * AuraTodo — Premium Productivity Dashboard Logic
 * Core State & Render Engine
 */

document.addEventListener('DOMContentLoaded', () => {
  
  // -----------------------------------------------------------
  // STATE MANAGEMENT
  // -----------------------------------------------------------
  let state = {
    tasks: [],
    filters: {
      status: 'all',
      category: 'all',
      search: '',
      sortBy: 'date-created-desc'
    },
    theme: 'light'
  };

  // -----------------------------------------------------------
  // DOM ELEMENT REFERENCES
  // -----------------------------------------------------------
  const todoForm = document.getElementById('todo-form');
  const taskTitleInput = document.getElementById('task-title');
  const taskDescInput = document.getElementById('task-desc');
  const taskPriorityInput = document.getElementById('task-priority');
  const taskCategoryInput = document.getElementById('task-category');
  const taskDueInput = document.getElementById('task-due');
  const titleError = document.getElementById('title-error');
  
  const searchInput = document.getElementById('search-input');
  const sortSelect = document.getElementById('sort-select');
  const filterPillsContainer = document.getElementById('filter-pills');
  const tabAllBtn = document.getElementById('tab-all');
  const tabActiveBtn = document.getElementById('tab-active');
  const tabCompletedBtn = document.getElementById('tab-completed');
  
  const taskListContainer = document.getElementById('task-list');
  const emptyState = document.getElementById('empty-state');
  
  const statsCompleted = document.getElementById('stats-completed');
  const statsPending = document.getElementById('stats-pending');
  const statsStreak = document.getElementById('stats-streak');
  const progressCircle = document.getElementById('progress-circle');
  const progressText = document.getElementById('progress-text');
  
  const themeToggleBtn = document.getElementById('theme-toggle');
  
  // Modal Elements
  const editModal = document.getElementById('edit-modal');
  const editForm = document.getElementById('edit-form');
  const editTaskIdInput = document.getElementById('edit-task-id');
  const editTaskTitleInput = document.getElementById('edit-task-title');
  const editTaskDescInput = document.getElementById('edit-task-desc');
  const editTaskPriorityInput = document.getElementById('edit-task-priority');
  const editTaskCategoryInput = document.getElementById('edit-task-category');
  const editTaskDueInput = document.getElementById('edit-task-due');
  const editTitleError = document.getElementById('edit-title-error');
  const closeModalBtn = document.getElementById('close-modal-btn');
  const cancelEditBtn = document.getElementById('cancel-edit-btn');

  // Set min date for date inputs to today
  const todayStr = new Date().toISOString().split('T')[0];
  taskDueInput.min = todayStr;
  editTaskDueInput.min = todayStr;

  // -----------------------------------------------------------
  // LOCALSTORAGE STORAGE OPERATIONS
  // -----------------------------------------------------------
  function loadState() {
    const savedTasks = localStorage.getItem('auratodo_tasks');
    const savedTheme = localStorage.getItem('auratodo_theme');
    
    if (savedTasks) {
      try {
        state.tasks = JSON.parse(savedTasks);
      } catch (e) {
        state.tasks = [];
      }
    }
    
    if (savedTheme) {
      state.theme = savedTheme;
    } else {
      // Auto-detect system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      state.theme = prefersDark ? 'dark' : 'light';
    }
    
    applyTheme(state.theme);
  }

  function saveTasks() {
    localStorage.setItem('auratodo_tasks', JSON.stringify(state.tasks));
  }

  function saveTheme(theme) {
    localStorage.setItem('auratodo_theme', theme);
  }

  // -----------------------------------------------------------
  // THEME MANAGEMENT
  // -----------------------------------------------------------
  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    state.theme = theme;
  }

  function toggleTheme() {
    const newTheme = state.theme === 'light' ? 'dark' : 'light';
    applyTheme(newTheme);
    saveTheme(newTheme);
  }

  // -----------------------------------------------------------
  // ROBUST STREAK & STATS ENGINE
  // -----------------------------------------------------------
  function getLocalDateString(dateObj) {
    return dateObj.toLocaleDateString('en-CA'); // YYYY-MM-DD format local to user
  }

  function calculateStreak() {
    // Filter tasks that have completed dates
    const completedTasks = state.tasks.filter(t => t.completed && t.completedDate);
    if (completedTasks.length === 0) return 0;

    // Get sorted unique completion dates (local YYYY-MM-DD strings)
    const completionDates = [
      ...new Set(completedTasks.map(t => t.completedDate.split('T')[0]))
    ].sort();

    if (completionDates.length === 0) return 0;

    const today = new Date();
    const todayStr = getLocalDateString(today);
    
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    const yesterdayStr = getLocalDateString(yesterday);

    // Verify if last completion was either today or yesterday
    const lastCompletion = completionDates[completionDates.length - 1];
    if (lastCompletion !== todayStr && lastCompletion !== yesterdayStr) {
      return 0; // Streak broken
    }

    let streak = 0;
    let expectedDate = new Date(completionDates[completionDates.length - 1]);

    // Backtrack from the last completion date
    for (let i = completionDates.length - 1; i >= 0; i--) {
      const currentDateStr = completionDates[i];
      const expectedDateStr = getLocalDateString(expectedDate);

      if (currentDateStr === expectedDateStr) {
        streak++;
        expectedDate.setDate(expectedDate.getDate() - 1); // Step back 1 day
      } else {
        // Gap found - streak stops here
        break;
      }
    }

    return streak;
  }

  function updateDashboardStats() {
    const total = state.tasks.length;
    const completed = state.tasks.filter(t => t.completed).length;
    const pending = total - completed;
    
    // Calculate percentage
    const percentage = total === 0 ? 0 : Math.round((completed / total) * 100);
    
    // Update Text Elements
    statsCompleted.textContent = completed;
    statsPending.textContent = pending;
    
    const streak = calculateStreak();
    statsStreak.textContent = `${streak} 🔥`;

    progressText.textContent = `${percentage}%`;
    
    // Update SVG Circle dynamically (works with responsive radius)
    const radius = progressCircle.r.baseVal.value;
    const circumference = 2 * Math.PI * radius;
    
    progressCircle.style.strokeDasharray = `${circumference} ${circumference}`;
    const offset = circumference - (percentage / 100) * circumference;
    progressCircle.style.strokeDashoffset = offset;
  }

  // -----------------------------------------------------------
  // FILTER & SORT ENGINE
  // -----------------------------------------------------------
  function getFilteredAndSortedTasks() {
    return state.tasks
      .filter(task => {
        // Status filter
        if (state.filters.status === 'active' && task.completed) return false;
        if (state.filters.status === 'completed' && !task.completed) return false;
        
        // Category filter
        if (state.filters.category !== 'all' && task.category !== state.filters.category) return false;
        
        // Search filter
        if (state.filters.search) {
          const query = state.filters.search.toLowerCase();
          const matchTitle = task.title.toLowerCase().includes(query);
          const matchDesc = task.description.toLowerCase().includes(query);
          if (!matchTitle && !matchDesc) return false;
        }
        
        return true;
      })
      .sort((a, b) => {
        if (state.filters.sortBy === 'date-created-desc') {
          return new Date(b.dateCreated) - new Date(a.dateCreated);
        }
        if (state.filters.sortBy === 'date-created-asc') {
          return new Date(a.dateCreated) - new Date(b.dateCreated);
        }
        if (state.filters.sortBy === 'due-date-asc') {
          if (!a.dueDate) return 1;
          if (!b.dueDate) return -1;
          return new Date(a.dueDate) - new Date(b.dueDate);
        }
        if (state.filters.sortBy === 'priority-desc') {
          const priorityWeight = { high: 3, medium: 2, low: 1 };
          return priorityWeight[b.priority] - priorityWeight[a.priority];
        }
        return 0;
      });
  }

  // -----------------------------------------------------------
  // RENDER ENGINE
  // -----------------------------------------------------------
  function renderTaskList() {
    const listTasks = getFilteredAndSortedTasks();
    taskListContainer.innerHTML = '';

    if (listTasks.length === 0) {
      emptyState.classList.remove('hidden');
      taskListContainer.classList.add('hidden');
      return;
    }

    emptyState.classList.add('hidden');
    taskListContainer.classList.remove('hidden');

    const todayStr = getLocalDateString(new Date());

    listTasks.forEach(task => {
      const todoItem = document.createElement('article');
      todoItem.className = `todo-item priority-${task.priority} ${task.completed ? 'completed' : ''}`;
      todoItem.setAttribute('data-id', task.id);

      // Determine due date display and check if overdue
      let dueDisplay = '';
      let isOverdue = false;

      if (task.dueDate) {
        const formattedDate = new Date(task.dueDate).toLocaleDateString(undefined, {
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        });
        
        isOverdue = !task.completed && task.dueDate < todayStr;
        
        dueDisplay = `
          <div class="due-tag ${isOverdue ? 'overdue' : ''}">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><path d="M16 2v4M8 2v4M3 10h18"/>
            </svg>
            <span>${isOverdue ? 'Overdue: ' : 'Due: '}${formattedDate}</span>
          </div>
        `;
      }

      // Priority Badge
      const priorityLabel = task.priority.charAt(0).toUpperCase() + task.priority.slice(1);
      
      todoItem.innerHTML = `
        <label class="custom-checkbox-container" title="Mark as ${task.completed ? 'active' : 'completed'}">
          <input type="checkbox" class="todo-checkbox" ${task.completed ? 'checked' : ''}>
          <span class="checkbox-visual">
            <svg class="check-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
              <path d="M20 6 9 17l-5-5"/>
            </svg>
          </span>
        </label>

        <div class="todo-details">
          <div class="todo-title-row">
            <h4 class="todo-title">${escapeHtml(task.title)}</h4>
          </div>
          ${task.description ? `<p class="todo-desc">${escapeHtml(task.description)}</p>` : ''}
          
          <div class="todo-meta">
            <span class="badge badge-${task.category.toLowerCase()}">${getCategoryIcon(task.category)} ${task.category}</span>
            <span class="priority-tag priority-tag-${task.priority}">
              <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor">
                <circle cx="5" cy="5" r="4"/>
              </svg>
              ${priorityLabel}
            </span>
            ${dueDisplay}
          </div>
        </div>

        <div class="todo-actions">
          <button class="btn-icon btn-edit" title="Edit Task" aria-label="Edit Task ${escapeHtml(task.title)}">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/>
            </svg>
          </button>
          <button class="btn-icon btn-delete" title="Delete Task" aria-label="Delete Task ${escapeHtml(task.title)}">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2M10 11v6M14 11v6"/>
            </svg>
          </button>
        </div>
      `;

      // Event Listeners for Dynamic Elements
      const checkbox = todoItem.querySelector('.todo-checkbox');
      checkbox.addEventListener('change', () => toggleTaskCompleted(task.id));

      const editBtn = todoItem.querySelector('.btn-edit');
      editBtn.addEventListener('click', () => openEditModal(task.id));

      const deleteBtn = todoItem.querySelector('.btn-delete');
      deleteBtn.addEventListener('click', () => deleteTask(task.id));

      taskListContainer.appendChild(todoItem);
    });
  }

  // Helper to escape HTML text to prevent XSS
  function escapeHtml(text) {
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, (m) => map[m]);
  }

  // Helper for Category icons
  function getCategoryIcon(cat) {
    const icons = {
      Work: '💼',
      Personal: '🏡',
      Shopping: '🛒',
      Health: '💪',
      Other: '✨'
    };
    return icons[cat] || '📋';
  }

  // -----------------------------------------------------------
  // TASK MUTATIONS & OPERATIONS
  // -----------------------------------------------------------
  function addTask(title, desc, priority, category, dueDate) {
    const newTask = {
      id: Date.now().toString(),
      title,
      description: desc,
      priority,
      category,
      dueDate: dueDate || null,
      completed: false,
      dateCreated: new Date().toISOString(),
      completedDate: null
    };

    state.tasks.push(newTask);
    saveTasks();
    updateDashboardStats();
    renderTaskList();
  }

  function toggleTaskCompleted(id) {
    const task = state.tasks.find(t => t.id === id);
    if (!task) return;

    task.completed = !task.completed;
    task.completedDate = task.completed ? new Date().toISOString() : null;

    saveTasks();
    updateDashboardStats();
    
    // Rerender with animation frame to show transitions cleanly
    requestAnimationFrame(() => {
      renderTaskList();
    });
  }

  function editTask(id, updatedFields) {
    const task = state.tasks.find(t => t.id === id);
    if (!task) return;

    Object.assign(task, updatedFields);
    saveTasks();
    updateDashboardStats();
    renderTaskList();
  }

  function deleteTask(id) {
    // Fade out target element before deleting it from DOM
    const itemEl = taskListContainer.querySelector(`[data-id="${id}"]`);
    if (itemEl) {
      itemEl.style.transition = 'opacity 250ms ease, transform 250ms ease';
      itemEl.style.opacity = '0';
      itemEl.style.transform = 'scale(0.95)';
      
      setTimeout(() => {
        state.tasks = state.tasks.filter(t => t.id !== id);
        saveTasks();
        updateDashboardStats();
        renderTaskList();
      }, 250);
    } else {
      state.tasks = state.tasks.filter(t => t.id !== id);
      saveTasks();
      updateDashboardStats();
      renderTaskList();
    }
  }

  // -----------------------------------------------------------
  // MODAL OPERATIONAL LOGIC
  // -----------------------------------------------------------
  let activeElementBeforeModal = null;

  function openEditModal(id) {
    const task = state.tasks.find(t => t.id === id);
    if (!task) return;

    // Track active element for keyboard recovery
    activeElementBeforeModal = document.activeElement;

    // Populate modal inputs
    editTaskIdInput.value = task.id;
    editTaskTitleInput.value = task.title;
    editTaskDescInput.value = task.description || '';
    editTaskPriorityInput.value = task.priority;
    editTaskCategoryInput.value = task.category;
    editTaskDueInput.value = task.dueDate || '';
    editTitleError.textContent = '';

    editModal.classList.remove('hidden');
    editTaskTitleInput.focus();
    
    // Trap tab focus inside modal
    document.addEventListener('keydown', trapFocus);
  }

  function closeEditModal() {
    editModal.classList.add('hidden');
    document.removeEventListener('keydown', trapFocus);
    
    if (activeElementBeforeModal) {
      activeElementBeforeModal.focus();
    }
  }

  function trapFocus(e) {
    if (e.key === 'Escape') {
      closeEditModal();
      return;
    }
    
    if (e.key !== 'Tab') return;

    const focusableEls = editModal.querySelectorAll('input, select, textarea, button');
    const firstEl = focusableEls[0];
    const lastEl = focusableEls[focusableEls.length - 1];

    if (e.shiftKey) { // Shift + Tab
      if (document.activeElement === firstEl) {
        lastEl.focus();
        e.preventDefault();
      }
    } else { // Tab
      if (document.activeElement === lastEl) {
        firstEl.focus();
        e.preventDefault();
      }
    }
  }

  // -----------------------------------------------------------
  // EVENT LISTENERS & INITIALIZATION
  // -----------------------------------------------------------
  
  // Create Form Submit Handler
  todoForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const title = taskTitleInput.value.trim();
    const desc = taskDescInput.value.trim();
    const priority = taskPriorityInput.value;
    const category = taskCategoryInput.value;
    const dueDate = taskDueInput.value;

    // Title validation
    if (!title) {
      titleError.textContent = 'Please enter a task title.';
      taskTitleInput.focus();
      return;
    }
    titleError.textContent = '';

    addTask(title, desc, priority, category, dueDate);
    todoForm.reset();
  });

  // Edit Form Submit Handler
  editForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const id = editTaskIdInput.value;
    const title = editTaskTitleInput.value.trim();
    const desc = editTaskDescInput.value.trim();
    const priority = editTaskPriorityInput.value;
    const category = editTaskCategoryInput.value;
    const dueDate = editTaskDueInput.value;

    if (!title) {
      editTitleError.textContent = 'Please enter a task title.';
      editTaskTitleInput.focus();
      return;
    }
    editTitleError.textContent = '';

    editTask(id, {
      title,
      description: desc,
      priority,
      category,
      dueDate: dueDate || null
    });

    closeEditModal();
  });

  // Modal Button Handlers
  closeModalBtn.addEventListener('click', closeEditModal);
  cancelEditBtn.addEventListener('click', closeEditModal);
  editModal.addEventListener('click', (e) => {
    if (e.target === editModal) {
      closeEditModal();
    }
  });

  // Theme Toggle Button
  themeToggleBtn.addEventListener('click', toggleTheme);

  // Search Input Handler (immediate, high-fidelity response)
  searchInput.addEventListener('input', (e) => {
    state.filters.search = e.target.value;
    renderTaskList();
  });

  // Sorting Handler
  sortSelect.addEventListener('change', (e) => {
    state.filters.sortBy = e.target.value;
    renderTaskList();
  });

  // Category Filter Pill Handlers
  filterPillsContainer.addEventListener('click', (e) => {
    const pill = e.target.closest('.pill');
    if (!pill) return;

    // Update active pill styling
    filterPillsContainer.querySelectorAll('.pill').forEach(btn => btn.classList.remove('active'));
    pill.classList.add('active');

    // Update filters and render
    state.filters.category = pill.dataset.filter;
    renderTaskList();
  });

  // Status Tab Filter Handlers
  const statusTabs = [tabAllBtn, tabActiveBtn, tabCompletedBtn];
  statusTabs.forEach(tab => {
    tab.addEventListener('click', (e) => {
      statusTabs.forEach(t => {
        t.classList.remove('active');
        t.setAttribute('aria-selected', 'false');
      });
      tab.classList.add('active');
      tab.setAttribute('aria-selected', 'true');

      state.filters.status = tab.dataset.status;
      renderTaskList();
    });
  });

  // Initialize Application
  loadState();
  updateDashboardStats();
  renderTaskList();
});
