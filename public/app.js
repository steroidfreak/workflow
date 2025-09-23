const capabilityContainer = document.getElementById('capability-cards');
const updatesContainer = document.getElementById('update-feed');
const feedbackEl = document.querySelector('.form-feedback');
const trialForm = document.getElementById('trial-form');
const yearEl = document.getElementById('year');

async function loadData(endpoint) {
  const response = await fetch(endpoint);
  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }
  return response.json();
}

function renderCapabilityCard({ title, description }) {
  const item = document.createElement('article');
  item.className = 'card';
  item.innerHTML = `
    <h3>${title}</h3>
    <p>${description}</p>
    <span class="card-footer">Prebuilt playbooks · Configurable SLAs</span>
  `;
  return item;
}

function renderUpdate({ title, date, summary }) {
  const li = document.createElement('li');
  li.className = 'update-card';
  li.innerHTML = `
    <div class="update-meta">${new Date(date).toLocaleDateString('en-SG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })}</div>
    <h3>${title}</h3>
    <p>${summary}</p>
  `;
  return li;
}

async function hydrateContent() {
  try {
    const [capabilities, updates] = await Promise.all([
      loadData('/api/capabilities'),
      loadData('/api/updates')
    ]);

    capabilities.forEach((capability) => {
      capabilityContainer.appendChild(renderCapabilityCard(capability));
    });

    updates.forEach((update) => {
      updatesContainer.appendChild(renderUpdate(update));
    });
  } catch (error) {
    console.error('Failed to hydrate content', error);
    capabilityContainer.innerHTML = '<p class="error">Unable to load capabilities right now. Please refresh.</p>';
    updatesContainer.innerHTML = '<li class="update-card error">Updates are temporarily unavailable.</li>';
  }
}

function handleFormSubmit(event) {
  event.preventDefault();
  feedbackEl.textContent = 'Submitting...';
  feedbackEl.style.color = 'rgba(11, 31, 51, 0.6)';

  const formData = new FormData(trialForm);
  const payload = Object.fromEntries(formData.entries());

  setTimeout(() => {
    console.log('Trial request payload', payload);
    feedbackEl.textContent = 'We have received your request. The Workflow SG team will reach out within one business day!';
    feedbackEl.style.color = '#0b7c42';
    trialForm.reset();
  }, 650);
}

hydrateContent();
trialForm.addEventListener('submit', handleFormSubmit);
yearEl.textContent = new Date().getFullYear();

setupChatWidget();



function setupChatWidget() {
  const chatLauncher = document.getElementById('chat-launcher');
  const chatPanel = document.getElementById('chat-panel');
  const chatClose = document.getElementById('chat-close');
  const chatForm = document.getElementById('chat-form');
  const chatInput = document.getElementById('chat-input');
  const chatMessages = document.getElementById('chat-messages');
  const chatStatus = document.getElementById('chat-status');

  if (!chatLauncher || !chatPanel || !chatClose || !chatForm || !chatInput || !chatMessages || !chatStatus) {
    return;
  }

  const sendButton = chatForm.querySelector('button[type="submit"]');
  if (!sendButton) {
    return;
  }

  const welcomeMessage = 'Hi there! I am the Workflow SG assistant. Ask about automation workflows, compliance guardrails, or onboarding support.';
  let chatHistory = [
    { role: 'assistant', content: welcomeMessage }
  ];
  let isOpen = false;
  let isSending = false;

  const appendChatMessage = (role, content) => {
    const bubble = document.createElement('div');
    bubble.className = `chat-message chat-message--${role}`;
    bubble.textContent = content;
    chatMessages.appendChild(bubble);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  };

  const setStatus = (message) => {
    chatStatus.textContent = message;
  };

  appendChatMessage('assistant', welcomeMessage);
  setStatus('Assistant online');

  const toggleChat = (open) => {
    if (open === isOpen) {
      return;
    }

    isOpen = open;
    chatPanel.hidden = !open;
    chatLauncher.setAttribute('aria-expanded', open ? 'true' : 'false');

    if (open) {
      window.requestAnimationFrame(() => {
        chatInput.focus();
      });
    } else {
      chatLauncher.focus();
    }
  };

  chatLauncher.addEventListener('click', () => {
    toggleChat(!isOpen);
  });

  chatClose.addEventListener('click', () => {
    toggleChat(false);
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && isOpen) {
      toggleChat(false);
    }
  });

  chatForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    if (isSending) {
      return;
    }

    const message = chatInput.value.trim();
    if (!message) {
      chatInput.focus();
      return;
    }

    appendChatMessage('user', message);
    chatInput.value = '';
    isSending = true;
    setStatus('Assistant is thinking...');
    chatInput.disabled = true;
    sendButton.disabled = true;

    const payload = {
      message,
      history: chatHistory.slice(-6)
    };

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        const errorMessage = typeof data.error === 'string' ? data.error : `Request failed: ${response.status}`;
        throw new Error(errorMessage);
      }

      const data = await response.json();
      const reply = typeof data.reply === 'string' ? data.reply.trim() : '';

      if (!reply) {
        throw new Error('Assistant response missing.');
      }

      appendChatMessage('assistant', reply);
      chatHistory = [
        ...chatHistory.slice(-6),
        { role: 'user', content: message },
        { role: 'assistant', content: reply }
      ];
      setStatus('Assistant online');
    } catch (error) {
      console.error('Chat request failed', error);
      const fallback = typeof error?.message === 'string' && error.message.trim()
        ? error.message.trim()
        : 'I could not reach our assistant right now. Please try again shortly or contact support@workflow.sg.';
      appendChatMessage('assistant', fallback);
      setStatus('Assistant unavailable');
    } finally {
      isSending = false;
      chatInput.disabled = false;
      sendButton.disabled = false;
      chatInput.focus();
    }
  });
}
