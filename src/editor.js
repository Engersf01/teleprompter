/**
 * editor.js - Rich text editor logic using execCommand on contentEditable div
 */

const Editor = (() => {
  let editorEl;
  let fontSizeSlider;
  let fontSizeVal;
  let textColorInput;
  let autosaveTimer;

  const AUTOSAVE_KEY = 'teleprompter_content';
  const AUTOSAVE_INTERVAL = 2000;

  function init() {
    editorEl = document.getElementById('editor');
    fontSizeSlider = document.getElementById('font-size');
    fontSizeVal = document.getElementById('font-size-val');
    textColorInput = document.getElementById('text-color');

    setupFormattingButtons();
    setupFontSize();
    setupTextColor();
    loadContent();
    startAutosave();
  }

  // ---- Formatting Commands ----

  function setupFormattingButtons() {
    document.querySelectorAll('.tool-btn[data-cmd]').forEach(btn => {
      btn.addEventListener('mousedown', (e) => {
        e.preventDefault(); // prevent losing editor focus
      });
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const cmd = btn.dataset.cmd;
        execFormatCommand(cmd);
        editorEl.focus();
      });
    });
  }

  function execFormatCommand(cmd) {
    if (cmd === 'hiliteColor') {
      // Toggle highlight: check if already highlighted
      document.execCommand('hiliteColor', false, '#ffff00');
    } else {
      document.execCommand(cmd, false, null);
    }
  }

  // ---- Font Size ----

  function setupFontSize() {
    const updateSize = () => {
      const size = fontSizeSlider.value;
      fontSizeVal.textContent = size + 'px';
      editorEl.style.fontSize = size + 'px';
      saveSettings();
    };

    fontSizeSlider.addEventListener('input', updateSize);

    // Load saved font size
    const saved = localStorage.getItem('teleprompter_fontSize');
    if (saved) {
      fontSizeSlider.value = saved;
      updateSize();
    }
  }

  // ---- Text Color ----

  function setupTextColor() {
    textColorInput.addEventListener('input', () => {
      editorEl.style.color = textColorInput.value;
      saveSettings();
    });

    // Also allow coloring selected text
    textColorInput.addEventListener('change', () => {
      const sel = window.getSelection();
      if (sel && sel.toString().length > 0) {
        document.execCommand('foreColor', false, textColorInput.value);
      }
    });

    // Load saved text color
    const saved = localStorage.getItem('teleprompter_textColor');
    if (saved) {
      textColorInput.value = saved;
      editorEl.style.color = saved;
    }
  }

  // ---- Content Persistence ----

  function loadContent() {
    const saved = localStorage.getItem(AUTOSAVE_KEY);
    if (saved) {
      editorEl.innerHTML = saved;
    }
  }

  function saveContent() {
    localStorage.setItem(AUTOSAVE_KEY, editorEl.innerHTML);
  }

  function startAutosave() {
    // Save on input
    editorEl.addEventListener('input', () => {
      clearTimeout(autosaveTimer);
      autosaveTimer = setTimeout(saveContent, AUTOSAVE_INTERVAL);
    });

    // Also save periodically
    setInterval(saveContent, 10000);

    // Save before unload
    window.addEventListener('beforeunload', saveContent);
  }

  function saveSettings() {
    localStorage.setItem('teleprompter_fontSize', fontSizeSlider.value);
    localStorage.setItem('teleprompter_textColor', textColorInput.value);
  }

  // ---- Public API ----

  function getEditorElement() {
    return editorEl;
  }

  function getContainerElement() {
    return document.getElementById('editor-container');
  }

  function clear() {
    editorEl.innerHTML = '<p><br></p>';
    saveContent();
  }

  return {
    init,
    getEditorElement,
    getContainerElement,
    saveContent,
    clear
  };
})();
