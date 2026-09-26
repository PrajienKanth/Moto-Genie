document.addEventListener("DOMContentLoaded", function () {
    const navbar =
        document.getElementById("navbar");

    const hamburger =
        document.getElementById("hamburger");

    const nav =
        document.getElementById("nav-links");

    const navDropdowns =
        document.querySelectorAll(
            ".nav-dropdown"
        );

    let isMenuOpen = false;

    function closeNavDropdowns(except = null) {
        navDropdowns.forEach(function (dropdown) {
            if (dropdown === except) {
                return;
            }

            dropdown.classList.remove("open");

            const toggle =
                dropdown.querySelector(
                    ".nav-dropdown-toggle"
                );

            if (toggle) {
                toggle.setAttribute(
                    "aria-expanded",
                    "false"
                );
            }
        });
    }

    function setMenuState(open) {
        isMenuOpen = open;

        if (hamburger) {
            hamburger.classList.toggle(
                "active",
                open
            );

            hamburger.setAttribute(
                "aria-expanded",
                String(open)
            );

            hamburger.setAttribute(
                "aria-label",
                open
                    ? "Close navigation menu"
                    : "Open navigation menu"
            );
        }

        if (nav) {
            nav.classList.toggle(
                "active",
                open
            );
        }

        if (!open) {
            closeNavDropdowns();
        }
    }

    if (navbar) {
        const stickyOffset = 80;

        function updateNavbar() {
            navbar.classList.toggle(
                "sticky",
                window.scrollY > stickyOffset
            );
        }

        updateNavbar();

        window.addEventListener(
            "scroll",
            updateNavbar,
            {
                passive: true
            }
        );
    }

    navDropdowns.forEach(function (dropdown) {
        const toggle =
            dropdown.querySelector(
                ".nav-dropdown-toggle"
            );

        if (!toggle) {
            return;
        }

        toggle.addEventListener(
            "click",
            function (event) {
                event.preventDefault();
                event.stopPropagation();

                const shouldOpen =
                    !dropdown.classList.contains(
                        "open"
                    );

                closeNavDropdowns(
                    dropdown
                );

                dropdown.classList.toggle(
                    "open",
                    shouldOpen
                );

                toggle.setAttribute(
                    "aria-expanded",
                    String(shouldOpen)
                );
            }
        );

        dropdown.addEventListener(
            "mouseenter",
            function () {
                if (window.innerWidth <= 900) {
                    return;
                }

                closeNavDropdowns(
                    dropdown
                );

                dropdown.classList.add(
                    "open"
                );

                toggle.setAttribute(
                    "aria-expanded",
                    "true"
                );
            }
        );

        dropdown.addEventListener(
            "mouseleave",
            function () {
                if (window.innerWidth <= 900) {
                    return;
                }

                dropdown.classList.remove(
                    "open"
                );

                toggle.setAttribute(
                    "aria-expanded",
                    "false"
                );
            }
        );

        dropdown
            .querySelectorAll(
                ".nav-dropdown-item"
            )
            .forEach(function (item) {
                item.addEventListener(
                    "click",
                    function () {
                        closeNavDropdowns();

                        if (
                            window.innerWidth <= 900
                        ) {
                            setMenuState(false);
                        }
                    }
                );
            });
    });

    document.addEventListener(
        "click",
        function (event) {
            if (
                !event.target.closest(
                    ".nav-dropdown"
                )
            ) {
                closeNavDropdowns();
            }
        }
    );

    if (hamburger && nav) {
        hamburger.addEventListener(
            "click",
            function (event) {
                event.preventDefault();
                event.stopPropagation();

                setMenuState(
                    !isMenuOpen
                );
            }
        );

        nav
            .querySelectorAll(
                ".nav-link:not(.nav-dropdown-toggle)"
            )
            .forEach(function (link) {
                link.addEventListener(
                    "click",
                    function () {
                        setMenuState(false);
                    }
                );
            });

        document.addEventListener(
            "click",
            function (event) {
                const clickedNav =
                    nav.contains(event.target);

                const clickedHamburger =
                    hamburger.contains(event.target);

                if (
                    isMenuOpen &&
                    !clickedNav &&
                    !clickedHamburger
                ) {
                    setMenuState(false);
                }
            }
        );

        document.addEventListener(
            "keydown",
            function (event) {
                if (event.key !== "Escape") {
                    return;
                }

                closeNavDropdowns();

                if (isMenuOpen) {
                    setMenuState(false);
                    hamburger.focus();
                }
            }
        );

        window.addEventListener(
            "scroll",
            function () {
                if (
                    window.innerWidth <= 900 &&
                    isMenuOpen
                ) {
                    setMenuState(false);
                }
            },
            {
                passive: true
            }
        );

        window.addEventListener(
            "resize",
            function () {
                if (
                    window.innerWidth > 900 &&
                    isMenuOpen
                ) {
                    setMenuState(false);
                }
            },
            {
                passive: true
            }
        );
    }

    function syncMobileViewport() {
        const width =
            window.visualViewport
                ? window.visualViewport.width
                : window.innerWidth;

        document.documentElement.classList.toggle(
            "mobile-viewport",
            width <= 900
        );
    }

    syncMobileViewport();

    window.addEventListener(
        "resize",
        syncMobileViewport,
        {
            passive: true
        }
    );

    if (window.visualViewport) {
        window.visualViewport.addEventListener(
            "resize",
            syncMobileViewport,
            {
                passive: true
            }
        );
    }
});