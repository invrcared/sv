let settingsCache = null;

function note(message, bad = false) {
  const notice = document.getElementById('studioNotice');
  notice.textContent = message;
  notice.style.color = bad ? '#fca5a5' : '#a3e635';
}

function fillForm(settings) {
  settingsCache = settings;
  document.getElementById('profileName').value = settings.profile?.name || '';
  document.getElementById('statusLine').value = settings.profile?.status || '';
  document.getElementById('bioText').value = settings.profile?.bio || '';
  document.getElementById('avatarUrl').value = settings.avatarUrl || '';
  document.getElementById('backgroundType').value = settings.backgroundMedia?.type || 'image';
  document.getElementById('backgroundUrl').value = settings.backgroundMedia?.url || '';
  document.getElementById('verifiedToggle').checked = !!settings.verified;
  document.getElementById('musicToggle').checked = !!settings.toggles?.musicPlayer;
  document.getElementById('clickToggle').checked = !!settings.toggles?.clickToEnter;
  document.getElementById('musicTitle').value = settings.music?.title || '';
  document.getElementById('musicUrl').value = settings.music?.url || '';
  document.getElementById('socialLinks').value = JSON.stringify(settings.socialLinks || [], null, 2);
}

async function load() {
  const response = await fetch('/api/settings');
  if (!response.ok) {
    window.location.href = '/login';
    return;
  }
  const settings = await response.json();
  fillForm(settings);
}

async function saveSettings(event) {
  event.preventDefault();
  let socialLinks;

  try {
    socialLinks = JSON.parse(document.getElementById('socialLinks').value);
    if (!Array.isArray(socialLinks)) {
      throw new Error('Social links must be an array');
    }
  } catch (error) {
    note(`Invalid social JSON: ${error.message}`, true);
    return;
  }

  const payload = {
    profile: {
      name: document.getElementById('profileName').value,
      status: document.getElementById('statusLine').value,
      bio: document.getElementById('bioText').value
    },
    avatarUrl: document.getElementById('avatarUrl').value,
    verified: document.getElementById('verifiedToggle').checked,
    socialLinks,
    backgroundMedia: {
      type: document.getElementById('backgroundType').value,
      url: document.getElementById('backgroundUrl').value
    },
    toggles: {
      musicPlayer: document.getElementById('musicToggle').checked,
      clickToEnter: document.getElementById('clickToggle').checked
    },
    music: {
      title: document.getElementById('musicTitle').value,
      url: document.getElementById('musicUrl').value
    }
  };

  const response = await fetch('/api/settings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    note('Save failed.', true);
    return;
  }

  const body = await response.json();
  settingsCache = body.settings;
  note('Saved. Refresh / to see your updated profile.');
}

async function uploadBackground() {
  const fileInput = document.getElementById('backgroundFile');
  if (!fileInput.files.length) {
    note('Pick a file first.', true);
    return;
  }

  const form = new FormData();
  form.append('backgroundFile', fileInput.files[0]);

  const response = await fetch('/api/upload-background', {
    method: 'POST',
    body: form
  });

  if (!response.ok) {
    note('Upload failed.', true);
    return;
  }

  const body = await response.json();
  document.getElementById('backgroundType').value = body.backgroundMedia.type;
  document.getElementById('backgroundUrl').value = body.backgroundMedia.url;
  note('Background uploaded and linked. Save to persist with your current form values.');
}

async function logout() {
  await fetch('/api/logout', { method: 'POST' });
  window.location.href = '/login';
}

document.getElementById('settingsForm').addEventListener('submit', saveSettings);
document.getElementById('uploadBtn').addEventListener('click', uploadBackground);
document.getElementById('logoutBtn').addEventListener('click', logout);

load();
