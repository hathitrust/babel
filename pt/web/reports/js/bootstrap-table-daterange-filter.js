/**
 * @author: roger <roger@umich.edu>
 * @version: v0.0.1
 *
 */

const Utils = $.fn.bootstrapTable.utils

const bootstrap = {
  bootstrap3: {
    icons: {
      advancedSearchIcon: 'glyphicon-chevron-down'
    },
    html: {
    }
  },
  bootstrap4: {
    icons: {
      advancedSearchIcon: 'fa-chevron-down'
    },
    html: {
    }
  }
}[$.fn.bootstrapTable.theme]

$.extend($.fn.bootstrapTable.defaults, {
  dateFilterSearch: false,
  idTable: undefined,
  onDateFilterSearch (field, text) {
    return false
  }
})

$.extend($.fn.bootstrapTable.defaults.icons, {
  advancedSearchIcon: bootstrap.icons.advancedSearchIcon
})

$.extend($.fn.bootstrapTable.Constructor.EVENTS, {
  'column-advanced-search.bs.table': 'onColumnAdvancedSearch'
})

$.extend($.fn.bootstrapTable.locales, {
  formatAdvancedSearch () {
    return 'Advanced search'
  },
  formatAdvancedCloseButton () {
    return 'Close'
  }
})

$.extend($.fn.bootstrapTable.defaults, $.fn.bootstrapTable.locales)

$.BootstrapTable = class extends $.BootstrapTable {
  initToolbar () {
    var that = this;
    const o = this.options

    this.showToolbar = this.showToolbar ||
      (o.search &&
      o.advancedSearch &&
      o.idTable)

    super.initToolbar()

    this.$form = $("#form-daterange-filter");

    this.$form.on("click", "#action-datetime-filter", function(event) {
      event.preventDefault();
      var params = {};
      params.datetime_start = $form.find("input[name='datetime-start']").val().trim() || '0000-00-00';
      params.datetime_end = $form.find("input[name='datetime-end']").val().trim() || '0000-00-00';
      if ( params.datetime_end == '0000-00-00' ) { params.datetime_end = '9999-99-99'; }

      that.initSearch();
      that.updatePagination();
    });

    that.$form.on('click', "#action-clear-datetime-filter", function(event) {
      event.preventDefault();
      that.$form.find("input[name='datetime-start']").val('0000-00-00');
      that.$form.find("input[name='datetime-end']").val('9999-99-99');

      that.initSearch();
      that.updatePagination();
    })

  }

  initSearch () {
    super.initSearch()

    if (!this.options.dateRangeFilter || this.options.sidePagination === 'server') {
      return
    }

    var params = {};
    params.datetime_start = this.$form.find("input[name='datetime-start']").val().trim() || '0000-00-00 00:00:00';
    params.datetime_end = this.$form.find("input[name='datetime-end']").val().trim() || '9999-99-99 23:59:59';
    if ( params.datetime_end == '0000-00-00' ) { params.datetime_end = '9999-99-99 23:59:59'; }

    if ( ! params.datetime_start.match(/\d\d:\d\d:\d\d/) ) {
      params.datetime_start += " 00:00:00";
    }
    if ( ! params.datetime_end.match(/\d\d:\d\d:\d\d/) ) {
      params.datetime_end += " 23:59:59";
    }

    let doFilter = true;

    if ( params.datetime_start == '0000-00-00 00:00:00' && 
         params.datetime_end == '9999-99-99 23:59:59' ) {
      doFilter = false;
    }

    this.data = doFilter ? this.data.filter((row, i) => {
      return row.datetime >= params.datetime_start && row.datetime <= params.datetime_end;
    }) : this.data;

    if ( ! this.options.sortName ) {
      this.options.sortName = 'datetime';
      this.options.sortOrder = 'desc';
    }
  }

  onColumnAdvancedSearch (e) {
    const text = $.trim($(e.currentTarget).val())
    const $field = $(e.currentTarget)[0].id

    if ($.isEmptyObject(this.filterColumnsPartial)) {
      this.filterColumnsPartial = {}
    }
    if (text) {
      this.filterColumnsPartial[$field] = text
    } else {
      delete this.filterColumnsPartial[$field]
    }

    if (this.options.sidePagination !== 'server') {
      this.options.pageNumber = 1
      this.onSearch(e)
      this.updatePagination()
      this.trigger('column-advanced-search', $field, text)
    }
  }
}