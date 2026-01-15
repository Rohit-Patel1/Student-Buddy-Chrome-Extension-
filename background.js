const DEFAULT_POMODORO_TIME = 25 * 60;

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get(
    ["pomodoroTime", "running", "examReminders"],
    (res) => {
      chrome.storage.local.set({
        pomodoroTime: res.pomodoroTime ?? DEFAULT_POMODORO_TIME,
        running: res.running ?? false,
        examReminders: res.examReminders ?? []
      });
    }
  );
});

chrome.runtime.onStartup.addListener(() => {
  chrome.storage.local.get(["examReminders"], (res) => {
    (res.examReminders || []).forEach((rem) => {
      const time = new Date(rem.time).getTime();
      if (time > Date.now()) {
        chrome.alarms.create(rem.id, { when: time });
      }
    });
  });
});

chrome.runtime.onMessage.addListener((msg) => {
  if (msg.action === "START_POMODORO") {
    chrome.storage.local.set({ running: true });
    chrome.alarms.create("pomodoro", { periodInMinutes: 1 / 60 });
  }

  if (msg.action === "RESET_POMODORO") {
    chrome.alarms.clear("pomodoro");
    chrome.storage.local.set({
      pomodoroTime: DEFAULT_POMODORO_TIME,
      running: false
    });
  }
});

chrome.alarms.onAlarm.addListener((alarm) => {

  if (alarm.name === "pomodoro") {
    chrome.storage.local.get(["pomodoroTime", "running"], (res) => {
      if (!res.running) return;

      const time = res.pomodoroTime - 1;

      if (time <= 0) {
        chrome.alarms.clear("pomodoro");
        chrome.storage.local.set({
          pomodoroTime: DEFAULT_POMODORO_TIME,
          running: false
        });

        chrome.notifications.create({
          type: "basic",
          iconUrl: "icons/icon.png",
          title: "⏱ Pomodoro Finished",
          message: "Great work! Take a break 🎉"
        });
      } else {
        chrome.storage.local.set({ pomodoroTime: time });
      }
    });
  }


  chrome.storage.local.get(["examReminders"], (res) => {
    const reminder = (res.examReminders || []).find(
      (r) => r.id === alarm.name
    );
    if (!reminder) return;

    chrome.notifications.create({
      type: "basic",
      iconUrl: "icons/icon.png",
      title: "📚 Exam Reminder",
      message: reminder.title + " is now!"
    });
  });
});
