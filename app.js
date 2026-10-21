const watermarkLayer = document.querySelector(".watermarks");
const watermarkText = "天光跨境物流2026-06-23";
const exportMenu = document.querySelector(".export-menu");
const exportToggle = document.querySelector(".export-toggle");
const printLabelMenu = document.querySelector(".print-label-menu");
const printLabelToggle = document.querySelector(".print-label-toggle");
const systemLabelModal = document.querySelector("#systemLabelModal");
const systemLabelList = document.querySelector("#systemLabelList");
const systemLabelWatermarkLayer = document.querySelector(".system-label-watermarks");
const attachmentExportModal = document.querySelector("#attachmentExportModal");
const toast = document.querySelector("#toast");
let toastTimer;

const clientViews = {
  waybill: {module:'orders', hash:'#waybill', title:'运单(客户)'},
  storage: {module:'overseas', hash:'#overseas-storage', title:'暂存管理'},
  instructions: {module:'overseas', hash:'#instruction-list', title:'指令列表'},
};
const overseasFrame = document.querySelector('#overseasFrame');
const overseasHost = document.querySelector('#overseasHost');
let frameReadyTimer;
let currentFrameView = '';

function activateClientView(view) {
  const config = clientViews[view] || clientViews.waybill;
  const isOverseas = config.module === 'overseas';
  document.querySelectorAll('[data-client-module]').forEach(button => {
    const active = button.dataset.clientModule === config.module;
    button.classList.toggle('active',active);
    button.setAttribute('aria-pressed',String(active));
  });
  document.querySelectorAll('[data-menu-panel]').forEach(panel => panel.hidden=panel.dataset.menuPanel !== config.module);
  document.querySelectorAll('[data-client-view]').forEach(link => {
    const active = clientViews[link.dataset.clientView] === config;
    link.classList.toggle('active',active);
    if(active) link.setAttribute('aria-current','page'); else link.removeAttribute('aria-current');
  });
  document.querySelector('.workspace').classList.toggle('overseas-mode',isOverseas);
  overseasHost.hidden = !isOverseas;
  document.querySelector('.customer-chip').textContent = config.title;
  document.title = '天图通达 - '+config.title.replace('(客户)','');
  if (location.hash !== config.hash) history.replaceState(null,'',config.hash);
  if (isOverseas && currentFrameView !== config.hash) {
    currentFrameView = config.hash;
    overseasHost.classList.remove('is-ready');
    overseasHost.setAttribute('aria-busy','true');
    overseasHost.querySelector('[role="status"]').textContent='正在加载页面…';
    overseasFrame.title=config.title;
    overseasFrame.src='overseas-app/index.html?view='+view+'&v=status-ordered-20261021'+config.hash;
    clearTimeout(frameReadyTimer);
    frameReadyTimer=setTimeout(()=>{
      overseasHost.querySelector('[role="status"]').textContent='页面加载失败，请刷新重试';
      overseasHost.setAttribute('aria-busy','false');
    },15000);
  }
  if (!isOverseas) requestAnimationFrame(renderWatermarks);
}
function activateViewFromHash() {
  activateClientView(Object.keys(clientViews).find(view=>clientViews[view].hash===location.hash)||'waybill');
}
window.addEventListener('message',event=>{
  if(event.origin!==location.origin || event.source!==overseasFrame.contentWindow || event.data?.type!=='tiantu-overseas-ready' || event.data.view!==currentFrameView) return;
  clearTimeout(frameReadyTimer);
  overseasHost.classList.add('is-ready');
  overseasHost.setAttribute('aria-busy','false');
});

function renderWatermarks() {
  if (!watermarkLayer) return;

  watermarkLayer.replaceChildren();
  const bounds = watermarkLayer.getBoundingClientRect();
  const horizontalStep = 300;
  const verticalStep = 130;

  for (let y = -20; y < bounds.height + 80; y += verticalStep) {
    for (let x = -120; x < bounds.width + 260; x += horizontalStep) {
      const mark = document.createElement("span");
      mark.className = "watermark";
      mark.textContent = watermarkText;
      mark.style.left = `${x}px`;
      mark.style.top = `${y}px`;
      watermarkLayer.appendChild(mark);
    }
  }
}

