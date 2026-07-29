(() => {
  const replacements = [
    ['\u6d77\u5916\u4ed3\u5907\u6ce8', '\u5907\u6ce8'],
    ['\u8bf7\u8f93\u5165\u6d77\u5916\u4ed3\u5907\u6ce8', '\u8bf7\u8f93\u5165\u5907\u6ce8'],
  ];
  let activeView = new URLSearchParams(window.location.search).get('view') || 'storage';
  const removedTransitColumns = new Set([
    'FBA单号',
    '\u67dc\u53f7',
    '\u63d0\u5355\u53f7',
    '\u5ba2\u6237\u7b80\u79f0',
    '\u6838\u9500\u72b6\u6001',
    '\u64cd\u4f5c\u6307\u4ee4',
    '\u4e1a\u52a1\u5458',
    '\u8ddf\u5355\u5458',
    // 该列是原有的客户备注；保留后面的海外仓备注并显示为“备注”。
    '\u5907\u6ce8',
  ]);
  const removedTransitSearchFields = new Set([
    'FBA单号',
    '\u67dc\u53f7',
    '\u63d0\u5355\u53f7',
    '\u5ba2\u6237\u7b80\u79f0',
    '\u6838\u9500\u72b6\u6001',
    '\u4e1a\u52a1\u5458',
    '\u8ddf\u5355\u5458',
  ]);
  const removedTransitDetailFields = new Set([
    ...removedTransitColumns,
  ]);

  const replaceText = (value) => replacements.reduce(
    (result, [from, to]) => result.replaceAll(from, to),
    value,
  );

  const updateNode = (node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      const currentValue = node.nodeValue || '';
      if (currentValue.includes('\u6d77\u5916\u4ed3\u5907\u6ce8')) {
        node.parentElement?.closest('th')?.setAttribute('data-keep-remark', 'true');
      }
      const nextValue = replaceText(currentValue);
      if (nextValue !== node.nodeValue) node.nodeValue = nextValue;
      return;
    }

    if (node.nodeType !== Node.ELEMENT_NODE || node.tagName === 'SCRIPT') return;

    for (const attribute of ['placeholder', 'title', 'aria-label']) {
      const value = node.getAttribute(attribute);
      if (value) node.setAttribute(attribute, replaceText(value));
    }

    node.childNodes.forEach(updateNode);
  };

  const hideTransitTableColumns = () => {
    document.querySelectorAll('table').forEach((table) => {
      const headers = Array.from(table.querySelectorAll('thead th'));
      const indexes = headers
        .map((header, index) => {
          const label = header.textContent.trim();
          const isRetainedRemark = label === '\u5907\u6ce8' && header.dataset.keepRemark === 'true';
          return removedTransitColumns.has(label) && !isRetainedRemark ? index : -1;
        })
        .filter((index) => index >= 0)
        .sort((left, right) => right - left);

      if (indexes.length === 0) return;

      table.querySelectorAll('tr').forEach((row) => {
        const cells = Array.from(row.children).filter(
          (cell) => cell.tagName === 'TH' || cell.tagName === 'TD',
        );
        indexes.forEach((index) => {
          if (cells[index]) {
            cells[index].style.display = 'none';
            cells[index].dataset.hiddenByTransitFilter = 'true';
          }
        });
      });
    });
  };

  const restoreTransitTableColumns = () => {
    document.querySelectorAll('[data-hidden-by-transit-filter="true"]').forEach((cell) => {
      cell.style.display = '';
      delete cell.dataset.hiddenByTransitFilter;
    });
  };

  const getRenderedView = () => {
    const pageText = document.body?.textContent || '';
    // 海外暂存与海外中转单的状态标签不重叠；优先使用当前渲染结果，
    // 以防父页面的 postMessage 在子页面加载前到达。
    if (pageText.includes('\u6682\u5b58\u5df2\u5b8c\u6210')) return 'storage';
    if (pageText.includes('\u5f85\u786e\u8ba4')) return 'transit';
    return activeView;
  };

  const removeTransitSearchFields = () => {
    document.querySelectorAll('label').forEach((label) => {
      const caption = label.querySelector('span')?.textContent?.trim();
      if (
        removedTransitSearchFields.has(caption)
        && label.querySelector('input, select, textarea')
      ) {
        label.remove();
      }
    });

    document.querySelectorAll('input[placeholder]').forEach((input) => {
      input.placeholder = input.placeholder.replace(
        '\u6d77\u5916\u4ed3\u8fd0\u5355\u53f7 / \u5934\u7a0b\u8fd0\u5355\u53f7 / FBA\u5355\u53f7 / \u5ba2\u6237',
        '\u6d77\u5916\u4ed3\u8fd0\u5355\u53f7 / \u5934\u7a0b\u8fd0\u5355\u53f7 / \u5ba2\u6237',
      );
    });
  };

  const removeTransitDetailFields = () => {
    document.querySelectorAll('div').forEach((field) => {
      const label = field.firstElementChild?.textContent?.trim();
      const parentClass = typeof field.parentElement?.className === 'string'
        ? field.parentElement.className
        : '';

      if (
        removedTransitDetailFields.has(label)
        && field.children.length >= 2
        && parentClass.includes('grid')
      ) {
        field.remove();
      }
    });
  };

  const updatePage = () => {
    const renderedView = getRenderedView();
    if (renderedView === 'transit') {
      hideTransitTableColumns();
      removeTransitSearchFields();
      removeTransitDetailFields();
    } else {
      restoreTransitTableColumns();
    }
    updateNode(document.body);
  };

  document.addEventListener('DOMContentLoaded', () => {
    updatePage();
    let updateScheduled = false;
    const scheduleUpdate = () => {
      if (updateScheduled) return;
      updateScheduled = true;
      window.requestAnimationFrame(() => {
        updateScheduled = false;
        updatePage();
      });
    };

    new MutationObserver(scheduleUpdate).observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
    });

    // 各状态页签会异步重绘列表；切换后再次应用字段规则。
    document.addEventListener('click', scheduleUpdate, true);
    window.addEventListener('message', (event) => {
      if (event.origin !== window.location.origin) return;
      if (
        event.data?.type === 'tiantu-overseas-view'
        && (event.data.view === 'storage' || event.data.view === 'transit')
      ) {
        activeView = event.data.view;
        scheduleUpdate();
      }
    });
    window.setInterval(updatePage, 400);
  });
})();
