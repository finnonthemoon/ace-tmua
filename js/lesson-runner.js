class LessonRepository {
    constructor(url) {
        this.url = url;
        this.lessons = [];
    }

    async load() {
        const response = await fetch(this.url);

        if (!response.ok) {
            throw new Error("Could not load lessons.json");
        }

        const data = await response.json();
        this.lessons = data.lessons;
    }

    getLesson(lessonId) {
        return this.lessons.find((lesson) => lesson.id === lessonId);
    }
}

class LessonRunner {
    constructor(repository, root) {
        this.repository = repository;
        this.root = root;
        this.lesson = null;
        this.screenIndex = 0;
        this.revealIndex = 0;
    }

    start(lessonId) {
        document.body.classList.add("lesson-mode");

        this.lesson = this.repository.getLesson(lessonId);
        this.screenIndex = 0;
        this.revealIndex = 0;

        if (!this.lesson) {
            this.root.innerHTML = "<p>Lesson not found.</p>";
            return;
        }

        this.render();
    }

    getProgressPercent() {
        if (!this.lesson || !this.lesson.screens.length) {
            return 0;
        }

        return ((this.screenIndex + 1) / this.lesson.screens.length) * 100;
    }

    getTopBar() {
        return `
      <div class="lesson-screen__top">
        <button class="lesson-exit" type="button" aria-label="Exit lesson">
          <i class="ri-close-line"></i>
        </button>

        <div class="lesson-progress" aria-label="Lesson progress">
          <span
            class="lesson-progress__fill"
            style="width: ${this.getProgressPercent()}%"
          ></span>
        </div>

        <span></span>
      </div>
    `;
    }

    addExitListener() {
        const exitButton = this.root.querySelector(".lesson-exit");

        if (exitButton) {
            exitButton.addEventListener("click", () => {
                this.exit();
            });
        }
    }

    render() {
        const screen = this.lesson.screens[this.screenIndex];

        if (!screen) {
            this.finish();
            return;
        }

        if (screen.type === "concept") {
            this.renderConcept(screen);
            return;
        }

        if (screen.type === "reveal") {
            this.renderReveal(screen);
            return;
        }

        this.root.innerHTML = `
      <article class="lesson-screen">
        ${this.getTopBar()}
        <div class="lesson-screen__content">
          <h1>Screen type not built yet</h1>
          <p>Unknown screen type: ${screen.type}</p>
        </div>
      </article>
    `;

        this.addExitListener();
    }

    renderConcept(screen) {
        this.root.innerHTML = `
      <article class="lesson-screen">
        ${this.getTopBar()}

        <div class="lesson-screen__content">
          <span class="lesson-screen__icon">
            <i class="ri-lightbulb-line"></i>
          </span>

          <p class="topic-page__eyebrow">${screen.eyebrow || "TMUA LESSON"}</p>

          <h1>${screen.title}</h1>
          <p>${screen.body}</p>

          ${screen.keyPoint
                ? `
                <div class="lesson-key-point">
                  <strong>Key idea</strong>
                  <p>${screen.keyPoint}</p>
                </div>
              `
                : ""
            }
        </div>

        <button class="lesson-primary-button" id="lesson-next" type="button">
          ${screen.buttonText || "Continue"}
          <i class="ri-arrow-right-line"></i>
        </button>
      </article>
    `;

        this.root.querySelector("#lesson-next").addEventListener("click", () => {
            this.next();
        });

        this.addExitListener();
    }

    renderReveal(screen) {
        const steps = screen.steps.slice(0, this.revealIndex + 1);
        const isLastReveal = this.revealIndex === screen.steps.length - 1;

        this.root.innerHTML = `
      <article class="lesson-screen">
        ${this.getTopBar()}

        <div class="lesson-screen__content">
          <p class="topic-page__eyebrow">${screen.eyebrow || "TMUA LESSON"}</p>

          <h1>${screen.title}</h1>

          <div class="reveal-steps">
            ${steps
                .map(
                    (step, index) => `
                  <div class="reveal-step">
                    <span>${index + 1}</span>
                    <div>
                      <strong>${step.title}</strong>
                      <p>${step.body}</p>
                    </div>
                  </div>
                `
                )
                .join("")}
          </div>
        </div>

        <button class="lesson-primary-button" id="lesson-next" type="button">
          ${isLastReveal ? screen.buttonText || "Continue" : "Show next step"}
          <i class="ri-arrow-right-line"></i>
        </button>
      </article>
    `;

        this.root.querySelector("#lesson-next").addEventListener("click", () => {
            if (isLastReveal) {
                this.next();
            } else {
                this.revealIndex += 1;
                this.render();
            }
        });

        this.addExitListener();
    }

    next() {
        this.screenIndex += 1;
        this.revealIndex = 0;
        this.render();
    }

    finish() {
        document.body.classList.add("lesson-mode");

        this.root.innerHTML = `
      <article class="lesson-screen lesson-complete">
        ${this.getTopBar()}

        <div class="lesson-screen__content">
          <span class="lesson-screen__icon">
            <i class="ri-checkbox-circle-fill"></i>
          </span>

          <p class="topic-page__eyebrow">LESSON COMPLETE</p>
          <h1>Nice work.</h1>
          <p>You completed ${this.lesson.title}.</p>
        </div>

        <button class="lesson-primary-button" id="lesson-exit-button" type="button">
          Back to Algebra
        </button>
      </article>
    `;

        this.root
            .querySelector("#lesson-exit-button")
            .addEventListener("click", () => {
                this.exit();
            });

        this.addExitListener();
    }

    exit() {
        document.body.classList.remove("lesson-mode");

        document.querySelectorAll(".section").forEach((section) => {
            section.classList.remove("active-section");
        });

        document.querySelector("#topic-1")?.classList.add("active-section");

        window.scrollTo(0, 0);
    }
}