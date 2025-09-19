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

