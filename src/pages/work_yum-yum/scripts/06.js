
    (function() {
      var currentScript = document.currentScript;
      var container = currentScript.parentElement;
      var link = "https://player.vimeo.com/video/1229232293?h=0ba8619de1&background=1&autoplay=1&loop=1&muted=1&playsinline=1".trim();

      if (!link) return;

      // Force parent .project-video to 100% full width
      var projectVideoParent = container.closest('.project-video');
      if (projectVideoParent) {
        projectVideoParent.style.width = '100%';
        projectVideoParent.style.maxWidth = 'none';
      }

      // Exact natural aspect ratios
      var ratios = {
        // HeyGluco Landscape (standard 16:9)
        '1228104808': 16 / 9,
        '1228104805': 16 / 9,
        '1228104804': 16 / 9,
        '1228104777': 16 / 9,
        '1228104776': 16 / 9,
        // HeyGluco Ultrawide Banner (3:1)
        '1228104778': 3 / 1,
        // HeyGluco Vertical
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

      var matchedRatio = 16 / 9;
      var found = false;
      for (var id in ratios) {
        if (link.indexOf(id) !== -1) {
          matchedRatio = ratios[id];
          found = true;
          break;
        }
      }

      container.style.width = '100%';
      container.style.maxWidth = 'none';
      container.style.aspectRatio = matchedRatio;

      if (!found) {
        var m = link.match(/video\/(\d+)/);
        if (m) {
          fetch('https://vimeo.com/api/oembed.json?url=https://vimeo.com/' + m[1])
            .then(function(res) { return res.json(); })
            .then(function(d) {
              if (d && d.width && d.height) {
                container.style.aspectRatio = d.width + ' / ' + d.height;
              }
            }).catch(function() {});
        }
      }

      if (link.indexOf('player.vimeo.com') !== -1 || link.indexOf('vimeo.com') !== -1) {
        var embedUrl = link;
        if (embedUrl.indexOf('background=1') === -1) {
          embedUrl += (embedUrl.indexOf('?') !== -1 ? '&' : '?') + 'background=1&autoplay=1&loop=1&muted=1&playsinline=1';
        }

        var iframe = document.createElement('iframe');
        iframe.src = embedUrl;
        iframe.setAttribute('frameborder', '0');
        iframe.setAttribute('allow', 'autoplay; fullscreen; picture-in-picture');
        iframe.setAttribute('playsinline', '');
        // Centered + 1.025 scale eliminates any side gaps or player letterboxing
        iframe.style.cssText = 'position: absolute; top: 50%; left: 50%; width: 100%; height: 100%; transform: translate(-50%, -50%) scale(1.025); border: 0; pointer-events: none;';
        container.appendChild(iframe);
      } else {
        var video = document.createElement('video');
        video.autoplay = true;
        video.loop = true;
        video.muted = true;
        video.playsInline = true;
        video.style.cssText = 'width: 100%; height: auto; display: block; object-fit: cover;';
        var source = document.createElement('source');
        source.src = link;
        source.type = 'video/mp4';
        video.appendChild(source);
        container.appendChild(video);
      }
    })();
  