if (!Object.create) {
    Object.create = function (o) {
        if (arguments.length > 1) {
            throw new Error('Object.create implementation only accepts the first parameter.');
        }
        function F() {}
        F.prototype = o;
        return new F();
    };
}

// !function( $ ) {
  
  
  
// }( window.jQuery );

if(!Array.indexOf){
  Array.prototype.indexOf = function(obj){
   for(var i=0; i<this.length; i++){
    if(this[i]==obj){
     return i;
    }
   }
   return -1;
  }
}

var MAX_ROWS = 50;

var Paginator = {
  init: function(options) {
    this.options = $.extend( {}, this.options, options );
    this._build();
    return this;
  },

  options: {

  },

  _build: function() {
    var slice_start = this.options.start || 0;
    this.recalculate(slice_start);
  },

  recalculate: function(slice_start) {
    var slice_end = slice_start + MAX_ROWS;

    this.page = {};
    this.page.items = this.options.items.slice(slice_start, slice_end);
    this.page.n = this.page.items.length;
    this.page.total = this.options.items.length;
    this.page.is_active = true;
    if ( this.page.n == this.page.total ) {
      this.page.is_active = false;
    }
    this.page.start = slice_start + 1;
    this.page.end = slice_start + MAX_ROWS;
    if ( this.page.end > this.options.items.length ) {
      this.page.end = this.options.items.length;
    }

    this.page.next = this.page.prev = false;
    if ( slice_start + MAX_ROWS < this.options.items.length ) {
      this.page.next = slice_start + MAX_ROWS;
    }
    if ( slice_start - MAX_ROWS > 0 ) {
      this.page.prev = slice_start - MAX_ROWS;
    }
  },

  describe: function() {
    var text = "";
    if ( this.page.is_active ) {
      text += this.page.start + "-" + ( this.page.end ) + " of ";
    }
    text += this.page.total;
    return text;
  },

  EOT: true

};

