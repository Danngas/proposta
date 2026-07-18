/**
 * autocomplete.js
 * Componente de autocomplete reutilizável
 * Autor: Daniel Silva de Souza
 */

/**
 * Inicializa um campo de autocomplete.
 *
 * @param {string}   inputId   - ID do <input>
 * @param {string}   listId    - ID da <div> que recebe os itens
 * @param {Function} getItems  - Função que retorna array de { label, data }
 * @param {Function} onSelect  - Callback chamado ao selecionar um item: fn(item)
 */
function makeAutocomplete(inputId, listId, getItems, onSelect) {
  const input = document.getElementById(inputId);
  const list  = document.getElementById(listId);
  let activeIdx = -1;

  // ── Digitar
  input.addEventListener('input', () => {
    const val = input.value.trim().toLowerCase();
    const items = getItems();
    const filtered = val
      ? items.filter(i => i.label.toLowerCase().includes(val))
      : items;
    renderList(filtered.slice(0, 80));
  });

  // ── Focar (abre lista)
  input.addEventListener('focus', () => {
    const val = input.value.trim().toLowerCase();
    const items = getItems();
    const filtered = val
      ? items.filter(i => i.label.toLowerCase().includes(val))
      : items;
    renderList(filtered.slice(0, 80));
  });

  // ── Teclado
  input.addEventListener('keydown', (e) => {
    const rows = list.querySelectorAll('.autocomplete-item');
    if (e.key === 'ArrowDown') {
      activeIdx = Math.min(activeIdx + 1, rows.length - 1);
      highlight(rows); e.preventDefault();
    } else if (e.key === 'ArrowUp') {
      activeIdx = Math.max(activeIdx - 1, 0);
      highlight(rows); e.preventDefault();
    } else if (e.key === 'Enter' && activeIdx >= 0) {
      rows[activeIdx].click();
    } else if (e.key === 'Escape') {
      closeList();
    }
  });

  // ── Clicar fora
  document.addEventListener('click', (e) => {
    if (!input.contains(e.target) && !list.contains(e.target)) closeList();
  });

  // ── Helpers
  function highlight(rows) {
    rows.forEach((row, i) => row.classList.toggle('active', i === activeIdx));
    if (activeIdx >= 0) rows[activeIdx].scrollIntoView({ block: 'nearest' });
  }

  function closeList() {
    list.classList.remove('open');
    activeIdx = -1;
  }

  function renderList(items) {
    activeIdx = -1;
    list.innerHTML = '';
    if (!items.length) { closeList(); return; }

    items.forEach(item => {
      const div = document.createElement('div');
      div.className = 'autocomplete-item';
      div.textContent = item.label;
      div.addEventListener('click', () => {
        input.value = item.label;
        closeList();
        onSelect(item);
      });
      list.appendChild(div);
    });
    list.classList.add('open');
  }
}
