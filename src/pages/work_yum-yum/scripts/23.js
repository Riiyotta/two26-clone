
(function() {
  var ratios = {
    // HeyGluco Landscape (standard 16:9)
    '1228104808': 16 / 9,
    '1228104805': 16 / 9,
    '1228104804': 16 / 9,
    '1228104777': 16 / 9,
    '1228104776': 16 / 9,
    // HeyGluco Ultrawide Banner (3:1)
    '1228104778': 3 / 1,
    // HeyGluco Vertical videos
    '1228104779': 240 / 322,
    '1228103535': 240 / 308,

    // Other projects
    '1228146154': 2718 / 908,
    '1228146155': 2718 / 908,
    '1228146156': 2826 / 1518,
    '1228146157': 2826 / 1080,
    '1228145968': 2718 / 1518,
    '1228105461': 2718 / 1518,
    '1228105443': 2718 / 1518,
    '1228105442': 2718 / 1518,
    '1228105441': 2718 / 1518,
    '1228105440': 2718 / 700,
    '1228105218': 2718 / 1518,
    '1228105219': 2718 / 1000,
    '1228105147': 2718 / 800,
    '1228105145': 1920 / 1080,
    '1228146502': 2718 / 908,
    '1228146500': 2718 / 908,
    '1228146303': 2718 / 3654
  };

  function fixVideos() {
    var boxes = document.querySelectorAll('.video-embed-box');
    boxes.forEach(function(box) {
      box.style.background = 'transparent';
      var iframe = box.querySelector('iframe');
      if (!iframe) return;
      
      // Apply scale to eliminate any edge bars
      iframe.style.position = 'absolute';
      iframe.style.top = '50%';
      iframe.style.left = '50%';
      iframe.style.width = '100%';
      iframe.style.height = '100%';
      iframe.style.transform = 'translate(-50%, -50%) scale(1.025)';
      iframe.style.border = '0';

      var src = iframe.getAttribute('src') || '';
      for (var id in ratios) {
        if (src.indexOf(id) !== -1) {
          box.style.aspectRatio = ratios[id];
          box.style.width = '100%';
          box.style.maxWidth = 'none';
          var parent = box.closest('.project-video');
          if (parent) {
            parent.style.width = '100%';
            parent.style.maxWidth = 'none';
          }
          return;
        }
      }

      var m = src.match(/video\/(\d+)/);
      if (m) {
        fetch('https://vimeo.com/api/oembed.json?url=https://vimeo.com/' + m[1])
          .then(function(res) { return res.json(); })
          .then(function(d) {
            if (d && d.width && d.height) {
              box.style.aspectRatio = d.width + ' / ' + d.height;
              box.style.width = '100%';
              box.style.maxWidth = 'none';
            }
          }).catch(function() {});
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', fixVideos);
  } else {
    fixVideos();
  }
  setTimeout(fixVideos, 100);
  setTimeout(fixVideos, 500);
  setTimeout(fixVideos, 1500);
})();
