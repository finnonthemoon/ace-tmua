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

    const navLinks = document.querySelectorAll('.nav__link');
    const sections = document.querySelectorAll('.section');

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
        e.preventDefault(); 

        navLinks.forEach(l => l.classList.remove('active-link'));
        sections.forEach(s => s.classList.remove('active-section'));

        link.classList.add('active-link');

        const targetId = link.getAttribute('href'); 
        const targetSection = document.querySelector(targetId);
        if (targetSection) {
            targetSection.classList.add('active-section');
        }
        });
    });
});