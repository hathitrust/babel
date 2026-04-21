'use strict';
function _typeof(e) {
  return (_typeof =
    'function' == typeof Symbol && 'symbol' == typeof Symbol.iterator
      ? function (e) {
          return typeof e;
        }
      : function (e) {
          return e && 'function' == typeof Symbol && e.constructor === Symbol && e !== Symbol.prototype
            ? 'symbol'
            : typeof e;
        })(e);
}
function _defineProperty(e, t, n) {
  return (
    t in e ? Object.defineProperty(e, t, { value: n, enumerable: !0, configurable: !0, writable: !0 }) : (e[t] = n),
    e
  );
}
function _typeof(e) {
  return (_typeof =
    'function' == typeof Symbol && 'symbol' == typeof Symbol.iterator
      ? function (e) {
          return typeof e;
        }
      : function (e) {
          return e && 'function' == typeof Symbol && e.constructor === Symbol && e !== Symbol.prototype
            ? 'symbol'
            : typeof e;
        })(e);
}
(!(function (r, i) {
  var t = r.document,
    e = r.navigator,
    n = r.location,
    a = t.documentElement,
    o = [],
    s = {
      screens: [240, 320, 480, 640, 768, 800, 1024, 1280, 1440, 1680, 1920],
      screensCss: { gt: !0, gte: !1, lt: !0, lte: !1, eq: !1 },
      browsers: [{ ie: { min: 6, max: 11 } }],
      browserCss: { gt: !0, gte: !1, lt: !0, lte: !1, eq: !0 },
      html5: !0,
      page: '-page',
      section: '-section',
      head: 'head',
    };
  if (r.head_conf) for (var c in r.head_conf) r.head_conf[c] !== i && (s[c] = r.head_conf[c]);
  function u(e) {
    o[o.length] = e;
  }
  function l(e) {
    var t = new RegExp(' ?\\b' + e + '\\b');
    a.className = a.className.replace(t, '');
  }
  function d(e, t) {
    for (var n = 0, o = e.length; n < o; n++) t.call(e, e[n], n);
  }
  var f = (r[s.head] = function () {
    f.ready.apply(null, arguments);
  });
  ((f.feature = function (e, t, n) {
    return (
      e
        ? ('[object Function]' === Object.prototype.toString.call(t) && (t = t.call()),
          u((t ? '' : 'no-') + e),
          (f[e] = !!t),
          n || (l('no-' + e), l(e), f.feature()))
        : ((a.className += ' ' + o.join(' ')), (o = [])),
      f
    );
  }),
    f.feature('js', !0));
  var m = e.userAgent.toLowerCase(),
    p = /mobile|android|kindle|silk|midp|phone|(windows .+arm|touch)/.test(m);
  (f.feature('mobile', p, !0), f.feature('desktop', !p, !0));
  var h = (m =
      /(chrome|firefox)[ \/]([\w.]+)/.exec(m) ||
      /(iphone|ipad|ipod)(?:.*version)?[ \/]([\w.]+)/.exec(m) ||
      /(android)(?:.*version)?[ \/]([\w.]+)/.exec(m) ||
      /(webkit|opera)(?:.*version)?[ \/]([\w.]+)/.exec(m) ||
      /(msie) ([\w.]+)/.exec(m) ||
      /(trident).+rv:(\w.)+/.exec(m) ||
      [])[1],
    g = parseFloat(m[2]);
  switch (h) {
    case 'msie':
    case 'trident':
      ((h = 'ie'), (g = t.documentMode || g));
      break;
    case 'firefox':
      h = 'ff';
      break;
    case 'ipod':
    case 'ipad':
    case 'iphone':
      h = 'ios';
      break;
    case 'webkit':
      h = 'safari';
  }
  ((f.browser = { name: h, version: g }), (f.browser[h] = !0));
  for (var v = 0, w = s.browsers.length; v < w; v++)
    for (var y in s.browsers[v])
      if (h === y) {
        u(y);
        for (var b = s.browsers[v][y].min, T = s.browsers[v][y].max, E = b; E <= T; E++)
          E < g
            ? (s.browserCss.gt && u('gt-' + y + E), s.browserCss.gte && u('gte-' + y + E))
            : g < E
              ? (s.browserCss.lt && u('lt-' + y + E), s.browserCss.lte && u('lte-' + y + E))
              : g === E &&
                (s.browserCss.lte && u('lte-' + y + E),
                s.browserCss.eq && u('eq-' + y + E),
                s.browserCss.gte && u('gte-' + y + E));
      } else u('no-' + y);
  function x() {
    a.className = a.className.replace(
      / (w-|eq-|gt-|gte-|lt-|lte-|portrait|no-portrait|landscape|no-landscape)\d+/g,
      '',
    );
    var t = r.innerWidth || a.clientWidth,
      e = r.outerWidth || r.screen.width;
    ((f.screen.innerWidth = t),
      (f.screen.outerWidth = e),
      u('w-' + t),
      d(s.screens, function (e) {
        e < t
          ? (s.screensCss.gt && u('gt-' + e), s.screensCss.gte && u('gte-' + e))
          : t < e
            ? (s.screensCss.lt && u('lt-' + e), s.screensCss.lte && u('lte-' + e))
            : t === e &&
              (s.screensCss.lte && u('lte-' + e), s.screensCss.eq && u('e-q' + e), s.screensCss.gte && u('gte-' + e));
      }));
    var n = r.innerHeight || a.clientHeight,
      o = r.outerHeight || r.screen.height;
    ((f.screen.innerHeight = n),
      (f.screen.outerHeight = o),
      f.feature('portrait', t < n),
      f.feature('landscape', n < t));
  }
  (u(h),
    u(h + parseInt(g, 10)),
    s.html5 &&
      'ie' === h &&
      g < 9 &&
      d(
        'abbr|article|aside|audio|canvas|details|figcaption|figure|footer|header|hgroup|main|mark|meter|nav|output|progress|section|summary|time|video'.split(
          '|',
        ),
        function (e) {
          t.createElement(e);
        },
      ),
    d(n.pathname.split('/'), function (e, t) {
      var n, o;
      2 < this.length && this[t + 1] !== i
        ? t &&
          u(
            this.slice(t, t + 1)
              .join('-')
              .toLowerCase() + s.section,
          )
        : (0 < (o = (n = e || 'index').indexOf('.')) && (n = n.substring(0, o)),
          (a.id = n.toLowerCase() + s.page),
          t || u('root' + s.section));
    }),
    (f.screen = { height: r.screen.height, width: r.screen.width }),
    x());
  var _ = 0;
  function H() {
    (r.clearTimeout(_), (_ = r.setTimeout(x, 50)));
  }
  r.addEventListener ? r.addEventListener('resize', H, !1) : r.attachEvent('onresize', H);
})(window),
  (function (e, n) {
    var t = e.document.createElement('i'),
      o = t.style,
      r = ' -o- -moz- -ms- -webkit- -khtml- '.split(' '),
      i = 'Webkit Moz O ms Khtml'.split(' '),
      a = (e.head_conf && e.head_conf.head) || 'head',
      s = e[a];
    function c(e) {
      var t = e.charAt(0).toUpperCase() + e.substr(1);
      return !!(function (e) {
        for (var t in e) if (o[e[t]] !== n) return 1;
      })((e + ' ' + i.join(t + ' ') + t).split(' '));
    }
    var u = {
      gradient: function () {
        var e = 'background-image:';
        return (
          (o.cssText = (
            e +
            r.join('gradient(linear,left top,right bottom,from(#9f9),to(#fff));' + e) +
            r.join('linear-gradient(left top,#eee,#fff);' + e)
          ).slice(0, -e.length)),
          !!o.backgroundImage
        );
      },
      rgba: function () {
        return ((o.cssText = 'background-color:rgba(0,0,0,0.5)'), !!o.backgroundColor);
      },
      opacity: function () {
        return '' === t.style.opacity;
      },
      textshadow: function () {
        return '' === o.textShadow;
      },
      multiplebgs: function () {
        o.cssText = 'background:url(https://),url(https://),red url(https://)';
        var e = (o.background || '').match(/url/g);
        return '[object Array]' === Object.prototype.toString.call(e) && 3 === e.length;
      },
      boxshadow: function () {
        return c('boxShadow');
      },
      borderimage: function () {
        return c('borderImage');
      },
      borderradius: function () {
        return c('borderRadius');
      },
      cssreflections: function () {
        return c('boxReflect');
      },
      csstransforms: function () {
        return c('transform');
      },
      csstransitions: function () {
        return c('transition');
      },
      touch: function () {
        return 'ontouchstart' in e;
      },
      retina: function () {
        return 1 < e.devicePixelRatio;
      },
      fontface: function () {
        var e = s.browser.name,
          t = s.browser.version;
        switch (e) {
          case 'ie':
            return 9 <= t;
          case 'chrome':
            return 13 <= t;
          case 'ff':
            return 6 <= t;
          case 'ios':
            return 5 <= t;
          case 'android':
            return !1;
          case 'webkit':
            return 5.1 <= t;
          case 'opera':
            return 10 <= t;
          default:
            return !1;
        }
      },
    };
    for (var l in u) u[l] && s.feature(l, u[l].call(), !0);
    s.feature();
  })(window),
  (function (c, o) {
    var i,
      u = c.document,
      a = [],
      s = {},
      l = {},
      e = 'async' in u.createElement('script') || 'MozAppearance' in u.documentElement.style || c.opera,
      t = (c.head_conf && c.head_conf.head) || 'head',
      d = (c[t] =
        c[t] ||
        function () {
          d.ready.apply(null, arguments);
        }),
      n = 1,
      r = 2,
      f = 3,
      m = 4;
    function p() {}
    function h(e, t) {
      if (e) {
        'object' === _typeof(e) && (e = [].slice.call(e));
        for (var n = 0, o = e.length; n < o; n++) t.call(e, e[n], n);
      }
    }
    function g(e, t) {
      var n = Object.prototype.toString.call(t).slice(8, -1);
      return t !== o && null !== t && n === e;
    }
    function v(e) {
      return g('Function', e);
    }
    function w(e) {
      return g('Array', e);
    }
    function y(e) {
      (e = e || p)._done || (e(), (e._done = 1));
    }
    function b(e) {
      var t,
        n,
        o,
        r = {};
      if ('object' === _typeof(e)) for (var i in e) e[i] && (r = { name: i, url: e[i] });
      else
        r = {
          name: ((t = e.split('/')), (n = t[t.length - 1]), -1 !== (o = n.indexOf('?')) ? n.substring(0, o) : n),
          url: e,
        };
      var a = l[r.name];
      return a && a.url === r.url ? a : (l[r.name] = r);
    }
    function T(e) {
      for (var t in (e = e || l)) if (e.hasOwnProperty(t) && e[t].state !== m) return;
      return 1;
    }
    function E(t) {
      t.state === o &&
        ((t.state = n),
        (t.onpreload = []),
        _({ url: t.url, type: 'cache' }, function () {
          var e;
          (((e = t).state = r),
            h(e.onpreload, function (e) {
              e.call();
            }));
        }));
    }
    function x(e, t) {
      ((t = t || p),
        e.state !== m
          ? e.state !== f
            ? e.state !== n
              ? ((e.state = f),
                _(e, function () {
                  ((e.state = m),
                    t(),
                    h(s[e.name], function (e) {
                      y(e);
                    }),
                    i &&
                      T() &&
                      h(s.ALL, function (e) {
                        y(e);
                      }));
                }))
              : e.onpreload.push(function () {
                  x(e, t);
                })
            : d.ready(e.name, t)
          : t());
    }
    function _(o, t) {
      function e(e) {
        ((e = e || c.event), (i.onload = i.onreadystatechange = i.onerror = null), t());
      }
      function r(e) {
        ('load' === (e = e || c.event).type ||
          (/loaded|complete/.test(i.readyState) && (!u.documentMode || u.documentMode < 9))) &&
          (c.clearTimeout(o.errorTimeout),
          c.clearTimeout(o.cssTimeout),
          (i.onload = i.onreadystatechange = i.onerror = null),
          t());
      }
      var i, n, a;
      ((t = t || p),
        'css' === ((n = o.url), (a = (n = n || '').split('?')[0].split('.'))[a.length - 1].toLowerCase())
          ? (((i = u.createElement('link')).type = 'text/' + (o.type || 'css')),
            (i.rel = 'stylesheet'),
            (i.href = o.url),
            (o.cssRetries = 0),
            (o.cssTimeout = c.setTimeout(function e() {
              if (o.state !== m && o.cssRetries <= 20) {
                for (var t = 0, n = u.styleSheets.length; t < n; t++)
                  if (u.styleSheets[t].href === i.href) return void r({ type: 'load' });
                (o.cssRetries++, (o.cssTimeout = c.setTimeout(e, 250)));
              }
            }, 500)))
          : (((i = u.createElement('script')).type = 'text/' + (o.type || 'javascript')), (i.src = o.url)),
        (i.onload = i.onreadystatechange = r),
        (i.onerror = e),
        (i.async = !1),
        (i.defer = !1),
        (o.errorTimeout = c.setTimeout(function () {
          e({ type: 'timeout' });
        }, 7e3)));
      var s = u.head || u.getElementsByTagName('head')[0];
      s.insertBefore(i, s.lastChild);
    }
    function H() {
      if (!u.body) return (c.clearTimeout(d.readyTimeout), void (d.readyTimeout = c.setTimeout(H, 50)));
      i ||
        ((i = !0),
        (function () {
          for (var e = u.getElementsByTagName('script'), t = 0, n = e.length; t < n; t++) {
            var o = e[t].getAttribute('data-headjs-load');
            if (o) return d.load(o);
          }
        })(),
        h(a, function (e) {
          y(e);
        }));
    }
    function C() {
      u.addEventListener
        ? (u.removeEventListener('DOMContentLoaded', C, !1), H())
        : 'complete' === u.readyState && (u.detachEvent('onreadystatechange', C), H());
    }
    if ('complete' === u.readyState) H();
    else if (u.addEventListener) (u.addEventListener('DOMContentLoaded', C, !1), c.addEventListener('load', H, !1));
    else {
      (u.attachEvent('onreadystatechange', C), c.attachEvent('onload', H));
      var k = !1;
      try {
        k = !c.frameElement && u.documentElement;
      } catch (e) {}
      k &&
        k.doScroll &&
        !(function t() {
          if (!i) {
            try {
              k.doScroll('left');
            } catch (e) {
              return (c.clearTimeout(d.readyTimeout), void (d.readyTimeout = c.setTimeout(t, 50)));
            }
            H();
          }
        })();
    }
    ((d.load = d.js =
      e
        ? function () {
            var e = arguments,
              n = e[e.length - 1],
              o = {};
            return (
              v(n) || (n = null),
              w(e[0])
                ? (e[0].push(n), d.load.apply(null, e[0]))
                : (h(e, function (e, t) {
                    e !== n && ((e = b(e)), (o[e.name] = e));
                  }),
                  h(e, function (e, t) {
                    e !== n &&
                      x((e = b(e)), function () {
                        T(o) && y(n);
                      });
                  })),
              d
            );
          }
        : function () {
            var e = arguments,
              t = e[e.length - 1],
              n = [].slice.call(e, 1),
              o = n[0];
            return (
              v(t) || (t = null),
              w(e[0])
                ? (e[0].push(t), d.load.apply(null, e[0]))
                : o
                  ? (h(n, function (e) {
                      !v(e) && e && E(b(e));
                    }),
                    x(
                      b(e[0]),
                      v(o)
                        ? o
                        : function () {
                            d.load.apply(null, n);
                          },
                    ))
                  : x(b(e[0])),
              d
            );
          }),
      (d.test = function (e, t, n, o) {
        var r =
            'object' === _typeof(e)
              ? e
              : { test: e, success: !!t && (w(t) ? t : [t]), failure: !!n && (w(n) ? n : [n]), callback: o || p },
          i = !!r.test;
        return (
          i && r.success
            ? (r.success.push(r.callback), d.load.apply(null, r.success))
            : !i && r.failure
              ? (r.failure.push(r.callback), d.load.apply(null, r.failure))
              : o(),
          d
        );
      }),
      (d.ready = function (e, t) {
        if (e === u) return (i ? y(t) : a.push(t), d);
        if ((v(e) && ((t = e), (e = 'ALL')), w(e))) {
          var n = {};
          return (
            h(e, function (e) {
              ((n[e] = l[e]),
                d.ready(e, function () {
                  T(n) && y(t);
                }));
            }),
            d
          );
        }
        if ('string' != typeof e || !v(t)) return d;
        var o = l[e];
        if ((o && o.state === m) || ('ALL' === e && T() && i)) return (y(t), d);
        var r = s[e];
        return (r ? r.push(t) : (r = s[e] = [t]), d);
      }),
      d.ready(u, function () {
        (T() &&
          h(s.ALL, function (e) {
            y(e);
          }),
          d.feature && d.feature('domloaded', !0));
      }));
  })(window),
  void 0 === window.console && (window.console = { log: function () {} }),
  Element.prototype.matches ||
    (Element.prototype.matches = Element.prototype.msMatchesSelector || Element.prototype.webkitMatchesSelector),
  Element.prototype.closest ||
    (Element.prototype.closest = function (e) {
      var t = this;
      do {
        if (t.matches(e)) return t;
        t = t.parentElement || t.parentNode;
      } while (null !== t && 1 === t.nodeType);
      return null;
    }),
  window.NodeList &&
    !NodeList.prototype.forEach &&
    (NodeList.prototype.forEach = function (e, t) {
      t = t || window;
      for (var n = 0; n < this.length; n++) e.call(t, this[n], n, this);
    }),
  (function (e, t, n) {
    e.composedPath ||
      (e.composedPath = function () {
        if (this.path) return this.path;
        var e = this.target;
        for (this.path = []; null !== e.parentNode; ) (this.path.push(e), (e = e.parentNode));
        return (this.path.push(t, n), this.path);
      });
  })(Event.prototype, document, window));
