(() => {
  const hiddenLabels = new Set([
    'FBA单号',
    '柜号',
    '提单号',
    '客户简称',
    '核销状态',
    '操作指令',
    '指令费用',
    '客户备注',
    '业务员',
    '跟单员',
  ]);
  const renamedLabel = '海外仓备注';
  const visibleRemarkLabel = '备注';

  const isTransitView = () => {
    const text = document.body?.innerText || '';
    return text.includes('待确认') && text.includes('签收');
  };

  const isRejectedTab = () => Array.from(document.querySelectorAll('button')).some((button) => (
    button.textContent.trim().startsWith('驳回') &&
    button.classList.contains('text-[#004bb1]')
  ));

  const isCanceledTab = () => Array.from(document.querySelectorAll('button')).some((button) => (
    button.textContent.trim().startsWith('取消') &&
    button.classList.contains('text-[#004bb1]')
  ));

  const restoreStorageView = () => {
    document.querySelectorAll('[data-transit-field-hidden="true"]').forEach((element) => {
      element.style.display = '';
      delete element.dataset.transitFieldHidden;
    });
  };

  const hideElement = (element) => {
    element.style.display = 'none';
    element.dataset.transitFieldHidden = 'true';
  };

  const renameRemark = () => {
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach((node) => {
      if (node.nodeValue?.includes(renamedLabel)) {
        const label = node.parentElement?.closest('label');
        if (label) label.dataset.transitRemarkKeep = 'true';
        const detailField = node.parentElement?.parentElement;
        if (detailField?.children.length >= 2) detailField.dataset.transitRemarkKeep = 'true';
        node.nodeValue = node.nodeValue.replaceAll(renamedLabel, '备注');
      }
    });

    document.querySelectorAll('[placeholder], [title], [aria-label]').forEach((element) => {
      for (const attribute of ['placeholder', 'title', 'aria-label']) {
        const value = element.getAttribute(attribute);
        if (value?.includes(renamedLabel)) element.setAttribute(attribute, value.replaceAll(renamedLabel, '备注'));
      }
    });
  };

  const hideOriginalCustomerRemark = () => {
    document.querySelectorAll('label').forEach((label) => {
      const labelText = label.querySelector('span')?.textContent?.trim() || label.textContent.trim();
      if (
        labelText === visibleRemarkLabel
        && label.dataset.transitRemarkKeep !== 'true'
        && label.querySelector('input, select, textarea')
      ) {
        hideElement(label);
      }
    });

    document.querySelectorAll('div').forEach((field) => {
      const label = field.firstElementChild?.textContent?.trim().replace(/：$/, '');
      const parentClass = typeof field.parentElement?.className === 'string' ? field.parentElement.className : '';
      if (
        label === visibleRemarkLabel
        && field.dataset.transitRemarkKeep !== 'true'
        && field.children.length >= 2
        && parentClass.includes('grid')
      ) {
        hideElement(field);
      }
    });
  };

  const restoreRejectedTableFields = () => {
    document.querySelectorAll('table').forEach((table) => {
      if (table.dataset.rejectedReferenceTable === 'true') return;
      const headers = Array.from(table.querySelectorAll('thead th'));
      if (!headers.some((header) => header.textContent.trim() === '头程运单号')) return;
      const fbaIndex = headers.findIndex((header) => header.textContent.trim() === 'FBA单号');
      table.querySelectorAll('tr').forEach((row) => {
        const cells = Array.from(row.children).filter((cell) => cell.tagName === 'TH' || cell.tagName === 'TD');
        cells.forEach((cell, index) => {
          if (index !== fbaIndex && cell.dataset.transitFieldHidden === 'true') {
            cell.style.display = '';
            delete cell.dataset.transitFieldHidden;
          }
        });
      });
    });
  };

  const getCellIndex = (headers, label) => headers.findIndex((header) => header.textContent.trim() === label);

  const appendRejectedCell = (row, index, field, value, className) => {
    const existing = row.querySelector(`[data-rejection-field="${field}"]`);
    if (existing) {
      existing.style.display = '';
      return;
    }
    const cell = document.createElement(row.parentElement?.tagName === 'THEAD' ? 'th' : 'td');
    cell.dataset.rejectionField = field;
    cell.className = className;
    cell.textContent = value;
    row.insertBefore(cell, row.children[index + 1] || null);
  };

  const appendCancelTimeCell = (row, index, value) => {
    const existing = row.querySelector('[data-cancel-time-field="true"]');
    if (existing) {
      existing.textContent = value;
      return existing;
    }
    const cell = document.createElement(row.parentElement?.tagName === 'THEAD' ? 'th' : 'td');
    cell.dataset.cancelTimeField = 'true';
    cell.className = row.parentElement?.tagName === 'THEAD'
      ? 'w-40 border border-slate-200 px-3 py-2 text-center'
      : 'border border-slate-200 px-3 text-center font-mono text-slate-500';
    cell.textContent = value;
    row.insertBefore(cell, row.children[index + 1] || null);
    return cell;
  };

  const pad = (number) => String(number).padStart(2, '0');

  const formatDateTime = (date) => (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
  );

  const stableCancelTime = (createdValue, rowKey) => {
    const key = `tiantu-cancel-time:${rowKey || createdValue || 'unknown'}`;
    const cached = sessionStorage.getItem(key);
    if (cached) return cached;

    const parsed = new Date((createdValue || '').replace(' ', 'T'));
    const date = Number.isNaN(parsed.getTime()) ? new Date() : parsed;
    let seed = 0;
    for (const char of String(rowKey || createdValue)) seed += char.charCodeAt(0);
    date.setHours(date.getHours() + 2 + (seed % 6));
    date.setMinutes((date.getMinutes() + seed) % 60);
    const value = formatDateTime(date);
    sessionStorage.setItem(key, value);
    return value;
  };

  const resetCancelTimeFields = () => {
    document.querySelectorAll('[data-cancel-time-field="true"]').forEach((cell) => cell.remove());
    document.querySelectorAll('[data-cancel-time-search="true"]').forEach((field) => {
      field.style.display = 'none';
    });
    document.querySelectorAll('[data-cancel-time-filter-hidden="true"]').forEach((row) => {
      row.style.display = '';
      delete row.dataset.cancelTimeFilterHidden;
    });
  };

  const ensureCancelTimeSearchField = () => {
    const anchor = Array.from(document.querySelectorAll('label')).find((label) => {
      const labelText = label.querySelector('span')?.textContent?.trim() || label.textContent.trim();
      return labelText === '入仓时间' && label.querySelector('input, select, textarea');
    });
    if (!anchor) return null;

    const existing = document.querySelector('[data-cancel-time-search="true"]');
    if (existing) {
      existing.style.display = '';
      return existing.querySelector('input');
    }

    const field = anchor.cloneNode(false);
    field.dataset.cancelTimeSearch = 'true';
    field.className = anchor.className;

    const label = document.createElement('span');
    label.textContent = '取消时间';

    const controlWrap = document.createElement('div');
    controlWrap.className = anchor.querySelector('div')?.className || 'min-w-0 flex-1';

    const input = document.createElement('input');
    const sourceInput = anchor.querySelector('input, select, textarea');
    input.type = 'text';
    input.placeholder = 'YYYY-MM-DD 或时间';
    input.className = sourceInput?.className || 'h-8 rounded border border-slate-300 bg-white px-3 text-xs text-slate-700 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500';
    input.addEventListener('input', applyCancelTimeFilter);

    controlWrap.append(input);
    field.append(label, controlWrap);
    anchor.insertAdjacentElement('afterend', field);
    return input;
  };

  const applyCancelTimeFilter = () => {
    const keyword = document.querySelector('[data-cancel-time-search="true"] input')?.value.trim() || '';
    document.querySelectorAll('table').forEach((table) => {
      if (!table.querySelector('[data-cancel-time-field="true"]')) return;
      table.querySelectorAll('tbody tr').forEach((row) => {
        const cancelTime = row.querySelector('[data-cancel-time-field="true"]')?.textContent.trim() || '';
        const hidden = Boolean(keyword) && !cancelTime.includes(keyword);
        row.style.display = hidden ? 'none' : '';
        if (hidden) row.dataset.cancelTimeFilterHidden = 'true';
        else delete row.dataset.cancelTimeFilterHidden;
      });
    });
  };

  const applyCancelTimeFields = () => {
    const searchInput = ensureCancelTimeSearchField();
    document.querySelectorAll('table').forEach((table) => {
      if (table.dataset.rejectedReferenceTable === 'true') return;
      const headerRow = table.querySelector('thead tr');
      if (!headerRow) return;
      const headers = Array.from(headerRow.children);
      if (!headers.some((header) => header.textContent.trim() === '头程运单号')) return;
      const createdIndex = getCellIndex(headers, '子单创建时间');
      if (createdIndex < 0) return;

      appendCancelTimeCell(headerRow, createdIndex, '取消时间');
      const currentHeaders = Array.from(headerRow.children);
      const childOrderIndex = getCellIndex(currentHeaders, '海外仓运单号');
      const currentCreatedIndex = getCellIndex(currentHeaders, '子单创建时间');

      table.querySelectorAll('tbody tr').forEach((row) => {
        const cells = Array.from(row.children);
        const createdValue = cells[currentCreatedIndex]?.textContent.trim() || '';
        const rowKey = cells[childOrderIndex]?.textContent.trim() || cells[0]?.textContent.trim() || createdValue;
        appendCancelTimeCell(row, currentCreatedIndex, stableCancelTime(createdValue, rowKey));
      });
    });
    if (searchInput) applyCancelTimeFilter();
  };

  const toRejectedAt = (value) => {
    const parsed = new Date(value.replace(' ', 'T'));
    if (Number.isNaN(parsed.getTime())) return '-';
    parsed.setDate(parsed.getDate() + 1);
    const pad = (number) => String(number).padStart(2, '0');
    return `${parsed.getFullYear()}-${pad(parsed.getMonth() + 1)}-${pad(parsed.getDate())} ${pad(parsed.getHours())}:${pad(parsed.getMinutes())}:${pad(parsed.getSeconds())}`;
  };

  const applyRejectedTableFields = () => {
    document.querySelectorAll('table').forEach((table) => {
      if (table.dataset.rejectedReferenceTable === 'true') return;
      const headerRow = table.querySelector('thead tr');
      if (!headerRow) return;
      const originalHeaders = Array.from(headerRow.children);
      if (!originalHeaders.some((header) => header.textContent.trim() === '头程运单号')) return;
      if (originalHeaders.some((header) => header.textContent.trim() === '驳回原因')) return;

      const instructionHeader = originalHeaders.find((header) => header.textContent.trim() === '操作指令');
      if (instructionHeader) instructionHeader.textContent = '指令费用';

      const headers = Array.from(headerRow.children);
      const createdIndex = getCellIndex(headers, '子单创建时间');
      const orderTypeIndex = getCellIndex(headers, '下单类型');
      const instructionIndex = getCellIndex(headers, '指令费用');
      if (createdIndex < 0 || orderTypeIndex < 0 || instructionIndex < 0) return;

      appendRejectedCell(headerRow, createdIndex, 'reason', '驳回原因', 'w-48 border border-slate-200 px-3 py-2 text-center');
      appendRejectedCell(headerRow, createdIndex + 1, 'rejected-at', '驳回时间', 'w-40 border border-slate-200 px-3 py-2 text-center');

      const currentHeaders = Array.from(headerRow.children);
      appendRejectedCell(headerRow, getCellIndex(currentHeaders, '下单类型'), 'delivery-method', '派送方式', 'w-28 border border-slate-200 px-3 py-2 text-center');
      appendRejectedCell(headerRow, getCellIndex(Array.from(headerRow.children), '指令费用'), 'customer-remark', '客户备注', 'w-36 border border-slate-200 px-3 py-2 text-center');

      table.querySelectorAll('tbody tr').forEach((row) => {
        const cells = Array.from(row.children);
        const createdValue = cells[getCellIndex(Array.from(headerRow.children), '子单创建时间')]?.textContent.trim() || '';
        appendRejectedCell(row, createdIndex, 'reason', '目的仓信息不完整，请补充后重新提交', 'border border-slate-200 px-3 text-left');
        appendRejectedCell(row, createdIndex + 1, 'rejected-at', toRejectedAt(createdValue), 'border border-slate-200 px-3 text-center font-mono text-slate-500');
        appendRejectedCell(row, getCellIndex(Array.from(headerRow.children), '下单类型'), 'delivery-method', '-', 'border border-slate-200 px-3 text-center');
        appendRejectedCell(row, getCellIndex(Array.from(headerRow.children), '指令费用'), 'customer-remark', '-', 'truncate border border-slate-200 px-3 text-center');
      });
    });
  };

  const resetRejectedTableFields = () => {
    document.querySelectorAll('[data-rejection-field]').forEach((cell) => {
      cell.style.display = 'none';
    });
    document.querySelectorAll('thead th').forEach((header) => {
      if (header.textContent.trim() === '指令费用') header.textContent = '操作指令';
    });
  };

  const hideTransitTableFields = (rejectedTab) => {
    document.querySelectorAll('table').forEach((table) => {
      if (table.dataset.rejectedReferenceTable === 'true') return;
      const headers = Array.from(table.querySelectorAll('thead th'));
      const labelsToHide = hiddenLabels;
      const indexes = headers
        .map((header, index) => (labelsToHide.has(header.textContent.trim()) ? index : -1))
        .filter((index) => index >= 0);
      if (indexes.length === 0) return;

      table.querySelectorAll('tr').forEach((row) => {
        const cells = Array.from(row.children).filter((cell) => cell.tagName === 'TH' || cell.tagName === 'TD');
        indexes.forEach((index) => cells[index] && hideElement(cells[index]));
      });
    });
  };

  const rejectedHeaders = [
    '头程运单号', '海外仓运单号', '子单创建时间', '驳回原因', '驳回时间',
    '转单号', '入仓号', 'Shipment ID', 'Reference ID', '柜号', '提单号',
    '客户简称', '仓库代码', '邮编', '下单类型', '派送方式', '目的地', '核销状态',
    '指令费用', '客户备注', '海外仓备注', '业务员', '跟单员', '发货件数',
    '重量', '方数', '是否到达海外仓', '入仓时间（海外仓）',
  ];

  const rejectedValues = [
    'YT2507100099', 'TGHU2507100099', '2026-07-12 10:20', '目的仓信息不完整，请补充后重新提交',
    '2026-07-13 10:20:00', '1Z0VV966030999', 'INB2507100099', 'SHP2507100099',
    'REF-FBA-10099', 'MSCU2507100', 'TTBL2507100099', '华南跨境供应链', 'ONT8',
    '92551', 'FBA', '快递派送', '美国', '未核销', '换箱 / 20 USD / 1 / 20.00',
    '请补充目的仓信息后重新提交', '海外仓已退回本次下单申请', '安一', '天朗',
    '2', '86.4kg', '0.46', '否', '2026-07-11 16:40',
  ];

  const setNativeTransitListVisibility = (visible) => {
    const baseTable = Array.from(document.querySelectorAll('table')).find((table) => (
      table.querySelector('thead th')?.textContent.trim() === '' &&
      Array.from(table.querySelectorAll('thead th')).some((header) => header.textContent.trim() === '头程运单号')
    ));
    if (!baseTable) return null;
    const tableContainer = baseTable.parentElement;
    const toolbar = tableContainer?.previousElementSibling;
    const pagination = tableContainer?.nextElementSibling;
    [toolbar, tableContainer, pagination].forEach((element) => {
      if (!element) return;
      element.style.display = visible ? '' : 'none';
    });
    return tableContainer;
  };

  const renderRejectedReferenceTable = () => {
    const tableContainer = setNativeTransitListVisibility(false);
    if (!tableContainer) return;
    let panel = tableContainer.parentElement?.querySelector('[data-rejected-reference-panel="true"]');
    if (!panel) {
      panel = document.createElement('div');
      panel.dataset.rejectedReferencePanel = 'true';
      panel.className = 'mb-3';
      tableContainer.parentElement?.insertBefore(panel, tableContainer);
    }
    panel.style.display = '';
    if (panel.dataset.rejectedReferenceRendered === 'true') return;
    panel.dataset.rejectedReferenceRendered = 'true';
    panel.innerHTML = `
      <div class="mb-3 flex items-center gap-3">
        <button type="button" class="rounded bg-[#004bb1] px-7 py-2 text-xs font-bold text-white hover:bg-[#003b91]">导出</button>
      </div>
      <div class="overflow-x-auto border border-slate-200">
        <table data-rejected-reference-table="true" class="w-full min-w-[3880px] table-fixed border-collapse text-[11px]">
          <thead class="bg-slate-50 text-slate-700"><tr><th class="w-10 border border-slate-200 px-2 py-2 text-center"><input type="checkbox" class="h-3.5 w-3.5 rounded border-slate-300"></th>${rejectedHeaders.map((header) => `<th class="border border-slate-200 px-3 py-2 text-center font-semibold">${header}</th>`).join('')}</tr></thead>
          <tbody><tr class="h-9 cursor-pointer text-slate-700 hover:bg-blue-50/70"><td class="border border-slate-200 px-2 text-center"><input type="checkbox" class="h-3.5 w-3.5 rounded border-slate-300"></td>${rejectedValues.map((value, index) => `<td class="border border-slate-200 px-3 ${index === 3 || index === 18 || index === 19 || index === 20 ? 'text-left' : 'text-center'}">${value}</td>`).join('')}</tr></tbody>
        </table>
      </div>`;
  };

  const clearRejectedReferenceTable = () => {
    setNativeTransitListVisibility(true);
    document.querySelectorAll('[data-rejected-reference-panel="true"]').forEach((panel) => {
      panel.style.display = 'none';
    });
    document.querySelectorAll('[data-rejected-original-class]').forEach((tab) => {
      tab.className = tab.dataset.rejectedOriginalClass;
      delete tab.dataset.rejectedOriginalClass;
    });
  };

  const ensureRejectedTab = () => {
    const tabBar = Array.from(document.querySelectorAll('div')).find((element) => (
      element.classList.contains('mb-3') && element.classList.contains('gap-8') &&
      Array.from(element.children).some((child) => child.tagName === 'BUTTON' && child.textContent.trim().startsWith('待确认')) &&
      Array.from(element.children).some((child) => child.tagName === 'BUTTON' && child.textContent.trim().startsWith('签收'))
    ));
    if (!tabBar) return;
    let rejectedTab = tabBar.querySelector('[data-rejected-reference-tab="true"]');
    if (!rejectedTab) {
      rejectedTab = document.createElement('button');
      rejectedTab.type = 'button';
      rejectedTab.dataset.rejectedReferenceTab = 'true';
      rejectedTab.className = 'relative px-1 pb-3 text-slate-600 hover:text-[#004bb1]';
      rejectedTab.textContent = '驳回(1)';
      const signedTab = Array.from(tabBar.children).find((child) => child.textContent.trim().startsWith('签收'));
      tabBar.insertBefore(rejectedTab, signedTab?.nextSibling || null);
      rejectedTab.addEventListener('click', () => {
        document.body.dataset.rejectedReferenceActive = 'true';
        scheduleRules();
      });
    }
    const active = document.body.dataset.rejectedReferenceActive === 'true';
    Array.from(tabBar.children).forEach((tab) => {
      if (tab === rejectedTab || tab.tagName !== 'BUTTON') return;
      if (active) {
        if (!tab.dataset.rejectedOriginalClass) tab.dataset.rejectedOriginalClass = tab.className;
        tab.className = 'relative px-1 pb-3 text-slate-600 hover:text-[#004bb1]';
        tab.querySelector('span')?.remove();
      }
    });
    rejectedTab.className = `relative px-1 pb-3 ${active ? 'text-[#004bb1]' : 'text-slate-600 hover:text-[#004bb1]'}`;
    if (active && !rejectedTab.querySelector('span')) {
      const underline = document.createElement('span');
      underline.className = 'absolute inset-x-0 bottom-[-1px] h-0.5 bg-[#004bb1]';
      rejectedTab.appendChild(underline);
    }
    if (!active) rejectedTab.querySelector('span')?.remove();
  };

  const hideTransitSearchFields = () => {
    document.querySelectorAll('label').forEach((label) => {
      const labelText = label.querySelector('span')?.textContent?.trim() || label.textContent.trim();
      if (hiddenLabels.has(labelText) && label.querySelector('input, select, textarea')) hideElement(label);
    });
  };

  const hideTransitDetailFields = () => {
    document.querySelectorAll('div').forEach((field) => {
      const label = field.firstElementChild?.textContent?.trim().replace(/：$/, '');
      const parentClass = typeof field.parentElement?.className === 'string' ? field.parentElement.className : '';
      if (hiddenLabels.has(label) && field.children.length >= 2 && parentClass.includes('grid')) hideElement(field);
    });
  };

  const applyRules = () => {
    if (!document.body) return;
    if (!isTransitView()) {
      restoreStorageView();
      return;
    }
    clearRejectedReferenceTable();
    document.querySelectorAll('[data-rejected-reference-tab="true"]').forEach((tab) => tab.remove());
    delete document.body.dataset.rejectedReferenceActive;
    const rejectedTab = isRejectedTab();
    if (rejectedTab) {
      resetCancelTimeFields();
      resetRejectedTableFields();
      restoreRejectedTableFields();
      renameRemark();
      applyRejectedTableFields();
      hideTransitTableFields(true);
      hideTransitSearchFields();
      hideTransitDetailFields();
      return;
    }
    if (isCanceledTab()) {
      resetRejectedTableFields();
      renameRemark();
      applyCancelTimeFields();
      hideTransitTableFields(false);
      hideTransitSearchFields();
      hideTransitDetailFields();
      return;
    }
    resetCancelTimeFields();
    resetRejectedTableFields();
    renameRemark();
    hideTransitTableFields(false);
    hideTransitSearchFields();
    hideTransitDetailFields();
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
    document.addEventListener('click', (event) => {
      const button = event.target.closest('button');
      if (!button || button.dataset.rejectedReferenceTab === 'true') return;
      if (/^(待确认|已确认|已下单|转运中|签收|取消)\(/.test(button.textContent.trim())) {
        delete document.body.dataset.rejectedReferenceActive;
        scheduleRules();
      }
    }, true);
  });
})();


