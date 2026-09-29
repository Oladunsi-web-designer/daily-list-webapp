const STORAGE_KEY = 'daily-list-tasks';
const todoForm = document.getElementById('todoForm');
const todoInput = document.getElementById('taskInput');
const todoList = document.getElementById('todoList');
const remainingCount = document.getElementById('remainingCount');
const completedCount = document.getElementById('completedCount');
const clearCompletedBtn = document.getElementById('clearCompletedBtn');
const dateLabel = document.getElementById('dateLabel');
const filterButtons = document.querySelectorAll('.filter-btn');

const state = {
  tasks: loadTasks(),
  filter: 'all',
};

initialize();

function initialize() {
  dateLabel.textContent = new Date().toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  todoForm.addEventListener('submit', handleSubmit);
  clearCompletedBtn.addEventListener('click', clearCompleted);
  filterButtons.forEach((button) => {
    button.addEventListener('click', () => {
      state.filter = button.dataset.filter;
      updateFilterButtons();
      render();
    });
  });

  render();
}

function handleSubmit(event) {
  event.preventDefault();
  const text = todoInput.value.trim();

  if (!text) {
    todoInput.focus();
    return;
  }

  state.tasks.unshift({
    id: crypto.randomUUID(),
    text,
    completed: false,
    createdAt: Date.now(),
  });

  todoInput.value = '';
  saveTasks();
  render();
  todoInput.focus();
}

function toggleTask(taskId) {
  state.tasks = state.tasks.map((task) =>
    task.id === taskId ? { ...task, completed: !task.completed } : task
  );
  saveTasks();
  render();
}

function deleteTask(taskId) {
  state.tasks = state.tasks.filter((task) => task.id !== taskId);
  saveTasks();
  render();
}

function clearCompleted() {
  state.tasks = state.tasks.filter((task) => !task.completed);
  saveTasks();
  render();
}

function updateFilterButtons() {
  filterButtons.forEach((button) => {
    const selected = button.dataset.filter === state.filter;
    button.classList.toggle('active', selected);
    button.setAttribute('aria-selected', String(selected));
  });
}

function getVisibleTasks() {
  switch (state.filter) {
    case 'active':
      return state.tasks.filter((task) => !task.completed);
    case 'completed':
      return state.tasks.filter((task) => task.completed);
    default:
      return state.tasks;
  }
}

function render() {
  const visibleTasks = getVisibleTasks();

  if (visibleTasks.length === 0) {
    todoList.innerHTML = `
      <li class="empty-state">
        ${state.tasks.length === 0 ? 'Your list is clear. Add your first task.' : 'No tasks match this filter.'}
      </li>
    `;
  } else {
    todoList.innerHTML = visibleTasks
      .map(
        (task) => `
          <li class="task-item ${task.completed ? 'completed' : ''}" data-id="${task.id}">
            <div class="task-main">
              <input
                class="task-checkbox"
                type="checkbox"
                aria-label="Mark task as complete"
                ${task.completed ? 'checked' : ''}
                data-action="toggle"
                data-id="${task.id}"
              />
              <span class="task-text">${escapeHtml(task.text)}</span>
            </div>
            <button class="task-delete" type="button" data-action="delete" data-id="${task.id}">Delete</button>
          </li>
        `
      )
      .join('');
  }

  const remaining = state.tasks.filter((task) => !task.completed).length;
  const completed = state.tasks.filter((task) => task.completed).length;
  remainingCount.textContent = String(remaining);
  completedCount.textContent = String(completed);

  todoList.querySelectorAll('[data-action="toggle"]').forEach((checkbox) => {
    checkbox.addEventListener('change', (event) => {
      toggleTask(event.target.dataset.id);
    });
  });

  todoList.querySelectorAll('[data-action="delete"]').forEach((button) => {
    button.addEventListener('click', (event) => {
      deleteTask(event.target.dataset.id);
    });
  });
}

function saveTasks() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.tasks));
}

function loadTasks() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
}

function escapeHtml(value) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
