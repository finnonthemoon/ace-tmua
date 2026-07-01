document.addEventListener('DOMContentLoaded', () => {
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