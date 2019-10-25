var HT = HT || {};

HT.track_pageview = function(args) {
  if ( window.location.hash ) {
    args = $.extend({}, { colltype : window.location.hash.substr(1) }, args);
  }
  var params = $.param(args);
  if ( params ) { params = "?" + params; }
  HT.analytics.trackPageview(window.location.pathname + params);
}

var Paginator = function(argv) {
  var root = this;
  var page = {};

  var options = {};
  this.construct = function(argv) {
    $.extend(options, argv);
    root.page = page;
    _build();
  }

  var _build = function() {
    var slice_start = options.start || 0;
    root.recalculate(slice_start);
  }

  this.recalculate = function(slice_start) {
    var slice_end = slice_start + options.max_rows;

    page.items = options.items.slice(slice_start, slice_end);
    page.n = page.items.length;
    page.total = options.items.length;
    page.is_active = true;
    if ( page.n == page.total ) {
      page.is_active = false;
    }
    page.start = slice_start + 1;
    page.end = slice_start + options.max_rows;
    if ( page.end > options.items.length ) {
      page.end = options.items.length;
    }

    page.next = page.prev = false;
    if ( slice_start + options.max_rows < options.items.length ) {
      page.next = slice_start + options.max_rows;
    }
    if ( slice_start - options.max_rows >= 0 ) {
      page.prev = slice_start - options.max_rows;
    }
  }

  this.describe = function() {
    var text = "";
    if ( page.is_active ) {
      text += page.start + " to " + ( page.end ) + " of ";
      text += page.total;
    } else {
      text += "1 to " + page.total + " of " + page.total;
    }
    return text;
  }

  this.construct(argv);
}

