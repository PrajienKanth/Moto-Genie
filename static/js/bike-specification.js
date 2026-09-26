document.addEventListener("DOMContentLoaded", function () {
    "use strict";

    if (typeof AOS !== "undefined") {
        AOS.init({
            duration: 800,
            easing: "ease-out-cubic",
            once: true,
            offset: 70,
            disable: false
        });
    }

    const form = document.getElementById("bikeSpecForm");
    const companyInput = document.getElementById("company");
    const modelInput = document.getElementById("model");
    const modelsList = document.getElementById("models");
    const submitButton =
        document.getElementById("bikeSubmit") ||
        document.querySelector(".spec-submit-button");
    const loader = document.getElementById("loader");

    const companyModelsElement =
        document.getElementById("companyModelsData");

    let companyModels = {};

    if (companyModelsElement) {
        try {
            companyModels = JSON.parse(
                companyModelsElement.textContent.trim()
            );
        } catch (error) {
            console.error(
                "Unable to read company/model data:",
                error
            );
        }
    }

    function escapeHtml(value) {
        const div = document.createElement("div");
        div.textContent = value ?? "";
        return div.innerHTML;
    }

    function updateModels() {
        if (!companyInput || !modelInput || !modelsList) {
            return;
        }

        const selectedCompany =
            companyInput.value.trim();

        modelsList.innerHTML = "";
        modelInput.value = "";
        modelInput.placeholder = "Type or select model";

        const models =
            Array.isArray(companyModels[selectedCompany])
                ? companyModels[selectedCompany]
                : [];

        models.forEach(function (model) {
            const option =
                document.createElement("option");

            option.value = model;
            modelsList.appendChild(option);
        });

        if (!models.length && selectedCompany) {
            modelInput.placeholder =
                "Select a valid company first";
        }
    }

    if (companyInput) {
        companyInput.addEventListener(
            "input",
            updateModels
        );

        companyInput.addEventListener(
            "change",
            updateModels
        );
    }

    function setLoadingState(loading) {
        if (loader) {
            loader.classList.toggle(
                "active",
                loading
            );
        }

        if (!submitButton) {
            return;
        }

        submitButton.disabled = loading;
        submitButton.classList.toggle(
            "loading",
            loading
        );

        const submitText =
            submitButton.querySelector(
                ".bike-submit-text strong"
            ) ||
            submitButton.querySelector(
                "strong"
            );

        if (submitText) {
            if (loading) {
                if (!submitButton.dataset.originalText) {
                    submitButton.dataset.originalText =
                        submitText.textContent;
                }

                submitText.textContent =
                    "Analyzing...";
            } else if (
                submitButton.dataset.originalText
            ) {
                submitText.textContent =
                    submitButton.dataset.originalText;
            }
        }
    }

    if (form) {
        form.addEventListener(
            "submit",
            function () {
                setLoadingState(true);
            }
        );
    }

    /*
     * Modal handling
     */

    const modalSelectors = [
        "#bikeSpecModal",
        "#bikeSpecificationModal",
        "#specificationModal",
        "#bikeDetailsModal",
        "#detailsModal",
        ".bike-spec-modal",
        ".bike-specification-modal",
        ".specification-modal"
    ];

    function getModal() {
        for (const selector of modalSelectors) {
            const modal =
                document.querySelector(selector);

            if (modal) {
                return modal;
            }
        }

        return null;
    }

    const modal = getModal();

    function openModal() {
        const currentModal = getModal();

        if (!currentModal) {
            return;
        }

        currentModal.classList.add("active");
        currentModal.classList.add("show");
        currentModal.setAttribute(
            "aria-hidden",
            "false"
        );

        if (
            currentModal.style.display === "none"
        ) {
            currentModal.style.display = "flex";
        }

        document.body.classList.add(
            "modal-open"
        );

        document.body.style.overflow = "hidden";
    }

    function closeModal() {
        const currentModal = getModal();

        if (!currentModal) {
            return;
        }

        currentModal.classList.remove("active");
        currentModal.classList.remove("show");
        currentModal.setAttribute(
            "aria-hidden",
            "true"
        );

        document.body.classList.remove(
            "modal-open"
        );

        document.body.style.removeProperty(
            "overflow"
        );

        if (
            currentModal.dataset.defaultDisplay ===
            "none"
        ) {
            currentModal.style.display = "none";
        }
    }

    if (modal) {
        modal.dataset.defaultDisplay =
            window.getComputedStyle(modal).display;

        if (
            modal.getAttribute("aria-hidden") === null
        ) {
            modal.setAttribute(
                "aria-hidden",
                "true"
            );
        }
    }

    const modalCloseSelectors = [
        "[data-modal-close]",
        "[data-close-modal]",
        ".modal-close",
        ".modal-close-button",
        ".close-modal",
        ".bike-modal-close",
        ".spec-modal-close",
        ".btn-close"
    ];

    modalCloseSelectors.forEach(function (selector) {
        document
            .querySelectorAll(selector)
            .forEach(function (button) {
                button.addEventListener(
                    "click",
                    function (event) {
                        event.preventDefault();
                        closeModal();
                    }
                );
            });
    });

    if (modal) {
        modal.addEventListener(
            "click",
            function (event) {
                if (event.target === modal) {
                    closeModal();
                }
            }
        );
    }

    document.addEventListener(
        "keydown",
        function (event) {
            if (event.key === "Escape") {
                closeModal();
            }
        }
    );

    /*
     * Open the modal when results are available.
     */

    function openResultsModalIfAvailable() {
        const currentModal = getModal();

        if (!currentModal) {
            return;
        }

        const details =
            document.querySelector(
                ".bike-details-section"
            );

        const response =
            document.querySelector(
                ".ai-response-section"
            );

        if (details || response) {
            openModal();
        }
    }

    /*
     * Some Flask responses reveal the result after
     * navigation/reload. Check after the page is ready.
     */

    window.setTimeout(
        openResultsModalIfAvailable,
        250
    );

    /*
     * Text-to-speech
     */

    const responseElement =
        document.getElementById(
            "aiResponseText"
        );

    const playButton =
        document.getElementById(
            "speechPlay"
        );

    const pauseButton =
        document.getElementById(
            "speechPause"
        );

    const stopButton =
        document.getElementById(
            "speechStop"
        );

    const speechSupported =
        "speechSynthesis" in window;

    let speechUtterance = null;
    let speechWords = [];
    let currentWordIndex = -1;

    function prepareSpeechText() {
        if (!responseElement) {
            return;
        }

        const text =
            responseElement.textContent.trim();

        if (!text) {
            return;
        }

        speechWords =
            text.split(/\s+/);

        responseElement.innerHTML =
            speechWords
                .map(function (word, index) {
                    return `
                        <span
                            class="speech-word"
                            data-word-index="${index}"
                        >${escapeHtml(word)}</span>
                    `;
                })
                .join(" ");
    }

    function highlightWord(index) {
        if (!responseElement) {
            return;
        }

        const words =
            responseElement.querySelectorAll(
                ".speech-word"
            );

        words.forEach(function (word) {
            word.classList.remove(
                "speech-word-active"
            );
        });

        if (
            index >= 0 &&
            index < words.length
        ) {
            const activeWord = words[index];

            activeWord.classList.add(
                "speech-word-active"
            );

            activeWord.scrollIntoView({
                behavior: "smooth",
                block: "nearest"
            });
        }

        currentWordIndex = index;
    }

    function resetSpeechHighlight() {
        if (!responseElement) {
            return;
        }

        responseElement
            .querySelectorAll(
                ".speech-word"
            )
            .forEach(function (word) {
                word.classList.remove(
                    "speech-word-active"
                );
            });

        currentWordIndex = -1;
    }

    function getPreferredVoice() {
        if (!speechSupported) {
            return null;
        }

        const voices =
            window.speechSynthesis.getVoices();

        if (!voices.length) {
            return null;
        }

        return (
            voices.find(function (voice) {
                return (
                    /^en[-_]/i.test(
                        voice.lang
                    ) &&
                    /google|microsoft|natural/i.test(
                        voice.name
                    )
                );
            }) ||
            voices.find(function (voice) {
                return /^en[-_]/i.test(
                    voice.lang
                );
            }) ||
            null
        );
    }

    function playSpeech() {
        if (
            !speechSupported ||
            !responseElement
        ) {
            alert(
                "Text-to-speech is not supported in this browser."
            );
            return;
        }

        if (
            window.speechSynthesis.paused &&
            speechUtterance
        ) {
            window.speechSynthesis.resume();
            return;
        }

        window.speechSynthesis.cancel();
        resetSpeechHighlight();

        const text =
            responseElement.textContent.trim();

        if (!text) {
            return;
        }

        speechUtterance =
            new SpeechSynthesisUtterance(text);

        speechUtterance.rate = 1;
        speechUtterance.pitch = 1;
        speechUtterance.volume = 1;

        const voice =
            getPreferredVoice();

        if (voice) {
            speechUtterance.voice = voice;
        }

        speechUtterance.onboundary =
            function (event) {
                if (
                    event.name !== "word"
                ) {
                    return;
                }

                const before =
                    text.substring(
                        0,
                        event.charIndex
                    );

                const trimmed =
                    before.trim();

                const index =
                    trimmed
                        ? trimmed.split(
                              /\s+/
                          ).length - 1
                        : 0;

                highlightWord(index);
            };

        speechUtterance.onend =
            function () {
                resetSpeechHighlight();
                speechUtterance = null;
            };

        speechUtterance.oncancel =
            function () {
                resetSpeechHighlight();
                speechUtterance = null;
            };

        speechUtterance.onerror =
            function (event) {
                console.error(
                    "Speech synthesis error:",
                    event
                );

                resetSpeechHighlight();
                speechUtterance = null;
            };

        window.speechSynthesis.speak(
            speechUtterance
        );
    }

    function pauseSpeech() {
        if (
            speechSupported &&
            window.speechSynthesis.speaking
        ) {
            window.speechSynthesis.pause();
        }
    }

    function stopSpeech() {
        if (speechSupported) {
            window.speechSynthesis.cancel();
        }

        speechUtterance = null;
        resetSpeechHighlight();
    }

    if (playButton) {
        playButton.addEventListener(
            "click",
            playSpeech
        );
    }

    if (pauseButton) {
        pauseButton.addEventListener(
            "click",
            pauseSpeech
        );
    }

    if (stopButton) {
        stopButton.addEventListener(
            "click",
            stopSpeech
        );
    }

    if (responseElement) {
        prepareSpeechText();
    }

    if (speechSupported) {
        window.speechSynthesis.onvoiceschanged =
            function () {
                window.speechSynthesis
                    .getVoices();
            };
    }

    /*
     * Details
     */

    function getDetailsItems() {
        return document.querySelectorAll(
            ".detail-item, .spec-item"
        );
    }

    function createDetailsHtml() {
        const items =
            getDetailsItems();

        let html = `
            <div class="details-grid">
        `;

        items.forEach(function (item) {
            const label =
                item.querySelector(
                    "small, .detail-label, .detail-name"
                );

            const value =
                item.querySelector(
                    "strong, .detail-value, .detail-content"
                );

            if (!label || !value) {
                return;
            }

            const labelText =
                label.textContent.trim();

            const valueText =
                value.textContent.trim();

            if (!labelText && !valueText) {
                return;
            }

            html += `
                <div class="detail">
                    <strong>
                        ${escapeHtml(labelText)}
                    </strong>
                    ${escapeHtml(valueText)}
                </div>
            `;
        });

        html += `
            </div>
        `;

        return html;
    }

    /*
     * PDF / Print
     */

    const pdfButton =
        document.getElementById(
            "downloadPdf"
        );

    if (pdfButton) {
        pdfButton.addEventListener(
            "click",
            function (event) {
                event.preventDefault();
                createPrintableDocument();
            }
        );
    }

    function createPrintableDocument() {
        const details =
            document.querySelector(
                ".bike-details-card"
            );

        const response =
            document.querySelector(
                ".bike-ai-card, .response-container"
            );

        if (!details && !response) {
            return;
        }

        const printWindow =
            window.open(
                "",
                "_blank",
                "width=900,height=700"
            );

        if (!printWindow) {
            alert(
                "Please allow pop-ups to generate the PDF."
            );
            return;
        }

        const responseText =
            responseElement
                ? responseElement.textContent.trim()
                : "";

        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>
                    Moto Genie - Bike Specification
                </title>

                <style>
                    * {
                        box-sizing: border-box;
                    }

                    body {
                        margin: 0;
                        padding: 40px;
                        font-family:
                            Arial,
                            sans-serif;
                        color: #111827;
                        background: #ffffff;
                    }

                    .document-header {
                        margin-bottom: 30px;
                        padding-bottom: 20px;
                        border-bottom:
                            2px solid #58abd4;
                    }

                    .document-header h1 {
                        margin: 0 0 8px;
                        font-size: 26px;
                    }

                    .document-header p {
                        margin: 0;
                        color: #64748b;
                    }

                    .section {
                        margin-bottom: 30px;
                    }

                    .section-title {
                        margin-bottom: 15px;
                        font-size: 20px;
                        font-weight: 700;
                    }

                    .details {
                        padding: 20px;
                        border:
                            1px solid #dbe3ea;
                        border-radius: 12px;
                    }

                    .details-grid {
                        display: grid;
                        grid-template-columns:
                            1fr 1fr;
                        gap: 15px;
                    }

                    .detail {
                        padding: 12px;
                        background: #f7fafc;
                        border-radius: 8px;
                    }

                    .detail strong {
                        display: block;
                        margin-bottom: 5px;
                        font-size: 11px;
                        color: #64748b;
                        text-transform:
                            uppercase;
                    }

                    .response {
                        padding: 20px;
                        border:
                            1px solid #dbe3ea;
                        border-radius: 12px;
                        line-height: 1.7;
                        white-space: pre-wrap;
                    }

                    .footer {
                        margin-top: 35px;
                        padding-top: 15px;
                        border-top:
                            1px solid #dbe3ea;
                        font-size: 12px;
                        color: #64748b;
                    }

                    @media print {
                        body {
                            padding: 20px;
                        }
                    }
                </style>
            </head>

            <body>
                <div class="document-header">
                    <h1>
                        Moto Genie
                    </h1>

                    <p>
                        Bike Specification Report
                    </p>
                </div>

                <div class="section">
                    <div class="section-title">
                        Bike Specifications
                    </div>

                    <div class="details">
                        ${createDetailsHtml()}
                    </div>
                </div>

                <div class="section">
                    <div class="section-title">
                        AI Analysis
                    </div>

                    <div class="response">
                        ${escapeHtml(responseText)}
                    </div>
                </div>

                <div class="footer">
                    Generated by Moto Genie · 2026
                </div>
            </body>
            </html>
        `);

        printWindow.document.close();

        setTimeout(function () {
            printWindow.focus();
            printWindow.print();
        }, 300);
    }

    /*
     * DOC download
     */

    const docButton =
        document.getElementById(
            "downloadDoc"
        );

    if (docButton) {
        docButton.addEventListener(
            "click",
            function (event) {
                event.preventDefault();
                downloadDoc();
            }
        );
    }

    function downloadDoc() {
        const details =
            document.querySelector(
                ".bike-details-card"
            );

        if (
            !details &&
            !responseElement
        ) {
            return;
        }

        const bikeTitle =
            document.querySelector(
                ".results-heading h2, .bike-details-header h2, .bike-details-header h3"
            );

        const title =
            bikeTitle
                ? bikeTitle.textContent.trim()
                : "Bike Specification";

        const responseText =
            responseElement
                ? responseElement.textContent.trim()
                : "";

        const docContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">

                <title>
                    Moto Genie - ${escapeHtml(title)}
                </title>

                <style>
                    body {
                        font-family:
                            Arial,
                            sans-serif;
                        color: #111827;
                        line-height: 1.6;
                        padding: 30px;
                    }

                    h1 {
                        margin-bottom: 5px;
                    }

                    h2 {
                        margin-bottom: 25px;
                    }

                    h4 {
                        margin-top: 25px;
                    }

                    .details-grid {
                        display: grid;
                        grid-template-columns:
                            1fr 1fr;
                        gap: 12px;
                    }

                    .detail {
                        padding: 10px;
                        border:
                            1px solid #dbe3ea;
                    }

                    .detail strong {
                        display: block;
                        margin-bottom: 5px;
                    }
                </style>
            </head>

            <body>
                <h1>
                    Moto Genie
                </h1>

                <h2>
                    Bike Specification Report
                </h2>

                <h3>
                    ${escapeHtml(title)}
                </h3>

                <h4>
                    Bike Specifications
                </h4>

                ${createDetailsHtml()}

                <h4>
                    AI Analysis
                </h4>

                <p style="white-space: pre-wrap;">
                    ${escapeHtml(responseText)}
                </p>

                <hr>

                <p>
                    Generated by Moto Genie
                </p>
            </body>
            </html>
        `;

        const blob =
            new Blob(
                [docContent],
                {
                    type:
                        "application/msword"
                }
            );

        const url =
            URL.createObjectURL(blob);

        const link =
            document.createElement("a");

        link.href = url;

        link.download =
            "moto-genie-bike-specification.doc";

        document.body.appendChild(link);

        link.click();

        document.body.removeChild(link);

        setTimeout(function () {
            URL.revokeObjectURL(url);
        }, 1000);
    }

    /*
     * Modal/result detection after browser navigation.
     */

    function refreshResultState() {
        const resultSection =
            document.querySelector(
                ".bike-details-section"
            );

        const aiSection =
            document.querySelector(
                ".ai-response-section"
            );

        if (
            resultSection ||
            aiSection
        ) {
            setLoadingState(false);
        }
    }

    refreshResultState();

    /*
     * Initial company → model state
     */

    if (
        companyInput &&
        companyInput.value.trim()
    ) {
        updateModels();
    }

    /*
     * Stop speech when leaving the page.
     */

    window.addEventListener(
        "beforeunload",
        function () {
            if (speechSupported) {
                window.speechSynthesis.cancel();
            }
        }
    );
});