function showToast(message) {
  if (!toast) return;

  toast.textContent = message;
  toast.classList.add("show");
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => {
    toast.classList.remove("show");
  }, 2200);
}

function getCustomerNo(orderNo) {
  return `KH${String(orderNo).slice(-6)}`;
}

function getShipmentRows() {
  const rows = Array.from(document.querySelectorAll("#shipmentTableBody tr"));
  return rows.map((row) => {
    const cells = Array.from(row.querySelectorAll("td")).map((cell) => cell.innerText.trim());
    const orderNo = cells[1];
    return {
      orderNo,
      customerNo: row.dataset.customerNo || getCustomerNo(orderNo),
      type: cells[2],
      country: cells[3],
      service: cells[4],
      payable: cells[5],
      recipient: cells[6],
      pieces: Number(cells[7]) || 0,
      status: cells[8],
      mark: cells[9],
      declaredValue: cells[10],
      currency: cells[11],
    };
  });
}

function getSelectedShipments() {
  const rows = Array.from(document.querySelectorAll("#shipmentTableBody tr"));
  return rows
    .filter((row) => row.querySelector('input[type="checkbox"]')?.checked)
    .map((row) => {
      const cells = Array.from(row.querySelectorAll("td")).map((cell) => cell.innerText.trim());
      const orderNo = cells[1];
      return {
        orderNo,
        customerNo: row.dataset.customerNo || getCustomerNo(orderNo),
        service: cells[4],
        recipient: cells[6],
        pieces: Number(cells[7]) || 0,
      };
    });
}

function toCsv(rows) {
  return rows
    .map((row) =>
      row
        .map((value) => `"${String(value).replaceAll('"', '""')}"`)
        .join(",")
    )
    .join("\r\n");
}

function downloadBlob(filename, blob) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function downloadCsv(filename, rows) {
  downloadBlob(filename, new Blob([`\ufeff${toCsv(rows)}`], { type: "text/csv;charset=utf-8" }));
}

