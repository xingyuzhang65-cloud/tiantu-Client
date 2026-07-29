(() => {
  const drawerId = 'overseas-operation-instruction-drawer';

  const closeDrawer = () => document.getElementById(drawerId)?.remove();

  const openDrawer = () => {
    closeDrawer();

    const drawer = document.createElement('div');
    drawer.id = drawerId;
    drawer.innerHTML = `
      <style>
        #${drawerId} { position: fixed; inset: 0; z-index: 9999; font-family: Arial, \"Microsoft YaHei\", sans-serif; }
        #${drawerId} .oi-mask { position: absolute; inset: 0; background: rgba(0, 0, 0, .45); }
        #${drawerId} .oi-panel { position: absolute; right: 0; top: 0; display: flex; height: 100%; width: min(1080px, 78vw); flex-direction: column; background: #fff; box-shadow: -8px 0 26px rgba(15, 23, 42, .18); color: #334155; }
        #${drawerId} .oi-header { display: flex; height: 54px; align-items: center; justify-content: space-between; border-bottom: 1px solid #e5e7eb; padding: 0 22px; font-size: 15px; font-weight: 700; }
        #${drawerId} .oi-close { border: 0; background: transparent; color: #64748b; cursor: pointer; font-size: 25px; line-height: 1; }
        #${drawerId} .oi-content { flex: 1; overflow: auto; padding: 20px 28px; }
        #${drawerId} .oi-summary { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px 32px; border-bottom: 1px solid #eef2f7; padding: 0 4px 18px; font-size: 12px; }
        #${drawerId} .oi-summary b { color: #0f172a; }
        #${drawerId} .oi-form { margin-top: 20px; }
        #${drawerId} .oi-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 17px 44px; }
        #${drawerId} label, #${drawerId} .oi-field { display: flex; align-items: center; gap: 10px; font-size: 12px; }
        #${drawerId} .oi-label { width: 78px; flex: 0 0 78px; text-align: right; color: #334155; }
        #${drawerId} .oi-required::before { content: '*'; margin-right: 3px; color: #ef4444; }
        #${drawerId} input, #${drawerId} select, #${drawerId} textarea { box-sizing: border-box; width: 100%; border: 1px solid #d8dee8; border-radius: 2px; background: #fff; color: #334155; font: inherit; outline: none; }
        #${drawerId} input, #${drawerId} select { height: 30px; padding: 0 10px; }
        #${drawerId} input:focus, #${drawerId} select:focus, #${drawerId} textarea:focus { border-color: #1677ff; box-shadow: 0 0 0 2px rgba(22,119,255,.08); }
        #${drawerId} .oi-radio { width: auto; height: auto; accent-color: #1677ff; }
        #${drawerId} .oi-radio-wrap { display: flex; align-items: center; gap: 16px; }
        #${drawerId} .oi-radio-wrap label { gap: 5px; }
        #${drawerId} .oi-upload { width: auto; border: 1px solid #d8dee8; background: #fff; padding: 6px 13px; color: #334155; cursor: pointer; }
        #${drawerId} .oi-section { margin-top: 28px; border-top: 1px solid #eef2f7; padding: 20px 4px 0; }
        #${drawerId} .oi-section-title { margin-bottom: 16px; font-size: 13px; font-weight: 700; color: #475569; }
        #${drawerId} .oi-services { display: grid; grid-template-columns: 1.2fr 1fr; gap: 34px; }
        #${drawerId} .oi-checks { display: grid; grid-template-columns: repeat(4, minmax(74px, 1fr)); gap: 12px 20px; }
        #${drawerId} .oi-checks label { gap: 6px; white-space: nowrap; }
        #${drawerId} .oi-checks input { width: auto; height: auto; accent-color: #1677ff; }
        #${drawerId} textarea { min-height: 130px; padding: 9px 10px; resize: vertical; }
        #${drawerId} .oi-footer { display: flex; justify-content: flex-end; gap: 12px; border-top: 1px solid #e5e7eb; padding: 15px 28px; }
        #${drawerId} .oi-button { min-width: 74px; border: 1px solid #d8dee8; border-radius: 2px; background: #fff; padding: 7px 16px; color: #475569; cursor: pointer; font-size: 12px; }
        #${drawerId} .oi-primary { border-color: #1677ff; background: #1677ff; color: #fff; }
      </style>
      <div class="oi-mask" data-close></div>
      <aside class="oi-panel" role="dialog" aria-modal="true" aria-label="操作指令">
        <header class="oi-header"><span>操作指令</span><button class="oi-close" type="button" aria-label="关闭" data-close>×</button></header>
        <div class="oi-content">
          <div class="oi-summary">
            <div><b>柜号：</b>当前中转单</div><div><b>派送方式：</b>Truck-Amazon</div><div><b>托盘标签：</b>待生成</div>
            <div><b>转运方式：</b>拆转</div><div><b>未发货箱数：</b>0</div>
          </div>
          <form class="oi-form">
            <div class="oi-grid">
              <div class="oi-field"><span class="oi-label oi-required">发货申请</span><div class="oi-radio-wrap"><label><input class="oi-radio" name="address" type="radio" checked> FBA</label><label><input class="oi-radio" name="address" type="radio"> 其他地址</label></div></div>
              <label><span class="oi-label oi-required">目的地</span><select><option>请选择</option><option>美国 CA</option><option>美国 TX</option></select></label>
              <label><span class="oi-label oi-required">Shipment ID</span><input placeholder="请输入"></label>
              <label><span class="oi-label oi-required">派送方式</span><select><option>Truck-Amazon</option><option>快递派送</option><option>客户自提</option></select></label>
              <label><span class="oi-label oi-required">Reference ID</span><input placeholder="请输入"></label>
              <label><span class="oi-label oi-required">箱数</span><input type="number" min="1" placeholder="请输入"></label>
              <label><span class="oi-label oi-required">预约发货时间</span><input type="date"></label>
              <div class="oi-field"><span class="oi-label">附件上传</span><button class="oi-upload" type="button">上传附件</button></div>
              <label style="grid-column: 2"><span class="oi-label">备注</span><input placeholder="请输入"></label>
            </div>
            <section class="oi-section">
              <div class="oi-section-title">增值服务</div>
              <div class="oi-services">
                <div class="oi-checks">
                  ${['贴标','测量尺寸','测量重量','验货','拍照','拍视频','销毁','撕标','重新打板','分拣','开箱'].map((label) => `<label><input type="checkbox">${label}</label>`).join('')}
                </div>
              </div>
            </section>
          </form>
        </div>
        <footer class="oi-footer"><button class="oi-button" type="button" data-close>取消</button><button class="oi-button oi-primary" type="button" data-confirm>确定</button></footer>
      </aside>`;
    document.body.append(drawer);
    drawer.querySelectorAll('[data-close]').forEach((button) => button.addEventListener('click', closeDrawer));
    drawer.querySelector('[data-confirm]').addEventListener('click', () => {
      closeDrawer();
      window.alert('操作指令已保存');
    });
  };

  const instructionOptions = ['贴标', '测量尺寸', '测量重量', '验货', '拍照', '拍视频', '销毁', '撕标', '重新打板', '分拣', '开箱'];

  const ensureInlineStyles = () => {
    if (document.getElementById('operation-instruction-inline-style')) return;
    const style = document.createElement('style');
    style.id = 'operation-instruction-inline-style';
    style.textContent = `
      .operation-instruction-selector { margin: 0 12px 18px; border: 1px solid #dbe5f0; border-radius: 4px; background: #f8fbff; padding: 15px 18px; }
      .operation-instruction-selector__title { display: flex; align-items: center; justify-content: space-between; margin-bottom: 13px; color: #334155; font-size: 12px; font-weight: 700; }
      .operation-instruction-selector__count { color: #1677ff; font-weight: 500; }
      .operation-instruction-selector__body { display: grid; grid-template-columns: minmax(460px, 1.35fr) minmax(260px, .65fr); gap: 24px; }
      .operation-instruction-selector__checks { display: grid; grid-template-columns: repeat(4, minmax(84px, 1fr)); gap: 12px 18px; align-content: start; }
      .operation-instruction-selector label { display: inline-flex; align-items: center; gap: 6px; color: #475569; font-size: 12px; white-space: nowrap; }
      .operation-instruction-selector input { width: 14px; height: 14px; accent-color: #1677ff; }
      .operation-instruction-selector textarea { box-sizing: border-box; width: 100%; min-height: 82px; resize: vertical; border: 1px solid #d8dee8; border-radius: 3px; padding: 8px 10px; color: #334155; font: 12px Arial, \"Microsoft YaHei\", sans-serif; outline: none; }
      .operation-instruction-selector textarea:focus { border-color: #1677ff; box-shadow: 0 0 0 2px rgba(22,119,255,.08); }
      .operation-instruction-selector__remark { display: grid; grid-template-columns: 92px 1fr; align-items: start; gap: 8px; color: #475569; font-size: 12px; }
      .reference-instruction-form { color: #334155; font: 12px Arial, \"Microsoft YaHei\", sans-serif; }
      .reference-instruction-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px 44px; padding: 0 12px 22px; }
      .reference-field { display: flex; min-width: 0; align-items: center; gap: 10px; }
      .reference-label { width: 92px; flex: 0 0 92px; text-align: right; color: #334155; }
      .reference-label.required::before { content: '*'; margin-right: 3px; color: #ef4444; }
      .reference-field input:not([type=radio]), .reference-field select { box-sizing: border-box; width: 100%; height: 30px; border: 1px solid #d8dee8; border-radius: 2px; padding: 0 10px; color: #334155; font: inherit; outline: none; }
      .reference-field input:focus, .reference-field select:focus { border-color: #1677ff; box-shadow: 0 0 0 2px rgba(22,119,255,.08); }
      .reference-radios { display: flex; gap: 16px; }
      .reference-radios label, .reference-services label { display: inline-flex; align-items: center; gap: 6px; white-space: nowrap; }
      .reference-radios input, .reference-services input { width: 14px; height: 14px; accent-color: #1677ff; }
      .reference-upload { height: 30px; border: 1px solid #d8dee8; border-radius: 2px; background: #fff; padding: 0 15px; color: #475569; cursor: pointer; font-size: 12px; }
      .reference-service-row { display: grid; grid-template-columns: 92px 1fr; gap: 16px; border-top: 1px solid #eef2f7; padding: 20px 12px; }
      .reference-service-title { padding-top: 2px; color: #475569; font-weight: 700; }
      .reference-services { display: grid; grid-template-columns: repeat(4, minmax(78px, 1fr)); gap: 12px 17px; align-content: start; }
      .reference-actions { display: flex; justify-content: flex-end; gap: 12px; border-top: 1px solid #eef2f7; padding: 14px 12px 0; }
      .reference-actions button { min-width: 72px; height: 30px; border: 1px solid #d8dee8; border-radius: 2px; background: #fff; color: #475569; cursor: pointer; font-size: 12px; }
      .reference-actions .reference-confirm { border-color: #1677ff; background: #1677ff; color: #fff; }
    `;
    document.head.append(style);
  };

  const mountInlineSelector = () => {
    const title = Array.from(document.querySelectorAll('section h3')).find(
      (element) => element.textContent.trim() === '操作指令',
    );
    if (!title) return;

    const section = title.closest('section');
    if (!section || section.dataset.referenceInstructionForm === 'true') return;

    ensureInlineStyles();
    section.dataset.referenceInstructionForm = 'true';
    section.innerHTML = `
      <h3 class="mb-5 pl-3 text-sm font-bold text-slate-950">操作指令</h3>
      <div class="reference-instruction-form">
        <div class="reference-service-row">
          <div class="reference-service-title">增值服务</div>
          <div class="reference-services">
            ${instructionOptions.map((label) => `<label><input type="checkbox" value="${label}">${label}</label>`).join('')}
          </div>
        </div>
      </div>`;
  };

  document.addEventListener('DOMContentLoaded', () => {
    mountInlineSelector();
    new MutationObserver(mountInlineSelector).observe(document.body, { childList: true, subtree: true });
  });
})();