var ListBrowser = function(argv, elem) {
  var root = this;

  var options = {};
  var controls = {};
  var cache = {};

  var labels = {};
  labels.min_items = 'Collections with';
  labels.search = 'Collections matching';

  this.construct = function(argv, e) {
    $.extend(options, argv);
    controls.$elem = $(elem);
    controls.$results = controls.$elem.find(".results-container--list");
    controls.$pagination_summary = controls.$elem.find(".pagination-summary");
    controls.$subtitle = controls.$elem.find(".current-filter");
    controls.$sort_option = $("#sort-option");
    controls.$paging_option = $("#top_paging");
    controls.$navigator = controls.$elem.find("nav");
    controls.$input_filter = controls.$elem.find("input[name=q]");

    controls.$sidebar = $("#sidebar");
    controls.$active_filters = controls.$sidebar.find(".active-filters-list");

    options.filters = [];
    options.sorting = [];
    options.is_default_sort = true;
    options.q = "";
    options.default_min_items = 0;
    options.min_items = 0;
    options.sz = parseInt(controls.$paging_option.val(), 10);

    root.options = options;
    root.controls = controls;
    root.cache = cache;

    _build();
    root.render();
  }

  var _build = function() {
    _bind_events();
    _build_cache();
    root.filter_items(options.view);
    root.apply_filters();
    // this.update_state();
  }

  var _build_cache = function() {
    for(var i = 0, num_rows = HT.listcs.bucket.length; i < num_rows; i++) {
      var buffer = [];
      var datum = HT.listcs.bucket[i];
      datum.OwnerName = datum.OwnerString;
      if ( datum.OwnerAffiliation ) {
        datum.OwnerAffiliation = datum.OwnerAffiliation.replace('__amp;', '&amp;');
        datum.OwnerName += " (" + datum.OwnerAffiliation + ")";
      }
      buffer.push(datum.CollName);
      buffer.push(datum.OwnerString);
      buffer.push(datum.OwnerAffiliation);
      buffer.push(datum.Description);
      datum.buffer = buffer.join(' ');
    }
  }

  var _bind_events = function() {
    var self = root;

    controls.$sort_option.on('change', function() {
      var key = $(this).val();
      var rel = $(this).find("option:selected").data('sort');
      root.sort_by(key, rel);
      root.apply_filters();
      root.track_pageview();
    })

    controls.$paging_option.on('change', function() {
      options.max_rows = options.sz = parseInt($(this).val(), 10);
      controls.paginator = null;
      root.render();
      root.track_pageview();
    })

    var $radiogroup = controls.$sidebar.find('[role=radiogroup]');
    $radiogroup.on('click', '[role=radio]', function(event) {
      var $this = $(this);

      var filter = $(this).data('target');
      var $checked = $radiogroup.find("[aria-checked=true]");
      $checked.attr('aria-checked', 'false').attr('tabindex', null);
      $checked.find("svg use").attr('xlink:href', '#radio-empty');
      $this.attr("aria-checked", "true").attr("tabindex", 0);
      $this.find("svg use").attr('xlink:href', '#radio-checked');
      $this.get(0).focus();
      console.log($this.get(0), document.activeElement);

      root.filter_items(filter);
      root.apply_filters();
      root.track_pageview();
    })

    controls.$sidebar.on('click keypress', 'button.filter-button', function(event) {
      event.preventDefault();
      var $this = $(this);
      var type = $this.data('type');
      controls.$sidebar.find("button[data-type='" + type + "']").show();
      $this.hide();
      var target = $this.data('target');
      root.filter_min_items(target);
      root.apply_filters();
      root.track_pageview();
    })

    controls.$sidebar.on('click keypress', 'button.active-filter-button', function(event) {
      event.preventDefault();
      var $this = $(this);
      var target = $this.data('target');
      controls.$sidebar.find("button[data-type='" + target + "']").show();
      root.remove_filter({ type: target });
      root.apply_filters();
      root.track_pageview();
    })

    options.min_items_possibles = [];
    controls.$sidebar.find("button[data-type=min_items]").each(function() {
      options.min_items_possibles.push(parseInt($(this).data('target'), 10));
    })

    // input filter
    controls.$input_filter.on('blur', function(e) {
      if ( $(this).val().toLowerCase() != self.q ) {
        self.filter_search($(this).val());
        self.apply_filters();
      }
    })
    controls.$input_filter.on('change', function(e) {
      if ( $(this).val().toLowerCase() == "" ) {
        self.filter_search('');
        self.apply_filters();
      }
    })
    controls.$input_filter.on('keyup', function(e) {
      if ( $(this).val().toLowerCase() != self.q ) {
        self.filter_search($(this).val());
        self.apply_filters();
        if ( self.q_timeout == null ) {
          self.q_timeout = setTimeout(function() {
            if ( self.q ) {
              self.track_pageview();
              self.q_timeout = null;
            }
          }, 1000);
        }
      }
    })
    controls.$input_filter.on('keyup', function(e) {
      if ( e.keyCode == 13 ) { return ; }
      if ( e.keyCode == 27 ) {
        $(this).val('');
        self.filter_search('');
        self.apply_filters();
        if ( self.q_timeout ) {
          clearTimeout(self.q_timeout);
          self.q_timeout = null;
        }
        return false;
      }
    })

    // paginator
    controls.$navigator.on('click', 'a[href]', function(event) {
      event.preventDefault();
      var href = $(this).attr('href');
      var start = parseInt(href.substr(1), 10);
      controls.paginator.recalculate(start);
      root.render();
    })

    // user actions
    controls.$elem.on('click', 'button.action-delete', function(event) {
      event.preventDefault();

      var $this = $(this);
      var collname = $this.parents("article").find("[data-key=CollName]").text();
      var choice = window.confirm("Do you really want to delete the collection " + collname + "?");
      if ( choice ) {
        return true;
        // var href = $this.data('delete-href');
        // $this.attr('href', href);
        // HT.track_event({ action : 'MB Collection Delete', label : '"' + collname + '"' + " " + href.replace(/.*c=(\d+).*/, "$1")})
        // return true;
      }
      event.stopPropagation();
      return false;
    })

  }

  this.update_state = function(filter) {
    var filters = options.filters.filter(function(v) { return v.type != 'view' });
    controls.$active_filters.empty();

    for(var i = 0; i < filters.length; i++) {
      var filter = filters[i];
      var html = ('<li class="active-filter-item"><button class="active-filter-button" data-target="{KEY}">' +
        '<span class="flex-space-between flex-center">' +
          '<span class="active-filter-button-text">{FILTER}: {VALUE}</span>' +
          '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 14 14" version="1.1" class="icon"><use xlink:href="#action-remove"></use></svg>' +
          '<span class="offpage">Remove</span>' +
        '</span>' +
      '</button></li>').replace('{KEY}', filter.type).replace('{FILTER}', labels[filter.type]).replace('{VALUE}', filter.message || filter.value);

      var $button = $(html);
      controls.$active_filters.append($button);
    }

    controls.$sidebar.toggleClass('active-filters--empty', filters.length == 0);

    controls.$pagination_summary.text(controls.paginator.describe());

    var subtitle = $("button[data-target='" + options.view + "'] .filter-name").text();
    var document_title = subtitle;
    if ( subtitle.indexOf('Collection') < 0 ) {
      subtitle += ' Collections';
    }
    controls.$subtitle.text(subtitle);
    // and the document title
    document.title = document_title + ' | Collections | HathiTrust Digital Library';

    HT.update_status("Showing " + controls.paginator.describe() + " " + subtitle);

    var new_href = "/cgi/mb?a=listcs&colltype=" + options.view;
    if ( options.min_items > 0 ) {
      new_href += '&min_items=' + options.min_items;
    }
    if ( options.sz != 25 ) {
      new_href += '&sz=' + options.sz;
    }
    // if ( options.q ) {
    //   new_href += '&q=' + options.q;
    // }
    // if ( options.sort ) {
    //   new_href += '&sort=' + options.sort;
    // }

    window.history.replaceState(null, document.title, new_href);
  }

  this.render = function() {
    var self = this;

    if ( controls.paginator == null ) {
      controls.paginator = new Paginator({ items: cache.filtered, max_rows: options.sz });
    }
    var page = controls.paginator.page;

    // var template = document.querySelector('#article-template');

    var template =
     '<article class="record">' +
        '<div class="cover">' +
        '</div>' +
        '<div class="record-container record-medium-container">' +
          '<div class="record-title-and-actions-container">' +
            '<div class="record-title-actions">' +
              '<h3 class="record-title">' +
                '<a data-key="CollName" href="#"></a>' +
              '</h3>' +
              '<div class="actions"></div>' +
            '</div>' +
            '<dl style="font-size: .9rem">' +
              '<dt>Updated</dt>' +
              '<dd data-key="Updated_Display"></dd>' +
              '<dt>Owner</dt>' +
              '<dd data-key="OwnerName"></dd>' +
              '<dt>Number of items</dt>' +
              '<dd data-key="NumItems_Display"></dd>' +
            '</dl>' +
          '</div>' +
          '<div class="resource-access-container" data-key="Description"></div>' +
        '</div>' +
      '</article>'

    var fragment = document.createDocumentFragment();

    for(var j = 0; j < page.n; j++) {
      var datum = page.items[j];

      var node;
      // var clone = document.importNode(template.content, true);
      var clone = $(template).get(0);
      var keys = [ 'CollName', 'Updated_Display', 'OwnerName', 'NumItems_Display' ];
      keys.forEach(function(key, index) {
        var selector = '[data-key="' + key + '"]';
        node = clone.querySelector(selector);
        node.innerText = datum[key];
        if ( key == 'CollName' ) {
          node.setAttribute('href', '/cgi/mb?a=listis;c=' + datum.CollId);
          if ( datum.isFeatured || datum.isOwned ) {
            var html = '';
            if ( datum.isFeatured ) {
              html += '<span class="xbadge xbadge-dark">Featured</span> ';
            }
            if ( datum.isOwned ) {
              if ( ! datum.isShared ) {
                html += '<span class="xbadge xbadge-secondary">Private</span> ';
                if ( datum.NumItems > 0 && datum.OwnerAffiliation ) {
                  var href = '/cgi/mb?a=editst;shrd=1;c=' + datum.CollId + ';colltype=' + options.view;
                  html +=
                    '<button class="btn btn-sm action-change-shared" data-href="{HREF}">Make Public</button>'
                    .replace('{HREF}', href);
                }
              } else {
                var href = '/cgi/mb?a=editst;shrd=0;c=' + datum.CollId + ';colltype=' + options.view;
                html +=
                  '<button class="btn btn-sm action-change-shared" data-href="{HREF}">Make Private</button>'
                  .replace('{HREF}', href);
              }
              html +=
                '<button class="btn btn-sm action-delete" data-href="{HREF}">Delete</button>'
                .replace('{HREF}', datum.DeleteCollHref);
            }
            node = node.parentNode.parentNode.querySelector('.actions');
            node.innerHTML = html;
          }
        }
      }.bind(this))

      if ( datum.Description ) {
        node = clone.querySelector('[data-key="Description"]');
        node.innerHTML = '<p>' + datum.Description + '</p>';
      }

      if ( datum.Branding ) {
        node = clone.querySelector('.cover');
        var img = new Image();
        img.classList.add('bookCover');
        img.setAttribute('aria-hidden', 'true');
        img.setAttribute('alt', '');
        img.src = datum.Branding;
        node.appendChild(img);
      }

      node = clone; // .querySelector('article');
      node.setAttribute('data-collid', datum.CollId);
      if ( datum.isFeatured) {
        node.classList.add('record--featured');
      }

      if ( datum.isOwned) {
        node.classList.add('record--owned');
      }

      fragment.appendChild(clone);
    }

    // controls.$results.empty();
    // var results_div = controls.$results.get(0);
    // results_div.appendChild(fragment);
    controls.$results.html(fragment);

    $("html").scrollTop(0);
    root.render_navigator();
    root.update_filters();
    root.update_state();
  }

  this.update_filters = function() {
    $.each(cache.counts, function(key, value) {
      var $button = $('button[data-target="' + key + '"]');
      $button.find('.filter-count').text(value);
      $button.attr("aria-label", key + " items - " + value);
      $button.attr("disabled", value == 0 ? 'disabled' : null);
    })

    $.each(cache.view_counts, function(key, value) {
      var $button = $('button[data-target="' + key + '"]');
      $button.find(".filter-count").text(value);
      $button.attr('aria-label', $button.find('.filter-name').text() + ' - ' + value);
    })
  }

  this.render_navigator = function() {
    function b2p(s) {
      return Math.floor(s / options.sz) + 1;
    }

    controls.$navigator.hide();

    if ( ! controls.paginator.page.is_active ) {
      return;
    }

    var $back_link = controls.$navigator.find(".page-back-link");
    var $advanced_link = controls.$navigator.find(".page-advance-link");
    var $ul = controls.$navigator.find("ul");

    $back_link.empty();
    $advanced_link.empty();
    $ul.empty();
    var page = controls.paginator.page;
    var pages = [ page.start - 1 ];
    // attach 3 previous
    var prev = page.prev;
    var next_page; var prev_page;
    var i = 0;
    var n_back = 4; var n_advance = 4;

    while ( prev !== false && n_back > 0 ) {
      if ( prev_page === undefined ) {
        prev_page = prev;
      }
      pages.unshift(prev);
      prev = prev - options.sz;
      n_back -= 1;
      if ( prev < 0 ) {
        prev = false;
      }
    }

    var next = page.next;
    n_advance += n_back;
    while ( next !== false && n_advance > 0 ) {
      pages.push(next);
      next = next + options.sz;
      n_advance -= 1;
      if ( next > page.total ) {
        next = false;
      }
    }

    if ( n_advance > 0 && n_back == 0 ) {
      prev = pages[0] - options.sz;
      if ( prev >= 0 ) {
        while ( prev !== false && n_advance > 0 ) {
          pages.unshift(prev);
          prev = prev - options.sz;
          n_advance -= 1;
          if ( prev < 0 ) {
            prev = false;
          }
        }
      }
    }

    var num_pages = Math.ceil(page.total / options.sz);

    var p = pages.indexOf(page.start - 1);
    if ( p > 0 ) {
      prev_page = pages[p - 1];
    }
    if ( p < pages.length - 1 ) {
      next_page = pages[p + 1]
    }

    // add the previous link
    if ( prev_page !== undefined ) {
      $('<a href="#{SLICE_START}"><span><i class="icomoon icomoon-arrow-left" aria-hidden="true"></i> Previous page</a></span>'.replace('{SLICE_START}', prev_page)).appendTo($back_link);
    }

    $.each(pages, function(index, p) {
      if ( p == '...' ) {
        $("<li>...</li>").appendTo($ul);
      } else {
        if ( p == page.start - 1 ) {
          var $li = $("<li><span><strong><span class='offscreen'>Results page (current) </span>{PAGE}</strong></span></span></li>".replace('{PAGE}', b2p(p))).appendTo($ul);
        } else {
          var $li = $("<li><a href='#{SLICE_START}'><span class='offscreen'>Results page </span>{PAGE}</a></li>".replace('{SLICE_START}', p).replace('{PAGE}', b2p(p))).appendTo($ul);
        }
      }
    })

    // add the next link
    if ( next_page !== undefined ) {
      $('<a href="#{SLICE_START}"><span style="margin-right: 4px">Next page <i class="icomoon icomoon-arrow-right" aria-hidden="true"></i></span></a></li>'.replace('{SLICE_START}', next_page)).appendTo($advanced_link);
    }

    controls.$navigator.show();
  }

  this.filter_items = function(filter) {
    options.view = filter;
    if ( filter == 'my-collections' || filter == 'featured' ) {
      root.filter_min_items(0);
    }

    if ( filter == 'all' ) {
      root.remove_filter({ type: 'view' });
      return;
    }

    root.add_filter({ type: 'view', fn: function(tr) {
      if ( options.view == 'updated' ) {
        return ( tr.isUpdated );
      } else if ( options.view == 'featured' ) {
        return ( tr.isFeatured );
      } else if ( options.view == 'my-collections' ) {
        return ( tr.isOwned );
      } else if ( options.view == 'all' ) {
        return true;
      }
    }})

  }

  this.filter_min_items = function(min_items) {
    if ( min_items !== undefined && min_items != options.min_items ) {
      options.min_items = min_items;
    }

    if ( options.min_items == 0 ) {
      root.remove_filter({ type : "min_items" });
      return;
    }

    var idx = options.min_items_possibles.indexOf(options.min_items);
    options.max_items = options.min_items_possibles[idx - 1] || Number.POSITIVE_INFINITY;
    var message;
    if ( options.max_items == 25 ) { message = 'up to 25 items'; }
    else if ( options.max_items == Number.POSITIVE_INFINITY ) { message = '1000 items or more'; }
    else { message = options.min_items + '-' + options.max_items + " items"; }
    root.add_filter({
      type : "min_items",
      value: options.min_items,
      // message: options.min_items + " items (up to " + options.max_items + ")",
      message: message,
      fn : function(tr) {
        var num_items = tr.NumItems;
        return ( num_items >= options.min_items && num_items < options.max_items);
      }
    })
  }

  this.filter_owner = function(owner_name) {

  }

  this.filter_search = function(q) {
    options.q = $.trim(q); // .toLowerCase();
    options.qre = new RegExp(q, 'i');
    if ( options.q == "" ) {
      root.remove_filter({ type: "search" });
    } else {
      root.add_filter({ type: "search", value: options.q, fn: function(tr) {
        return ( tr.buffer.match(options.qre) );
      }})
    }
  }

  this.add_filter =function(filter) {
    var num_filters = options.filters.length;
    for(var i = 0; i < num_filters; i++) {
      if ( options.filters[i].type == filter.type ) {
        options.filters[i] = filter;
        filter.added = true;
        break;
      }
    }
    if ( filter.added != true ) {
      options.filters.push(filter);
    }
  }

  this.has_filter = function(type) {
    var num_filters = options.filters.length;
    for(var i = 0; i < num_filters; i++) {
      if ( options.filters[i].type == type ) {
        return true;
      }
    }
    return false;
  }

  this.remove_filter = function(filter) {
    var splice_idx = -1;
    for(var i = 0; i < options.filters.length; i++) {
      if ( options.filters[i].type == filter.type ) {
        splice_idx = i;
        break;
      }
    }
    if ( splice_idx >= 0 ) {
      options.filters.splice(i, 1);
      if ( filter.type == 'search' ) {
        controls.$input_filter.val('');
      } else if ( filter.type == 'min_items' ) {
        options.min_items = 0;
      }
    }
  }

  this.apply_filters = function() {
    var self = this;

    var num_filters = options.filters.length;
    var filters = options.filters;

    cache.filtered = [];
    cache.counts = {};
    cache.view_counts = { all: 0, updated: 0, featured: 0, 'my-collections': 0 };
    var possible_counts = [ -1, 25, 50, 100, 250, 500, 1000 ];
    var p_total = possible_counts.length;
    for(var i = 0; i < p_total; i++) {
      cache.counts[possible_counts[i]] = 0;
    }
    // cache.counts = { -1: 0, 25: 0, 50: 0, 100: 0, 250: 0, 500: 0, 1000: 0 };
    var bucket = HT.listcs.bucket;
    var totalRows = bucket.length;

    // and reset the paginator
    controls.paginator = null;

    for(var i = 0; i < totalRows; i++) {
      var row = bucket[i];
      var check; var filter_check;
      if ( num_filters == 0 ) {
        check = filter_check = true;
      } else {
        check = true; filter_check = true;
        for ( var ii = 0; ii < num_filters; ii++ ) {
          if ( filters[ii].type != 'view' ) {
            filter_check = filter_check && filters[ii].fn(row);
          }
          check = check && filters[ii].fn(row);
          // -- do not break so we capture all the filter counts
          // if ( ! check ) {
          //   break;
          // }
        }
      }

      if ( filter_check ) {
        cache.view_counts.all += 1;
        if ( row.isFeatured ) { cache.view_counts.featured += 1; }
        if ( row.isUpdated ) { cache.view_counts.updated += 1; }
        if ( row.DeleteCollHref ) { cache.view_counts['my-collections'] += 1; }
      }

      if ( check ) {
        cache.filtered.push(row);
        for(var p = 0; p < p_total; p++) {
          var max = p + 1 == p_total ? Number.POSITIVE_INFINITY : possible_counts[p + 1];
          var num = possible_counts[p];
          if ( row.NumItems >= num && row.NumItems < max ) {
            cache.counts[num] += 1;
          }
        }
      }
    }

    root.render();
  }

  this.sort_by = function(key, rel) {
    if ( rel === undefined || rel == "asc" ) { delta = 0; }
    else if ( rel == "desc" ) { delta = 1; }
    var sorting = [];

    sorting.push([key, delta]);
    if ( key != "CollName" ) {
      sorting.push(['CollName', delta]);
      options.is_default_sort = false;
    } else {
      options.is_default_sort = true;
    }

    _apply_sorting(sorting);
  }

  var _apply_sorting = function(sorting) {
    var self = this;
    options.sorting = sorting;
    var _sort_fn = function(a, b) {
      var retval = 0;
      for ( var i = 0, l = sorting.length; i < l; i++ ) {
        var sort = sorting[i];
        var min, max, delta;
        if ( sort[1] ) {
          // desc
          min = Number.NEGATIVE_INFINITY;
          max = Number.POSITIVE_INFINITY;
          delta = 1;
        } else {
          min = Number.POSITIVE_INFINITY;
          max = Number.NEGATIVE_INFINITY;
          delta = -1;
        }
        var key = sort[0];
        var avalue = a[key];
        var bvalue = b[key];
        if ( key == 'NumItems' ) {
          if ( avalue === null ) {
            avalue = 0;
          }
          if ( bvalue === null ) {
            bvalue = 0;
          }
        }
        retval = (avalue == bvalue ? 0 : (avalue === null ? min: (bvalue === null ? max : (avalue < bvalue) ? delta : -delta)));
        if ( retval ) {
          return retval;
        }
      }
      return a.index - b.index;
    }

    HT.listcs.bucket.sort(_sort_fn);
  }

  this.track_pageview = function() {
    var args = {};
    if ( root.has_filter("min_items") && options.min_items > 0 ) {
      args.min_items = options.min_items;
    }
    if ( root.has_filter("search") && options.q ) {
      args.q = options.q;
    }
    args.sortby = controls.$sort_option.val();
    HT.track_pageview(args);
  }

  this.construct(argv, elem);
}

// var colltype = $.url().param('colltype') || 'featured';
var $container = $(".results-container");
var colltype = $container.data('colltype') || 'featured';
var browser = new ListBrowser({ view: colltype }, $container);
