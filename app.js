document.addEventListener('DOMContentLoaded', () => {
    // Elements
    const baseInput = document.getElementById('base-input');
    const limitInput = document.getElementById('limit-input');
    const generateBtn = document.getElementById('generate-btn');
    const resultsSection = document.getElementById('results-section');
    const resultsContainer = document.getElementById('results-container');
    const countBadge = document.getElementById('count-badge');
    
    // Actions
    const copyAllBtn = document.getElementById('copy-all-btn');
    const copyJsonBtn = document.getElementById('copy-json-btn');
    const exportBtn = document.getElementById('export-btn');
    
    // Toggles & Options
    const searchFilter = document.getElementById('search-filter');
    const viewGridBtn = document.getElementById('view-grid-btn');
    const viewTableBtn = document.getElementById('view-table-btn');
    
    const optHomoglyph = document.getElementById('opt-homoglyph');
    const optCase = document.getElementById('opt-case');
    const optSymbols = document.getElementById('opt-symbols');
    const optZwsp = document.getElementById('opt-zwsp');
    const encodingSelect = document.getElementById('encoding-select');
    
    // Presets
    const presetAuth = document.getElementById('preset-auth');
    const presetWaf = document.getElementById('preset-waf');

    // Theme Logic
    const themeToggle = document.getElementById('theme-toggle');
    const loadTheme = () => {
        if (localStorage.getItem('unifuzzTheme') === 'light') {
            document.documentElement.setAttribute('data-theme', 'light');
            themeToggle.textContent = '🌙';
        }
    };
    themeToggle.addEventListener('click', () => {
        const isLight = document.documentElement.getAttribute('data-theme') === 'light';
        if (isLight) {
            document.documentElement.removeAttribute('data-theme');
            themeToggle.textContent = '☀️';
            localStorage.setItem('unifuzzTheme', 'dark');
        } else {
            document.documentElement.setAttribute('data-theme', 'light');
            themeToggle.textContent = '🌙';
            localStorage.setItem('unifuzzTheme', 'light');
        }
    });
    
    // State
    let currentPayloads = [];
    let displayedPayloads = [];
    let baseString = "";
    let isGridView = true;

    // Load State
    const loadState = () => {
        try {
            const state = JSON.parse(localStorage.getItem('unifuzzState') || '{}');
            if (state.limit) limitInput.value = state.limit;
            if (state.homoglyph !== undefined) optHomoglyph.checked = state.homoglyph;
            if (state.case !== undefined) optCase.checked = state.case;
            if (state.symbols !== undefined) optSymbols.checked = state.symbols;
            if (state.zwsp !== undefined) optZwsp.checked = state.zwsp;
            if (state.encoding) encodingSelect.value = state.encoding;
            if (state.baseString) baseInput.value = state.baseString;
            if (state.isGridView !== undefined) {
                 isGridView = state.isGridView;
                 updateViewToggles();
            }
        } catch (e) {}
    };

    const saveState = () => {
        localStorage.setItem('unifuzzState', JSON.stringify({
            limit: limitInput.value,
            homoglyph: optHomoglyph.checked,
            case: optCase.checked,
            symbols: optSymbols.checked,
            zwsp: optZwsp.checked,
            encoding: encodingSelect.value,
            baseString: baseInput.value,
            isGridView
        }));
    };

    // View toggles
    const updateViewToggles = () => {
        if (isGridView) {
            viewGridBtn.classList.add('active');
            viewTableBtn.classList.remove('active');
            resultsContainer.className = 'results-grid';
        } else {
            viewTableBtn.classList.add('active');
            viewGridBtn.classList.remove('active');
            resultsContainer.className = 'results-table';
        }
        if (currentPayloads.length) renderResults();
        saveState();
    };

    viewGridBtn.addEventListener('click', () => { isGridView = true; updateViewToggles(); });
    viewTableBtn.addEventListener('click', () => { isGridView = false; updateViewToggles(); });

    // Presets
    presetAuth.addEventListener('click', () => {
        optHomoglyph.checked = true;
        optCase.checked = true;
        optSymbols.checked = false;
        optZwsp.checked = false;
        limitInput.value = 100;
        generate();
    });

    presetWaf.addEventListener('click', () => {
        optHomoglyph.checked = true;
        optCase.checked = false;
        optSymbols.checked = true;
        optZwsp.checked = true;
        limitInput.value = 50; 
        generate();
    });

    // Generate Payloads
    const generate = () => {
        baseString = baseInput.value;
        const limit = parseInt(limitInput.value) || 100;
        
        if (!baseString) {
            resultsSection.classList.add('hidden');
            return;
        }

        const opts = {
            homoglyph: optHomoglyph.checked,
            case: optCase.checked,
            symbols: optSymbols.checked,
            zwsp: optZwsp.checked,
            encoding: encodingSelect.value
        };
        saveState();
        
        currentPayloads = Engine.generate(baseString, limit, opts);
        applyFilter();
        
        resultsSection.classList.remove('hidden');
    };

    searchFilter.addEventListener('input', () => {
        applyFilter();
    });

    const applyFilter = () => {
        const query = searchFilter.value.toLowerCase();
        if (!query) {
            displayedPayloads = currentPayloads;
        } else {
            displayedPayloads = currentPayloads.filter(p => p.text.toLowerCase().includes(query) || p.type.toLowerCase().includes(query));
        }
        countBadge.textContent = displayedPayloads.length;
        renderResults();
    };

    generateBtn.addEventListener('click', generate);
    baseInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') generate();
    });

    // Rendering
    const getByteSize = str => new Blob([str]).size;

    const renderResults = () => {
        resultsContainer.innerHTML = '';
        const originalByteSize = getByteSize(baseString);
        
        displayedPayloads.forEach((payloadObj, index) => {
            const card = document.createElement('div');
            
            const text = payloadObj.text; 
            const type = payloadObj.type;
            const currentByteSize = getByteSize(text);
            const byteDiff = currentByteSize - originalByteSize;
            
            let byteClass = 'neutral';
            if (byteDiff > 0) byteClass = 'positive';
            let byteStr = byteDiff > 0 ? `+${byteDiff} B` : (byteDiff < 0 ? `${byteDiff} B` : `0 B`);

            // Diff building
            let charDiffHtml = '';
            let payloadVisualHtml = '';

            const origChars = Array.from(baseString);
            const newChars = Array.from(payloadObj.rawText); 
            // note: if url encoded, char-by-char diff is too complex, just show result

            if (type === 'Original' || encodingSelect.value !== 'raw') {
                payloadVisualHtml = escapeHtml(text);
                charDiffHtml = '<span class="diff-step">Encoding/Base</span>';
            } else {
                for (let i = 0; i < Math.max(origChars.length, newChars.length); i++) {
                    let o = origChars[i] || '';
                    let n = newChars[i] || '';
                    if (o !== n) {
                        payloadVisualHtml += `<span class="mutated-char">${escapeHtml(n)}</span>`;
                        if (o && n) {
                            let hexO = o.codePointAt(0).toString(16).padStart(4, '0').toUpperCase();
                            let hexN = n.codePointAt(0).toString(16).padStart(4, '0').toUpperCase();
                            charDiffHtml += `<span class="diff-step" title="U+${hexO} to U+${hexN}"><span class="char-orig">${escapeHtml(o)}</span><span class="diff-arrow">→</span><span class="char-new">${escapeHtml(n)} <small style="opacity:0.6">[U+${hexN}]</small></span></span> `;
                        } else if (n) { // insertion (zwsp)
                            let hex = n.codePointAt(0).toString(16).padStart(4, '0').toUpperCase();
                            charDiffHtml += `<span class="diff-step"><span class="diff-arrow">+</span><span class="char-new">U+${hex}</span></span> `;
                        }
                    } else {
                        payloadVisualHtml += escapeHtml(n);
                    }
                }
            }

            if (isGridView) {
                card.className = 'payload-card';
                card.innerHTML = `
                    <span class="payload-content">${payloadVisualHtml}</span>
                    <span class="copy-indicator">Copy</span>
                    ${type !== 'Original' ? `<span class="tag-label">${type}</span>` : ''}
                `;
            } else {
                card.className = 'table-row';
                card.innerHTML = `
                    <div class="table-col col-main">${payloadVisualHtml}</div>
                    <div class="table-col col-diff">${charDiffHtml}</div>
                    <div class="table-col col-meta">
                        <span style="color:var(--primary-color)">${type}</span>
                        <span class="byte-diff ${byteClass}">${byteStr}</span>
                    </div>
                `;
            }
            
            card.addEventListener('click', () => {
                navigator.clipboard.writeText(text).then(() => {
                    if (isGridView) {
                        card.classList.add('copied');
                        const indicator = card.querySelector('.copy-indicator');
                        indicator.textContent = 'Copied!';
                        setTimeout(() => { card.classList.remove('copied'); indicator.textContent = 'Copy'; }, 2000);
                    } else {
                        card.style.borderColor = '#2a9d8f';
                        setTimeout(() => card.style.borderColor = '', 1000);
                    }
                });
            });
            
            // Limit animations so it doesn't stutter on huge sets
            if (index < 100) card.style.animationDelay = `${index * 2}ms`;
            resultsContainer.appendChild(card);
        });
    };

    // Actions
    copyAllBtn.addEventListener('click', () => {
        if (!displayedPayloads.length) return;
        const text = displayedPayloads.map(p => p.text).join('\n');
        navigator.clipboard.writeText(text).then(() => {
            const temp = copyAllBtn.textContent;
            copyAllBtn.textContent = 'Copied!';
            setTimeout(() => copyAllBtn.textContent = temp, 2000);
        });
    });

    copyJsonBtn.addEventListener('click', () => {
        if (!displayedPayloads.length) return;
        const text = JSON.stringify(displayedPayloads.map(p => p.text), null, 2);
        navigator.clipboard.writeText(text).then(() => {
            const temp = copyJsonBtn.textContent;
            copyJsonBtn.textContent = 'Copied JSON!';
            setTimeout(() => copyJsonBtn.textContent = temp, 2000);
        });
    });

    exportBtn.addEventListener('click', () => {
        if (!displayedPayloads.length) return;
        const text = displayedPayloads.map(p => p.text).join('\n');
        const blob = new Blob([text], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const safeBase = escapeHtml(baseString).replace(/[^a-zA-Z0-9]/g, '_');
        a.download = `unifuzz_${safeBase}.txt`;
        a.click();
        URL.revokeObjectURL(url);
    });

    // Utility
    function escapeHtml(unsafe) {
        return (unsafe || "").toString()
             .replace(/&/g, "&amp;")
             .replace(/</g, "&lt;")
             .replace(/>/g, "&gt;")
             .replace(/"/g, "&quot;")
             .replace(/'/g, "&#039;");
    }

    loadState();
    loadTheme();
});
