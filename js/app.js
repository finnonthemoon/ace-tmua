document.addEventListener('DOMContentLoaded', async () => {
    const jsonURL = 'data/leaderboard.json';
    const tableBody = document.getElementById('leaderboard-data');


    try {
        const response = await fetch(jsonURL)
        if (!response.ok) {
            throw new Error('Network response was not ok')
        }

        const data = await response.json()

        data.users.forEach(user => {
            const row = document.createElement('tr');

            row.innerHTML = `
                    <td>${user.name}</td>
                    <td>${user.targetUni}</td>
                    <td>${user.weeklyScore}</td>
                `;

            tableBody.appendChild(row);
        });
    }
    catch (error) {
        console.error('There was a problem fetching the data: ', error);
        tableBody.innerHTML = `<tr><td colspan="3" style="text-align:center; color:red;">Failed to load leaderboard.</td></tr>`;
    }

    const navLinks = document.querySelectorAll(".nav__link");
    const topicLinks = document.querySelectorAll(".topic-link");
    const backLinks = document.querySelectorAll(".back-link");
    const sections = document.querySelectorAll(".section");

    function showSection(targetId) {
        const targetSection = document.querySelector(targetId);

        if (!targetSection) {
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
                const isCurrentPage = link.getAttribute("href") === targetId;
                link.classList.toggle("active-link", isCurrentPage);
            });
        }

        window.scrollTo(0, 0);
    }

    function addNavigation(links) {
        links.forEach((link) => {
            link.addEventListener("click", (event) => {
                event.preventDefault();

                const targetId = link.getAttribute("href");

                if (targetId && targetId.startsWith("#")) {
                    showSection(targetId);
                }
            });
        });
    }

    addNavigation(navLinks);
    addNavigation(topicLinks);
    addNavigation(backLinks);
    function getInitials(name) {
        return name
            .split(" ")
            .map((part) => part[0])
            .join("")
            .slice(0, 2)
            .toUpperCase();
    }

    function renderHomeUser() {
        const user = userData.get();

        const greeting = document.getElementById("home-greeting");
        const avatar = document.getElementById("home-avatar");

        if (greeting) {
            const firstName = user.name.split(" ")[0];
            greeting.textContent = `Good morning, ${firstName}!`;
        }

        if (avatar) {
            avatar.textContent = getInitials(user.name);
        }
    }

    renderHomeUser();
});