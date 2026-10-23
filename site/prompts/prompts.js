// Prompt library page: Copy and Share buttons. Saves nothing, sends nothing.
(function () {
  'use strict';
  var status = document.createElement('p');
  status.className = 'status';
  status.setAttribute('role', 'status');
  status.setAttribute('aria-live', 'polite');
  document.body.appendChild(status);

  function say(message) {
    status.textContent = message;
    setTimeout(function () { status.textContent = ''; }, 5000);
  }

  // Selecting the text is the fallback when the clipboard API is not allowed.
  function selectText(pre) {
    var details = pre.closest('details');
    if (details) details.open = true;
    var range = document.createRange();
    range.selectNodeContents(pre);
    var selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
  }

  document.addEventListener('click', function (event) {
    var copy = event.target.closest('[data-copy]');
    var share = event.target.closest('[data-share]');
    if (copy) {
      var pre = document.getElementById(copy.getAttribute('data-copy'));
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(pre.textContent).then(function () {
          say('Prompt copied. Open your AI chat and paste it.');
        }, function () { selectText(pre); say('Text selected. Use Copy on your device.'); });
      } else { selectText(pre); say('Text selected. Use Copy on your device.'); }
    }
    if (share) {
      var text = document.getElementById(share.getAttribute('data-share')).textContent;
      navigator.share({ text: text }).catch(function () { /* the user closed the share sheet */ });
    }
  });

  // On phones, "Share" can send the prompt straight to an installed AI chat app.
  if (navigator.share) {
    document.querySelectorAll('[data-share]').forEach(function (b) { b.hidden = false; });
  }
}());
