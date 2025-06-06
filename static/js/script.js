document.addEventListener('DOMContentLoaded', function () {
    // ✅ Preloader - Hide after page load
    window.onload = function () {
        const preloader = document.getElementById("preloader");
        if (preloader) preloader.style.display = "none";
    };

    // ✅ Sticky Navbar
    const navbar = document.getElementById("navbar");
    if (navbar) {
        const sticky = navbar.offsetTop;
        window.onscroll = function () {
            if (window.pageYOffset > sticky) {
                navbar.classList.add("sticky");
            } else {
                navbar.classList.remove("sticky");
            }
        };
    }

    // ✅ Hamburger Menu
    const hamburger = document.querySelector(".hamburger");
    const nav = document.querySelector(".nav");
    if (hamburger && nav) {
        let isMenuOpen = false;

        function toggleMenu() {
            isMenuOpen = !isMenuOpen;
            hamburger.classList.toggle("active", isMenuOpen);
            nav.classList.toggle("active", isMenuOpen);
        }

        function closeMenu() {
            if (isMenuOpen) {
                isMenuOpen = false;
                hamburger.classList.remove("active");
                nav.classList.remove("active");
            }
        }

        hamburger.addEventListener("click", function (event) {
            event.stopPropagation();
            toggleMenu();
        });

        document.addEventListener("click", function (event) {
            if (!nav.contains(event.target) && !hamburger.contains(event.target)) {
                closeMenu();
            }
        });

        window.addEventListener("scroll", function () {
            closeMenu();
        });
    }

    // ✅ Car Specification Form
    const carSpecForm = document.querySelector('#carSpecForm');
    if (carSpecForm) {
        carSpecForm.addEventListener('submit', async function (e) {
            e.preventDefault();
            const company = document.querySelector('#company').value;
            const model = document.querySelector('#model').value;
            const userQuery = document.querySelector('#user_query').value;
            const responseContainer = document.querySelector('.response');

            if (company && model && userQuery) {
                responseContainer.innerHTML = '<p>Loading...</p>';
                try {
                    const response = await fetch('/api/car-specification', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ company, model, user_query: userQuery })
                    });
                    const data = await response.json();
                    responseContainer.innerHTML = data.error 
                        ? `<p>Error: ${data.error}</p>` 
                        : `<p>${data.response}</p>`;
                } catch (error) {
                    responseContainer.innerHTML = `<p>An error occurred: ${error}</p>`;
                }
            } else {
                alert('Please fill out all fields.');
            }
        });
    }

    // ✅ Car Comparison Form
    const carComparisonForm = document.querySelector('#carComparisonForm');
    if (carComparisonForm) {
        carComparisonForm.addEventListener('submit', async function (e) {
            e.preventDefault();
            const company1 = document.querySelector('#company1').value;
            const model1 = document.querySelector('#model1').value;
            const company2 = document.querySelector('#company2').value;
            const model2 = document.querySelector('#model2').value;
            const userRequirements = document.querySelector('#user_requirements').value;
            const responseContainer = document.querySelector('.response');

            if (company1 && model1 && company2 && model2 && userRequirements) {
                responseContainer.innerHTML = '<p>Loading comparison report...</p>';
                try {
                    const response = await fetch('/api/car-comparison', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ company1, model1, company2, model2, user_requirements: userRequirements })
                    });
                    const data = await response.json();
                    responseContainer.innerHTML = data.error 
                        ? `<p>Error: ${data.error}</p>` 
                        : `<p>${data.response}</p>`;
                } catch (error) {
                    responseContainer.innerHTML = `<p>An error occurred: ${error}</p>`;
                }
            } else {
                alert('Please fill out all fields.');
            }
        });
    }
});
