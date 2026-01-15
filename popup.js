const themeBtn = document.getElementById("toggle-theme");
chrome.storage.local.get(["theme"], r => {
  if (r.theme === "dark") document.body.classList.add("dark");
});
themeBtn.onclick = () => {
  document.body.classList.toggle("dark");
  chrome.storage.local.set({
    theme: document.body.classList.contains("dark") ? "dark" : "light"
  });
};

const todoInput = document.getElementById("todo-input");
const todoList = document.getElementById("todo-list");

document.getElementById("add-todo").onclick = () => {
  const text = todoInput.value;
  if (!text.trim()) return;

  chrome.storage.local.get(["todos"], res => {
    const todos = res.todos || [];
    todos.push(text);
    chrome.storage.local.set({ todos }, loadTodos);
  });

  todoInput.value = "";
};

function loadTodos() {
  chrome.storage.local.get(["todos"], res => {
    todoList.innerHTML = "";
    (res.todos || []).forEach((t, i) => {
      const li = document.createElement("li");
      li.className = "todo-item";

      const span = document.createElement("span");
      span.textContent = t;

      const del = document.createElement("button");
      del.textContent = "❌";
      del.className = "todo-delete";
      del.onclick = () => {
        res.todos.splice(i, 1);
        chrome.storage.local.set({ todos: res.todos }, loadTodos);
      };

      li.appendChild(span);
      li.appendChild(del);
      todoList.appendChild(li);
    });
  });
}
loadTodos();

const notes = document.getElementById("notes");
chrome.storage.local.get(["notes"], r => notes.value = r.notes || "");
notes.oninput = () => chrome.storage.local.set({ notes: notes.value });

const timerDisplay = document.getElementById("timer");
const focusStatus = document.getElementById("focus-status");

document.getElementById("start").onclick =
  () => chrome.runtime.sendMessage({ action: "START_POMODORO" });
document.getElementById("reset").onclick =
  () => chrome.runtime.sendMessage({ action: "RESET_POMODORO" });

setInterval(() => {
  chrome.storage.local.get(["pomodoroTime", "running"], res => {
    const t = res.pomodoroTime || 25 * 60;
    const m = Math.floor(t / 60);
    const s = t % 60;
    timerDisplay.textContent = `${m}:${s < 10 ? "0" : ""}${s}`;
    focusStatus.textContent = res.running ? "🔥 Focus Mode ON" : "🚫 Focus Mode OFF";
  });
}, 1000);

const examTitle = document.getElementById("exam-title");
const examTime = document.getElementById("exam-time");
const examList = document.getElementById("exam-list");

document.getElementById("add-exam").onclick = () => {
  const title = examTitle.value.trim();
  const time = examTime.value;
  if (!title || !time) return alert("Fill all fields");

  const reminder = {
    id: "exam_" + Date.now(),
    title,
    time
  };

  chrome.storage.local.get(["examReminders"], res => {
    const reminders = res.examReminders || [];
    reminders.push(reminder);
    chrome.storage.local.set({ examReminders: reminders }, () => {
      chrome.alarms.create(reminder.id, { when: new Date(time).getTime() });
      loadExams();
    });
  });

  examTitle.value = "";
  examTime.value = "";
};

function loadExams() {
  chrome.storage.local.get(["examReminders"], res => {
    examList.innerHTML = "";
    (res.examReminders || []).forEach(rem => {
      const li = document.createElement("li");
      li.className = "exam-item";

      const span = document.createElement("span");
      span.textContent =
        rem.title + " — " + new Date(rem.time).toLocaleString();

      const del = document.createElement("button");
      del.textContent = "❌";
      del.className = "exam-delete";
      del.onclick = () => deleteExam(rem.id);

      li.appendChild(span);
      li.appendChild(del);
      examList.appendChild(li);
    });
  });
}

function deleteExam(id) {
  chrome.storage.local.get(["examReminders"], res => {
    const updated = (res.examReminders || []).filter(r => r.id !== id);
    chrome.storage.local.set({ examReminders: updated }, () => {
      chrome.alarms.clear(id);
      loadExams();
    });
  });
}

loadExams();