var docCookies = {
    getItem: function (e) {
      return (
        (e &&
          decodeURIComponent(
            document.cookie.replace(
              new RegExp(
                '(?:(?:^|.*;)\\s*' +
                  encodeURIComponent(e).replace(/[\-\.\+\*]/g, '\\$&') +
                  '\\s*\\=\\s*([^;]*).*$)|^.*$',
              ),
              '$1',
            ),
          )) ||
        null
      );
    },
    setItem: function (e, t, n, o, r, i) {
      if (!e || /^(?:expires|max\-age|path|domain|secure)$/i.test(e)) return !1;
      var a = '';
      if (n)
        switch (n.constructor) {
          case Number:
            a = n === 1 / 0 ? '; expires=Fri, 31 Dec 9999 23:59:59 GMT' : '; max-age=' + n;
            break;
          case String:
            a = '; expires=' + n;
            break;
          case Date:
            a = '; expires=' + n.toUTCString();
        }
      return (
        (document.cookie =
          encodeURIComponent(e) +
          '=' +
          encodeURIComponent(t) +
          a +
          (r ? '; domain=' + r : '') +
          (o ? '; path=' + o : '') +
          (i ? '; secure' : '')),
        !0
      );
    },
    removeItem: function (e, t, n) {
      return (
        !!this.hasItem(e) &&
        ((document.cookie =
          encodeURIComponent(e) +
          '=; expires=Thu, 01 Jan 1970 00:00:00 GMT' +
          (n ? '; domain=' + n : '') +
          (t ? '; path=' + t : '')),
        !0)
      );
    },
    hasItem: function (e) {
      return (
        !!e &&
        new RegExp('(?:^|;\\s*)' + encodeURIComponent(e).replace(/[\-\.\+\*]/g, '\\$&') + '\\s*\\=').test(
          document.cookie,
        )
      );
    },
    keys: function () {
      for (
        var e = document.cookie
            .replace(/((?:^|\s*;)[^\=]+)(?=;|$)|^\s*|\s*(?:\=[^;]*)?(?:\1|$)/g, '')
            .split(/\s*(?:\=[^;]*)?;\s*/),
          t = e.length,
          n = 0;
        n < t;
        n++
      )
        e[n] = decodeURIComponent(e[n]);
      return e;
    },
  },
  HT = HT || {};