function formatFileSize(size) {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / 1024 / 1024).toFixed(1)} MB`;
}

function getExportScopeShipments() {
  const selected = getSelectedShipments();
  if (selected.length > 0) {
    return selected;
  }

  return getShipmentRows().map((shipment) => ({
    orderNo: shipment.orderNo,
    customerNo: shipment.customerNo,
    service: shipment.service,
    recipient: shipment.recipient,
    pieces: shipment.pieces,
  }));
}

function createAttachmentDataUrl(waybill, attachmentName) {
  const content = [
    `运单号：${waybill.orderNo}`,
    `客户单号：${waybill.customerNo}`,
    `服务：${waybill.service}`,
    `附件：${attachmentName}`,
    "此文件为页面原型生成的附件示例内容。",
  ].join("\n");
  return `data:text/plain;charset=utf-8,${encodeURIComponent(content)}`;
}

function getWaybillAttachments(waybill) {
  const suffix = waybill.orderNo.slice(-4);
  const items = [
    { name: `报关资料_${suffix}.txt`, type: "text/plain", size: 1840, uploadedAt: "2026-06-23 09:12" },
    { name: `POD签收_${suffix}.txt`, type: "text/plain", size: 1320, uploadedAt: "2026-06-23 09:18" },
    { name: `申报信息_${suffix}.txt`, type: "text/plain", size: 2150, uploadedAt: "2026-06-23 09:26" },
  ];

  return items.map((item) => ({
    ...item,
    dataUrl: createAttachmentDataUrl(waybill, item.name),
  }));
}

function downloadDataUrlFile(filename, dataUrl) {
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
}

function openAttachmentExportModal() {
  exportMenu?.classList.remove("open");
  exportToggle?.setAttribute("aria-expanded", "false");
  document.querySelectorAll(".attachment-type-grid input").forEach((input) => {
    input.checked = false;
  });
  attachmentExportModal?.classList.add("open");
  attachmentExportModal?.setAttribute("aria-hidden", "false");
}

function closeAttachmentExportModal() {
  attachmentExportModal?.classList.remove("open");
  attachmentExportModal?.setAttribute("aria-hidden", "true");
  document.querySelectorAll(".attachment-type-grid input").forEach((input) => {
    input.checked = false;
  });
}

function handleExportAttachments() {
  const selectedAttachmentTypes = Array.from(document.querySelectorAll(".attachment-type-grid input:checked")).map((input) => input.value);

  if (selectedAttachmentTypes.length === 0) {
    showToast("请选择附件类型");
    return;
  }

  const exportScopeWaybills = getExportScopeShipments();
  if (exportScopeWaybills.length === 0) {
    showToast("当前没有可导出的运单附件");
    return;
  }

  const attachments = exportScopeWaybills.flatMap((waybill) =>
    getWaybillAttachments(waybill).map((attachment) => ({ waybill, attachment }))
  );

  if (attachments.length === 0) {
    showToast("当前范围内没有已上传附件可导出");
    closeAttachmentExportModal();
    return;
  }

  const attachmentTypeText = selectedAttachmentTypes.join("、");
  const manifestRows = [["运单号", "导出附件类型", "附件名称", "文件类型", "文件大小", "上传时间", "是否包含文件内容"]];
  attachments.forEach(({ waybill, attachment }) => {
    manifestRows.push([
      waybill.orderNo,
      attachmentTypeText,
      attachment.name,
      attachment.type || "application/octet-stream",
      formatFileSize(attachment.size),
      attachment.uploadedAt,
      attachment.dataUrl ? "是" : "否",
    ]);
  });

  downloadCsv(`附件导出清单_${new Date().toISOString().slice(0, 10)}.csv`, manifestRows);

  const downloadableAttachments = attachments.filter(({ attachment }) => Boolean(attachment.dataUrl));
  downloadableAttachments.forEach(({ waybill, attachment }) => {
    downloadDataUrlFile(`${waybill.orderNo}_${attachment.name}`, attachment.dataUrl);
  });

  closeAttachmentExportModal();
  showToast(`已导出 ${attachments.length} 个附件记录，${downloadableAttachments.length} 个原始附件文件`);
}

function exportShipments(dimension) {
  const shipments = getShipmentRows();
  const today = "2026-06-23";

  if (dimension === "box") {
    const rows = [["箱号", "运单号", "件数", "国家或地区", "服务", "标识", "配租状态"]];
    shipments.forEach((item) => {
      rows.push([`BOX-${item.orderNo.slice(-4)}`, item.orderNo, item.pieces, item.country, item.service, item.mark, item.status]);
    });
    downloadCsv(`箱子维度导出-${today}.csv`, rows);
    return;
  }

  if (dimension === "tracking") {
    const rows = [["运单号", "当前状态", "最近轨迹", "国家或地区", "服务", "更新时间"]];
    shipments.forEach((item) => {
      rows.push([item.orderNo, item.status, `${item.country}${item.status}节点已更新`, item.country, item.service, `${today} 09:30`]);
    });
    downloadCsv(`运踪维度导出-${today}.csv`, rows);
    return;
  }

  const rows = [["运单号", "运单类型", "国家或地区", "服务", "应付", "收件人", "件数", "配租状态", "标识", "申报价值", "申报币种"]];
  shipments.forEach((item) => {
    rows.push([
      item.orderNo,
      item.type,
      item.country,
      item.service,
      item.payable,
      item.recipient,
      item.pieces,
      item.status,
      item.mark,
      item.declaredValue,
      item.currency,
    ]);
  });
  downloadCsv(`运单维度导出-${today}.csv`, rows);
}

function pdfText(value) {
  return String(value)
    .replace(/[^\x20-\x7E]/g, "?")
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)");
}

function createLabelPdf(shipments) {
  const pages = shipments.map((shipment, index) => {
    const y = 770;
    return [
      "BT /F1 18 Tf 50 " + y + " Td (TIANTU SHIPPING LABEL) Tj ET",
      "BT /F1 12 Tf 50 730 Td (Waybill No: " + pdfText(shipment.orderNo) + ") Tj ET",
      "BT /F1 12 Tf 50 705 Td (Customer No: " + pdfText(shipment.customerNo) + ") Tj ET",
      "BT /F1 12 Tf 50 680 Td (Service: " + pdfText(shipment.service) + ") Tj ET",
      "BT /F1 12 Tf 50 655 Td (Recipient: " + pdfText(shipment.recipient || "-") + ") Tj ET",
      "BT /F1 12 Tf 50 630 Td (Pieces: " + pdfText(shipment.pieces || 1) + ") Tj ET",
      "BT /F1 10 Tf 50 80 Td (Page " + (index + 1) + " / " + shipments.length + ") Tj ET",
      "0.5 w 45 605 505 1 re S",
      "0.5 w 45 95 505 500 re S",
    ].join("\n");
  });

  const fontObjectNumber = 3 + pages.length * 2;
  const kids = pages.map((_, index) => `${3 + index * 2} 0 R`).join(" ");
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    `<< /Type /Pages /Kids [${kids}] /Count ${pages.length} >>`,
  ];

  pages.forEach((content, index) => {
    const pageObjectNumber = 3 + index * 2;
    const contentObjectNumber = pageObjectNumber + 1;
    objects.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 ${fontObjectNumber} 0 R >> >> /Contents ${contentObjectNumber} 0 R >>`);
    objects.push(`<< /Length ${content.length} >>\nstream\n${content}\nendstream`);
  });

  objects.push("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");

  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  objects.forEach((object, index) => {
    offsets.push(pdf.length);
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });
  const xrefOffset = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += "0000000000 65535 f \n";
  offsets.slice(1).forEach((offset) => {
    pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
  });
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  return new TextEncoder().encode(pdf);
}

