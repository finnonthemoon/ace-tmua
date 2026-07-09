function renderTmuaCountdown() {
  // Change this when the official TMUA exam date is confirmed.
  const examDate = new Date("2026-10-15T09:00:00");
  const now = new Date();
  const millisecondsLeft = examDate - now;
  const daysLeft = Math.max(
    0,
    Math.ceil(millisecondsLeft / (1000 * 60 * 60 * 24)),
  );

  const daysElement = document.getElementById("tmua-days-left");
  const dateElement = document.getElementById("tmua-exam-date");

  if (daysElement) {
    daysElement.textContent = daysLeft;
  }

  if (dateElement) {
    dateElement.textContent = examDate.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }
}

function getTopicProgress() {
  return JSON.parse(localStorage.getItem("tmuaTopicProgress") || "{}");
}

function getHomeStudyData() {
  const fallback = {
    weeklyMinutes: 42,
    weeklyGoalMinutes: 90,
    weeklySessions: 3,
    targetSessions: 5,
    dailyMinutes: [12, 18, 0, 12, 0, 0, 0],
  };

  try {
    const savedData = JSON.parse(
      localStorage.getItem("tmuaHomeStudyData") || "null",
    );

    return {
      ...fallback,
      ...(savedData || {}),
    };
  } catch (error) {
    console.warn("Could not read home study data.", error);
    return fallback;
  }
}

function renderHomeMomentum() {
  const data = getHomeStudyData();

  const minutesElement = document.getElementById("weekly-minutes");
  const sessionsElement = document.getElementById("weekly-sessions");
  const goalElement = document.getElementById("weekly-goal-minutes");
  const barsElement = document.getElementById("weekly-chart-bars");

  if (minutesElement) {
    minutesElement.textContent = data.weeklyMinutes;
  }

  if (sessionsElement) {
    sessionsElement.textContent = `${data.weeklySessions} / ${data.targetSessions}`;
  }

  if (goalElement) {
    goalElement.textContent = data.weeklyGoalMinutes;
  }

  if (barsElement) {
    const dayLabels = ["M", "T", "W", "T", "F", "S", "S"];
    const highestMinutes = Math.max(...data.dailyMinutes, 20);

    barsElement.innerHTML = data.dailyMinutes
      .map((minutes, index) => {
        const height = Math.max(10, Math.round((minutes / highestMinutes) * 100));

        return `
          <div class="weekly-chart__day">
            <div class="weekly-chart__bar-wrap">
              <span
                class="weekly-chart__bar ${minutes > 0 ? "is-active" : ""}"
                style="height: ${height}%"
                aria-label="${dayLabels[index]}: ${minutes} minutes"
              ></span>
            </div>
            <span>${dayLabels[index]}</span>
          </div>
        `;
      })
      .join("");
  }
}

