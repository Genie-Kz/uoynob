/* シェアボタン・URLコピーの配線（元サイトのシェア機能をクライアントサイドで再現） */
(function () {
  'use strict';
  function wire() {
    var url = location.href;
    var title = document.title;
    var u = encodeURIComponent(url);
    var t = encodeURIComponent(title);
    var map = {
      'sharebtn-twitter': 'https://twitter.com/intent/tweet?text=' + t + '&url=' + u,
      'sharebtn-fb': 'https://www.facebook.com/sharer/sharer.php?u=' + u,
      'sharebtn-hatena': 'https://b.hatena.ne.jp/entry/' + url.replace(/^https?:\/\//, ''),
      'sharebtn-line': 'https://social-plugins.line.me/lineit/share?url=' + u
    };
    Object.keys(map).forEach(function (id) {
      var a = document.getElementById(id);
      if (a) a.href = map[id];
    });
    var copy = document.getElementById('copy-url');
    if (copy) {
      copy.style.cursor = 'pointer';
      copy.addEventListener('click', function () {
        if (navigator.clipboard) {
          navigator.clipboard.writeText(url).then(function () {
            var orig = copy.innerHTML;
            copy.innerHTML = '<small>Copied!</small>';
            setTimeout(function () { copy.innerHTML = orig; }, 1200);
          });
        }
      });
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', wire);
  else wire();
})();
