const iconMap = {
  github: 'github',
  twitter: 'twitter',
  instagram: 'instagram',
  youtube: 'youtube',
  twitch: 'twitch',
  link: 'link'
};

function renderBackground(backgroundMedia) {
  const container = document.getElementById('backgroundContainer');
  container.innerHTML = '';

  if (backgroundMedia?.type === 'video') {
    const video = document.createElement('video');
    video.src = backgroundMedia.url;
    video.autoplay = true;
    video.loop = true;
    video.muted = true;
    video.playsInline = true;
    container.appendChild(video);
    return;
  }

  const image = document.createElement('img');
  image.src = backgroundMedia?.url || '';
  image.alt = 'background';
  container.appendChild(image);
}

function renderSocialLinks(links = []) {
  const wrap = document.getElementById('socialLinks');
  wrap.innerHTML = '';

  links.forEach((link) => {
    const anchor = document.createElement('a');
    anchor.className = 'social-button';
    anchor.href = link.url;
    anchor.target = '_blank';
    anchor.rel = 'noopener noreferrer';
    const iconName = iconMap[(link.icon || '').toLowerCase()] || 'link';
    anchor.innerHTML = `
      <span class="inline-flex items-center gap-2">
        <i data-lucide="${iconName}" class="w-4 h-4"></i>
        <span>${link.label || 'Link'}</span>
      </span>
      <i data-lucide="arrow-up-right" class="w-4 h-4"></i>
    `;
    wrap.appendChild(anchor);
  });

  lucide.createIcons();
}

function renderMusic(settings) {
  const wrap = document.getElementById('musicWrap');
  const player = document.getElementById('musicPlayer');
  const title = document.getElementById('musicTitle');
  if (!settings?.toggles?.musicPlayer || !settings?.music?.url) {
    wrap.classList.add('hidden');
    return;
  }

  wrap.classList.remove('hidden');
  player.src = settings.music.url;
  title.textContent = settings.music.title || 'now playing';
}

function setupClickOverlay(toggles) {
  const overlay = document.getElementById('clickOverlay');
  const button = document.getElementById('enterBtn');
  if (!toggles?.clickToEnter) {
    overlay.classList.add('hidden');
    return;
  }

  overlay.classList.remove('hidden');
  button.addEventListener('click', () => {
    overlay.classList.add('hidden');
  });
}

async function init() {
  const response = await fetch('/api/public-settings');
  const settings = await response.json();

  document.getElementById('avatar').src = settings.avatarUrl;
  document.getElementById('name').textContent = settings.profile?.name || '';
  document.getElementById('bio').textContent = settings.profile?.bio || '';
  document.getElementById('status').textContent = settings.profile?.status || '';

  const verified = document.getElementById('verified');
  if (settings.verified) {
    verified.classList.remove('hidden');
  } else {
    verified.classList.add('hidden');
  }

  renderBackground(settings.backgroundMedia);
  renderSocialLinks(settings.socialLinks);
  renderMusic(settings);
  setupClickOverlay(settings.toggles);
}

init();
