/**
 * app.js - Main renderer process: wires up window controls,
 * toolbar toggling, lock mode, and keyboard shortcuts
 */

(function () {
  // ---- Initialize modules ----
  Controls.init();
  Editor.init();

  // ---- State ----
  let toolbarVisible = true;
  let isLocked = false;
  let alwaysOnTop = true;

  // ---- Element references ----
  const toolbar = document.getElementById('toolbar');
  const hoverZone = document.getElementById('toolbar-hover-zone');
  const btnToggleToolbar = document.getElementById('btn-toggle-toolbar');
  const btnLock = document.getElementById('btn-lock');
  const iconLocked = document.getElementById('icon-locked');
  const iconUnlocked = document.getElementById('icon-unlocked');
  const btnPin = document.getElementById('btn-pin');
  const btnMinimize = document.getElementById('btn-minimize');
  const btnClose = document.getElementById('btn-close');
  const editor = Editor.getEditorElement();

  // ---- Lock indicator ----
  const lockIndicator = document.createElement('div');
  lockIndicator.id = 'lock-indicator';
  lockIndicator.textContent = 'LOCKED - Click-through mode (Ctrl+Shift+L to unlock)';
  document.body.appendChild(lockIndicator);

  // ---- Window Controls ----

  btnMinimize.addEventListener('click', () => {
    window.electronAPI.minimize();
  });

  btnClose.addEventListener('click', () => {
    Editor.saveContent();
    window.electronAPI.close();
  });

  // ---- Always on Top ----

  btnPin.addEventListener('click', toggleAlwaysOnTop);

  function toggleAlwaysOnTop() {
    alwaysOnTop = !alwaysOnTop;
    window.electronAPI.setAlwaysOnTop(alwaysOnTop);
    btnPin.classList.toggle('active', alwaysOnTop);
  }

  // ---- Toolbar Toggle ----

  btnToggleToolbar.addEventListener('click', toggleToolbar);

  function toggleToolbar() {
    toolbarVisible = !toolbarVisible;
    toolbar.classList.toggle('hidden', !toolbarVisible);
    hoverZone.classList.toggle('active', !toolbarVisible);
    btnToggleToolbar.classList.toggle('active', toolbarVisible);
  }

  // Hover zone reveals toolbar temporarily
  let hoverTimeout;
  hoverZone.addEventListener('mouseenter', () => {
    if (!toolbarVisible) {
      toolbar.classList.remove('hidden');
      // toolbar stays as long as mouse is over it
    }
  });

  toolbar.addEventListener('mouseleave', (e) => {
    if (!toolbarVisible) {
      // Small delay before hiding again
      hoverTimeout = setTimeout(() => {
        toolbar.classList.add('hidden');
      }, 600);
    }
  });

  toolbar.addEventListener('mouseenter', () => {
    clearTimeout(hoverTimeout);
  });

  // ---- Lock Mode (Click-Through) ----

  btnLock.addEventListener('click', toggleLock);

  function toggleLock() {
    isLocked = !isLocked;

    if (isLocked) {
      iconLocked.style.display = 'block';
      iconUnlocked.style.display = 'none';
      btnLock.classList.add('locked');

      // Hide toolbar and titlebar buttons, show only text
      if (toolbarVisible) {
        toggleToolbar();
      }

      // Enable click-through
      window.electronAPI.setIgnoreMouseEvents(true);

      // Show lock indicator briefly
      lockIndicator.classList.add('show');
      setTimeout(() => lockIndicator.classList.remove('show'), 2000);
    } else {
      iconLocked.style.display = 'none';
      iconUnlocked.style.display = 'block';
      btnLock.classList.remove('locked');

      // Disable click-through
      window.electronAPI.setIgnoreMouseEvents(false);
    }
  }

  // ---- Keyboard Shortcuts ----

  document.addEventListener('keydown', (e) => {
    // Ctrl+Shift+H - toggle toolbar
    if (e.ctrlKey && e.shiftKey && e.key === 'H') {
      e.preventDefault();
      toggleToolbar();
      return;
    }

    // Ctrl+Shift+L - toggle lock/click-through
    if (e.ctrlKey && e.shiftKey && e.key === 'L') {
      e.preventDefault();
      toggleLock();
      return;
    }

    // Ctrl+Shift+T - toggle always on top
    if (e.ctrlKey && e.shiftKey && e.key === 'T') {
      e.preventDefault();
      toggleAlwaysOnTop();
      return;
    }

    // F5 - toggle auto-scroll
    if (e.key === 'F5') {
      e.preventDefault();
      Controls.toggleScroll();
      return;
    }

    // Space - toggle scroll ONLY when editor is not focused
    if (e.key === ' ' && document.activeElement !== editor) {
      e.preventDefault();
      Controls.toggleScroll();
      return;
    }

    // Escape should NOT close the app - do nothing
    if (e.key === 'Escape') {
      e.preventDefault();
      // If scrolling, stop scrolling instead
      if (Controls.getIsScrolling()) {
        Controls.toggleScroll();
      }
      return;
    }
  });

  // ---- Mac Cmd support (map Cmd to same as Ctrl) ----

  document.addEventListener('keydown', (e) => {
    if (!e.metaKey) return;

    if (e.shiftKey && e.key === 'H') {
      e.preventDefault();
      toggleToolbar();
    } else if (e.shiftKey && e.key === 'L') {
      e.preventDefault();
      toggleLock();
    } else if (e.shiftKey && e.key === 'T') {
      e.preventDefault();
      toggleAlwaysOnTop();
    }
  });

  // ---- Prevent default drag behavior ----
  document.addEventListener('dragover', (e) => e.preventDefault());
  document.addEventListener('drop', (e) => e.preventDefault());

})();
