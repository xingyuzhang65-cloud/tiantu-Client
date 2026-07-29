(() => {
  const hiddenLabels = new Set(['客户备注', '客户简称', '业务员', '跟单员']);
  const hiddenSearchLabels = new Set([...hiddenLabels, '仓租时间']);
  const renamedLabel = '海外仓备注';

  const isStorageView = () => (document.body?.innerText || '').includes('暂存已完成');

  const hideElement = (element) => {
    element.style.display = 'none';
    element.dataset.storageFieldHidden = 'true';
  };

  const restoreTransitView = () => {
    document.querySelectorAll('[data-storage-field-hidden="true"]').forEach((element) => {
      element.style.display = '';
      delete element.dataset.storageFieldHidden;
    });
  };

  const renameRemark = () => {
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach((node) => {
      if (node.nodeValue?.includes(renamedLabel)) node.nodeValue = node.nodeValue.replaceAll(renamedLabel, '备注');
    });
  };

  const hideStorageTableFields = () => {
    document.querySelectorAll('table').forEach((table) => {
      const headers = Array.from(table.querySelectorAll('thead th'));
      const indexes = headers
        .map((header, index) => (hiddenLabels.has(header.textContent.trim()) ? index : -1))
        .filter((index) => index >= 0);
      if (indexes.length === 0) return;
      table.querySelectorAll('tr').forEach((row) => {
        const cells = Array.from(row.children).filter((cell) => cell.tagName === 'TH' || cell.tagName === 'TD');
        indexes.forEach((index) => cells[index] && hideElement(cells[index]));
      });
    });
  };

  const hideStorageSearchAndDetailFields = () => {
    document.querySelectorAll('label').forEach((label) => {
      const labelText = label.querySelector('span')?.textContent?.trim() || label.textContent.trim();
      if (hiddenSearchLabels.has(labelText) && label.querySelector('input, select, textarea')) hideElement(label);
    });

    document.querySelectorAll('div').forEach((field) => {
      const label = field.firstElementChild?.textContent?.trim().replace(/：$/, '');
      const parentClass = typeof field.parentElement?.className === 'string' ? field.parentElement.className : '';
      if (hiddenLabels.has(label) && field.children.length >= 2 && parentClass.includes('grid')) hideElement(field);
    });
  };

  const ensureStorageDisplayStyle = () => {
    if (document.getElementById('storage-display-polish')) return;
    const style = document.createElement('style');
    style.id = 'storage-display-polish';
    style.textContent = `
      body[data-storage-display="true"] .overflow-x-auto { border-radius: 6px; background: #fff; }
      body[data-storage-display="true"] table thead th { white-space: nowrap; background: #f5f8fc; color: #334155; font-weight: 700; }
      body[data-storage-display="true"] table tbody td { height: 42px; white-space: nowrap; color: #475569; }
      body[data-storage-display="true"] table tbody tr:hover td { background-color: #f3f8ff; }
      body[data-storage-display="true"] table tbody td .truncate { max-width: 190px; }
      body[data-storage-display="true"] input, body[data-storage-display="true"] select { border-color: #d7e0eb; }
    `;
    document.head.append(style);
  };

  const applyRules = () => {
    if (!document.body) return;
    if (!isStorageView()) {
      restoreTransitView();
      delete document.body.dataset.storageDisplay;
      return;
    }
    ensureStorageDisplayStyle();
    document.body.dataset.storageDisplay = 'true';
    renameRemark();
    hideStorageTableFields();
    hideStorageSearchAndDetailFields();
  };

  document.addEventListener('DOMContentLoaded', () => {
    applyRules();
    let scheduled = false;
    const scheduleRules = () => {
      if (scheduled) return;
      scheduled = true;
      requestAnimationFrame(() => {
        scheduled = false;
        applyRules();
      });
    };
    new MutationObserver(scheduleRules).observe(document.body, { childList: true, subtree: true, characterData: true });
    window.addEventListener('message', scheduleRules);
  });
})();
