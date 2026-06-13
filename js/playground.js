/* ===================================
   RunJS v2.1 - Playground Engine
   Monaco • Console • Save/Share
   =================================== */

const Playground = {
  editor: null,
  defaultCode: `// Welcome to RunJS Playground
// Write JavaScript and hit Cmd+Enter or click Run

function greet(name) {
  return \`Hello, \${name}!\`;
}

console.log(greet('World'));

const nums = [1, 2, 3, 4, 5];
const doubled = nums.map(n => n * 2);
console.log('Doubled:', doubled);
`,

  init() {
    this.initMonaco();
    this.bindEvents();
    this.loadSavedCode();
    console.log('Playground initialized');
  },

  // === 1. Monaco Setup ===
  initMonaco() {
    require.config({ paths: { vs: 'https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/min/vs' }});
    
    require(['vs/editor/editor.main'], () => {
      const container = document.getElementById('playgroundEditor');
      if (!container) return;

      this.editor = monaco.editor.create(container, {
        value: this.defaultCode,
        language: 'javascript',
        theme: RunJS.state.theme === 'dark'? 'vs-dark' : 'vs',
        fontSize: RunJS.state.settings?.fontSize || 14,
        fontFamily: 'Fira Code, monospace',
        minimap: { enabled: true },
        automaticLayout: true,
        scrollBeyondLastLine: false,
        tabSize: 2,
        wordWrap: 'on',
        lineNumbers: 'on',
        renderLineHighlight: 'all',
        suggestOnTriggerCharacters: true,
        quickSuggestions: true
      });

      // Auto-save
      this.editor.onDidChangeModelContent(
        RunJS.debounce(() => this.saveCode(), 2000)
      );

      // Shortcuts
      this.editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
        this.runCode();
      });

      this.editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
        this.saveCode();
        RunJS.toast('Code saved', 'success');
      });

      container.querySelector('.editor-loading')?.remove();
    });
  },

  // === 2. Events ===
  bindEvents() {
    document.getElementById('runBtn')?.addEventListener('click', () => this.runCode());
    document.getElementById('clearBtn')?.addEventListener('click', () => this.clearConsole());
    document.getElementById('saveBtn')?.addEventListener('click', () => {
      this.saveCode();
      RunJS.toast('Saved to browser', 'success');
    });
    document.getElementById('shareBtn')?.addEventListener('click', () => this.shareCode());
    document.getElementById('formatBtn')?.addEventListener('click', () => this.formatCode());
    document.getElementById('resetBtn')?.addEventListener('click', () => this.resetCode());

    // Theme sync
    document.addEventListener('themeChanged', () => {
      if (this.editor) {
        monaco.editor.setTheme(RunJS.state.theme === 'dark'? 'vs-dark' : 'vs');
      }
    });
  },

  // === 3. Code Execution ===
  runCode() {
    if (!this.editor) return;
    
    const code = this.editor.getValue();
    const output = document.getElementById('playgroundOutput');
    output.innerHTML = '';

    const startTime = performance.now();

    try {
      // Sandboxed execution
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      document.body.appendChild(iframe);
      
      iframe.contentWindow.console = {
        log: (...args) => this.logToOutput(args.join(' '), 'log'),
        error: (...args) => this.logToOutput(args.join(' '), 'error'),
        warn: (...args) => this.logToOutput(args.join(' '), 'warn'),
        info: (...args) => this.logToOutput(args.join(' '), 'info'),
        table: (data) => this.logToOutput(JSON.stringify(data, null, 2), 'log'),
        clear: () => this.clearConsole()
      };

      const result = iframe.contentWindow.eval(code);
      
      if (result!== undefined) {
        this.logToOutput(`→ ${this.stringify(result)}`, 'return');
      }

      const endTime = performance.now();
      this.logToOutput(`✓ Executed in ${(endTime - startTime).toFixed(2)}ms`, 'success');

      document.body.removeChild(iframe);

    } catch (error) {
      this.logToOutput(`${error.name}: ${error.message}`, 'error');
      if (error.stack) {
        const line = error.stack.split('\n')[1];
        if (line) this.logToOutput(line.trim(), 'error');
      }
    }
  },

  logToOutput(message, type = 'log') {
    const output = document.getElementById('playgroundOutput');
    const line = document.createElement('div');
    line.className = `console-line ${type}`;
    
    const timestamp = new Date().toLocaleTimeString('en-US', { 
      hour12: false, 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit' 
    });
    
    line.innerHTML = `<span class="console-time">${timestamp}</span> <span class="console-msg">${this.escapeHtml(message)}</span>`;
    output.appendChild(line);
    output.scrollTop = output.scrollHeight;
  },

  clearConsole() {
    document.getElementById('playgroundOutput').innerHTML = '<div class="console-empty">Console cleared</div>';
  },

  // === 4. Save/Load/Share ===
  saveCode() {
    if (!this.editor) return;
    const code = this.editor.getValue();
    localStorage.setItem('runjs_playground_code', code);
    localStorage.setItem('runjs_playground_saved_at', Date.now());
  },

  loadSavedCode() {
    const saved = localStorage.getItem('runjs_playground_code');
    const savedAt = localStorage.getItem('runjs_playground_saved_at');
    
    if (saved && this.editor) {
      this.editor.setValue(saved);
      if (savedAt) {
        const date = new Date(parseInt(savedAt));
        RunJS.toast(`Loaded code from ${date.toLocaleString()}`, 'success');
      }
    }
  },

  resetCode() {
    if (!this.editor ||!confirm('Reset to default code? Your current code will be lost.')) return;
    this.editor.setValue(this.defaultCode);
    this.clearConsole();
    localStorage.removeItem('runjs_playground_code');
    RunJS.toast('Reset to default', 'success');
  },

  formatCode() {
    if (!this.editor) return;
    this.editor.getAction('editor.action.formatDocument').run();
    RunJS.toast('Code formatted', 'success');
  },

  shareCode() {
    if (!this.editor) return;
    const code = this.editor.getValue();
    
    // Encode code to base64 URL
    const encoded = btoa(encodeURIComponent(code));
    const url = `${window.location.origin}${window.location.pathname}?code=${encoded}`;
    
    navigator.clipboard.writeText(url).then(() => {
      RunJS.toast('Share link copied to clipboard', 'success');
    }).catch(() => {
      // Fallback: show prompt
      prompt('Copy this share link:', url);
    });
  },

  // Load code from URL
  loadFromURL() {
    const params = new URLSearchParams(window.location.search);
    const encoded = params.get('code');
    if (encoded && this.editor) {
      try {
        const code = decodeURIComponent(atob(encoded));
        this.editor.setValue(code);
        RunJS.toast('Loaded shared code', 'success');
        // Clean URL
        window.history.replaceState({}, '', window.location.pathname);
      } catch (e) {
        RunJS.toast('Invalid share link', 'error');
      }
    }
  },

  // === 5. Utils ===
  stringify(val) {
    if (val === null) return 'null';
    if (val === undefined) return 'undefined';
    if (typeof val === 'function') return '[Function]';
    if (typeof val === 'object') {
      try {
        return JSON.stringify(val, null, 2);
      } catch {
        return '[Circular]';
      }
    }
    return String(val);
  },

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
};

// Auto-init
if (window.RunJS) {
  Playground.init();
  // Check for shared code after Monaco loads
  setTimeout(() => Playground.loadFromURL(), 1000);
} else {
  document.addEventListener('DOMContentLoaded', () => {
    if (window.RunJS) {
      Playground.init();
      setTimeout(() => Playground.loadFromURL(), 1000);
    }
  });
}

window.Playground = Playground;
