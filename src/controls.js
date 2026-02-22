/**
 * controls.js - Background opacity, color presets, and auto-scroll
 */

const Controls = (() => {
  // State
  let bgColor = '#000000';
  let bgOpacity = 30;
  let isScrolling = false;
  let scrollSpeed = 3;
  let scrollAnimId = null;

  // Elements
  let overlay;
  let opacitySlider;
  let opacityVal;
  let speedSlider;
  let speedVal;
  let scrollToggleBtn;
  let iconPlay;
  let iconPause;
  let scrollIndicator;

  function init() {
    overlay = document.getElementById('bg-overlay');
    opacitySlider = document.getElementById('bg-opacity');
    opacityVal = document.getElementById('bg-opacity-val');
    speedSlider = document.getElementById('scroll-speed');
    speedVal = document.getElementById('scroll-speed-val');
    scrollToggleBtn = document.getElementById('btn-scroll-toggle');
    iconPlay = document.getElementById('icon-play');
    iconPause = document.getElementById('icon-pause');

    // Create scroll indicator
    scrollIndicator = document.createElement('div');
    scrollIndicator.id = 'scroll-indicator';
    scrollIndicator.textContent = 'AUTO-SCROLL';
    document.body.appendChild(scrollIndicator);

    setupOpacity();
    setupColorPresets();
    setupAutoScroll();
    loadSettings();
  }

  // ---- Background Opacity ----

  function setupOpacity() {
    opacitySlider.addEventListener('input', () => {
      bgOpacity = parseInt(opacitySlider.value);
      opacityVal.textContent = bgOpacity + '%';
      updateOverlay();
      saveSettings();
    });
  }

  function updateOverlay() {
    const alpha = bgOpacity / 100;
    const r = parseInt(bgColor.slice(1, 3), 16);
    const g = parseInt(bgColor.slice(3, 5), 16);
    const b = parseInt(bgColor.slice(5, 7), 16);
    overlay.style.background = `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  // ---- Color Presets ----

  function setupColorPresets() {
    const presets = document.querySelectorAll('.color-preset');
    const customColor = document.getElementById('custom-bg-color');

    presets.forEach(btn => {
      btn.addEventListener('click', () => {
        presets.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        bgColor = btn.dataset.color;
        customColor.value = bgColor;
        updateOverlay();
        saveSettings();
      });
    });

    customColor.addEventListener('input', () => {
      presets.forEach(b => b.classList.remove('active'));
      bgColor = customColor.value;
      updateOverlay();
      saveSettings();
    });
  }

  // ---- Auto-Scroll ----

  function setupAutoScroll() {
    scrollToggleBtn.addEventListener('click', toggleScroll);

    speedSlider.addEventListener('input', () => {
      scrollSpeed = parseInt(speedSlider.value);
      speedVal.textContent = scrollSpeed;
      saveSettings();
    });

    document.getElementById('btn-scroll-reset').addEventListener('click', () => {
      const container = Editor.getContainerElement();
      container.scrollTop = 0;
    });
  }

  function toggleScroll() {
    isScrolling = !isScrolling;

    if (isScrolling) {
      iconPlay.style.display = 'none';
      iconPause.style.display = 'block';
      scrollToggleBtn.classList.add('active');
      scrollIndicator.classList.add('show');
      startScrollLoop();
    } else {
      iconPlay.style.display = 'block';
      iconPause.style.display = 'none';
      scrollToggleBtn.classList.remove('active');
      scrollIndicator.classList.remove('show');
      stopScrollLoop();
    }
  }

  function startScrollLoop() {
    const container = Editor.getContainerElement();

    function step() {
      if (!isScrolling) return;
      // Speed: 0.5px to 5px per frame based on slider 1-10
      const px = 0.3 + (scrollSpeed - 1) * 0.5;
      container.scrollTop += px;

      // Stop if at the bottom
      if (container.scrollTop >= container.scrollHeight - container.clientHeight) {
        toggleScroll();
        return;
      }

      scrollAnimId = requestAnimationFrame(step);
    }

    scrollAnimId = requestAnimationFrame(step);
  }

  function stopScrollLoop() {
    if (scrollAnimId) {
      cancelAnimationFrame(scrollAnimId);
      scrollAnimId = null;
    }
  }

  function getIsScrolling() {
    return isScrolling;
  }

  // ---- Persistence ----

  function saveSettings() {
    const settings = {
      bgColor,
      bgOpacity,
      scrollSpeed
    };
    localStorage.setItem('teleprompter_controls', JSON.stringify(settings));
  }

  function loadSettings() {
    try {
      const saved = localStorage.getItem('teleprompter_controls');
      if (saved) {
        const s = JSON.parse(saved);
        if (s.bgColor) {
          bgColor = s.bgColor;
          document.getElementById('custom-bg-color').value = bgColor;
          // Activate matching preset
          document.querySelectorAll('.color-preset').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.color === bgColor);
          });
        }
        if (s.bgOpacity != null) {
          bgOpacity = s.bgOpacity;
          opacitySlider.value = bgOpacity;
          opacityVal.textContent = bgOpacity + '%';
        }
        if (s.scrollSpeed != null) {
          scrollSpeed = s.scrollSpeed;
          speedSlider.value = scrollSpeed;
          speedVal.textContent = scrollSpeed;
        }
      }
    } catch (e) {
      // ignore
    }
    updateOverlay();
  }

  return {
    init,
    toggleScroll,
    getIsScrolling,
    updateOverlay
  };
})();
