(() => {
  const allowed = new Set(['#overseas-storage', '#instruction-list']);
  if (!allowed.has(location.hash)) location.replace('#overseas-storage');
  const observer = new MutationObserver(() => {
    if (!document.querySelector('main')) return;
    document.title = location.hash === '#instruction-list' ? '指令列表' : '暂存管理';
    window.parent.postMessage({type:'tiantu-overseas-ready',view:location.hash},location.origin);
    observer.disconnect();
  });
  observer.observe(document.documentElement,{childList:true,subtree:true});
})();

// The original detail keyboard navigation includes the hidden fee/operation tab.
// Return to cargo information if that hidden tab is selected by the keyboard.
(() => {
  const keepVisibleDetailTab = () => {
    const hiddenTab = document.querySelector('[role="tab"][id^="instructionDetailTab-"][id$="-2"][aria-selected="true"]');
    if (!hiddenTab) return;
    const firstTab = hiddenTab.parentElement.querySelector('[role="tab"]');
    firstTab?.click();
    firstTab?.focus();
  };
  new MutationObserver(keepVisibleDetailTab).observe(document.documentElement, {
    childList: true, subtree: true, attributes: true, attributeFilter: ['aria-selected']
  });
})();

(() => {
  const allowedActions = new Set(['导出', '查看日志']);
  function limitInstructionActions() {
    const toolbar = document.querySelector('main[aria-label="指令列表"] > section:nth-child(2) > div:nth-child(2)');
    toolbar?.querySelectorAll('button').forEach(button => {
      if (allowedActions.has(button.textContent.trim())) {
        if (!button.hasAttribute('data-client-kept-action')) button.setAttribute('data-client-kept-action','');
      } else if (button.hasAttribute('data-client-kept-action')) button.removeAttribute('data-client-kept-action');
    });
  }
  new MutationObserver(limitInstructionActions).observe(document.documentElement,{childList:true,subtree:true,characterData:true});
  limitInstructionActions();
})();

// Client details permit viewing plus attachment upload/download only.
(() => {
  function isUploadDialog(element) {
    const dialog=element.closest('[role="dialog"][aria-labelledby^="instructionAttachmentTitle-"]');
    return !!dialog && dialog.querySelector('h2')?.textContent.trim()==='上传附件';
  }
  function actionAllowed(button) {
    if(button.getAttribute('role')==='tab')return true;
    const text=button.textContent.trim();
    if(isUploadDialog(button))return ['确定','取消','删除','×'].includes(text);
    return ['上传附件','下载','关闭','×'].includes(text);
  }
  function lockClientDetails() {
    document.querySelectorAll('.instruction-detail-portal[data-client-readonly]').forEach(root=>{
      root.querySelectorAll('button').forEach(button=>{
        if(actionAllowed(button))button.removeAttribute('data-client-mutation');
        else button.setAttribute('data-client-mutation','');
      });
      root.querySelectorAll('input,textarea,select').forEach(input=>{
        if(isUploadDialog(input))return;
        if(input.tagName==='SELECT'||['checkbox','radio','file'].includes(input.type))input.disabled=true;
        else input.readOnly=true;
      });
    });
  }
  document.addEventListener('click',event=>{
    const button=event.target.closest?.('.instruction-detail-portal[data-client-readonly] button');
    if(button&&!actionAllowed(button)){event.preventDefault();event.stopImmediatePropagation();}
  },true);
  new MutationObserver(lockClientDetails).observe(document.documentElement,{childList:true,subtree:true});
  lockClientDetails();
})();
