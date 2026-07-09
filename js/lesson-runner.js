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
    if (screen.type === "multipleChoice") {
      this.renderMultipleChoice(screen);
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

    if (screen.type === "trueFalse") {
      this.renderTrueFalse(screen);
      return;
    }
    if (screen.type === "workedExample") {
      this.renderWorkedExample(screen);
      return;
    }
    if (screen.type === "milestone") {
      this.renderMilestone(screen);
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

          <p class="topic-page__eyebrow">
            ${screen.eyebrow || "TMUA LESSON"}
          </p>

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
          <p class="topic-page__eyebrow">
            ${screen.eyebrow || "TMUA LESSON"}
          </p>

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
                `,
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

  renderTrueFalse(screen) {
    this.root.innerHTML = `
      <article class="lesson-screen">
        ${this.getTopBar()}

        <div class="lesson-screen__content">
          <p class="topic-page__eyebrow">
            ${screen.eyebrow || "QUICK CHECK"}
          </p>

          <h1>${screen.question}</h1>

          <div class="true-false-options">
            <button class="true-false-option" data-answer="true" type="button">
              <i class="ri-check-line"></i>
              True
            </button>

            <button class="true-false-option" data-answer="false" type="button">
              <i class="ri-close-line"></i>
              False
            </button>
          </div>

          <div class="answer-feedback" id="answer-feedback"></div>
        </div>
      </article>
    `;

    this.root.querySelectorAll(".true-false-option").forEach((button) => {
      button.addEventListener("click", () => {
        const chosenAnswer = button.dataset.answer === "true";
        const isCorrect = chosenAnswer === screen.answer;
        const feedback = this.root.querySelector("#answer-feedback");

        this.root.querySelectorAll(".true-false-option").forEach((option) => {
          option.disabled = true;
        });

        button.classList.add(isCorrect ? "is-correct" : "is-wrong");

        feedback.innerHTML = `
          <div class="answer-feedback__card ${isCorrect ? "is-correct" : "is-wrong"
          }">
            <strong>${isCorrect ? "Correct." : "Not quite."}</strong>

            <p>
              ${isCorrect ? screen.correctFeedback : screen.incorrectFeedback}
            </p>

            <button class="lesson-primary-button" id="lesson-next" type="button">
              Continue
              <i class="ri-arrow-right-line"></i>
            </button>
          </div>
        `;

        this.root
          .querySelector("#lesson-next")
          .addEventListener("click", () => {
            this.next();
          });
      });
    });

    this.addExitListener();
  }
  renderMultipleChoice(screen) {
    this.root.innerHTML = `
    <article class="lesson-screen">
      ${this.getTopBar()}

      <div class="lesson-screen__content">
        <p class="topic-page__eyebrow">
          ${screen.eyebrow || "QUICK CHECK"}
        </p>

        <h1>${screen.question}</h1>

        ${screen.prompt
        ? `<p class="multiple-choice__prompt">${screen.prompt}</p>`
        : ""
      }

        <div class="multiple-choice-options">
          ${screen.options
        .map(
          (option, index) => `
                <button
                  class="multiple-choice-option"
                  data-index="${index}"
                  type="button"
                >
                  <span class="multiple-choice-option__letter">
                    ${String.fromCharCode(65 + index)}
                  </span>

                  <span>${option}</span>
                </button>
              `,
        )
        .join("")}
        </div>

        <div class="answer-feedback" id="answer-feedback"></div>
      </div>
    </article>
  `;

    this.root.querySelectorAll(".multiple-choice-option").forEach((button) => {
      button.addEventListener("click", () => {
        const chosenIndex = Number(button.dataset.index);
        const isCorrect = chosenIndex === screen.answerIndex;
        const feedback = this.root.querySelector("#answer-feedback");

        this.root
          .querySelectorAll(".multiple-choice-option")
          .forEach((option) => {
            option.disabled = true;

            const optionIndex = Number(option.dataset.index);

            if (optionIndex === screen.answerIndex) {
              option.classList.add("is-correct");
            }

            if (optionIndex === chosenIndex && !isCorrect) {
              option.classList.add("is-wrong");
            }
          });

        feedback.innerHTML = `
        <div class="answer-feedback__card ${isCorrect ? "is-correct" : "is-wrong"
          }">
          <strong>${isCorrect ? "Correct." : "Not quite."}</strong>

          <p>
            ${isCorrect
            ? screen.correctFeedback
            : screen.incorrectFeedback
          }
          </p>

          <button class="lesson-primary-button" id="lesson-next" type="button">
            Continue
            <i class="ri-arrow-right-line"></i>
          </button>
        </div>
      `;

        this.root.querySelector("#lesson-next").addEventListener("click", () => {
          this.next();
        });
      });
    });

    this.addExitListener();
  } renderWorkedExample(screen) {
    const steps = screen.steps.slice(0, this.revealIndex);
    const hasStarted = this.revealIndex > 0;
    const isFinished = this.revealIndex >= screen.steps.length;

    this.root.innerHTML = `
    <article class="lesson-screen">
      ${this.getTopBar()}

      <div class="lesson-screen__content">
        <p class="topic-page__eyebrow">
          ${screen.eyebrow || "WORKED EXAMPLE"}
        </p>

        <h1>${screen.title}</h1>

        <div class="worked-example-question">
          <p>${screen.question}</p>

          ${screen.options
        ? `
                <div class="worked-example-options">
                  ${screen.options
          .map(
            (option, index) => `
                        <div class="worked-example-option ${isFinished && index === screen.answerIndex
                ? "is-correct"
                : ""
              }">
                          <span>${String.fromCharCode(65 + index)}</span>
                          <p>${option}</p>
                        </div>
                      `,
          )
          .join("")}
                </div>
              `
        : ""
      }
        </div>

        ${hasStarted
        ? `
              <div class="worked-example-steps">
                ${steps
          .map(
            (step, index) => `
                      <div class="worked-example-step">
                        <span>${index + 1}</span>

                        <div>
                          <strong>${step.title}</strong>
                          <p>${step.body}</p>
                        </div>
                      </div>
                    `,
          )
          .join("")}
              </div>
            `
        : ""
      }

        ${isFinished
        ? `
              <div class="worked-example-answer">
                <strong>Answer: ${String.fromCharCode(65 + screen.answerIndex)}</strong>
                <p>${screen.finalAnswer}</p>
              </div>
            `
        : ""
      }
      </div>

      <button class="lesson-primary-button" id="lesson-next" type="button">
        ${isFinished
        ? screen.buttonText || "Continue"
        : hasStarted
          ? "Show next step"
          : "Show reasoning"
      }
        <i class="ri-arrow-right-line"></i>
      </button>
    </article>
  `;

    this.root.querySelector("#lesson-next").addEventListener("click", () => {
      if (isFinished) {
        this.next();
        return;
      }

      this.revealIndex += 1;
      this.render();
    });

    this.addExitListener();
  }
  renderMilestone(screen) {
    this.root.innerHTML = `
      <article class="lesson-screen lesson-screen--milestone">
        ${this.getTopBar()}

        <div class="lesson-screen__content lesson-milestone">
          <div class="lesson-milestone__glow"></div>

          <img
            class="lesson-milestone__mascot"
            src="./assets/excited robot.png"
            alt="TMUA study robot celebrating"
          />

          <p class="topic-page__eyebrow">
            ${screen.eyebrow || "KEEP GOING"}
          </p>

          <h1>${screen.title}</h1>
          <p>${screen.body}</p>
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

  next() {
    this.screenIndex += 1;
    this.revealIndex = 0;
    this.render();
  }

  finish() {
    const progressKey = "tmuaTopicProgress";
    const progress = JSON.parse(localStorage.getItem(progressKey) || "{}");

    if (!progress[this.lesson.topicId]) {
      progress[this.lesson.topicId] = {
        completedLessons: [],
      };
    }

    const completedLessons = progress[this.lesson.topicId].completedLessons;

    if (!completedLessons.includes(this.lesson.id)) {
      completedLessons.push(this.lesson.id);
    }

    localStorage.setItem(progressKey, JSON.stringify(progress));

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

      <button
        class="lesson-primary-button"
        id="lesson-exit-button"
        type="button"
      >
        Back to roadmap
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
