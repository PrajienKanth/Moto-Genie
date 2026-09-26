document.addEventListener("DOMContentLoaded", function () {
    if (typeof AOS !== "undefined") {
        AOS.init({
            duration: 700,
            easing: "ease-out-cubic",
            once: true,
            mirror: false,
            offset: 60,
            disable: false
        });
    }

    const aboutFeatures = document.querySelectorAll(
        ".about-feature"
    );

    if (aboutFeatures.length) {
        aboutFeatures.forEach(function (card) {
            card.addEventListener("click", function (event) {
                if (window.innerWidth > 600) {
                    return;
                }

                if (event.target.closest("a")) {
                    return;
                }

                const wasActive =
                    card.classList.contains(
                        "popup-active"
                    );

                aboutFeatures.forEach(function (item) {
                    item.classList.remove(
                        "popup-active"
                    );
                });

                if (!wasActive) {
                    card.classList.add(
                        "popup-active"
                    );
                }
            });
        });

        document.addEventListener("click", function (event) {
            if (window.innerWidth > 600) {
                return;
            }

            if (!event.target.closest(".about-feature")) {
                aboutFeatures.forEach(function (card) {
                    card.classList.remove(
                        "popup-active"
                    );
                });
            }
        });

        window.addEventListener(
            "resize",
            function () {
                if (window.innerWidth > 600) {
                    aboutFeatures.forEach(function (card) {
                        card.classList.remove(
                            "popup-active"
                        );
                    });
                }
            },
            {
                passive: true
            }
        );
    }

    const dropdowns = document.querySelectorAll(
        "[data-dropdown]"
    );

    dropdowns.forEach(function (dropdown) {
        const button = dropdown.querySelector(
            "[data-dropdown-button]"
        );

        const selected = dropdown.querySelector(
            ".moto-dropdown-selected span"
        );

        const selectedIcon = dropdown.querySelector(
            ".moto-dropdown-selected i"
        );

        const options = dropdown.querySelectorAll(
            ".moto-dropdown-option"
        );

        const inputId = dropdown.dataset.input;

        const hiddenInput = inputId
            ? document.getElementById(inputId)
            : null;

        if (!button) {
            return;
        }

        button.addEventListener(
            "click",
            function (event) {
                event.preventDefault();
                event.stopPropagation();

                dropdowns.forEach(function (otherDropdown) {
                    if (otherDropdown !== dropdown) {
                        otherDropdown.classList.remove(
                            "open"
                        );
                    }
                });

                dropdown.classList.toggle("open");
            }
        );

        options.forEach(function (option) {
            option.addEventListener(
                "click",
                function (event) {
                    event.preventDefault();
                    event.stopPropagation();

                    const value =
                        option.dataset.value || "";

                    const textElement =
                        option.querySelector("span");

                    const text = textElement
                        ? textElement.textContent.trim()
                        : value;

                    const icon = option.querySelector(
                        ":scope > i:first-child"
                    );

                    if (hiddenInput) {
                        hiddenInput.value = value;

                        hiddenInput.dispatchEvent(
                            new Event("change", {
                                bubbles: true
                            })
                        );

                        hiddenInput.dispatchEvent(
                            new Event("input", {
                                bubbles: true
                            })
                        );
                    }

                    if (selected) {
                        selected.textContent = text;
                    }

                    if (icon && selectedIcon) {
                        selectedIcon.className =
                            icon.className;
                    }

                    options.forEach(function (item) {
                        item.classList.remove(
                            "active"
                        );
                    });

                    option.classList.add("active");

                    dropdown.classList.remove("open");
                }
            );
        });
    });

    document.addEventListener(
        "click",
        function () {
            dropdowns.forEach(function (dropdown) {
                dropdown.classList.remove("open");
            });
        }
    );

    document.addEventListener(
        "keydown",
        function (event) {
            if (event.key !== "Escape") {
                return;
            }

            dropdowns.forEach(function (dropdown) {
                dropdown.classList.remove("open");
            });
        }
    );

    if (
        typeof initializeFuelCalculator ===
        "function"
    ) {
        initializeFuelCalculator();
    }
});