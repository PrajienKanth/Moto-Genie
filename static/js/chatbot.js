document.addEventListener('DOMContentLoaded', () => {
    const chatToggleButton = document.getElementById('chat-toggle-button');
    const chatWidget = document.getElementById('chat-widget');
    const chatCloseButton = document.getElementById('chat-close-button');
    const chatMessages = document.getElementById('chat-messages');
    const chatInput = document.getElementById('chat-input');
    const chatSendButton = document.getElementById('chat-send-button');
    const micButton = document.getElementById('mic-button');

    // Toggle chat widget
    chatToggleButton.addEventListener('click', () => {
        chatWidget.classList.toggle('open');
        if (chatWidget.classList.contains('open')) {
            chatInput.focus();
        }
    });

    // Close chat widget
    chatCloseButton.addEventListener('click', () => {
        chatWidget.classList.remove('open');
    });

    // Send message to backend
    const sendMessage = async () => {
        const messageText = chatInput.value.trim();
        if (!messageText) return;

        appendMessage(messageText, 'user');
        chatInput.value = '';
        showLoadingIndicator();

        const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');

        try {
            const response = await fetch('/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': csrfToken || ''
                },
                body: JSON.stringify({ message: messageText })
            });

            removeLoadingIndicator();

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            const data = await response.json();

            if (data.response) {
                appendMessage(data.response, 'bot');
            } else {
                appendMessage("Sorry, I didn't get that. Please try again.", 'bot');
            }

        } catch (error) {
            console.error('Error:', error);
            removeLoadingIndicator();
            appendMessage("Sorry, something went wrong. Please try again.", 'bot');
        }
    };

    // Append message to chat
    const appendMessage = (text, sender) => {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message', `${sender}-message`);

        if (sender === 'bot') {
            let i = 0;
            const typingSpeed = 30;
            chatMessages.appendChild(messageDiv);

            const typeChar = () => {
                if (i < text.length) {
                    messageDiv.textContent += text.charAt(i);
                    i++;
                    chatMessages.scrollTop = chatMessages.scrollHeight;
                    setTimeout(typeChar, typingSpeed);
                }
            };
            typeChar();
        } else {
            messageDiv.textContent = text;
            chatMessages.appendChild(messageDiv);
        }

        chatMessages.scrollTop = chatMessages.scrollHeight;
    };

    // Loading indicator
    const showLoadingIndicator = () => {
        removeLoadingIndicator();
        const loadingDiv = document.createElement('div');
        loadingDiv.classList.add('message', 'bot-message', 'loading-indicator');
        loadingDiv.innerHTML = '<span>.</span><span>.</span><span>.</span>';
        loadingDiv.id = 'loading-indicator';
        chatMessages.appendChild(loadingDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    };

    const removeLoadingIndicator = () => {
        const indicator = document.getElementById('loading-indicator');
        if (indicator) indicator.remove();
    };

    // Event: Click Send Button
    chatSendButton.addEventListener('click', sendMessage);

    // Event: Press Enter
    chatInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            sendMessage();
        }
    });

    // 🎤 Speech-to-Text
    if ('webkitSpeechRecognition' in window) {
        const recognition = new webkitSpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';

        micButton.addEventListener('click', () => {
            recognition.start();
            micButton.classList.add('listening');
        });

        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            chatInput.value = transcript;
            micButton.classList.remove('listening');
        };

        recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            micButton.classList.remove('listening');
        };

        recognition.onend = () => {
            micButton.classList.remove('listening');
        };
    } else {
        micButton.style.display = 'none';
        console.warn("Speech recognition not supported.");
    }
});
