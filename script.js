const form = document.getElementById('todo-form');
const input = document.getElementById('todo-input');
const deadlineInput = document.getElementById('todo-deadline');

const pendingList = document.getElementById('pending-list');
const completedList = document.getElementById('completed-list');
const lateCompletedList = document.getElementById('late-completed-list');
const missedIncompleteList = document.getElementById('missed-incomplete-list');

// Request notification permission on load
if ('Notification' in window && Notification.permission !== 'granted') {
  Notification.requestPermission();
}

form.addEventListener('submit', (e) => {
  e.preventDefault();

  const taskText = input.value.trim();
  const deadline = new Date(deadlineInput.value);

  if (!taskText || isNaN(deadline)) {
    alert('Please enter a task and a valid time slot.');
    return;
  }

  if (deadline <= new Date()) {
    alert('Deadline must be in the future.');
    return;
  }

  const li = createTaskElement(taskText, deadline);
  pendingList.appendChild(li);

  input.value = '';
  deadlineInput.value = '';
});

function createTaskElement(taskText, deadline) {
  const li = document.createElement('li');
  li.innerHTML = `
    <span>${taskText}</span>
    <span class="deadline">Due: ${deadline.toLocaleString()}</span>
    <button class="delete-btn">✖</button>
  `;

  li.dataset.deadline = deadline;
  li.dataset.completed = "false";

  // Complete task logic
  li.addEventListener('click', function () {
    if (li.dataset.completed === "true") return;

    li.dataset.completed = "true";
    li.classList.remove('missed-incomplete');
    li.classList.add('completed');

    const now = new Date();
    const deadlineTime = new Date(li.dataset.deadline);

    if (now <= deadlineTime) {
      completedList.appendChild(li);
      alert('✅ Task completed on time!');
    } else {
      lateCompletedList.appendChild(li);
      alert('⚠️ Task completed after the deadline.');
    }
  });

  // Delete button
  li.querySelector('.delete-btn').addEventListener('click', (e) => {
    e.stopPropagation();
    li.remove();
    alert('🗑️ Task deleted.');
  });

  return li;
}

// Deadline checker for missed tasks
setInterval(() => {
  const now = new Date();

  const allTasks = [
    ...pendingList.children,
    ...missedIncompleteList.children
  ];

  allTasks.forEach(task => {
    const deadline = new Date(task.dataset.deadline);
    const isCompleted = task.dataset.completed === "true";

    if (!isCompleted && now > deadline && !task.classList.contains('missed-incomplete')) {
      task.classList.add('missed-incomplete');
      missedIncompleteList.appendChild(task);
      alert(`❌ Deadline missed and task not completed: "${task.textContent.trim()}"`);
    }
  });
}, 30000);

// 🕗 Daily Morning Notification (at 8:00 AM local time)
function sendMorningTaskNotifications() {
  const now = new Date();
  // Only send if time is 8:00 AM +/- 5 minutes (to catch the check)
  if (now.getHours() === 8 && now.getMinutes() < 5) {
    [...pendingList.children].forEach(task => {
      const taskName = task.querySelector('span').innerText;
      const deadline = new Date(task.dataset.deadline);
      const timeLeftMs = deadline - now;

      if (timeLeftMs > 0) {
        const hoursLeft = Math.floor(timeLeftMs / (1000 * 60 * 60));
        const minutesLeft = Math.floor((timeLeftMs / (1000 * 60)) % 60);

        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification("⏰ Task Reminder", {
            body: `"${taskName}" has ${hoursLeft}h ${minutesLeft}m left until the deadline.`,
          });
        } else {
          // Fallback alert if no permission
          alert(`Reminder: "${taskName}" has ${hoursLeft}h ${minutesLeft}m left until the deadline.`);
        }
      }
    });
  }
}

// Check every minute for morning notifications
setInterval(sendMorningTaskNotifications, 60000);
