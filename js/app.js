document.addEventListener("DOMContentLoaded", async () => {
    /* ========================
       LEADERBOARD
    ======================== */
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

    /* ========================
       PAGE NAVIGATION
    ======================== */
    const navLinks = document.querySelectorAll(".nav__link");
    const topicLinks = document.querySelectorAll(".topic-link, .roadmap__item");
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
                    link.getAttribute("href") === targetId
                );
            });
        }
        document.dispatchEvent(new CustomEvent("lessonProgressUpdated"));
        window.scrollTo(0, 0);
    }

    function addNavigation(links) {
        links.forEach((link) => {
            link.addEventListener("click", (event) => {
                /* Lesson links are handled separately below */
                if (link.dataset.lessonId) {
                    return;
                }

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

    /* ========================
       HOME USER DATA
    ======================== */
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
            console.warn("userData was not found.");
            return;
        }

        const user = userData.get();
        const greeting = document.getElementById("home-greeting");
        const avatar = document.getElementById("home-avatar");
        const streak = document.getElementById("home-streak");

        if (greeting && user.name) {
            const firstName = user.name.split(" ")[0];
            greeting.textContent = `Good morning, ${firstName}!`;
        }

        if (avatar && user.name) {
            avatar.textContent = getInitials(user.name);
        }

        if (streak && typeof user.streak !== "undefined") {
            streak.textContent = user.streak;
        }
    }

    renderHomeUser();

    /* ========================
       JSON LESSON RUNNER
    ======================== */
    const lessonRoot = document.getElementById("lesson-root");

    if (!lessonRoot) {
        console.warn("Lesson root not found. Add #lesson-root to index.html.");
        return;
    }

    if (
        typeof LessonRepository === "undefined" ||
        typeof LessonRunner === "undefined"
    ) {
        console.error(
            "Lesson classes not found. Make sure lesson-runner.js loads before app.js."
        );
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
        document.addEventListener("click", (event) => {
            const lessonLink = event.target.closest("[data-lesson-id]");

            if (!lessonLink) {
                return;
            }

            if (lessonLink.classList.contains("roadmap__item--locked")) {
                event.preventDefault();
                return;
            }

            event.preventDefault();

            if (!lessonRunner) {
                console.error("Lesson runner is not ready yet.");
                return;
            }

            showSection("#lesson");
            lessonRunner.start(lessonLink.dataset.lessonId);
        });
        event.preventDefault();

        if (!lessonRunner) {
            console.error("Lesson runner is not ready yet.");
            return;
        }

        showSection("#lesson");
        lessonRunner.start(lessonLink.dataset.lessonId);
        function getTopicProgress() {
            return JSON.parse(localStorage.getItem("tmuaTopicProgress") || "{}");
        }

        function updateRoadmapProgress() {

            const progress = getTopicProgress();

            document.querySelectorAll(".roadmap").forEach((roadmap) => {
                const topicSection = roadmap.closest(".section");
                const topicId = topicSection?.id;

                if (!topicId) return;

                const roadmapItems = [
                    ...roadmap.querySelectorAll("[data-lesson-id]"),
                ];

                const completedLessons =
                    progress[topicId]?.completedLessons || [];

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
                        "roadmap__item--locked"
                    );

                    if (isComplete) {
                        item.classList.add("roadmap__item--complete");
                        return;
                    }

                    if (previousComplete) {
                        item.classList.add("roadmap__item--current");
                        return;
                    }

                    item.classList.add("roadmap__item--locked");
                });

                const completedCount = completedLessons.length;
                const totalLessons = roadmapItems.length;
                const percent =
                    totalLessons === 0
                        ? 0
                        : Math.round((completedCount / totalLessons) * 100);

                const progressText = topicSection.querySelector(
                    "[data-topic-progress-text]"
                );

                if (progressText) {
                    progressText.textContent = `${percent}% complete · ${completedCount} / ${totalLessons} lessons`;
                }

                const progressFill = topicSection.querySelector(
                    "[data-topic-progress-fill]"
                );

                if (progressFill) {
                    progressFill.style.width = `${percent}%`;
                }
            });
        }

        updateRoadmapProgress();
        document.addEventListener("lessonProgressUpdated", updateRoadmapProgress);
    });
});