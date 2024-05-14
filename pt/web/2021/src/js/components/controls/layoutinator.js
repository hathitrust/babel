import { createNanoEvents } from 'nanoevents';
import debounce from 'lodash/debounce';

export var Layoutinator = class {
  constructor(options={}) {
    this.input = options.input;
    this.reader = options.reader;
    this.emitter = createNanoEvents();
    this.bindEvents();
  }

  on() {
    return this.emitter.on.apply(this.emitter, arguments)
  }

  bindEvents() {
    this.$sidebar = document.querySelector(this.input.sidebar);
    this._bindLayoutTweaker();
    this._bindSidebarToggle();

    this.reader.on('show:reader', () => {
      if ( this.$toggle.offsetHeight > 0 ) {
        // narrow viewport
        document.body.dataset.sidebarToggleState = 'closed';
        this.reader.$root.setAttribute('aria-hidden', false);
        this.$toggle.setAttribute('aria-expanded', false);
      }
    })

    const fixRootAria = function() {
      if ( this.$tweaker.offsetWidth > 0 && this.$tweaker.offsetHeight > 0 ) {
        this.reader.$root.setAttribute('aria-hidden', false);
        this.$toggle.setAttribute('aria-expanded', false);
        document.body.dataset.sidebarToggleState = 'closed';
      }
    }.bind(this);

    this.reader.on('resize', debounce(fixRootAria, 100));
  }

  _bindSidebarToggle() {
    this.$toggle = document.querySelector(this.input.toggle);

    this.$toggle.addEventListener('click', (event) => {
      event.stopPropagation();
      document.body.dataset.sidebarToggleState = document.body.dataset.sidebarToggleState == 'closed' ? 'open' : 'closed';
      this.$toggle.setAttribute('aria-expanded', document.body.dataset.sidebarToggleState == 'open');
      this.reader.$root.setAttribute('aria-hidden', document.body.dataset.sidebarToggleState == 'open');
    })
  }

  _bindLayoutTweaker() {
    this.$tweaker = document.querySelector(this.input.tweaker);

    let isDragging = false;
    let hasDragged = false;
    let marginLeft = 0;
    let lastClientX = -1;

    const $tweakContainer = this.$tweaker.parentElement;
    const $layoutContainer = this.input.$layoutContainer;
    const $sidebar = this.$sidebar;

    const classList = document.documentElement.classList;
    const $body = document.body;
    const gridSidebarColumnWidth = '--grid-sidebar-column-width';

    // classList.add('ie');
    if ( 
      // classList.contains("mobile") || 
      classList.contains("ie") || 
      document.documentElement.dataset.usesGrid == 'false'
    ) {
      // just bind simple toggle
      const action = this.$tweaker;
      action.addEventListener('click', (event) => {
        event.stopPropagation();
        $body.dataset.sidebarState = $body.dataset.sidebarState == 'closed' ? 'open' : 'closed';
        this._updateTweakAttributes();
      })

      return;
    }

    this.$tweaker.addEventListener('keyup', (event) => {
      if ( event.key == 'Enter' || event.key == 'Return' ) {
        event.stopPropagation();
        $body.dataset.sidebarState = $body.dataset.sidebarState == 'closed' ? 'open' : 'closed';
        this._updateTweakAttributes();
      }
    })

    $tweakContainer.addEventListener('mousedown', (event) => {
      const target = event.target.closest("button#action-tweak-sidebar,.d--sidebar--toggle--edge mq--wide");
      if ( ! target ) { return ; }
      isDragging = true;
      $layoutContainer.style.cursor = 'ew-resize';
      marginLeft = parseInt(window.getComputedStyle($layoutContainer).marginLeft, 10);

      event.preventDefault();
      event.stopPropagation();
    })

    $layoutContainer.addEventListener('mousemove', (event) => {
      if ( isDragging ) {
        hasDragged = true;
        let width = event.clientX - marginLeft;
        lastClientX = event.clientX;
        $body.style.setProperty(gridSidebarColumnWidth, `${width}px`);
        if ( $body.dataset.sidebarState == 'closed' ) {
          $body.dataset.sidebarState = 'open';
          this._updateTweakAttributes();
        }
        event.preventDefault();
      }
    })

    $layoutContainer.addEventListener('mouseup', (event) => {
      isDragging = false;
      var target = event.target.closest("button#action-tweak-sidebar,.d--sidebar--toggle--edge mq--wide");
      $body.dataset.gridSidebarColumnWidth = $body.style.getPropertyValue(gridSidebarColumnWidth);
      if ( target == this.$tweaker && ! hasDragged ) {
          document.body.dataset.sidebarState = 
            document.body.dataset.sidebarState == 'open' ? 'closed' : 'open';
          if ( document.body.dataset.sidebarState == 'open' && $body.style.getPropertyValue(gridSidebarColumnWidth) == '0px' ) {
            $body.style.setProperty(gridSidebarColumnWidth, null);
          }
          this._updateTweakAttributes();
      } else {
        if ( $sidebar.offsetWidth <= 100 ) {
          $body.style.setProperty(gridSidebarColumnWidth, '0px');
          document.body.dataset.sidebarState = 'closed';
          this._updateTweakAttributes(false);
        }
      }
      HT.prefs.set({ pt: { sidebarToggleState: document.body.dataset.sidebarState } });
      hasDragged = false;
      $layoutContainer.style.cursor = 'auto';
    })
  }

  _updateTweakAttributes(expanded) {
    const action = this.$tweaker;
    if ( expanded === undefined ) { expanded = document.body.dataset.sidebarState == 'open'; }
    action.setAttribute('aria-expanded', expanded);
    action.setAttribute('aria-label', 
      ! expanded ? 
      action.dataset.toggledLabel :
      action.dataset.untoggledLabel
    );
    if ( action._tippy ) {
      action._tippy.setContent(action.getAttribute('aria-label'));
    }
  }

};