!(function () {
  var e = '/';
  (window.jQuery && (window.old_jQuery = window.jQuery),
    (HT.service_domain = 'babel.hathitrust.org'),
    (HT.catalog_domain = 'catalog.hathitrust.org'),
    (HT.www_domain = 'www.hathitrust.org'),
    (HT.cookie_domain = '.hathitrust.org'));
  var t,
    n,
    o,
    r,
    i = location.hostname;
  function a(e) {
    return e && 'object' === _typeof(e) && !Array.isArray(e);
  }
  ((HT.is_dev = 'www.hathitrust.org' != i && 'catalog.hathitrust.org' != i && 'babel.hathitrust.org' != i),
    (HT.is_babel = -1 < i.indexOf('babel.hathitrust.org')),
    HT.is_dev &&
      ((e = i.split('.')[0]),
      console.log('-- main setting hostname', e, i),
      'localhost' == e || -1 < i.indexOf('.local')
        ? (location.port && (i += ':' + location.port),
          (HT.service_domain = i),
          (HT.catalog_domain = i),
          (HT.www_domain = i),
          (HT.cookie_domain = 'localhost' == e ? e : i))
        : ((t = e),
          'test.www.hathitrust.org' == i && (e = t = 'test'),
          (HT.service_domain = t + '.babel.hathitrust.org'),
          (HT.catalog_domain = e + '.catalog.hathitrust.org'),
          (HT.www_domain = e + '.www.hathitrust.org'))),
    document.addEventListener('DOMContentLoaded', function (e) {
      var t, n, o, r, i;
      window.location.href.indexOf('babel.hathitrust.org') < 0 &&
        -1 < window.location.href.indexOf('signon=') &&
        ((n = (t = location.href.split('signon=swle:')).pop()),
        (o = t[0]),
        document.querySelector('#logout-link') || document.querySelector('.logout-link')
          ? history.replaceState({}, document.title, o)
          : ((r = encodeURIComponent('https://'.concat(HT.service_domain, '/cgi/ping/pong?target=').concat(o))),
            (i =
              'wayf' == n
                ? 'https://'.concat(HT.service_domain, '/cgi/wayf?target=').concat(r)
                : 'https://'
                    .concat(HT.service_domain, '/Shibboleth.sso/Login?entityID=')
                    .concat(n, '&target=')
                    .concat(r)),
            (window.location.href = i)));
    }),
    (HT.prefs = {}),
    (HT.prefs.get = function () {
      var t = {};
      try {
        t = JSON.parse(docCookies.getItem('HT.prefs') || '{}');
      } catch (e) {
        (docCookies.removeItem('HT.prefs'), (t = {}));
      }
      return t;
    }),
    (HT.prefs.set = function (e) {
      var t = (function t(n, o) {
        var r = Object.assign({}, n);
        return (
          a(n) &&
            a(o) &&
            Object.keys(o).forEach(function (e) {
              a(o[e]) && e in n ? (r[e] = t(n[e], o[e])) : Object.assign(r, _defineProperty({}, e, o[e]));
            }),
          r
        );
      })((t = HT.prefs.get()), e);
      try {
        var n = new Date();
        (n.setDate(n.getDate() + 90), docCookies.setItem('HT.prefs', JSON.stringify(t), n, '/', HT.cookie_domain, !0));
      } catch (e) {}
    }),
    (HT.scripts = []),
    (HT.update_status = function (e) {
      void 0 === n && (n = document.querySelector('#root > div[role=status]'));
      var t = n;
      (window.bootbox &&
        window.bootbox.active() &&
        (t = window.bootbox.active().modal.querySelector('div[role="status"]')),
        t && HT._update_status(t, e));
    }),
    (HT._update_status = function (e, t) {
      var n;
      '--' != t
        ? o != t &&
          (r && (clearTimeout(r), (r = null)),
          (n = HT.params && 'polite' == HT.params.debug ? 2e3 : 500),
          setTimeout(function () {
            ((e.innerText = t), (o = t), console.log('-- status:', t));
          }, 50),
          (r = setTimeout(function () {
            e.innerText = '';
          }, n)))
        : (o = t);
    }));
  function s() {
    var e = window.innerHeight;
    return (
      window.visualViewport &&
        1 != window.visualViewport.scale &&
        (e = window.visualViewport.height * window.visualViewport.scale),
      e
    );
  }
  document.querySelector('html');
  var c = 0.01 * s();
  document.documentElement.style.setProperty('--vh', c + 'px');
  var u,
    l = 0;
  ((window.txt = requestAnimationFrame(function e(t) {
    var n, o;
    (void 0 === u && (u = t),
      100 < t - u &&
        ((u = t),
        (n = s()) != l &&
          ((l = n),
          document.documentElement.style.setProperty('--vh', 0.01 * n + 'px'),
          (o = document.createEvent('UIEvents')).initEvent('resize', !0, !1, window, 0),
          window.dispatchEvent(o)),
        (window.tx = requestAnimationFrame(e))));
  })),
    setTimeout(function () {
      var e = 0.01 * s();
      document.documentElement.style.setProperty('--vh', e + 'px');
    }, 500),
    window.addEventListener('resize', function () {
      var e = 0.01 * s();
      document.documentElement.style.setProperty('--vh', e + 'px');
    }),
    window.addEventListener('orientationchange', function () {
      setTimeout(function () {
        var e = 0.01 * s();
        (document.documentElement.style.setProperty('--vh', e + 'px'),
          HT && HT.utils && HT.utils.handleOrientationChange && HT.utils.handleOrientationChange());
      }, 500);
    }));
  var d,
    f = !1;
  (window.addEventListener('beforeunload', function (e) {
    var t;
    HT.disableUnloadTimeout ||
      ((t = HT.beforeUnloadTimeout || 1e4),
      (d = setTimeout(function () {
        var e;
        f ||
          ((e = document.createElement('div')).classList.add('wait-for-it'),
          document.body.appendChild(e),
          $('html').is('ie') &&
            setTimeout(function () {
              document.body.removeChild(e);
            }, t));
      }, 501)));
  }),
    window.addEventListener('pagehide', function (e) {
      ((f = !0), d && clearTimeout(d));
      var t = document.querySelector('.wait-for-it');
      t && document.body.removeChild(t);
    }),
    window.addEventListener('unload', function (e) {
      ((f = !0), d && clearTimeout(d));
      var t = document.querySelector('.wait-for-it');
      t && document.body.removeChild(t);
    }),
    setTimeout(function () {
      var e = document.createEvent('UIEvents');
      (e.initEvent('resize', !0, !1, window, 0), window.dispatchEvent(e));
    }, 100),
    navigator &&
      navigator.userAgent &&
      navigator.userAgent.match(/Edge\/1[678]/) &&
      document.documentElement.classList.add('edge'),
    (HT.pre_login_callback = function (e) {}));
  document.referrer && document.referrer;
  var m = document.createElement('script');
  ((m.async = !0),
    (m.src = '//'.concat(HT.service_domain, '/cgi/ping?callback=HT.pre_login_callback&_').concat(new Date().getTime())),
    document.head.appendChild(m));
  var p = [];
  // (p.push(
  //   'https://polyfill.io/v3/polyfill.min.js?features=Array.prototype.find,Promise,Object.assign,es2015,MutationObserver,CustomEvent,Event.composedPath',
  // ),
  (p.push('/pt/web/2021/common/utils.bundle.js'), head.js.apply(this, p));
})();
//# sourceMappingURL=maps/utils.201910.js.map