var ListBrowser = {
  init: function(options, elem) {
    this.options = $.extend( {}, this.options, options );
    
    this.elem = elem;
    this.$elem = $(elem);

    this.$results = this.$elem.find(".results");
    this.$controls = this.$elem.find(".controls");
    this.$title = this.$elem.find(".mbContentTitle");
    this.$sidebar = $("#Sidebar");
    
    this.filters = [];
    this.sorting = [];
    this.is_default_sort = true;
    this.q = "";
    this.default_min_items = 0;

    this._build();
    this.render();
    this.$elem.removeClass("no-display");
    
    return this;
  },
  
  options: {
    
  },
  
  _build: function() {
    
    this.$filters = $(".list-filter-option");
    this.$sort = $(".list-sort-option");
    this.$sort_options = $(".list-sort-options").find("a");
    this.$search = $(".list-search-option");
    this.$active_filters = $(".active_filters");
    this.$status = $(".status");
    this.$reset = $(".list-reset");
    
    this._build_cache();
    this._bind_controls();
    //this._bind_events();
    this._setup_featured();
    this._init();
  },
  
  _init: function() {
    this.recent_timepoint = (1).month().ago().toString("yyyy-MM-dd hh:mm:ss");
    this.default_min_items = 0;

    var colltype = window.location.href.match(/colltype=([a-z-_]+)/);
    if ( colltype != null && ! window.location.hash ) {
      colltype = colltype[1];
      if ( colltype == "priv" || colltype == "my_colls" ) { colltype = "my-collections"; }
      else if ( colltype == "pub" ) { colltype = "all"; }
    } else if ( window.location.hash ) {
      colltype = window.location.hash.substr(1);
    } else {
      colltype = "updated";
    }

    this.navigate(colltype);

    // this.filter_list(colltype);
    // this.apply_filters();
  },

  _bind_controls: function() {
    var self = this;

    self.$reset.bind('click', function() {
      self.reset_filters();
      self.apply_filters();
      return false;
    })

    self.$controls.find("select[name=min_items]").bind("change", function() {
      var min_items = $(this).val();
      self.filter_min_items(min_items);
      self.apply_filters();
      self.track_pageview();
    })

    self.$controls.find("select[name=sort_by]").bind("change", function() {
      var key = $(this).val();
      var rel = $(this).find("option:selected").data('sort');
      self.sort_by(key, rel);
      self.apply_filters();
      self.track_pageview();
    })
    
    self.$controls.find("input[name=toggle_descriptions]").bind("click", function() {
      if ( $(this).is(":checked") ) {
        $("p.description").show();
      } else {
        $("p.description").hide();
      }
    })
    
    self.$controls.find(".filters a").click(function(e) {
      e.preventDefault();
      var $this = $(this);
      var view = $this.data('target');
      self.navigate(view, true);
      self.track_pageview();
    })

    self.$elem.on('click.list_colls', '.pages a', function(e) {
      e.preventDefault();
      var href = $(this).attr("href");
      self.goto_page(href.substr(1));
    }) 
    
    // fix the active button
    if ( window.location.hash && window.location.hash != "#all" ) {
      self.$controls.find("button[data-target=all]").removeClass("active");
      self.$controls.find("button[data-target=" + window.location.hash.substr(1) + "]").addClass("active");
    }
    
    self.input_filter = self.$controls.find("input[name=q]");
    self.input_filter.bind('blur', function(e) {
      if ( $(this).val().toLowerCase() != self.q ) {
        self.filter_search($(this).val());
        self.apply_filters();
      }
    })
    self.input_filter.bind('change', function(e) {
      if ( $(this).val().toLowerCase() == "" ) {
        self.filter_search('');
        self.apply_filters();
      }
    })
    self.input_filter.bind('keyup', function(e) {
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
    self.input_filter.bind('keypress', function(e) {
      if ( e.keyCode == 13 ) { return false; }
    }).bind('keyup', function(e) {
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
    
    // try {
    //   $("input[placeholder]", this.$controls).placeholder();
    // } catch(e) {
    //   // noop
    // }
                    
  },

  navigate: function(view, invoke_events) {
    var $buttons = this.$controls.find(".filters li");
    $buttons.removeClass("active");
    var $active = $buttons.filter(":has(a[data-target=" + view + "])");
    if ( ! $active.length ) {
      view = 'all';
      this.navigate('all');
      return;
    }
    $active.addClass("active");

    this.filter_list(view);
    this.apply_filters();
    this.update_state(view);
  },
  
  _build_cache: function() {
    var self = this;
    
    this.idx = {};
    var bucket = this.options.bucket;
    
    for(var i = 0, n = bucket.cols.length; i < n; i++) {
      this.idx[bucket.cols[i]] = i;
    }
    
    self.cache = {};
    self.cache.html = bucket.html;
    self.cache.featured = bucket.featured;
    self.cache.mondo = bucket.mondo;
    self.cache.normalized = [];
    
    var num_cells = self.cache.html[0].length;
    for(var i = 0, num_rows=self.cache.html.length; i < num_rows; i++) {
      var cols = [];
      var html = self.cache.html[i];
      if ( html[self.idx.OwnerAffiliation] ) {
        // hack to get around libxml2 emitting CDATA...
        html[self.idx.OwnerAffiliation] = html[self.idx.OwnerAffiliation].replace('__amp;', '&amp;');
      }
      for (var j = 0; j < num_cells; j++) {
        cols.push(html[j].toLowerCase());
      }
      if ( cols[self.idx.Description] ) {
        cols[self.idx.CollName] += " " + cols[self.idx.Description];
      }
      cols[self.idx.CollName] += " " + cols[self.idx.OwnerString] + " " + cols[self.idx.OwnerAffiliation];
      cols.push(self.cache.normalized.length); // add position for rowCache
      self.cache.normalized.push(cols);
    }
    
  },
  
  _bind_events: function() {
    var self = this;
    
    this.$reset.bind('click', function() {
      self.reset_filters();
      self.apply_filters();
      return false;
    })
    
    this.$filters.bind('click', function() {
      self.filter_list($(this).data('target'));
      self.apply_filters();
    })
    
    this.$sort_options.on('click', function(e) {
      e.preventDefault();
      self.sort_list($(this).attr('href'), $(this).data('sort'), $(this).text());
      self.apply_filters();
    })
    
    this.$search.on('keyup', function(e) {
      if ( this.value.toLowerCase() != self.q ) {
        self.filter_search(this.value);
        self.apply_filters();
        if ( self.q_timeout == null ) {
          self.q_timeout = setTimeout(function() {
            if ( self.q ) {
              self.q_timeout = null;
            }
          }, 1000);
        }
      }
    })
    this.$search.on('keypress', function(e) {
      if ( e.keyCode == 13 ) { return false ; }
    }).on('keyup', function(e) {
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
        
  },
  
  reset_filters : function() {
    this.clear_filters();
    this.clear_sort();
    
    this.filter_min_items(this.default_min_items);

    // reset controls
    this.$controls.find("select[name=min_items]").val(this.min_items);
    this.$controls.find("select[name=sort_by]").val("collname");
    this.$controls.find("input[name=q]").val("");
    // var $buttons = this.$controls.find(".filters button");
    // $buttons.removeClass("active").filter("button[=all]").addClass("active");
    
    this.navigate("all", true);
    return false;
  },
  
  clear_filters : function() {
    this.filters = [];
  },
  
  clear_sort : function() {
    this.sort_by("CollName");
  },
  
  filter_list : function(rel) {
    var self = this;
    console.log("TOGGLING", rel);
    this.view = rel;

    if ( this.view == 'my-collections' || this.view == 'featured' || this.view == 'mondo' ) {
      this.filter_min_items(0);
    }

    if ( this.view == 'all' ) {
      this.remove_filter({ type : 'view' });
      return;
    }
    
    self.add_filter({ type : "view", fn: function(tr) {
      if ( self.view == "updated" ) {
        return ( tr[self.idx.Updated] >= self.recent_timepoint );
      } else if ( self.view == "featured" ) {
        return ( tr[self.idx.Featured] != '' );
      } else if ( self.view == "mondo" ) {
        return ( tr[self.idx.Mondo] != '' );
      } else if ( self.view == "my-collections" ) {
        return ( tr[self.idx.DeleteCollHref] != '' );
      } else if ( self.view == "all" ) {
        return true;
      }
    }})
  },
  
  filter_min_items: function(min_items) {
    var self = this;
    if ( min_items !== undefined && min_items != this.min_items ) {
      this.min_items = min_items;
      this.$controls.find("select[name=min_items]").val(this.min_items);
    }
    
    if ( this.min_items == 0 ) {
      this.remove_filter({ type : "min_items" });
      return;
    }
    
    this.add_filter({ type : "min_items", fn : function(tr) {
      var num_items = parseInt(tr[self.idx.NumItems]);
      return ( num_items >= self.min_items );
    }})
  },

  sort_by: function(key, rel) {
    // var expr = "th." + key + " a";
    // $(expr).click();
    if ( rel === undefined || rel == "asc" ) { delta = 0; }
    else if ( rel == "desc" ) { delta = 1; }
    var sorting = [];
    
    //var idx = this.idx[key];
    sorting.push([key, delta]);
    if ( key != "CollName" ) {
      sorting.push([this.idx['CollName'], delta]);
      this.is_default_sort = false;
    } else {
      this.is_default_sort = true;
    }
    
    this._apply_sorting(sorting);
    
  },

  sort_list : function(target, rel, label) {
    this.$sort.find(".list-sort-by").text(label);
    console.log("SORTING:", target, rel);
    var delta;
    if ( rel === undefined || rel == "asc" ) { delta = 0; }
    else if ( rel == "desc" ) { delta = 1; }
    
    var sorting = [];
    sorting.push([target, delta]);
    if ( target != 'CollName' ) {
      sorting.push(['CollName', 0]);
      this.is_default_sort = false;
    } else {
      this.is_default_sort = true;
    }
    this._apply_sorting(sorting);
  },
  
  _apply_sorting: function(sorting) {
    // EXAMPLE FROM TABLESORTER MODULE
    // var sortWrapper = function (a, b) {
    //         var e0 = (a[3] == b[3] ? 0 : (a[3] === null ? Number.POSITIVE_INFINITY : (b[3] === null ? Number.NEGATIVE_INFINITY : (a[3] < b[3]) ? -1 : 1)));
    //         if (e0) {
    //             return e0;
    //         } else {
    //             var e1 = (a[0] == b[0] ? 0 : (a[0] === null ? Number.POSITIVE_INFINITY : (b[0] === null ? Number.NEGATIVE_INFINITY : (a[0] < b[0]) ? -1 : 1)));
    //             if (e1) {
    //                 return e1;
    //             } else {
    //                 return a[6] - b[6];
    //             };
    //         };
    //         return 0;
    //     };
    
    var self = this;
    self.sorting = sorting;
    var checkIdx = self.cache.normalized.length - 1;
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
        var idx = self.idx[sort[0]];
        var avalue = a[idx];
        var bvalue = b[idx];
        if ( idx == self.idx.NumItems ) {
          if ( avalue !== null ) {
            avalue = parseInt(avalue);
          }
          if ( bvalue != null ) {
            bvalue = parseInt(bvalue);
          }
        }
        retval = (avalue == bvalue ? 0 : (avalue === null ? min: (bvalue === null ? max : (avalue < bvalue) ? delta : -delta)));
        if ( retval ) {
          return retval;
        }
      }
      return a[checkIdx] - b[checkIdx];
    }
    
    self.cache.normalized.sort(_sort_fn);
    
  },
  
  filter_owner_name: function(owner_name) {
    var self = this;
    if ( owner_name !== undefined && owner_name != this.owner_name ) {
      this.owner_name = owner_name;
    }
    this.add_filter({ type: "owner_name", fn: function(tr) {
      return ( tr[self.idx.OwnerString].indexOf(self.owner_name) > -1 );
    }})
  },

  filter_search : function(q) {
    var self = this;
    
    console.log("FILTERING:", q);
    this.q = $.trim(q).toLowerCase();
    if ( this.q == "" ) {
      this.remove_filter({ type: "search" });
    } else {
      this.add_filter({ type: "search", fn: function(tr) {
        return ( tr[self.idx.CollName].match(self.q) );
      }})
    }
  },
  
  add_filter: function(filter) {
    var num_filters = this.filters.length;
    for(var i = 0; i < num_filters; i++) {
      if ( this.filters[i].type == filter.type ) {
        this.filters[i] = filter;
        filter.added = true;
        break;
      }
    }
    if ( filter.added != true ) {
      this.filters.push(filter);
    }
  },
  
  has_filter: function(type) {
    var num_filters = this.filters.length;
    for(var i = 0; i < num_filters; i++) {
      if ( this.filters[i].type == type ) {
        return true;
      }
    }
    return false;
  },
  
  remove_filter: function(filter) {
    var splice_idx = -1;
    for(var i = 0; i < this.filters.length; i++) {
      if ( this.filters[i].type == filter.type ) {
        splice_idx = i;
        break;
      }
    }
    if ( splice_idx >= 0 ) {
      this.filters.splice(i, 1);
    }
  },
  
  apply_filters : function() {
    var self = this;
    var cache = self.cache;

    var num_filters = this.filters.length;
    var filters = this.filters;
    var f = self.cache.filtered;
    
    cache.filtered = [];
    var checkIndex = cache.normalized[0].length - 1;
    var n = cache.normalized;

    // and reset the paginator
    this.paginator = null;

    var totalRows = n.length;
    for(var i = 0; i < totalRows; i++) {
      var pos = n[i][checkIndex];
      var row = n[i];
      // var $this = cache.row[pos];
      var check;
      if ( num_filters == 0 ) {
        check = true;
      } else {
        check = true;
        for ( var ii = 0; ii < num_filters; ii++ ) {
          check = check && filters[ii].fn(row);
          if ( ! check ) {
            break;
          }
        }
      }

      if ( check ) {
        //$this.addClass("selected");
        cache.filtered.push(pos);
      }
    }

    this.render();
  },
  
  render : function() {
    var self = this;
    
    this.$results.empty();
    var resultDiv = this.$results.get(0);

    var c = this.cache,
        h = c.html,
        n = c.normalized,
        f = c.filtered,
        checkCell = (n[0].length - 1),
        totalRows = f.length;

    var i = -1;
    
    var t0 = (new Date).getTime();
    
    // build a single HTML array for the entire listing
    // and slam it onto the resultsDiv

    if ( this.paginator == null ) {
      this.paginator = Object.create(Paginator).init({ items : f })
    }
    var page = this.paginator.page;
    console.log("PAGINATOR", page);


    var html = [];
    for(var j = 0; j < page.n; j++) {

      // var pos = f[j];
      var pos = page.items[j];
      
      var row = h[pos];

      var data = {};
      i += 1;
      data.stripe = i % 2 == 0 ? "" : "odd";
      
      data.collid = row[self.idx.CollId];
      data.collname = row[self.idx.CollName];
      data.description = row[self.idx.Description];
      data.num_items = row[self.idx.NumItems];
      data.owner_name = row[self.idx.OwnerString];
      data.owner_affiliation = row[self.idx.OwnerAffiliation];
      data.mine = row[self.idx.DeleteCollHref];
      if ( data.mine ) {
        data.mine = data.mine.replace(/colltype=([a-z-]+)/, "colltype=" + self.view);
      }
      data.shared = row[self.idx.Shared];
      data.featured = row[self.idx.Featured];
      data.mondo = row[self.idx.Mondo];
      data.updated = row[self.idx.Updated_Display];
      
      if ( data.owner_affiliation ) {
        if ( data.shared == 1 ) { // $this.data('shared')
          data.shared = "Public";
          data.altshared = "Private";
        } else {
          data.shared = "Private";
          data.altshared = "Public";
        }
      } else {
        data.shared = "Private";
        data.altshared = "Private";
      }
      
      var cls = "collection "  + data.stripe;
      if ( data.mine != '' ) {
        cls += " mine";
      }
      if ( ! data.shared ) {
        cls += " private";
      }
      if ( data.featured ) {
        cls += " featured";
      }
      
      html.push('<div class="' + cls + '">');

      var add_featured_ribbon = data.featured;
      if ( add_featured_ribbon && $.browser.msie && ( parseInt($.browser.version) < 8 ) ) {
        html.push('<div title="featured collection" class="ribbon featured"></div>');
        add_featured_ribbon = false;
      }
      
      html.push('<div class="left">');
      html.push('<h4 class="collname">');
      if ( data.mondo ) {
        html.push('<a href="ls?a=srchls;q1=*;coll_id=' + data.collid + '">' + data.collname + '</a>');
      } else {
        html.push('<a href="mb?a=listis;c=' + data.collid + '">' + data.collname + '</a>');
      }
      if ( data.featured ) {
        html.push('<span class="featured"> (Featured Collection)</span>');
      }
      html.push('</h4>');
      
      if ( $.trim(data.description) && $.trim(data.description) != "&nbsp;" ) {
        html.push('<p class="description">' + data.description + '</p>');
      }

      html.push('<p class="meta">');
      var owner_name_html = '<span class="owner_name">Owner: ' + data.owner_name;
      if ( data.owner_affiliation ) {
        owner_name_html += ' (' + data.owner_affiliation + ')';
      }
      owner_name_html += '</span>';
      html.push(owner_name_html);

      if ( data.mine != '' ) {
        var href="mb?a=editst;shrd=" + ( data.shared == 'Public' ? 0 : 1 ) + ";c=" + data.collid + ";colltype=" + this.view;
        if ( window.location.href.search(/debug=.*local.*/) > -1 ) {
          href += ";debug=local";
        }
        href += "#" + self.view;
        
        var change_sharing = ( data.owner_affiliation 
                               ?  
                               '<a href="${href}" class="btn btn-mini ${bg} toggle-sharing ${status}"><span class="sharing-status ${status}">${shared}</span> : Make ${altshared}</a>' + '&#160;&#160;' 
                               : "" );
        var options = 
          '<span class="options">' + change_sharing + '<a href="#" data-delete-href="${mine}" class="btn btn-mini delete-collection">Delete Collection</a>' +
          '</span>'
        options = options.
                    replace('${collid}',data.collid).
                    replace('${href}', href).
                    replace('${shared}', data.shared).
                    replace('${altshared}', data.altshared).
                    replace(/\$\{status\}/g, data.shared.toLowerCase()).
                    replace('${bg}', data.shared == 'Public' ? 'btn-inverse' : '').
                    replace('${mine}', data.mine);
        
        html.push(options);
        
      }
      html.push('</p>');

      html.push('</div>');
      
      if ( data.featured ) {
        html.push('<div class="right featured">');
      } else {
        html.push('<div class="right">');
      }

      var innerHTML = ( data.num_items || 0 ) + " item";
      if ( data.num_items != 1 ) { innerHTML += "s"; }
      
      html.push('<p class="num_items">' + innerHTML + '</p>');
      
      html.push('<p class="updated">last updated: ' + data.updated + '</p>');
      html.push('</div>');

      html.push('</div>');

    }

    resultDiv.innerHTML = html.join("\n");

    this.$active_filters.empty();
    // var total = $("div.collection").length;
    var other_filters_in_use = false;
    var title = "All Collections";
    if ( this.filters.length > 0 ) {
      var message = "Showing ";
      
      var tab_summary;
      if ( this.has_filter("view") ) {
        if ( this.view == "updated" ) {
          message += this.paginator.describe() + " of recently updated"; // " collections";
          title = "Recently Updated Collections";
        } else if ( this.view == "my-collections" ) {
          message += this.paginator.describe() + " of your"; //" collections";
          title = "My Collections";
        } else if ( this.view == 'featured' ) {
          message += this.paginator.describe() + " of featured";
          title = "Featured Collections";
        } else if ( this.view == 'mondo' ) {
          message += this.paginator.describe() + " of mondo";
          title = "Mondo Collections";
        } else {
          //message += " collections";
          // message += "all " + totalRows;
          message += this.paginator.describe() + " of all collections";
        }
      }

      message += " collections";
      var html = [];
      if ( this.has_filter("min_items") && this.min_items > 0 ) {
        html.push("with at least " + this.min_items + " items");
        other_filters_in_use = true;
      }
      if ( this.has_filter("search") && this.q ) {
        other_filters_in_use = true;
        html.push("matching \"" + this.q + "\"");
        other_filters_in_use = true;
      }
      this.$active_filters.text(message + " " + html.join(" and "));
      
      //$("#portfolio-title").text(title);
      
    } else {
      // this.$active_filters.text("Showing all " + total + " collections");
      this.$active_filters.text("Showing " + this.paginator.describe() + " of all collections");
    }
    
    if ( ! this.is_default_sort ) {
      other_filters_in_use = true;
    }
    
    this.$status.show();
    if ( this.view == "all" && ! other_filters_in_use ) {
      this.$reset.hide();
      this.$status.removeClass("with-filters");
    } else {
      this.$status.addClass("with-filters");
      this.$reset.show();
    }

    this.$title.text(title);
    this.show_pages();

    
  },

  show_pages: function() {

    function b2p(s) {
      return Math.floor(s / MAX_ROWS) + 1;
    }

    if ( ! this.paginator.page.is_active ) {
      $(".pages").hide();
      return;
    }
    var $div = $(".pages");
    if ( ! $div.length ) {
      $div = $("<div class='pages'></div>").insertAfter(this.$status);
    }
    $div.empty();
    var $ul = $("<ul></ul>").appendTo($div);
    var page = this.paginator.page;
    var pages = [ page.start - 1 ];
    // attach 3 previous
    var prev = page.prev;
    var next_page; var prev_page;
    var i = 0;
    while ( prev !== false && i < 3 ) {
      if ( prev_page === undefined ) {
        prev_page = prev;
      }
      i += 1;
      pages.unshift(prev);
      prev = prev - MAX_ROWS;
      if ( prev < 0 ) {
        prev = false;
      }
    }

    var next = page.next;
    i = 0;
    while ( next !== false && i < 3 ) {
      i += 1;
      pages.push(next);
      next = next + MAX_ROWS;
      if ( next > page.total ) {
        next = false;
      }
    }

    // now the rest of the lame business
    var num_pages = Math.ceil(page.total / MAX_ROWS);
    var last_slice = ( num_pages - 1 ) * MAX_ROWS;
    if ( pages.indexOf(last_slice) < 0 ) {
      if ( pages[pages.length - 1] + MAX_ROWS < last_slice ) {
        pages.push("...");
      }
      pages.push(last_slice);
    }
    if ( pages.indexOf(0) < 0 ) {
      if ( pages[0] - MAX_ROWS > 0 ) {
        pages.unshift("...");
      }
      pages.unshift(0);
    }

    var p = pages.indexOf(page.start - 1);
    if ( p > 0 ) {
      prev_page = pages[p - 1];
    }
    if ( p < pages.length - 1 ) {
      next_page = pages[p + 1]
    }

    // add the previous link
    if ( prev_page !== undefined ) {
      $('<li><a href="#{SLICE_START}">Previous</a></li>'.replace('{SLICE_START}', prev_page)).appendTo($ul);
    } else {
      $('<li>Previous</li>').appendTo($ul);
    }

    _.each(pages, function(p) {
      if ( p == '...' ) {
        $("<li>...</li>").appendTo($ul);
      } else {
        var $li = $("<li><a href='#{SLICE_START}'>{PAGE}</a></li>".replace('{SLICE_START}', p).replace('{PAGE}', b2p(p))).appendTo($ul);
        if ( p == page.start - 1 ) {
          $li.addClass("active");
        }
      }
    })

    // add the next link
    if ( next_page !== undefined ) {
      $('<li><a href="#{SLICE_START}">Next</a></li>'.replace('{SLICE_START}', next_page)).appendTo($ul);
    } else {
      $('<li>Next</li>').appendTo($ul);
    }

    $div.show();

  },

  goto_page: function(start) {
    this.paginator.recalculate(parseInt(start));
    this.render();
  }, 

  _setup_featured: function() {
    // take care of the featured here as well
    var featured_items = _.shuffle(this.cache.featured);
    // var random_idx = Math.floor(Math.random() * .length);
    // var featured = this.cache.html[this.cache.featured[random_idx]];

    // var tmpl = $("#featured-template").text();
    // var re = new RegExp("\$\{(.+?)\}", "g");
    // _.templateSettings = { interpolate : re };

    // var tmpl = $(".sidebar").data('template');

    var tmpl =       
      '<div class="Box" role="complementary">' + 
        '<div>' + 
          '<span class="title">' + 
            '<a href="mb?a=listis;c=${collid}">${collname}</a>' + 
          '</span>' + 
          '<a href="mb?a=listis;c=${collid}" aria-hidden="true">' + 
            '<img alt=" " class="imgLeft" src="${featured}" />' + 
          '</a>' + 
          '<p class="hyphenate">' + 
            '${description}' +
          '</p>' +
          '<br clear="all" />' +
        '</div>' + 
      '</div>';

    _.templateSettings = { interpolate : /\$\{(.+?)\}/g };
    tmpl = _.template(tmpl);

    for(var i = 0; i < 3; i++) {
      var featured = this.cache.html[featured_items[i]];
      var tmplData = {
        collid : featured[this.idx.CollId],
        collname : featured[this.idx.CollName],
        description : featured[this.idx.Description],
        featured : featured[this.idx.Featured]
      };
      
      // $("#featured-template").tmpl(tmplData).appendTo(this.$sidebar);
      $(tmpl(tmplData)).appendTo(this.$sidebar);
    }
    
  },

  _updateUrlForView: function(view) {
    var href = window.location.pathname;
    var delim;
    if ( href.indexOf("?") < 0 ) { delim = "?"; }
    else { delim = href.indexOf(";") < 0 ? '&' : ';'; }
    if ( href.indexOf("colltype=") < 0 ) {
      href += delim + "colltype=" + view;
    } else {
      href = href.replace(/colltype=([a-z-]+)/, "colltype=" + view);
    }
    return href;
  },

  update_state: function(view) {

    if ( view === undefined ) {
      view = this.view;
    }

    var new_href = this._updateUrlForView(view);
    if ( window.history && window.history.replaceState != null) {
        window.history.replaceState(null, document.title, new_href);
    } else {
        var newHash = '#' + view;
        window.location.replace(newHash); // replace blocks the back button!
        // window.location.hash = newHash; // clutters the browser history?
    }

    this.update_login_link(new_href);

  },
  
  update_login_link: function(href) {
    if ( window.location.protocol == "http:" ) {
      // update the Login link; this is escaped as a target to the WAYF URL
      var $loginLink = $(".loginLink");
      var login_href = $loginLink.attr("href").split('target=');
      login_href[1]= escape(href);
      $loginLink.attr('href', login_href.join('target='));
      if ( this.view == 'my-collections' ) {
        $(".login_status").show();
      } else {
        $(".login_status").hide();
      }
    }
  },

  track_pageview: function() {
    var args = {};
    if ( this.has_filter("min_items") && this.min_items > 0 ) {
      args.min_items = this.min_items;
    }
    if ( this.has_filter("search") && this.q ) {
      args.q = this.q;
    }
    args.sortby = this.$controls.find("select[name=sort_by]").val();
    HT.track_pageview(args);
  },

  EOT : true
  
};

// (function($) {
head.ready(function() {

  // Create a plugin based on a defined object
  $.plugin = function( name, object ) {
    $.fn[name] = function( options ) {
      return this.each(function() {
        if ( ! $.data( this, name ) ) {
          $.data( this, name, Object.create(object).init(
          options, this ) );
        } else {
          var ob = $.data(this, name);
          ob.handle(options);
        }
      });
    };
  };


  $.plugin('listbrowser', ListBrowser);
  $("#mbContentContainer").listbrowser({bucket : bucket});

  $("body").on("click", ".delete-collection", function(e) {
    var $this = $(this);
    var collname = $this.parents(".collection").find(".collname").text();
    var choice = window.confirm("Do you really want to delete the collection " + collname + "?");
    if ( choice ) {
      var href = $this.data('delete-href');
      $this.attr('href', href);
      HT.track_event({ action : 'MB Collection Delete', label : '"' + collname + '"' + " " + href.replace(/.*c=(\d+).*/, "$1")})
      return true;
    }
    return false;
  });
  
  $("body").on("click", ".toggle-sharing", function(e) {
    var collname = $(this).parents(".collection").find("p.collname").text();
    var href = $(this).attr('href');
    var label = ( href.indexOf("shrd=1") < 0 ) ? "Make Private" : "Make Public";
    HT.track_event({ action : 'MB Collection Status', label : (label + " " + href.replace(/.*c=(\d+).*/, "$1"))});
    return true;
  })
  
});
// })(jQuery);