const crcTable = (() => {
  const table = [];
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(data) {
  let crc = 0xffffffff;
  data.forEach((byte) => {
    crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  });
  return (crc ^ 0xffffffff) >>> 0;
}

function writeUint16(view, offset, value) {
  view.setUint16(offset, value, true);
}

function writeUint32(view, offset, value) {
  view.setUint32(offset, value >>> 0, true);
}

function concatBytes(parts) {
  const total = parts.reduce((sum, part) => sum + part.length, 0);
  const output = new Uint8Array(total);
  let offset = 0;
  parts.forEach((part) => {
    output.set(part, offset);
    offset += part.length;
  });
  return output;
}

function dosDateTime(date = new Date()) {
  const time = (date.getHours() << 11) | (date.getMinutes() << 5) | Math.floor(date.getSeconds() / 2);
  const dosDate = ((date.getFullYear() - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate();
  return { time, date: dosDate };
}

function createZip(entries) {
  const encoder = new TextEncoder();
  const localParts = [];
  const centralParts = [];
  let offset = 0;
  const stamp = dosDateTime();

  entries.forEach((entry) => {
    const nameBytes = encoder.encode(entry.name);
    const data = entry.data;
    const crc = crc32(data);

    const localHeader = new Uint8Array(30 + nameBytes.length);
    const localView = new DataView(localHeader.buffer);
    writeUint32(localView, 0, 0x04034b50);
    writeUint16(localView, 4, 20);
    writeUint16(localView, 6, 0x0800);
    writeUint16(localView, 8, 0);
    writeUint16(localView, 10, stamp.time);
    writeUint16(localView, 12, stamp.date);
    writeUint32(localView, 14, crc);
    writeUint32(localView, 18, data.length);
    writeUint32(localView, 22, data.length);
    writeUint16(localView, 26, nameBytes.length);
    writeUint16(localView, 28, 0);
    localHeader.set(nameBytes, 30);
    localParts.push(localHeader, data);

    const centralHeader = new Uint8Array(46 + nameBytes.length);
    const centralView = new DataView(centralHeader.buffer);
    writeUint32(centralView, 0, 0x02014b50);
    writeUint16(centralView, 4, 20);
    writeUint16(centralView, 6, 20);
    writeUint16(centralView, 8, 0x0800);
    writeUint16(centralView, 10, 0);
    writeUint16(centralView, 12, stamp.time);
    writeUint16(centralView, 14, stamp.date);
    writeUint32(centralView, 16, crc);
    writeUint32(centralView, 20, data.length);
    writeUint32(centralView, 24, data.length);
    writeUint16(centralView, 28, nameBytes.length);
    writeUint16(centralView, 30, 0);
    writeUint16(centralView, 32, 0);
    writeUint16(centralView, 34, 0);
    writeUint16(centralView, 36, 0);
    writeUint32(centralView, 38, 0);
    writeUint32(centralView, 42, offset);
    centralHeader.set(nameBytes, 46);
    centralParts.push(centralHeader);

    offset += localHeader.length + data.length;
  });

  const centralDirectory = concatBytes(centralParts);
  const end = new Uint8Array(22);
  const endView = new DataView(end.buffer);
  writeUint32(endView, 0, 0x06054b50);
  writeUint16(endView, 8, entries.length);
  writeUint16(endView, 10, entries.length);
  writeUint32(endView, 12, centralDirectory.length);
  writeUint32(endView, 16, offset);
  return concatBytes([...localParts, centralDirectory, end]);
}

function safeFileName(value) {
  return String(value).replace(/[\\/:*?"<>|]/g, "_");
}

function downloadSystemLabels() {
  const selectedShipments = getSelectedShipments();
  if (selectedShipments.length === 0) {
    showToast("请在下方列表中勾选要下载系统标签的运单");
    return;
  }

  const mode = document.querySelector('input[name="systemLabelDownloadMode"]:checked')?.value || "split";
  const orderName = selectedShipments.map((shipment) => safeFileName(shipment.orderNo)).join(",");

  if (selectedShipments.length > 1 && mode === "split") {
    const entries = selectedShipments.map((shipment) => ({
      name: `${safeFileName(shipment.orderNo)}+${safeFileName(shipment.customerNo)}.pdf`,
      data: createLabelPdf([shipment]),
    }));
    downloadBlob(`${orderName}.zip`, new Blob([createZip(entries)], { type: "application/zip" }));
    showToast(`正在下载 ${selectedShipments.length} 票分割标签ZIP`);
    return;
  }

  const filename = selectedShipments.length === 1
    ? `${safeFileName(selectedShipments[0].orderNo)}+${safeFileName(selectedShipments[0].customerNo)}.pdf`
    : `${orderName}.pdf`;
  downloadBlob(filename, new Blob([createLabelPdf(selectedShipments)], { type: "application/pdf" }));
  showToast(`正在下载 ${selectedShipments.length} 张系统标签PDF`);
}

function renderSystemLabelWatermarks() {
  if (!systemLabelWatermarkLayer) return;

  systemLabelWatermarkLayer.replaceChildren();
  for (let index = 0; index < 20; index += 1) {
    const mark = document.createElement("span");
    mark.className = "system-label-watermark";
    mark.textContent = "管理员2026-06-22";
    mark.style.left = `${(index % 4) * 31 - 7}%`;
    mark.style.top = `${Math.floor(index / 4) * 20 + 3}%`;
    systemLabelWatermarkLayer.appendChild(mark);
  }
}

function openSystemLabelModal() {
  const selectedShipments = getSelectedShipments();
  if (selectedShipments.length === 0) {
    showToast("请在下方列表中勾选要打印系统标签的运单");
    return;
  }

  if (!systemLabelModal || !systemLabelList) return;

  systemLabelList.replaceChildren(
    ...selectedShipments.map((shipment) => {
      const row = document.createElement("div");
      row.className = "system-label-row";
      row.innerHTML = `
        <span>
          <span class="label-muted">运单号：</span>
          <span class="label-value">${shipment.orderNo}</span>
        </span>
        <span>
          <span class="label-muted">服务：</span>
          <span class="label-value">${shipment.service}</span>
        </span>
        <label>
          <span class="label-muted">标签显示服务：</span>
          <select disabled>
            <option>${shipment.service}</option>
          </select>
        </label>
      `;
      return row;
    })
  );

  renderSystemLabelWatermarks();
  systemLabelModal.classList.toggle("single-waybill", selectedShipments.length === 1);
  systemLabelModal.classList.add("open");
  systemLabelModal.setAttribute("aria-hidden", "false");
}

function closeSystemLabelModal() {
  systemLabelModal?.classList.remove("open");
  systemLabelModal?.classList.remove("single-waybill");
  systemLabelModal?.setAttribute("aria-hidden", "true");
}

document.querySelectorAll(".tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach((item) => item.classList.remove("active"));
    tab.classList.add("active");
  });
});

document.querySelectorAll('[data-client-view]').forEach(link=>link.addEventListener('click',event=>{
  event.preventDefault(); activateClientView(link.dataset.clientView);
}));
document.querySelectorAll('[data-client-module]').forEach(button=>button.addEventListener('click',()=>{
  activateClientView(button.dataset.clientModule==='overseas'?'storage':'waybill');
}));
window.addEventListener('hashchange',activateViewFromHash);

exportToggle?.addEventListener("click", (event) => {
  event.stopPropagation();
  const isOpen = exportMenu.classList.toggle("open");
  exportToggle.setAttribute("aria-expanded", String(isOpen));
});

document.querySelectorAll("[data-export]").forEach((button) => {
  button.addEventListener("click", () => {
    if (button.dataset.export === "attachment") {
      openAttachmentExportModal();
      return;
    }

    exportShipments(button.dataset.export);
    exportMenu?.classList.remove("open");
    exportToggle?.setAttribute("aria-expanded", "false");
  });
});

printLabelToggle?.addEventListener("click", (event) => {
  event.stopPropagation();
  const isOpen = printLabelMenu.classList.toggle("open");
  printLabelToggle.setAttribute("aria-expanded", String(isOpen));
  exportMenu?.classList.remove("open");
  exportToggle?.setAttribute("aria-expanded", "false");
});

document.querySelectorAll("[data-print-label]").forEach((button) => {
  button.addEventListener("click", () => {
    printLabelMenu?.classList.remove("open");
    printLabelToggle?.setAttribute("aria-expanded", "false");

    if (button.dataset.printLabel === "fba") {
      showToast("正在生成货箱专属 FBA 揽收电子吊贴/面单...");
      return;
    }

    openSystemLabelModal();
  });
});

document.querySelector("[data-system-label-close]")?.addEventListener("click", closeSystemLabelModal);
document.querySelector("[data-system-label-print]")?.addEventListener("click", () => {
  showToast(`正在打印 ${getSelectedShipments().length} 张系统标签`);
});
document.querySelector("[data-system-label-download]")?.addEventListener("click", downloadSystemLabels);
document.querySelector("[data-attachment-export-confirm]")?.addEventListener("click", handleExportAttachments);
document.querySelector("[data-attachment-export-cancel]")?.addEventListener("click", closeAttachmentExportModal);

systemLabelModal?.addEventListener("click", (event) => {
  if (event.target === systemLabelModal) {
    closeSystemLabelModal();
  }
});

attachmentExportModal?.addEventListener("click", (event) => {
  if (event.target === attachmentExportModal) {
    closeAttachmentExportModal();
  }
});

document.addEventListener("click", (event) => {
  if (!exportMenu?.contains(event.target)) {
    exportMenu?.classList.remove("open");
    exportToggle?.setAttribute("aria-expanded", "false");
  }
  if (!printLabelMenu?.contains(event.target)) {
    printLabelMenu?.classList.remove("open");
    printLabelToggle?.setAttribute("aria-expanded", "false");
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeSystemLabelModal();
    closeAttachmentExportModal();
  }
});

document.querySelector(".shipment-table thead input[type='checkbox']")?.addEventListener("change", (event) => {
  document.querySelectorAll("#shipmentTableBody input[type='checkbox']").forEach((checkbox) => {
    checkbox.checked = event.target.checked;
  });
});

window.addEventListener("resize", renderWatermarks);
window.addEventListener("load", renderWatermarks);
renderWatermarks();
activateViewFromHash();
