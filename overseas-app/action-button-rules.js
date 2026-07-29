/*
 * Keep overseas list actions aligned with the approved workflow without
 * altering React's table DOM.  React re-renders the toolbar when a status is
 * switched, so the rules are reapplied after every relevant DOM update.
 */
(function () {
  'use strict';

  var LOG_ACTIONS = new Set(['日志', '查看日志']);
  var queryView = new URLSearchParams(window.location.search).get('view');
  var currentView = queryView ? 'overseas-' + queryView : (window.location.hash || '');

  function textOf(element) {
    return (element.textContent || '').replace(/\s+/g, ' ').trim();
  }

  function hide(action) {
    if (action.dataset.overseasActionRuleHidden === 'true') return;
    action.dataset.overseasActionRuleHidden = 'true';
    action.style.setProperty('display', 'none', 'important');
    action.setAttribute('aria-hidden', 'true');
    action.tabIndex = -1;
  }

  function clearPreviousRules() {
    document.querySelectorAll('[data-overseas-action-rule-hidden="true"]').forEach(function (action) {
      action.style.removeProperty('display');
      action.removeAttribute('aria-hidden');
      action.removeAttribute('tabindex');
      delete action.dataset.overseasActionRuleHidden;
    });
  }

  function removeLogActions() {
    document.querySelectorAll('button, [role="button"]').forEach(function (action) {
      if (LOG_ACTIONS.has(textOf(action))) hide(action);
    });
  }

  function isTransitToolbar(toolbar) {
    if (!toolbar.classList.contains('mb-3') ||
        !toolbar.classList.contains('flex') ||
        !toolbar.classList.contains('items-center') ||
        !toolbar.classList.contains('gap-3')) return false;

    return Array.from(toolbar.children).some(function (child) {
      return child.matches('button, [role="button"]') && textOf(child) === '导出';
    });
  }

  function applyTransitActionRules() {
    document.querySelectorAll('div').forEach(function (toolbar) {
      if (!isTransitToolbar(toolbar)) return;

      var actions = Array.from(toolbar.children).filter(function (child) {
        return child.matches('button, [role="button"]');
      });
      var pending = actions.some(function (action) { return textOf(action) === '已确认'; });
      var rejected = actions.some(function (action) { return textOf(action) === '重新下单' || textOf(action) === '作废'; });
      var allowed = pending ? new Set(['取消下单', '导出']) : rejected ? new Set(['重新下单', '作废', '导出']) : new Set(['导出']);

      actions.forEach(function (action) {
        if (!allowed.has(textOf(action))) hide(action);
      });
    });
  }

  function applyRules() {
    clearPreviousRules();
    if (currentView.indexOf('overseas-transit') !== -1) {
      removeLogActions();
      applyTransitActionRules();
    } else if (currentView.indexOf('overseas-storage') !== -1) {
      removeLogActions();
    }
  }

  var queued = false;
  function scheduleApply() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(function () {
      queued = false;
      applyRules();
    });
  }

  new MutationObserver(scheduleApply).observe(document.documentElement, {
    childList: true,
    subtree: true
  });
  window.addEventListener('hashchange', function () {
    currentView = window.location.hash || currentView;
    scheduleApply();
  });
  window.addEventListener('message', function (event) {
    if (event.data && event.data.type === 'tiantu-overseas-view' &&
        (event.data.view === 'storage' || event.data.view === 'transit')) {
      currentView = 'overseas-' + event.data.view;
      scheduleApply();
    }
  });
  document.addEventListener('click', function () { setTimeout(scheduleApply, 0); }, true);
  scheduleApply();
})();