function renderReadinessForecast() {
  const data = getHomeStudyData();
  const examDate = new Date("2026-10-15T09:00:00");
  const today = new Date();
  const daysUntilExam = Math.max(
    0,
    Math.ceil((examDate - today) / (1000 * 60 * 60 * 24)),
  );

  const weeksUntilExam = Math.max(1, Math.floor(daysUntilExam / 7));
  const sessionsPerWeek = Math.max(data.weeklySessions, 1);
  const projectedSessions = sessionsPerWeek * weeksUntilExam;
  const totalLessons = document.querySelectorAll("[data-lesson-id]").length;
  const completedLessons = Object.values(getTopicProgress()).reduce(
    (total, topic) => total + (topic.completedLessons?.length || 0),
    0,
  );

  const currentReadiness = Math.min(
    92,
    Math.max(12, Math.round(16 + completedLessons * 7 + data.weeklyMinutes / 8)),
  );

  const projectedReadiness = Math.min(
    96,
    Math.round(currentReadiness + projectedSessions * 1.1),
  );

  const forecastText = document.getElementById("forecast-message");
  const forecastSessions = document.getElementById("forecast-sessions");
  const forecastProgress = document.getElementById("forecast-progress");
  const forecastCurrent = document.getElementById("forecast-current");
  const forecastProjected = document.getElementById("forecast-projected");

  if (forecastText) {
    forecastText.textContent =
      data.weeklySessions >= 4
        ? `At this pace, you could complete around ${projectedSessions} more study sessions before TMUA.`
        : `Add one more session this week to build a stronger run-up to TMUA.`;
  }

  if (forecastSessions) {
    forecastSessions.textContent = projectedSessions;
  }

  if (forecastProgress) {
    forecastProgress.style.width = `${projectedReadiness}%`;
  }

  if (forecastCurrent) {
    forecastCurrent.textContent = `${currentReadiness}%`;
  }

  if (forecastProjected) {
    forecastProjected.textContent = `${projectedReadiness}%`;
  }

  const forecastLessons = document.getElementById("forecast-lessons");
  if (forecastLessons) {
    forecastLessons.textContent =
      totalLessons > 0
        ? `${completedLessons} of ${totalLessons} lessons complete`
        : "Build your first learning streak";
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  const tableBody = document.getElementById("leaderboard-data");

  if (tableBody) {
    try {
      const response = await fetch("./data/leaderboard.json");

      if (!response.ok) {
        throw new Error("Could not load leaderboard data.");
      }

      const data = await response.json();

      data.users.forEach((user) => {
        const row = document.createElement("tr");

        row.innerHTML = `
          <td>${user.name}</td>
          <td>${user.targetUni}</td>
          <td>${user.weeklyScore}</td>
        `;

        tableBody.appendChild(row);
      });
    } catch (error) {
      console.error("Leaderboard error:", error);

      tableBody.innerHTML = `
        <tr>
          <td colspan="3" style="text-align:center; color:red;">
            Failed to load leaderboard.
          </td>
        </tr>
      `;
    }
  }

  const navLinks = document.querySelectorAll(".nav__link");
  const topicLinks = document.querySelectorAll(".topic-link");
  const backLinks = document.querySelectorAll(".back-link");
  const sections = document.querySelectorAll(".section");

  function showSection(targetId) {
    const targetSection = document.querySelector(targetId);

    if (!targetSection) {
      console.warn(`Section not found: ${targetId}`);
      return;
    }

    sections.forEach((section) => {
      section.classList.remove("active-section");
    });

    targetSection.classList.add("active-section");

    const mainPages = [
      "#home",
      "#learn",
      "#leaderboard",
      "#questions",
      "#profile",
    ];

    if (mainPages.includes(targetId)) {
      navLinks.forEach((link) => {
        link.classList.toggle(
          "active-link",
          link.getAttribute("href") === targetId,
        );
      });
    }

    document.body.classList.toggle("lesson-mode", targetId === "#lesson");
    document.dispatchEvent(new CustomEvent("lessonProgressUpdated"));
    window.scrollTo(0, 0);
  }

  function addNavigation(links) {
    links.forEach((link) => {
      link.addEventListener("click", (event) => {
        const targetId = link.getAttribute("href");

        if (!targetId || !targetId.startsWith("#")) {
          return;
        }

        event.preventDefault();
        showSection(targetId);
      });
    });
  }

  addNavigation(navLinks);
  addNavigation(topicLinks);
  addNavigation(backLinks);

  function getInitials(name) {
    return name
      .split(" ")
      .filter(Boolean)
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  }

  function renderHomeUser() {
    if (typeof userData === "undefined") {
      return;
    }

    const user = userData.get();
    const greeting = document.getElementById("home-greeting");
    const avatar = document.getElementById("home-avatar");
    const streak = document.getElementById("home-streak");

    if (greeting && user.name) {
      greeting.textContent = `Good morning, ${user.name.split(" ")[0]}!`;
    }

    if (avatar && user.name) {
      avatar.textContent = getInitials(user.name);
    }

    if (streak && typeof user.streak !== "undefined") {
      streak.textContent = user.streak;
    }
  }

  function updateRoadmapProgress() {
    const progress = getTopicProgress();

    document.querySelectorAll(".roadmap").forEach((roadmap) => {
      const topicSection = roadmap.closest(".section");
      const topicId = topicSection?.id;

      if (!topicId) {
        return;
      }

      const roadmapItems = [...roadmap.querySelectorAll("[data-lesson-id]")];
      const completedLessons = progress[topicId]?.completedLessons || [];

      roadmapItems.forEach((item, index) => {
        const lessonId = item.dataset.lessonId;
        const isComplete = completedLessons.includes(lessonId);
        const previousLesson = roadmapItems[index - 1];
        const previousComplete =
          index === 0 ||
          completedLessons.includes(previousLesson.dataset.lessonId);

        item.classList.remove(
          "roadmap__item--complete",
          "roadmap__item--current",
          "roadmap__item--locked",
        );

        if (isComplete) {
          item.classList.add("roadmap__item--complete");
        } else if (previousComplete) {
          item.classList.add("roadmap__item--current");
        } else {
          item.classList.add("roadmap__item--locked");
        }
      });

      const completedCount = completedLessons.length;
      const totalLessons = roadmapItems.length;
      const percent =
        totalLessons === 0
          ? 0
          : Math.round((completedCount / totalLessons) * 100);

      const progressText = topicSection.querySelector(
        "[data-topic-progress-text]",
      );
      const progressFill = topicSection.querySelector(
        "[data-topic-progress-fill]",
      );

      if (progressText) {
        progressText.textContent = `${percent}% complete · ${completedCount} / ${totalLessons} lessons`;
      }

      if (progressFill) {
        progressFill.style.width = `${percent}%`;
      }
    });

    renderReadinessForecast();
  }

  renderHomeUser();
  renderTmuaCountdown();
  renderHomeMomentum();
  updateRoadmapProgress();

  document.addEventListener("lessonProgressUpdated", updateRoadmapProgress);

  const lessonRoot = document.getElementById("lesson-root");

  if (!lessonRoot) {
    console.warn("Lesson root not found.");
    return;
  }

  if (
    typeof LessonRepository === "undefined" ||
    typeof LessonRunner === "undefined"
  ) {
    console.error("Lesson classes not found.");
    return;
  }

  const lessonRepository = new LessonRepository("./data/lessons.json");
  let lessonRunner = null;

  try {
    await lessonRepository.load();
    lessonRunner = new LessonRunner(lessonRepository, lessonRoot);
  } catch (error) {
    console.error("Lesson setup error:", error);

    lessonRoot.innerHTML = `
      <p style="padding: 1rem; text-align: center;">
        Could not load lesson data.
      </p>
    `;
  }

  document.addEventListener("click", (event) => {
    const lessonLink = event.target.closest("[data-lesson-id]");

    if (!lessonLink) {
      return;
    }

    event.preventDefault();

    if (lessonLink.classList.contains("roadmap__item--locked")) {
      return;
    }

    if (!lessonRunner) {
      console.error("Lesson runner is not ready yet.");
      return;
    }

    showSection("#lesson");
    lessonRunner.start(lessonLink.dataset.lessonId);
  });
});