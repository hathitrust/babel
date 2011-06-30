// define a console if not exists
if ( window.console === undefined ) {
    window.console = {
        log : function() { }
    }
}

$(document).ready(function() {
  $(".delete-collection").live("click", function() {
    var collname = $(this).parents(".collection").find("p.collname").text();
    var check = doYouReally(collname);
    var href = $(this).data('delete-href');
    href += "#" + App.view;
    if ( check ) {
      $(this).attr('href', href);
      return true;
    }
    return false;
  })
})

jQuery(function($) {
  
  window.ColListApp = Spine.Controller.create({
    el: $("#mbContentContainer"),
    
    proxied: [],
    
    events: {
      "click .reset_filters_link" : "reset_filters"
    },
    
    elements: {
      ".PublicCollections" : "collections"
      , ".collectionData" : "collectionData"
      , ".results" : "results"
      , ".status": "status"
      , ".active_filters" : "active_filters"
      , ".reset_filters_link" : "reset_filters_link"
      , ".controls" : "controls"
      , "#Sidebar" : "sidebar"
    },
    
    NBSP: String.fromCharCode(160),
    
    init: function() {
      // 
      //$.loadTemplate("./js/controls.tmpl", "controls");
      // $.loadTemplate("./js/results.tmpl", "results");
      
      this.recent_timepoint = (1).month().ago().toString("yyyy-MM-dd hh:mm:ss");
      this.default_min_items = 0;

      this.collectionData.hide();
      this.installed_controls = false;

      console.log("INIT BEGIN: ", ( new Date() ).getTime());

      this._build_cache();
      this.clear_filters();

      console.log("SORT ARRAYS: ", ( new Date() ).getTime());
      

      console.log("INIT: ", ( new Date() ).getTime());
      

      console.log("RENDERED: ", ( new Date() ).getTime());
      
      this.view = "all";
      
      this.routes({
        "updated" : function() {
          console.log("VIEW: UPDATED");
          this.filter_view("updated");
          this.apply_filters();
        },
        "featured": function() {
          console.log("VIEW: FEATURED");
          this.filter_view("featured");
          this.apply_filters();
        },
        "my-collections": function() {
          console.log("VIEW: MINE");
          this.filter_view("my-collections");
          this.apply_filters();
        },
        "all" : function() {
          console.log("VIEW: ALL");
          this.filter_view("all");
          this.apply_filters();
        },
        "" : function() {
          console.log("VIEW: ALL");
          this.filter_view("all");
          this.apply_filters();
        }
        
      })
      
      var colltype = window.location.href.match(/colltype=([a-z-]+)/);
      if ( colltype !== null && ! window.location.hash ) {
        colltype = colltype[1];
        if ( colltype == "priv" ) { colltype = "my-collections"; }
        else if ( colltype == "pub" ) { colltype = "all"; }
        this.navigate(colltype, true);
      }
      // if ( colltype == "priv" || colltype == "my-collections" ) {
      //   Spine.Route.navigate("my-collections", true);
      // } else if ( colltype == "featured" ) {
      //   Spine.Route.navigate("featured", true);
      // } else if ( colltype == "updated" ) {
      //   Spine.Route.navigate("featured", true);
      // }
      
    },
    
    navigate: function(view, invoke_events) {
      Spine.Route.navigate(view, invoke_events);
      this.update_login_link(view);
    },
    
    _build_cache: function() {
      var self = this;
      
      this.idx = {};
      // this.collectionData.find("th").each(function(i, e) {
      //   self.idx[$(this).attr("class")] = i;
      // })
      
      this.idx["collid"] = 0;
      this.idx["collname"] = 1;
      this.idx["description"] = 2;
      this.idx["num_items"] = 3;
      this.idx["owner_name"] = 4;
      this.idx["updated"] = 5;
      this.idx["updated_display"] = 6;
      this.idx["featured"] = 7;
      this.idx["shared"] = 8;
      this.idx["mine"] = 9;
      
      self.cache = {
        html: [],
        normalized: [],
        featured: []
      };
      
      self.cache.html = bucket.html;
      self.cache.featured = bucket.featured;
      
      var t0 = new Date();
      
      
      var num_cells = self.cache.html[0].length;
      for(var i = 0, num_rows=self.cache.html.length; i < num_rows; i++) {
        var cols = [];
        var html = self.cache.html[i];
        for (var j = 0; j < num_cells; j++) {
          cols.push(html[j].toLowerCase());
        }
        if ( cols[self.idx.description] ) {
          cols[self.idx.collname] += " " + cols[self.idx.description];
        }
        cols[self.idx.collname] += " " + cols[self.idx.owner_name];
        cols.push(self.cache.normalized.length); // add position for rowCache
        self.cache.normalized.push(cols);
      }
      
      var t1 = new Date();      
      console.log("TABLESORTER: ", t0, "/", t1, "/", ( t1.getTime() - t0.getTime() ));
      return;

      var t0 = new Date();
      
      var idx_owner_name = self.idx.owner_name;
      var idx_featured = self.idx.featured;
      
      var table = self.collectionData.get(0);
      var num_rows = table.tBodies[0].rows.length;
      var num_cells = table.tBodies[0].rows[0].cells.length;
      var tBody = table.tBodies[0];
      for ( var i = 0; i < num_rows; i++ ) {
        var tr = table.tBodies[0].rows[i];
        var cols = [];
        var html = [];
        for ( var j = 0; j < num_cells; j++ ) {
          var $cell = $(tr.cells[j]);
          var text = $cell.text();
          cols.push(text.toLowerCase()); // .toLowerCase());
          if ( j > 0 ) { html.push(text); }
          else { html.push($cell.html()); }
          // html.push($cell.html());
        }
        // combine description with collname
        if( cols[1] ) {
          cols[0] += " " + cols[1];
        }
        cols[0] += " " + cols[idx_owner_name];
        cols.push(self.cache.normalized.length); // add position for rowCache
        self.cache.normalized.push(cols);
        self.cache.html.push(html);
        
        if ( cols[idx_featured] ) {
          self.cache.featured.push(html);
        }
        
      }
            
      var t1 = new Date();      
      console.log("TABLESORTER: ", t0, "/", t1, "/", ( t1.getTime() - t0.getTime() ));
      
    },
    
    render: function() {
      var self = this;
      
      if ( ! this.installed_controls ){
        this.installed_controls = true;
        console.log($("#controls-template"));
        var $html = $("#controls-template").tmpl({});
        $html.insertBefore(self.results);
        self.refreshElements();

        self.controls.find("select[name=min_items]").bind("change", function() {
          var min_items = $(this).val();
          self.filter_min_items(min_items);
          self.apply_filters();
        })

        self.controls.find("select[name=sort_by]").bind("change", function() {
          var key = $(this).val();
          var rel = $(this).find("option:selected").attr("rel");
          console.log(key, rel);
          self.sort_by(key, rel);
          self.apply_filters();
        })
        
        self.controls.find("input[name=toggle_descriptions]").bind("click", function() {
          if ( $(this).is(":checked") ) {
            $("p.description").show();
          } else {
            $("p.description").hide();
          }
        })
        
        self.controls.find(".filters button").click(function() {
          var $this = $(this);
          $this.parents("ul").find("button").removeClass("active");
          $this.addClass("active");
          var view = $this.attr('rel');
          self.navigate(view, true);
        })
        
        // fix the active button
        if ( window.location.hash && window.location.hash != "#all" ) {
          self.controls.find("button[rel=all]").removeClass("active");
          self.controls.find("button[rel=" + window.location.hash.substr(1) + "]").addClass("active");
        }
        
        self.input_filter = self.controls.find("input[name=q]");
        self.input_filter.bind('keyup', function(e) {
          if ( this.value != self.q ) {
            self.filter_search(this.value);
            self.apply_filters();
          }
        })
        self.input_filter.bind('keypress', function(e) {
          if ( e.keyCode == 13 ) { return false; }
        }).bind('keyup', function(e) {
          if ( e.keyCode == 27 ) {
            $(this).val('');
            self.filter_search('');
            self.apply_filters();
            return false;
          }
        })
        
        try {
          $("input[placeholder]", this.controls).placeholder();
        } catch(e) {
          // noop
        }
                        
        this.refreshElements();
        this.delegateEvents();
        
        // take care of the featured here as well
        var random_idx = Math.floor(Math.random() * this.cache.featured.length);
        var featured = this.cache.html[this.cache.featured[random_idx]];
        
        var tmplData = {
          collid : featured[this.idx.collid],
          collname : featured[this.idx.collname],
          description : featured[this.idx.description],
          featured : featured[this.idx.featured]
        };
        
        $("#featured-template").tmpl(tmplData).appendTo(this.sidebar);
        Hyphenator.run();
      }
      
      this.results.empty();
      var resultDiv = this.results.get(0);
      var fragment = document.createDocumentFragment();
      var c = this.cache,
          h = c.html,
          n = c.normalized,
          f = c.filtered,
          checkCell = (n[0].length - 1),
          totalRows = f.length;
      //this.collectionData.find(".selected").each(function(i, e) {
      var i = -1;
      
      for(var j = 0; j < totalRows; j++) {

        //var pos = n[j][checkCell];
        var pos = f[j];
        
        var row = h[pos];
        //if ( ! $this.hasClass("selected") ) { continue; }

        var data = {};
        i += 1;
        data.stripe = i % 2 == 0 ? "even" : "odd";
        
        data.collid = row[self.idx.collid];
        data.collname = row[self.idx.collname];
        data.description = row[self.idx.description];
        data.num_items = row[self.idx.num_items];
        data.owner_name = row[self.idx.owner_name];
        data.mine = row[self.idx.mine].replace(/colltype=([a-z-]+)/, "colltype=" + self.view);
        data.shared = row[self.idx.shared];
        data.featured = row[self.idx.featured];
        data.updated = row[self.idx.updated_display];
        
        if ( data.shared == 1 ) { // $this.data('shared')
          data.shared = "Public";
          data.altshared = "Private";
        } else {
          data.shared = "Private";
          data.altshared = "Public";
        }

        // painful but faster!
        var div = document.createElement("div");
        var $div = $(div);
        var cls = "collection";
        if ( i % 2 == 0 ) { cls += " even"; }
        else { cls += " odd"; };
        if ( data.mine != '' ) {
          cls += " mine";
        }
        if ( data.shared == "Private" ) {
          cls += " private";
        }
        //cls += " cf";
        if ( data.featured ) {
          cls += " featured";
        }
        if ( $.browser.mozilla ) {
          cls += " mozilla";
        }
        
        
        $div.addClass(cls);
        
        var html = [];
        if ( data.featured && $.browser.msie && ( parseInt($.browser.version) < 8 ) ) {
          html.push('<div title="featured collection" class="ribbon featured"></div>');
          data.featured = false;
        }
        
        html.push('<div class="left">');
        html.push('<p class="collname">');
        html.push('<a href="mb?a=listis;c=' + data.collid + '">' + data.collname + '</a>');
        html.push('</p>');
        
        if ( $.trim(data.description) && $.trim(data.description) != "&nbsp;" ) {
          html.push('<p class="description">' + data.description + '</p>');
        }

        html.push('<p class="meta">');
        html.push('<span class="owner_name">Owner: ' + data.owner_name + '</span>');

        if ( data.mine != '' ) {
          var href="mb?a=editst;shrd=" + ( data.shared == 'Public' ? 0 : 1 ) + ";c=" + data.collid + ";colltype=" + this.view;
          if ( window.location.href.indexOf("debug=") > -1 ) {
            href += ";debug=local";
          }
          href += "#" + self.view;
          
          var options = 
            '<span class="options">' + 
              '<a href="${href}" class="awesome thin small grey toggle-sharing"><span class="sharing-status ${status}">${shared}</span> : Make ${altshared}</a>' +
              '&#160;&#160;<a href="#" data-delete-href="${mine}" class="awesome thin small grey delete-collection">Delete Collection</a>' +
            '</span>'
          options = options.
                      replace('${collid}',data.collid).
                      replace('${href}', href).
                      replace('${shared}', data.shared).
                      replace('${altshared}', data.altshared).
                      replace('${status}', data.shared.toLowerCase()).
                      replace('${mine}', data.mine);
          
          html.push(options);
          
        }
        html.push('</p>');

        //$leftDiv.append($p);
        
        html.push('</div>');
        html.push('<div class="right">');
        if ( data.featured ) {
          if ( $.browser.mozilla || $.browser.safari ) {
            html.push('<div class="wrapper">');
          }
          html.push('<div title="featured collection" class="ribbon featured"></div>');
        }

        
        
        // p = document.createElement("p");
        // $p = $(p);
        // $p.addClass("num_items");
        var innerHTML = data.num_items + " item";
        if ( data.num_items > 1 ) { innerHTML += "s"; }
        // $p.append(innerHTML);
        // $rightDiv.append($p);
        
        html.push('<p class="num_items">' + innerHTML + '</p>');
        
        // p = document.createElement("p");
        // $p = $(p);
        // $p.addClass("updated");
        // var innerHTML = "last updated: " + data.updated;
        // $p.append(innerHTML);
        // $rightDiv.append($p);
        
        html.push('<p class="updated">last updated: ' + data.updated + '</p>');
        
        if ( $.browser.mozilla || $.browser.safari ) {
          html.push('</div>'); // wrapper
        }
        html.push('</div>');
        div.innerHTML = html.join('\n');
        
        fragment.appendChild(div);
        
      } //)
      
      resultDiv.appendChild(fragment.cloneNode(true));
      if ( $.browser.mozilla || $.browser.safari ) {
        $(".wrapper").each(function() {
          var h = $(this).parent().height();
          var h2 = $(this).height();
          var $ribbon = $(this).children(".ribbon");
          $ribbon.css('top', (-Math.ceil(h/2) + Math.ceil(h2/2) - 5) + "px");
          // var $p = $(this).parent();
          // var h = $p.height();
          // $(this).height(h); // .css({'margin-bottom': Math.floor(h/2) * -1});
          // $(this).find("p.num_items").css('padding-top', Math.floor(h/4) + "px");
        })
      }


      this.active_filters.empty();
      if ( this.filters.length > 0 ) {
        var total = $("div.collection").length;
        var message = "Showing " + total;
        if ( this.has_filter("view") ) {
          if ( this.view == "updated" ) {
            message += " of recently updated"; // " collections";
          } else if ( this.view == "featured" ) {
            message += " of featured"; // " collections";
          } else if ( this.view == "my-collections" ) {
            message += " of your"; //" collections";
          } else {
            //message += " collections";
          }
        }
        message += " collections";
        var html = [];
        if ( this.has_filter("min_items") && this.min_items > 0 ) {
          html.push("with at least " + this.min_items + " items");
        }
        if ( this.has_filter("search") && this.q ) {
          html.push("matching \"" + this.q + "\"");
        }
        this.active_filters.text(message + " " + html.join(" and "));
        if ( this.view != "all" || html.length > 0 ) {
          this.status.show();
        }
      } else {
        this.status.hide();
      }

    },
    
    clear_filters: function() {
      this.filters = [];
    },
    
    clear_sort: function() {
      // really, restore sort by collname
      this.sort_by("collname");
    },
    
    reset_filters: function() {
      this.clear_filters();
      this.clear_sort();
      this.filter_min_items(this.default_min_items);
      this.filter_view("all");
      
      // reset controls
      this.controls.find("select[name=min_items]").val(this.min_items);
      this.controls.find("select[name=sort_by]").val("collname");
      this.controls.find("input[name=q]").val("");
      var $buttons = this.controls.find(".filters button");
      $buttons.removeClass("active").filter("button[rel=all]").addClass("active");
      
      //this.apply_filters();
      this.navigate("all", true);
      return false; // this seems lame
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
    
    filter_view: function(view) {
      var self = this;
      self.view = view;
      if ( self.view == "my-collections" || self.view == "featured" ) {
        this.filter_min_items(0);
      }
      
      if ( self.view == "all" ) {
        // not a filter; punt
        self.remove_filter({ type: "view" });
        return;
      }
      
      self.add_filter({ type : "view", fn: function(tr) {
        if ( self.view == "updated" ) {
          return ( tr[self.idx.updated] >= self.recent_timepoint );
        } else if ( self.view == "featured" ) {
          return ( tr[self.idx.featured] != '' );
        } else if ( self.view == "my-collections" ) {
          return ( tr[self.idx.mine] != '' );
        } else if ( self.view == "all" ) {
          return true;
        }
      }})
    },
    
    filter_min_items: function(min_items) {
      var self = this;
      if ( min_items !== undefined && min_items != this.min_items ) {
        this.min_items = min_items;
        this.controls.find("select[name=min_items]").val(this.min_items);
      }
      
      if ( this.min_items == 0 ) {
        this.remove_filter({ type : "min_items" });
        return;
      }
      
      this.add_filter({ type : "min_items", fn : function(tr) {
        var num_items = parseInt(tr[self.idx.num_items]);
        return ( num_items >= self.min_items );
      }})
    },
    
    filter_owner_name: function(owner_name) {
      var self = this;
      if ( owner_name !== undefined && owner_name != this.owner_name ) {
        this.owner_name = owner_name;
      }
      this.add_filter({ type: "owner_name", fn: function(tr) {
        return ( tr[self.idx.owner_name].indexOf(self.owner_name) > -1 );
      }})
    },
    
    filter_search: function(q) {
      var self = this;
      
      this.q = $.trim(q);
      
      if ( this.q == "" ) {
        this.remove_filter({ type: "search" });
      } else {
        this.add_filter({ type: "search", fn: function(tr) {
          return ( tr[self.idx.collname].match(q) );
        }})
      }
      
    },

    sort_by: function(key, rel) {
      // var expr = "th." + key + " a";
      // $(expr).click();
      if ( rel === undefined || rel == "asc" ) { delta = 0; }
      else if ( rel == "desc" ) { delta = 1; }
      var sorting = [];
      
      var idx = this.idx[key];
      sorting.push([idx, delta]);
      if ( key != "collname" ) {
        sorting.push([this.idx['collname'], delta]);
      }
      
      console.log("SORT SETUP: ", ( new Date() ).getTime());
      this._apply_sorting(sorting);
      console.log("SORT DONE: ", ( new Date() ).getTime());
      
    },
    
    apply_filters: function() {
      var self = this;
      var cache = self.cache;

      var num_filters = this.filters.length;
      var filters = this.filters;
      var f = self.cache.filtered;
      
      var t0 = new Date();
            
      var t1 = new Date();
      
      console.log("FILTERS CLEARED: ", t0, "/", t1, "/", ( t1.getTime() - t0.getTime() ));
      
      t0 = t1;
      
      cache.filtered = [];
      var checkIndex = cache.normalized[0].length - 1;
      var n = cache.normalized;
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
      
      t1 = new Date();      
      console.log("FILTERS APPLIED: ", t0, "/", t1, "/", ( t1.getTime() - t0.getTime() ));

      t0 = t1;
      this.render();

      t1 = new Date();      
      console.log("RENDERED: ", t0, "/", t1, "/", ( t1.getTime() - t0.getTime() ));

    },
    
    _apply_sorting: function(sorting) {
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
      
      console.log("AHOY", sorting);
      
      var self = this;
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
          var idx = sort[0];
          var avalue = a[idx];
          var bvalue = b[idx];
          if ( idx == self.idx.num_items ) {
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
    
    update_login_link: function(view) {
      if ( view === undefined ) {
        view = this.view;
      }
      console.log("UPDATING TO", view, this.view);
      if ( window.location.protocol == "http:" ) {
        // update the Login link; this is escaped as a target to the WAYF URL
        var $loginLink = $("#loginLink");
        var login_href = $loginLink.attr("href").split('target=');
        var href = unescape(login_href[1]);
        var delim = href.indexOf(";") < 0 ? '&' : ';';
        if ( href.indexOf("colltype=") < 0 ) {
          href += delim + "colltype=" + view;
        } else {
          href = href.replace(/colltype=([a-z-]+)/, "colltype=" + view);
        }
        login_href[1]= escape(href);
        $loginLink.attr('href', login_href.join('target='));
      }
    },
        
    EOT: true
    
        
  })
  
  window.App = ColListApp.init(); 
  Spine.Route.setup();
  
});
