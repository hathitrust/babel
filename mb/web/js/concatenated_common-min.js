if(typeof YAHOO=="undefined"||!YAHOO){var YAHOO={};}YAHOO.namespace=function(){var b=arguments,g=null,e,c,f;for(e=0;e<b.length;e=e+1){f=(""+b[e]).split(".");g=YAHOO;for(c=(f[0]=="YAHOO")?1:0;c<f.length;c=c+1){g[f[c]]=g[f[c]]||{};g=g[f[c]];}}return g;};YAHOO.log=function(d,a,c){var b=YAHOO.widget.Logger;if(b&&b.log){return b.log(d,a,c);}else{return false;}};YAHOO.register=function(a,f,e){var k=YAHOO.env.modules,c,j,h,g,d;if(!k[a]){k[a]={versions:[],builds:[]};}c=k[a];j=e.version;h=e.build;g=YAHOO.env.listeners;c.name=a;c.version=j;c.build=h;c.versions.push(j);c.builds.push(h);c.mainClass=f;for(d=0;d<g.length;d=d+1){g[d](c);}if(f){f.VERSION=j;f.BUILD=h;}else{YAHOO.log("mainClass is undefined for module "+a,"warn");}};YAHOO.env=YAHOO.env||{modules:[],listeners:[]};YAHOO.env.getVersion=function(a){return YAHOO.env.modules[a]||null;};YAHOO.env.parseUA=function(d){var e=function(i){var j=0;return parseFloat(i.replace(/\./g,function(){return(j++==1)?"":".";}));},h=navigator,g={ie:0,opera:0,gecko:0,webkit:0,chrome:0,mobile:null,air:0,ipad:0,iphone:0,ipod:0,ios:null,android:0,webos:0,caja:h&&h.cajaVersion,secure:false,os:null},c=d||(navigator&&navigator.userAgent),f=window&&window.location,b=f&&f.href,a;g.secure=b&&(b.toLowerCase().indexOf("https")===0);if(c){if((/windows|win32/i).test(c)){g.os="windows";}else{if((/macintosh/i).test(c)){g.os="macintosh";}else{if((/rhino/i).test(c)){g.os="rhino";}}}if((/KHTML/).test(c)){g.webkit=1;}a=c.match(/AppleWebKit\/([^\s]*)/);if(a&&a[1]){g.webkit=e(a[1]);if(/ Mobile\//.test(c)){g.mobile="Apple";a=c.match(/OS ([^\s]*)/);if(a&&a[1]){a=e(a[1].replace("_","."));}g.ios=a;g.ipad=g.ipod=g.iphone=0;a=c.match(/iPad|iPod|iPhone/);if(a&&a[0]){g[a[0].toLowerCase()]=g.ios;}}else{a=c.match(/NokiaN[^\/]*|Android \d\.\d|webOS\/\d\.\d/);if(a){g.mobile=a[0];}if(/webOS/.test(c)){g.mobile="WebOS";a=c.match(/webOS\/([^\s]*);/);if(a&&a[1]){g.webos=e(a[1]);}}if(/ Android/.test(c)){g.mobile="Android";a=c.match(/Android ([^\s]*);/);if(a&&a[1]){g.android=e(a[1]);}}}a=c.match(/Chrome\/([^\s]*)/);if(a&&a[1]){g.chrome=e(a[1]);}else{a=c.match(/AdobeAIR\/([^\s]*)/);if(a){g.air=a[0];}}}if(!g.webkit){a=c.match(/Opera[\s\/]([^\s]*)/);if(a&&a[1]){g.opera=e(a[1]);a=c.match(/Version\/([^\s]*)/);if(a&&a[1]){g.opera=e(a[1]);}a=c.match(/Opera Mini[^;]*/);if(a){g.mobile=a[0];}}else{a=c.match(/MSIE\s([^;]*)/);if(a&&a[1]){g.ie=e(a[1]);}else{a=c.match(/Gecko\/([^\s]*)/);if(a){g.gecko=1;a=c.match(/rv:([^\s\)]*)/);if(a&&a[1]){g.gecko=e(a[1]);}}}}}}return g;};YAHOO.env.ua=YAHOO.env.parseUA();(function(){YAHOO.namespace("util","widget","example");if("undefined"!==typeof YAHOO_config){var b=YAHOO_config.listener,a=YAHOO.env.listeners,d=true,c;if(b){for(c=0;c<a.length;c++){if(a[c]==b){d=false;break;}}if(d){a.push(b);}}}})();YAHOO.lang=YAHOO.lang||{};(function(){var f=YAHOO.lang,a=Object.prototype,c="[object Array]",h="[object Function]",i="[object Object]",b=[],g={"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#x27;","/":"&#x2F;","`":"&#x60;"},d=["toString","valueOf"],e={isArray:function(j){return a.toString.apply(j)===c;},isBoolean:function(j){return typeof j==="boolean";},isFunction:function(j){return(typeof j==="function")||a.toString.apply(j)===h;},isNull:function(j){return j===null;},isNumber:function(j){return typeof j==="number"&&isFinite(j);},isObject:function(j){return(j&&(typeof j==="object"||f.isFunction(j)))||false;},isString:function(j){return typeof j==="string";},isUndefined:function(j){return typeof j==="undefined";},_IEEnumFix:(YAHOO.env.ua.ie)?function(l,k){var j,n,m;for(j=0;j<d.length;j=j+1){n=d[j];m=k[n];if(f.isFunction(m)&&m!=a[n]){l[n]=m;}}}:function(){},escapeHTML:function(j){return j.replace(/[&<>"'\/`]/g,function(k){return g[k];});},extend:function(m,n,l){if(!n||!m){throw new Error("extend failed, please check that "+"all dependencies are included.");}var k=function(){},j;k.prototype=n.prototype;m.prototype=new k();m.prototype.constructor=m;m.superclass=n.prototype;if(n.prototype.constructor==a.constructor){n.prototype.constructor=n;}if(l){for(j in l){if(f.hasOwnProperty(l,j)){m.prototype[j]=l[j];}}f._IEEnumFix(m.prototype,l);}},augmentObject:function(n,m){if(!m||!n){throw new Error("Absorb failed, verify dependencies.");}var j=arguments,l,o,k=j[2];if(k&&k!==true){for(l=2;l<j.length;l=l+1){n[j[l]]=m[j[l]];}}else{for(o in m){if(k||!(o in n)){n[o]=m[o];}}f._IEEnumFix(n,m);}return n;},augmentProto:function(m,l){if(!l||!m){throw new Error("Augment failed, verify dependencies.");}var j=[m.prototype,l.prototype],k;for(k=2;k<arguments.length;k=k+1){j.push(arguments[k]);}f.augmentObject.apply(this,j);return m;},dump:function(j,p){var l,n,r=[],t="{...}",k="f(){...}",q=", ",m=" => ";if(!f.isObject(j)){return j+"";}else{if(j instanceof Date||("nodeType" in j&&"tagName" in j)){return j;}else{if(f.isFunction(j)){return k;}}}p=(f.isNumber(p))?p:3;if(f.isArray(j)){r.push("[");for(l=0,n=j.length;l<n;l=l+1){if(f.isObject(j[l])){r.push((p>0)?f.dump(j[l],p-1):t);}else{r.push(j[l]);}r.push(q);}if(r.length>1){r.pop();}r.push("]");}else{r.push("{");for(l in j){if(f.hasOwnProperty(j,l)){r.push(l+m);if(f.isObject(j[l])){r.push((p>0)?f.dump(j[l],p-1):t);}else{r.push(j[l]);}r.push(q);}}if(r.length>1){r.pop();}r.push("}");}return r.join("");},substitute:function(x,y,E,l){var D,C,B,G,t,u,F=[],p,z=x.length,A="dump",r=" ",q="{",m="}",n,w;for(;;){D=x.lastIndexOf(q,z);if(D<0){break;}C=x.indexOf(m,D);if(D+1>C){break;}p=x.substring(D+1,C);G=p;u=null;B=G.indexOf(r);if(B>-1){u=G.substring(B+1);G=G.substring(0,B);}t=y[G];if(E){t=E(G,t,u);}if(f.isObject(t)){if(f.isArray(t)){t=f.dump(t,parseInt(u,10));}else{u=u||"";n=u.indexOf(A);if(n>-1){u=u.substring(4);}w=t.toString();if(w===i||n>-1){t=f.dump(t,parseInt(u,10));}else{t=w;}}}else{if(!f.isString(t)&&!f.isNumber(t)){t="~-"+F.length+"-~";F[F.length]=p;}}x=x.substring(0,D)+t+x.substring(C+1);if(l===false){z=D-1;}}for(D=F.length-1;D>=0;D=D-1){x=x.replace(new RegExp("~-"+D+"-~"),"{"+F[D]+"}","g");}return x;},trim:function(j){try{return j.replace(/^\s+|\s+$/g,"");}catch(k){return j;
}},merge:function(){var n={},k=arguments,j=k.length,m;for(m=0;m<j;m=m+1){f.augmentObject(n,k[m],true);}return n;},later:function(t,k,u,n,p){t=t||0;k=k||{};var l=u,s=n,q,j;if(f.isString(u)){l=k[u];}if(!l){throw new TypeError("method undefined");}if(!f.isUndefined(n)&&!f.isArray(s)){s=[n];}q=function(){l.apply(k,s||b);};j=(p)?setInterval(q,t):setTimeout(q,t);return{interval:p,cancel:function(){if(this.interval){clearInterval(j);}else{clearTimeout(j);}}};},isValue:function(j){return(f.isObject(j)||f.isString(j)||f.isNumber(j)||f.isBoolean(j));}};f.hasOwnProperty=(a.hasOwnProperty)?function(j,k){return j&&j.hasOwnProperty&&j.hasOwnProperty(k);}:function(j,k){return !f.isUndefined(j[k])&&j.constructor.prototype[k]!==j[k];};e.augmentObject(f,e,true);YAHOO.util.Lang=f;f.augment=f.augmentProto;YAHOO.augment=f.augmentProto;YAHOO.extend=f.extend;})();YAHOO.register("yahoo",YAHOO,{version:"@VERSION@",build:"@BUILD@"});
/* /htapps/roger.babel/mb/web/yui2-lib/build/yahoo/yahoo-min.js */
YAHOO.util.CustomEvent=function(d,c,b,a,e){this.type=d;this.scope=c||window;this.silent=b;this.fireOnce=e;this.fired=false;this.firedWith=null;this.signature=a||YAHOO.util.CustomEvent.LIST;this.subscribers=[];if(!this.silent){}var f="_YUICEOnSubscribe";if(d!==f){this.subscribeEvent=new YAHOO.util.CustomEvent(f,this,true);}this.lastError=null;};YAHOO.util.CustomEvent.LIST=0;YAHOO.util.CustomEvent.FLAT=1;YAHOO.util.CustomEvent.prototype={subscribe:function(b,c,d){if(!b){throw new Error("Invalid callback for subscriber to '"+this.type+"'");}if(this.subscribeEvent){this.subscribeEvent.fire(b,c,d);}var a=new YAHOO.util.Subscriber(b,c,d);if(this.fireOnce&&this.fired){this.notify(a,this.firedWith);}else{this.subscribers.push(a);}},unsubscribe:function(d,f){if(!d){return this.unsubscribeAll();}var e=false;for(var b=0,a=this.subscribers.length;b<a;++b){var c=this.subscribers[b];if(c&&c.contains(d,f)){this._delete(b);e=true;}}return e;},fire:function(){this.lastError=null;var h=[],a=this.subscribers.length;var d=[].slice.call(arguments,0),c=true,f,b=false;if(this.fireOnce){if(this.fired){return true;}else{this.firedWith=d;}}this.fired=true;if(!a&&this.silent){return true;}if(!this.silent){}var e=this.subscribers.slice();for(f=0;f<a;++f){var g=e[f];if(!g||!g.fn){b=true;}else{c=this.notify(g,d);if(false===c){if(!this.silent){}break;}}}return(c!==false);},notify:function(g,c){var b,i=null,f=g.getScope(this.scope),a=YAHOO.util.Event.throwErrors;if(!this.silent){}if(this.signature==YAHOO.util.CustomEvent.FLAT){if(c.length>0){i=c[0];}try{b=g.fn.call(f,i,g.obj);}catch(h){this.lastError=h;if(a){throw h;}}}else{try{b=g.fn.call(f,this.type,c,g.obj);}catch(d){this.lastError=d;if(a){throw d;}}}return b;},unsubscribeAll:function(){var a=this.subscribers.length,b;for(b=a-1;b>-1;b--){this._delete(b);}this.subscribers=[];return a;},_delete:function(a){var b=this.subscribers[a];if(b){delete b.fn;delete b.obj;}this.subscribers.splice(a,1);},toString:function(){return"CustomEvent: "+"'"+this.type+"', "+"context: "+this.scope;}};YAHOO.util.Subscriber=function(a,b,c){this.fn=a;this.obj=YAHOO.lang.isUndefined(b)?null:b;this.overrideContext=c;};YAHOO.util.Subscriber.prototype.getScope=function(a){if(this.overrideContext){if(this.overrideContext===true){return this.obj;}else{return this.overrideContext;}}return a;};YAHOO.util.Subscriber.prototype.contains=function(a,b){if(b){return(this.fn==a&&this.obj==b);}else{return(this.fn==a);}};YAHOO.util.Subscriber.prototype.toString=function(){return"Subscriber { obj: "+this.obj+", overrideContext: "+(this.overrideContext||"no")+" }";};if(!YAHOO.util.Event){YAHOO.util.Event=function(){var g=false,h=[],j=[],a=0,e=[],b=0,c={63232:38,63233:40,63234:37,63235:39,63276:33,63277:34,25:9},d=YAHOO.env.ua.ie,f="focusin",i="focusout";return{POLL_RETRYS:500,POLL_INTERVAL:40,EL:0,TYPE:1,FN:2,WFN:3,UNLOAD_OBJ:3,ADJ_SCOPE:4,OBJ:5,OVERRIDE:6,CAPTURE:7,lastError:null,isSafari:YAHOO.env.ua.webkit,webkit:YAHOO.env.ua.webkit,isIE:d,_interval:null,_dri:null,_specialTypes:{focusin:(d?"focusin":"focus"),focusout:(d?"focusout":"blur")},DOMReady:false,throwErrors:false,startInterval:function(){if(!this._interval){this._interval=YAHOO.lang.later(this.POLL_INTERVAL,this,this._tryPreloadAttach,null,true);}},onAvailable:function(q,m,o,p,n){var k=(YAHOO.lang.isString(q))?[q]:q;for(var l=0;l<k.length;l=l+1){e.push({id:k[l],fn:m,obj:o,overrideContext:p,checkReady:n});}a=this.POLL_RETRYS;this.startInterval();},onContentReady:function(n,k,l,m){this.onAvailable(n,k,l,m,true);},onDOMReady:function(){this.DOMReadyEvent.subscribe.apply(this.DOMReadyEvent,arguments);},_addListener:function(m,k,v,p,t,y){if(!v||!v.call){return false;}if(this._isValidCollection(m)){var w=true;for(var q=0,s=m.length;q<s;++q){w=this.on(m[q],k,v,p,t)&&w;}return w;}else{if(YAHOO.lang.isString(m)){var o=this.getEl(m);if(o){m=o;}else{this.onAvailable(m,function(){YAHOO.util.Event._addListener(m,k,v,p,t,y);});return true;}}}if(!m){return false;}if("unload"==k&&p!==this){j[j.length]=[m,k,v,p,t];return true;}var l=m;if(t){if(t===true){l=p;}else{l=t;}}var n=function(z){return v.call(l,YAHOO.util.Event.getEvent(z,m),p);};var x=[m,k,v,n,l,p,t,y];var r=h.length;h[r]=x;try{this._simpleAdd(m,k,n,y);}catch(u){this.lastError=u;this.removeListener(m,k,v);return false;}return true;},_getType:function(k){return this._specialTypes[k]||k;},addListener:function(m,p,l,n,o){var k=((p==f||p==i)&&!YAHOO.env.ua.ie)?true:false;return this._addListener(m,this._getType(p),l,n,o,k);},addFocusListener:function(l,k,m,n){return this.on(l,f,k,m,n);},removeFocusListener:function(l,k){return this.removeListener(l,f,k);},addBlurListener:function(l,k,m,n){return this.on(l,i,k,m,n);},removeBlurListener:function(l,k){return this.removeListener(l,i,k);},removeListener:function(l,k,r){var m,p,u;k=this._getType(k);if(typeof l=="string"){l=this.getEl(l);}else{if(this._isValidCollection(l)){var s=true;for(m=l.length-1;m>-1;m--){s=(this.removeListener(l[m],k,r)&&s);}return s;}}if(!r||!r.call){return this.purgeElement(l,false,k);}if("unload"==k){for(m=j.length-1;m>-1;m--){u=j[m];if(u&&u[0]==l&&u[1]==k&&u[2]==r){j.splice(m,1);return true;}}return false;}var n=null;var o=arguments[3];if("undefined"===typeof o){o=this._getCacheIndex(h,l,k,r);}if(o>=0){n=h[o];}if(!l||!n){return false;}var t=n[this.CAPTURE]===true?true:false;try{this._simpleRemove(l,k,n[this.WFN],t);}catch(q){this.lastError=q;return false;}delete h[o][this.WFN];delete h[o][this.FN];h.splice(o,1);return true;},getTarget:function(m,l){var k=m.target||m.srcElement;return this.resolveTextNode(k);},resolveTextNode:function(l){try{if(l&&3==l.nodeType){return l.parentNode;}}catch(k){return null;}return l;},getPageX:function(l){var k=l.pageX;if(!k&&0!==k){k=l.clientX||0;if(this.isIE){k+=this._getScrollLeft();}}return k;},getPageY:function(k){var l=k.pageY;if(!l&&0!==l){l=k.clientY||0;if(this.isIE){l+=this._getScrollTop();}}return l;},getXY:function(k){return[this.getPageX(k),this.getPageY(k)];},getRelatedTarget:function(l){var k=l.relatedTarget;
if(!k){if(l.type=="mouseout"){k=l.toElement;}else{if(l.type=="mouseover"){k=l.fromElement;}}}return this.resolveTextNode(k);},getTime:function(m){if(!m.time){var l=new Date().getTime();try{m.time=l;}catch(k){this.lastError=k;return l;}}return m.time;},stopEvent:function(k){this.stopPropagation(k);this.preventDefault(k);},stopPropagation:function(k){if(k.stopPropagation){k.stopPropagation();}else{k.cancelBubble=true;}},preventDefault:function(k){if(k.preventDefault){k.preventDefault();}else{k.returnValue=false;}},getEvent:function(m,k){var l=m||window.event;if(!l){var n=this.getEvent.caller;while(n){l=n.arguments[0];if(l&&Event==l.constructor){break;}n=n.caller;}}return l;},getCharCode:function(l){var k=l.keyCode||l.charCode||0;if(YAHOO.env.ua.webkit&&(k in c)){k=c[k];}return k;},_getCacheIndex:function(n,q,r,p){for(var o=0,m=n.length;o<m;o=o+1){var k=n[o];if(k&&k[this.FN]==p&&k[this.EL]==q&&k[this.TYPE]==r){return o;}}return -1;},generateId:function(k){var l=k.id;if(!l){l="yuievtautoid-"+b;++b;k.id=l;}return l;},_isValidCollection:function(l){try{return(l&&typeof l!=="string"&&l.length&&!l.tagName&&!l.alert&&typeof l[0]!=="undefined");}catch(k){return false;}},elCache:{},getEl:function(k){return(typeof k==="string")?document.getElementById(k):k;},clearCache:function(){},DOMReadyEvent:new YAHOO.util.CustomEvent("DOMReady",YAHOO,0,0,1),_load:function(l){if(!g){g=true;var k=YAHOO.util.Event;k._ready();k._tryPreloadAttach();}},_ready:function(l){var k=YAHOO.util.Event;if(!k.DOMReady){k.DOMReady=true;k.DOMReadyEvent.fire();k._simpleRemove(document,"DOMContentLoaded",k._ready);}},_tryPreloadAttach:function(){if(e.length===0){a=0;if(this._interval){this._interval.cancel();this._interval=null;}return;}if(this.locked){return;}if(this.isIE){if(!this.DOMReady){this.startInterval();return;}}this.locked=true;var q=!g;if(!q){q=(a>0&&e.length>0);}var p=[];var r=function(t,u){var s=t;if(u.overrideContext){if(u.overrideContext===true){s=u.obj;}else{s=u.overrideContext;}}u.fn.call(s,u.obj);};var l,k,o,n,m=[];for(l=0,k=e.length;l<k;l=l+1){o=e[l];if(o){n=this.getEl(o.id);if(n){if(o.checkReady){if(g||n.nextSibling||!q){m.push(o);e[l]=null;}}else{r(n,o);e[l]=null;}}else{p.push(o);}}}for(l=0,k=m.length;l<k;l=l+1){o=m[l];r(this.getEl(o.id),o);}a--;if(q){for(l=e.length-1;l>-1;l--){o=e[l];if(!o||!o.id){e.splice(l,1);}}this.startInterval();}else{if(this._interval){this._interval.cancel();this._interval=null;}}this.locked=false;},purgeElement:function(p,q,s){var n=(YAHOO.lang.isString(p))?this.getEl(p):p;var r=this.getListeners(n,s),o,k;if(r){for(o=r.length-1;o>-1;o--){var m=r[o];this.removeListener(n,m.type,m.fn);}}if(q&&n&&n.childNodes){for(o=0,k=n.childNodes.length;o<k;++o){this.purgeElement(n.childNodes[o],q,s);}}},getListeners:function(n,k){var q=[],m;if(!k){m=[h,j];}else{if(k==="unload"){m=[j];}else{k=this._getType(k);m=[h];}}var s=(YAHOO.lang.isString(n))?this.getEl(n):n;for(var p=0;p<m.length;p=p+1){var u=m[p];if(u){for(var r=0,t=u.length;r<t;++r){var o=u[r];if(o&&o[this.EL]===s&&(!k||k===o[this.TYPE])){q.push({type:o[this.TYPE],fn:o[this.FN],obj:o[this.OBJ],adjust:o[this.OVERRIDE],scope:o[this.ADJ_SCOPE],index:r});}}}}return(q.length)?q:null;},_unload:function(s){var m=YAHOO.util.Event,p,o,n,r,q,t=j.slice(),k;for(p=0,r=j.length;p<r;++p){n=t[p];if(n){try{k=window;if(n[m.ADJ_SCOPE]){if(n[m.ADJ_SCOPE]===true){k=n[m.UNLOAD_OBJ];}else{k=n[m.ADJ_SCOPE];}}n[m.FN].call(k,m.getEvent(s,n[m.EL]),n[m.UNLOAD_OBJ]);}catch(w){}t[p]=null;}}n=null;k=null;j=null;if(h){for(o=h.length-1;o>-1;o--){n=h[o];if(n){try{m.removeListener(n[m.EL],n[m.TYPE],n[m.FN],o);}catch(v){}}}n=null;}try{m._simpleRemove(window,"unload",m._unload);m._simpleRemove(window,"load",m._load);}catch(u){}},_getScrollLeft:function(){return this._getScroll()[1];},_getScrollTop:function(){return this._getScroll()[0];},_getScroll:function(){var k=document.documentElement,l=document.body;if(k&&(k.scrollTop||k.scrollLeft)){return[k.scrollTop,k.scrollLeft];}else{if(l){return[l.scrollTop,l.scrollLeft];}else{return[0,0];}}},regCE:function(){},_simpleAdd:function(){if(window.addEventListener){return function(m,n,l,k){m.addEventListener(n,l,(k));};}else{if(window.attachEvent){return function(m,n,l,k){m.attachEvent("on"+n,l);};}else{return function(){};}}}(),_simpleRemove:function(){if(window.removeEventListener){return function(m,n,l,k){m.removeEventListener(n,l,(k));};}else{if(window.detachEvent){return function(l,m,k){l.detachEvent("on"+m,k);};}else{return function(){};}}}()};}();(function(){var a=YAHOO.util.Event;a.on=a.addListener;a.onFocus=a.addFocusListener;a.onBlur=a.addBlurListener;
/*! DOMReady: based on work by: Dean Edwards/John Resig/Matthias Miller/Diego Perini */
if(a.isIE){if(self!==self.top){document.onreadystatechange=function(){if(document.readyState=="complete"){document.onreadystatechange=null;a._ready();}};}else{YAHOO.util.Event.onDOMReady(YAHOO.util.Event._tryPreloadAttach,YAHOO.util.Event,true);var b=document.createElement("p");a._dri=setInterval(function(){try{b.doScroll("left");clearInterval(a._dri);a._dri=null;a._ready();b=null;}catch(c){}},a.POLL_INTERVAL);}}else{if(a.webkit&&a.webkit<525){a._dri=setInterval(function(){var c=document.readyState;if("loaded"==c||"complete"==c){clearInterval(a._dri);a._dri=null;a._ready();}},a.POLL_INTERVAL);}else{a._simpleAdd(document,"DOMContentLoaded",a._ready);}}a._simpleAdd(window,"load",a._load);a._simpleAdd(window,"unload",a._unload);a._tryPreloadAttach();})();}YAHOO.util.EventProvider=function(){};YAHOO.util.EventProvider.prototype={__yui_events:null,__yui_subscribers:null,subscribe:function(a,c,f,e){this.__yui_events=this.__yui_events||{};var d=this.__yui_events[a];if(d){d.subscribe(c,f,e);}else{this.__yui_subscribers=this.__yui_subscribers||{};var b=this.__yui_subscribers;if(!b[a]){b[a]=[];}b[a].push({fn:c,obj:f,overrideContext:e});}},unsubscribe:function(c,e,g){this.__yui_events=this.__yui_events||{};var a=this.__yui_events;if(c){var f=a[c];if(f){return f.unsubscribe(e,g);}}else{var b=true;for(var d in a){if(YAHOO.lang.hasOwnProperty(a,d)){b=b&&a[d].unsubscribe(e,g);
}}return b;}return false;},unsubscribeAll:function(a){return this.unsubscribe(a);},createEvent:function(b,g){this.__yui_events=this.__yui_events||{};var e=g||{},d=this.__yui_events,f;if(d[b]){}else{f=new YAHOO.util.CustomEvent(b,e.scope||this,e.silent,YAHOO.util.CustomEvent.FLAT,e.fireOnce);d[b]=f;if(e.onSubscribeCallback){f.subscribeEvent.subscribe(e.onSubscribeCallback);}this.__yui_subscribers=this.__yui_subscribers||{};var a=this.__yui_subscribers[b];if(a){for(var c=0;c<a.length;++c){f.subscribe(a[c].fn,a[c].obj,a[c].overrideContext);}}}return d[b];},fireEvent:function(b){this.__yui_events=this.__yui_events||{};var d=this.__yui_events[b];if(!d){return null;}var a=[];for(var c=1;c<arguments.length;++c){a.push(arguments[c]);}return d.fire.apply(d,a);},hasEvent:function(a){if(this.__yui_events){if(this.__yui_events[a]){return true;}}return false;}};(function(){var a=YAHOO.util.Event,c=YAHOO.lang;YAHOO.util.KeyListener=function(d,i,e,f){if(!d){}else{if(!i){}else{if(!e){}}}if(!f){f=YAHOO.util.KeyListener.KEYDOWN;}var g=new YAHOO.util.CustomEvent("keyPressed");this.enabledEvent=new YAHOO.util.CustomEvent("enabled");this.disabledEvent=new YAHOO.util.CustomEvent("disabled");if(c.isString(d)){d=document.getElementById(d);}if(c.isFunction(e)){g.subscribe(e);}else{g.subscribe(e.fn,e.scope,e.correctScope);}function h(o,n){if(!i.shift){i.shift=false;}if(!i.alt){i.alt=false;}if(!i.ctrl){i.ctrl=false;}if(o.shiftKey==i.shift&&o.altKey==i.alt&&o.ctrlKey==i.ctrl){var j,m=i.keys,l;if(YAHOO.lang.isArray(m)){for(var k=0;k<m.length;k++){j=m[k];l=a.getCharCode(o);if(j==l){g.fire(l,o);break;}}}else{l=a.getCharCode(o);if(m==l){g.fire(l,o);}}}}this.enable=function(){if(!this.enabled){a.on(d,f,h);this.enabledEvent.fire(i);}this.enabled=true;};this.disable=function(){if(this.enabled){a.removeListener(d,f,h);this.disabledEvent.fire(i);}this.enabled=false;};this.toString=function(){return"KeyListener ["+i.keys+"] "+d.tagName+(d.id?"["+d.id+"]":"");};};var b=YAHOO.util.KeyListener;b.KEYDOWN="keydown";b.KEYUP="keyup";b.KEY={ALT:18,BACK_SPACE:8,CAPS_LOCK:20,CONTROL:17,DELETE:46,DOWN:40,END:35,ENTER:13,ESCAPE:27,HOME:36,LEFT:37,META:224,NUM_LOCK:144,PAGE_DOWN:34,PAGE_UP:33,PAUSE:19,PRINTSCREEN:44,RIGHT:39,SCROLL_LOCK:145,SHIFT:16,SPACE:32,TAB:9,UP:38};})();YAHOO.register("event",YAHOO.util.Event,{version:"@VERSION@",build:"@BUILD@"});
/* /htapps/roger.babel/mb/web/yui2-lib/build/event/event-min.js */
(function(){YAHOO.env._id_counter=YAHOO.env._id_counter||0;var e=YAHOO.util,k=YAHOO.lang,L=YAHOO.env.ua,a=YAHOO.lang.trim,B={},F={},m=/^t(?:able|d|h)$/i,w=/color$/i,j=window.document,v=j.documentElement,C="ownerDocument",M="defaultView",U="documentElement",S="compatMode",z="offsetLeft",o="offsetTop",T="offsetParent",x="parentNode",K="nodeType",c="tagName",n="scrollLeft",H="scrollTop",p="getBoundingClientRect",V="getComputedStyle",y="currentStyle",l="CSS1Compat",A="BackCompat",E="class",f="className",i="",b=" ",R="(?:^|\\s)",J="(?= |$)",t="g",O="position",D="fixed",u="relative",I="left",N="top",Q="medium",P="borderLeftWidth",q="borderTopWidth",d=L.opera,h=L.webkit,g=L.gecko,s=L.ie;e.Dom={CUSTOM_ATTRIBUTES:(!v.hasAttribute)?{"for":"htmlFor","class":f}:{"htmlFor":"for","className":E},DOT_ATTRIBUTES:{checked:true},get:function(aa){var ac,X,ab,Z,W,G,Y=null;if(aa){if(typeof aa=="string"||typeof aa=="number"){ac=aa+"";aa=j.getElementById(aa);G=(aa)?aa.attributes:null;if(aa&&G&&G.id&&G.id.value===ac){return aa;}else{if(aa&&j.all){aa=null;X=j.all[ac];if(X&&X.length){for(Z=0,W=X.length;Z<W;++Z){if(X[Z].id===ac){return X[Z];}}}}}}else{if(e.Element&&aa instanceof e.Element){aa=aa.get("element");}else{if(!aa.nodeType&&"length" in aa){ab=[];for(Z=0,W=aa.length;Z<W;++Z){ab[ab.length]=e.Dom.get(aa[Z]);}aa=ab;}}}Y=aa;}return Y;},getComputedStyle:function(G,W){if(window[V]){return G[C][M][V](G,null)[W];}else{if(G[y]){return e.Dom.IE_ComputedStyle.get(G,W);}}},getStyle:function(G,W){return e.Dom.batch(G,e.Dom._getStyle,W);},_getStyle:function(){if(window[V]){return function(G,Y){Y=(Y==="float")?Y="cssFloat":e.Dom._toCamel(Y);var X=G.style[Y],W;if(!X){W=G[C][M][V](G,null);if(W){X=W[Y];}}return X;};}else{if(v[y]){return function(G,Y){var X;switch(Y){case"opacity":X=100;try{X=G.filters["DXImageTransform.Microsoft.Alpha"].opacity;}catch(Z){try{X=G.filters("alpha").opacity;}catch(W){}}return X/100;case"float":Y="styleFloat";default:Y=e.Dom._toCamel(Y);X=G[y]?G[y][Y]:null;return(G.style[Y]||X);}};}}}(),setStyle:function(G,W,X){e.Dom.batch(G,e.Dom._setStyle,{prop:W,val:X});},_setStyle:function(){if(!window.getComputedStyle&&j.documentElement.currentStyle){return function(W,G){var X=e.Dom._toCamel(G.prop),Y=G.val;if(W){switch(X){case"opacity":if(Y===""||Y===null||Y===1){W.style.removeAttribute("filter");}else{if(k.isString(W.style.filter)){W.style.filter="alpha(opacity="+Y*100+")";if(!W[y]||!W[y].hasLayout){W.style.zoom=1;}}}break;case"float":X="styleFloat";default:W.style[X]=Y;}}else{}};}else{return function(W,G){var X=e.Dom._toCamel(G.prop),Y=G.val;if(W){if(X=="float"){X="cssFloat";}W.style[X]=Y;}else{}};}}(),getXY:function(G){return e.Dom.batch(G,e.Dom._getXY);},_canPosition:function(G){return(e.Dom._getStyle(G,"display")!=="none"&&e.Dom._inDoc(G));},_getXY:function(W){var X,G,Z,ab,Y,aa,ac=Math.round,ad=false;if(e.Dom._canPosition(W)){Z=W[p]();ab=W[C];X=e.Dom.getDocumentScrollLeft(ab);G=e.Dom.getDocumentScrollTop(ab);ad=[Z[I],Z[N]];if(Y||aa){ad[0]-=aa;ad[1]-=Y;}if((G||X)){ad[0]+=X;ad[1]+=G;}ad[0]=ac(ad[0]);ad[1]=ac(ad[1]);}else{}return ad;},getX:function(G){var W=function(X){return e.Dom.getXY(X)[0];};return e.Dom.batch(G,W,e.Dom,true);},getY:function(G){var W=function(X){return e.Dom.getXY(X)[1];};return e.Dom.batch(G,W,e.Dom,true);},setXY:function(G,X,W){e.Dom.batch(G,e.Dom._setXY,{pos:X,noRetry:W});},_setXY:function(G,Z){var aa=e.Dom._getStyle(G,O),Y=e.Dom.setStyle,ad=Z.pos,W=Z.noRetry,ab=[parseInt(e.Dom.getComputedStyle(G,I),10),parseInt(e.Dom.getComputedStyle(G,N),10)],ac,X;ac=e.Dom._getXY(G);if(!ad||ac===false){return false;}if(aa=="static"){aa=u;Y(G,O,aa);}if(isNaN(ab[0])){ab[0]=(aa==u)?0:G[z];}if(isNaN(ab[1])){ab[1]=(aa==u)?0:G[o];}if(ad[0]!==null){Y(G,I,ad[0]-ac[0]+ab[0]+"px");}if(ad[1]!==null){Y(G,N,ad[1]-ac[1]+ab[1]+"px");}if(!W){X=e.Dom._getXY(G);if((ad[0]!==null&&X[0]!=ad[0])||(ad[1]!==null&&X[1]!=ad[1])){e.Dom._setXY(G,{pos:ad,noRetry:true});}}},setX:function(W,G){e.Dom.setXY(W,[G,null]);},setY:function(G,W){e.Dom.setXY(G,[null,W]);},getRegion:function(G){var W=function(X){var Y=false;if(e.Dom._canPosition(X)){Y=e.Region.getRegion(X);}else{}return Y;};return e.Dom.batch(G,W,e.Dom,true);},getClientWidth:function(){return e.Dom.getViewportWidth();},getClientHeight:function(){return e.Dom.getViewportHeight();},getElementsByClassName:function(ab,af,ac,ae,X,ad){af=af||"*";ac=(ac)?e.Dom.get(ac):null||j;if(!ac){return[];}var W=[],G=ac.getElementsByTagName(af),Z=e.Dom.hasClass;for(var Y=0,aa=G.length;Y<aa;++Y){if(Z(G[Y],ab)){W[W.length]=G[Y];}}if(ae){e.Dom.batch(W,ae,X,ad);}return W;},hasClass:function(W,G){return e.Dom.batch(W,e.Dom._hasClass,G);},_hasClass:function(X,W){var G=false,Y;if(X&&W){Y=e.Dom._getAttribute(X,f)||i;if(Y){Y=Y.replace(/\s+/g,b);}if(W.exec){G=W.test(Y);}else{G=W&&(b+Y+b).indexOf(b+W+b)>-1;}}else{}return G;},addClass:function(W,G){return e.Dom.batch(W,e.Dom._addClass,G);},_addClass:function(X,W){var G=false,Y;if(X&&W){Y=e.Dom._getAttribute(X,f)||i;if(!e.Dom._hasClass(X,W)){e.Dom.setAttribute(X,f,a(Y+b+W));G=true;}}else{}return G;},removeClass:function(W,G){return e.Dom.batch(W,e.Dom._removeClass,G);},_removeClass:function(Y,X){var W=false,aa,Z,G;if(Y&&X){aa=e.Dom._getAttribute(Y,f)||i;e.Dom.setAttribute(Y,f,aa.replace(e.Dom._getClassRegex(X),i));Z=e.Dom._getAttribute(Y,f);if(aa!==Z){e.Dom.setAttribute(Y,f,a(Z));W=true;if(e.Dom._getAttribute(Y,f)===""){G=(Y.hasAttribute&&Y.hasAttribute(E))?E:f;Y.removeAttribute(G);}}}else{}return W;},replaceClass:function(X,W,G){return e.Dom.batch(X,e.Dom._replaceClass,{from:W,to:G});},_replaceClass:function(Y,X){var W,ab,aa,G=false,Z;if(Y&&X){ab=X.from;aa=X.to;if(!aa){G=false;}else{if(!ab){G=e.Dom._addClass(Y,X.to);}else{if(ab!==aa){Z=e.Dom._getAttribute(Y,f)||i;W=(b+Z.replace(e.Dom._getClassRegex(ab),b+aa).replace(/\s+/g,b)).split(e.Dom._getClassRegex(aa));W.splice(1,0,b+aa);e.Dom.setAttribute(Y,f,a(W.join(i)));G=true;}}}}else{}return G;},generateId:function(G,X){X=X||"yui-gen";var W=function(Y){if(Y&&Y.id){return Y.id;}var Z=X+YAHOO.env._id_counter++;
if(Y){if(Y[C]&&Y[C].getElementById(Z)){return e.Dom.generateId(Y,Z+X);}Y.id=Z;}return Z;};return e.Dom.batch(G,W,e.Dom,true)||W.apply(e.Dom,arguments);},isAncestor:function(W,X){W=e.Dom.get(W);X=e.Dom.get(X);var G=false;if((W&&X)&&(W[K]&&X[K])){if(W.contains&&W!==X){G=W.contains(X);}else{if(W.compareDocumentPosition){G=!!(W.compareDocumentPosition(X)&16);}}}else{}return G;},inDocument:function(G,W){return e.Dom._inDoc(e.Dom.get(G),W);},_inDoc:function(W,X){var G=false;if(W&&W[c]){X=X||W[C];G=e.Dom.isAncestor(X[U],W);}else{}return G;},getElementsBy:function(W,af,ab,ad,X,ac,ae){af=af||"*";ab=(ab)?e.Dom.get(ab):null||j;var aa=(ae)?null:[],G;if(ab){G=ab.getElementsByTagName(af);for(var Y=0,Z=G.length;Y<Z;++Y){if(W(G[Y])){if(ae){aa=G[Y];break;}else{aa[aa.length]=G[Y];}}}if(ad){e.Dom.batch(aa,ad,X,ac);}}return aa;},getElementBy:function(X,G,W){return e.Dom.getElementsBy(X,G,W,null,null,null,true);},batch:function(X,ab,aa,Z){var Y=[],W=(Z)?aa:null;X=(X&&(X[c]||X.item))?X:e.Dom.get(X);if(X&&ab){if(X[c]||X.length===undefined){return ab.call(W,X,aa);}for(var G=0;G<X.length;++G){Y[Y.length]=ab.call(W||X[G],X[G],aa);}}else{return false;}return Y;},getDocumentHeight:function(){var W=(j[S]!=l||h)?j.body.scrollHeight:v.scrollHeight,G=Math.max(W,e.Dom.getViewportHeight());return G;},getDocumentWidth:function(){var W=(j[S]!=l||h)?j.body.scrollWidth:v.scrollWidth,G=Math.max(W,e.Dom.getViewportWidth());return G;},getViewportHeight:function(){var G=self.innerHeight,W=j[S];if((W||s)&&!d){G=(W==l)?v.clientHeight:j.body.clientHeight;}return G;},getViewportWidth:function(){var G=self.innerWidth,W=j[S];if(W||s){G=(W==l)?v.clientWidth:j.body.clientWidth;}return G;},getAncestorBy:function(G,W){while((G=G[x])){if(e.Dom._testElement(G,W)){return G;}}return null;},getAncestorByClassName:function(W,G){W=e.Dom.get(W);if(!W){return null;}var X=function(Y){return e.Dom.hasClass(Y,G);};return e.Dom.getAncestorBy(W,X);},getAncestorByTagName:function(W,G){W=e.Dom.get(W);if(!W){return null;}var X=function(Y){return Y[c]&&Y[c].toUpperCase()==G.toUpperCase();};return e.Dom.getAncestorBy(W,X);},getPreviousSiblingBy:function(G,W){while(G){G=G.previousSibling;if(e.Dom._testElement(G,W)){return G;}}return null;},getPreviousSibling:function(G){G=e.Dom.get(G);if(!G){return null;}return e.Dom.getPreviousSiblingBy(G);},getNextSiblingBy:function(G,W){while(G){G=G.nextSibling;if(e.Dom._testElement(G,W)){return G;}}return null;},getNextSibling:function(G){G=e.Dom.get(G);if(!G){return null;}return e.Dom.getNextSiblingBy(G);},getFirstChildBy:function(G,X){var W=(e.Dom._testElement(G.firstChild,X))?G.firstChild:null;return W||e.Dom.getNextSiblingBy(G.firstChild,X);},getFirstChild:function(G,W){G=e.Dom.get(G);if(!G){return null;}return e.Dom.getFirstChildBy(G);},getLastChildBy:function(G,X){if(!G){return null;}var W=(e.Dom._testElement(G.lastChild,X))?G.lastChild:null;return W||e.Dom.getPreviousSiblingBy(G.lastChild,X);},getLastChild:function(G){G=e.Dom.get(G);return e.Dom.getLastChildBy(G);},getChildrenBy:function(W,Y){var X=e.Dom.getFirstChildBy(W,Y),G=X?[X]:[];e.Dom.getNextSiblingBy(X,function(Z){if(!Y||Y(Z)){G[G.length]=Z;}return false;});return G;},getChildren:function(G){G=e.Dom.get(G);if(!G){}return e.Dom.getChildrenBy(G);},getDocumentScrollLeft:function(G){G=G||j;return Math.max(G[U].scrollLeft,G.body.scrollLeft);},getDocumentScrollTop:function(G){G=G||j;return Math.max(G[U].scrollTop,G.body.scrollTop);},insertBefore:function(W,G){W=e.Dom.get(W);G=e.Dom.get(G);if(!W||!G||!G[x]){return null;}return G[x].insertBefore(W,G);},insertAfter:function(W,G){W=e.Dom.get(W);G=e.Dom.get(G);if(!W||!G||!G[x]){return null;}if(G.nextSibling){return G[x].insertBefore(W,G.nextSibling);}else{return G[x].appendChild(W);}},getClientRegion:function(){var X=e.Dom.getDocumentScrollTop(),W=e.Dom.getDocumentScrollLeft(),Y=e.Dom.getViewportWidth()+W,G=e.Dom.getViewportHeight()+X;return new e.Region(X,Y,G,W);},setAttribute:function(W,G,X){e.Dom.batch(W,e.Dom._setAttribute,{attr:G,val:X});},_setAttribute:function(X,W){var G=e.Dom._toCamel(W.attr),Y=W.val;if(X&&X.setAttribute){if(e.Dom.DOT_ATTRIBUTES[G]&&X.tagName&&X.tagName!="BUTTON"){X[G]=Y;}else{G=e.Dom.CUSTOM_ATTRIBUTES[G]||G;X.setAttribute(G,Y);}}else{}},getAttribute:function(W,G){return e.Dom.batch(W,e.Dom._getAttribute,G);},_getAttribute:function(W,G){var X;G=e.Dom.CUSTOM_ATTRIBUTES[G]||G;if(e.Dom.DOT_ATTRIBUTES[G]){X=W[G];}else{if(W&&"getAttribute" in W){if(/^(?:href|src)$/.test(G)){X=W.getAttribute(G,2);}else{X=W.getAttribute(G);}}else{}}return X;},_toCamel:function(W){var X=B;function G(Y,Z){return Z.toUpperCase();}return X[W]||(X[W]=W.indexOf("-")===-1?W:W.replace(/-([a-z])/gi,G));},_getClassRegex:function(W){var G;if(W!==undefined){if(W.exec){G=W;}else{G=F[W];if(!G){W=W.replace(e.Dom._patterns.CLASS_RE_TOKENS,"\\$1");W=W.replace(/\s+/g,b);G=F[W]=new RegExp(R+W+J,t);}}}return G;},_patterns:{ROOT_TAG:/^body|html$/i,CLASS_RE_TOKENS:/([\.\(\)\^\$\*\+\?\|\[\]\{\}\\])/g},_testElement:function(G,W){return G&&G[K]==1&&(!W||W(G));},_calcBorders:function(X,Y){var W=parseInt(e.Dom[V](X,q),10)||0,G=parseInt(e.Dom[V](X,P),10)||0;if(g){if(m.test(X[c])){W=0;G=0;}}Y[0]+=G;Y[1]+=W;return Y;}};var r=e.Dom[V];if(L.opera){e.Dom[V]=function(W,G){var X=r(W,G);if(w.test(G)){X=e.Dom.Color.toRGB(X);}return X;};}if(L.webkit){e.Dom[V]=function(W,G){var X=r(W,G);if(X==="rgba(0, 0, 0, 0)"){X="transparent";}return X;};}if(L.ie&&L.ie>=8){e.Dom.DOT_ATTRIBUTES.type=true;}})();YAHOO.util.Region=function(d,e,a,c){this.top=d;this.y=d;this[1]=d;this.right=e;this.bottom=a;this.left=c;this.x=c;this[0]=c;this.width=this.right-this.left;this.height=this.bottom-this.top;};YAHOO.util.Region.prototype.contains=function(a){return(a.left>=this.left&&a.right<=this.right&&a.top>=this.top&&a.bottom<=this.bottom);};YAHOO.util.Region.prototype.getArea=function(){return((this.bottom-this.top)*(this.right-this.left));};YAHOO.util.Region.prototype.intersect=function(f){var d=Math.max(this.top,f.top),e=Math.min(this.right,f.right),a=Math.min(this.bottom,f.bottom),c=Math.max(this.left,f.left);
if(a>=d&&e>=c){return new YAHOO.util.Region(d,e,a,c);}else{return null;}};YAHOO.util.Region.prototype.union=function(f){var d=Math.min(this.top,f.top),e=Math.max(this.right,f.right),a=Math.max(this.bottom,f.bottom),c=Math.min(this.left,f.left);return new YAHOO.util.Region(d,e,a,c);};YAHOO.util.Region.prototype.toString=function(){return("Region {"+"top: "+this.top+", right: "+this.right+", bottom: "+this.bottom+", left: "+this.left+", height: "+this.height+", width: "+this.width+"}");};YAHOO.util.Region.getRegion=function(e){var g=YAHOO.util.Dom.getXY(e),d=g[1],f=g[0]+e.offsetWidth,a=g[1]+e.offsetHeight,c=g[0];return new YAHOO.util.Region(d,f,a,c);};YAHOO.util.Point=function(a,b){if(YAHOO.lang.isArray(a)){b=a[1];a=a[0];}YAHOO.util.Point.superclass.constructor.call(this,b,a,b,a);};YAHOO.extend(YAHOO.util.Point,YAHOO.util.Region);(function(){var b=YAHOO.util,a="clientTop",f="clientLeft",j="parentNode",k="right",w="hasLayout",i="px",u="opacity",l="auto",d="borderLeftWidth",g="borderTopWidth",p="borderRightWidth",v="borderBottomWidth",s="visible",q="transparent",n="height",e="width",h="style",t="currentStyle",r=/^width|height$/,o=/^(\d[.\d]*)+(em|ex|px|gd|rem|vw|vh|vm|ch|mm|cm|in|pt|pc|deg|rad|ms|s|hz|khz|%){1}?/i,m={get:function(x,z){var y="",A=x[t][z];if(z===u){y=b.Dom.getStyle(x,u);}else{if(!A||(A.indexOf&&A.indexOf(i)>-1)){y=A;}else{if(b.Dom.IE_COMPUTED[z]){y=b.Dom.IE_COMPUTED[z](x,z);}else{if(o.test(A)){y=b.Dom.IE.ComputedStyle.getPixel(x,z);}else{y=A;}}}}return y;},getOffset:function(z,E){var B=z[t][E],x=E.charAt(0).toUpperCase()+E.substr(1),C="offset"+x,y="pixel"+x,A="",D;if(B==l){D=z[C];if(D===undefined){A=0;}A=D;if(r.test(E)){z[h][E]=D;if(z[C]>D){A=D-(z[C]-D);}z[h][E]=l;}}else{if(!z[h][y]&&!z[h][E]){z[h][E]=B;}A=z[h][y];}return A+i;},getBorderWidth:function(x,z){var y=null;if(!x[t][w]){x[h].zoom=1;}switch(z){case g:y=x[a];break;case v:y=x.offsetHeight-x.clientHeight-x[a];break;case d:y=x[f];break;case p:y=x.offsetWidth-x.clientWidth-x[f];break;}return y+i;},getPixel:function(y,x){var A=null,B=y[t][k],z=y[t][x];y[h][k]=z;A=y[h].pixelRight;y[h][k]=B;return A+i;},getMargin:function(y,x){var z;if(y[t][x]==l){z=0+i;}else{z=b.Dom.IE.ComputedStyle.getPixel(y,x);}return z;},getVisibility:function(y,x){var z;while((z=y[t])&&z[x]=="inherit"){y=y[j];}return(z)?z[x]:s;},getColor:function(y,x){return b.Dom.Color.toRGB(y[t][x])||q;},getBorderColor:function(y,x){var z=y[t],A=z[x]||z.color;return b.Dom.Color.toRGB(b.Dom.Color.toHex(A));}},c={};c.top=c.right=c.bottom=c.left=c[e]=c[n]=m.getOffset;c.color=m.getColor;c[g]=c[p]=c[v]=c[d]=m.getBorderWidth;c.marginTop=c.marginRight=c.marginBottom=c.marginLeft=m.getMargin;c.visibility=m.getVisibility;c.borderColor=c.borderTopColor=c.borderRightColor=c.borderBottomColor=c.borderLeftColor=m.getBorderColor;b.Dom.IE_COMPUTED=c;b.Dom.IE_ComputedStyle=m;})();(function(){var c="toString",a=parseInt,b=RegExp,d=YAHOO.util;d.Dom.Color={KEYWORDS:{black:"000",silver:"c0c0c0",gray:"808080",white:"fff",maroon:"800000",red:"f00",purple:"800080",fuchsia:"f0f",green:"008000",lime:"0f0",olive:"808000",yellow:"ff0",navy:"000080",blue:"00f",teal:"008080",aqua:"0ff"},re_RGB:/^rgb\(([0-9]+)\s*,\s*([0-9]+)\s*,\s*([0-9]+)\)$/i,re_hex:/^#?([0-9A-F]{2})([0-9A-F]{2})([0-9A-F]{2})$/i,re_hex3:/([0-9A-F])/gi,toRGB:function(e){if(!d.Dom.Color.re_RGB.test(e)){e=d.Dom.Color.toHex(e);}if(d.Dom.Color.re_hex.exec(e)){e="rgb("+[a(b.$1,16),a(b.$2,16),a(b.$3,16)].join(", ")+")";}return e;},toHex:function(f){f=d.Dom.Color.KEYWORDS[f]||f;if(d.Dom.Color.re_RGB.exec(f)){f=[Number(b.$1).toString(16),Number(b.$2).toString(16),Number(b.$3).toString(16)];for(var e=0;e<f.length;e++){if(f[e].length<2){f[e]="0"+f[e];}}f=f.join("");}if(f.length<6){f=f.replace(d.Dom.Color.re_hex3,"$1$1");}if(f!=="transparent"&&f.indexOf("#")<0){f="#"+f;}return f.toUpperCase();}};}());YAHOO.register("dom",YAHOO.util.Dom,{version:"@VERSION@",build:"@BUILD@"});
/* /htapps/roger.babel/mb/web/yui2-lib/build/dom/dom-min.js */
if(!YAHOO.util.DragDropMgr){YAHOO.util.DragDropMgr=function(){var A=YAHOO.util.Event,B=YAHOO.util.Dom;return{useShim:false,_shimActive:false,_shimState:false,_debugShim:false,_createShim:function(){var C=document.createElement("div");C.id="yui-ddm-shim";if(document.body.firstChild){document.body.insertBefore(C,document.body.firstChild);}else{document.body.appendChild(C);}C.style.display="none";C.style.backgroundColor="red";C.style.position="absolute";C.style.zIndex="99999";B.setStyle(C,"opacity","0");this._shim=C;A.on(C,"mouseup",this.handleMouseUp,this,true);A.on(C,"mousemove",this.handleMouseMove,this,true);A.on(window,"scroll",this._sizeShim,this,true);},_sizeShim:function(){if(this._shimActive){var C=this._shim;C.style.height=B.getDocumentHeight()+"px";C.style.width=B.getDocumentWidth()+"px";C.style.top="0";C.style.left="0";}},_activateShim:function(){if(this.useShim){if(!this._shim){this._createShim();}this._shimActive=true;var C=this._shim,D="0";if(this._debugShim){D=".5";}B.setStyle(C,"opacity",D);this._sizeShim();C.style.display="block";}},_deactivateShim:function(){this._shim.style.display="none";this._shimActive=false;},_shim:null,ids:{},handleIds:{},dragCurrent:null,dragOvers:{},deltaX:0,deltaY:0,preventDefault:true,stopPropagation:true,initialized:false,locked:false,interactionInfo:null,init:function(){this.initialized=true;},POINT:0,INTERSECT:1,STRICT_INTERSECT:2,mode:0,_execOnAll:function(E,D){for(var F in this.ids){for(var C in this.ids[F]){var G=this.ids[F][C];if(!this.isTypeOfDD(G)){continue;}G[E].apply(G,D);}}},_onLoad:function(){this.init();A.on(document,"mouseup",this.handleMouseUp,this,true);A.on(document,"mousemove",this.handleMouseMove,this,true);A.on(window,"unload",this._onUnload,this,true);A.on(window,"resize",this._onResize,this,true);},_onResize:function(C){this._execOnAll("resetConstraints",[]);},lock:function(){this.locked=true;},unlock:function(){this.locked=false;},isLocked:function(){return this.locked;},locationCache:{},useCache:true,clickPixelThresh:3,clickTimeThresh:1000,dragThreshMet:false,clickTimeout:null,startX:0,startY:0,fromTimeout:false,regDragDrop:function(D,C){if(!this.initialized){this.init();}if(!this.ids[C]){this.ids[C]={};}this.ids[C][D.id]=D;},removeDDFromGroup:function(E,C){if(!this.ids[C]){this.ids[C]={};}var D=this.ids[C];if(D&&D[E.id]){delete D[E.id];}},_remove:function(E){for(var D in E.groups){if(D){var C=this.ids[D];if(C&&C[E.id]){delete C[E.id];}}}delete this.handleIds[E.id];},regHandle:function(D,C){if(!this.handleIds[D]){this.handleIds[D]={};}this.handleIds[D][C]=C;},isDragDrop:function(C){return(this.getDDById(C))?true:false;},getRelated:function(H,D){var G=[];for(var F in H.groups){for(var E in this.ids[F]){var C=this.ids[F][E];if(!this.isTypeOfDD(C)){continue;}if(!D||C.isTarget){G[G.length]=C;}}}return G;},isLegalTarget:function(G,F){var D=this.getRelated(G,true);for(var E=0,C=D.length;E<C;++E){if(D[E].id==F.id){return true;}}return false;},isTypeOfDD:function(C){return(C&&C.__ygDragDrop);},isHandle:function(D,C){return(this.handleIds[D]&&this.handleIds[D][C]);},getDDById:function(D){for(var C in this.ids){if(this.ids[C][D]){return this.ids[C][D];}}return null;},handleMouseDown:function(E,D){this.currentTarget=YAHOO.util.Event.getTarget(E);this.dragCurrent=D;var C=D.getEl();this.startX=YAHOO.util.Event.getPageX(E);this.startY=YAHOO.util.Event.getPageY(E);this.deltaX=this.startX-C.offsetLeft;this.deltaY=this.startY-C.offsetTop;this.dragThreshMet=false;this.clickTimeout=setTimeout(function(){var F=YAHOO.util.DDM;F.startDrag(F.startX,F.startY);F.fromTimeout=true;},this.clickTimeThresh);},startDrag:function(C,E){if(this.dragCurrent&&this.dragCurrent.useShim){this._shimState=this.useShim;this.useShim=true;}this._activateShim();clearTimeout(this.clickTimeout);var D=this.dragCurrent;if(D&&D.events.b4StartDrag){D.b4StartDrag(C,E);D.fireEvent("b4StartDragEvent",{x:C,y:E});}if(D&&D.events.startDrag){D.startDrag(C,E);D.fireEvent("startDragEvent",{x:C,y:E});}this.dragThreshMet=true;},handleMouseUp:function(C){if(this.dragCurrent){clearTimeout(this.clickTimeout);if(this.dragThreshMet){if(this.fromTimeout){this.fromTimeout=false;this.handleMouseMove(C);}this.fromTimeout=false;this.fireEvents(C,true);}else{}this.stopDrag(C);this.stopEvent(C);}},stopEvent:function(C){if(this.stopPropagation){YAHOO.util.Event.stopPropagation(C);}if(this.preventDefault){YAHOO.util.Event.preventDefault(C);}},stopDrag:function(E,D){var C=this.dragCurrent;if(C&&!D){if(this.dragThreshMet){if(C.events.b4EndDrag){C.b4EndDrag(E);C.fireEvent("b4EndDragEvent",{e:E});}if(C.events.endDrag){C.endDrag(E);C.fireEvent("endDragEvent",{e:E});}}if(C.events.mouseUp){C.onMouseUp(E);C.fireEvent("mouseUpEvent",{e:E});}}if(this._shimActive){this._deactivateShim();if(this.dragCurrent&&this.dragCurrent.useShim){this.useShim=this._shimState;this._shimState=false;}}this.dragCurrent=null;this.dragOvers={};},handleMouseMove:function(F){var C=this.dragCurrent;if(C){if(YAHOO.env.ua.ie&&(YAHOO.env.ua.ie<9)&&!F.button){this.stopEvent(F);return this.handleMouseUp(F);}else{if(F.clientX<0||F.clientY<0){}}if(!this.dragThreshMet){var E=Math.abs(this.startX-YAHOO.util.Event.getPageX(F));var D=Math.abs(this.startY-YAHOO.util.Event.getPageY(F));if(E>this.clickPixelThresh||D>this.clickPixelThresh){this.startDrag(this.startX,this.startY);}}if(this.dragThreshMet){if(C&&C.events.b4Drag){C.b4Drag(F);C.fireEvent("b4DragEvent",{e:F});}if(C&&C.events.drag){C.onDrag(F);C.fireEvent("dragEvent",{e:F});}if(C){this.fireEvents(F,false);}}this.stopEvent(F);}},fireEvents:function(W,M){var c=this.dragCurrent;if(!c||c.isLocked()||c.dragOnly){return;}var O=YAHOO.util.Event.getPageX(W),N=YAHOO.util.Event.getPageY(W),Q=new YAHOO.util.Point(O,N),K=c.getTargetCoord(Q.x,Q.y),F=c.getDragEl(),E=["out","over","drop","enter"],V=new YAHOO.util.Region(K.y,K.x+F.offsetWidth,K.y+F.offsetHeight,K.x),I=[],D={},L={},R=[],d={outEvts:[],overEvts:[],dropEvts:[],enterEvts:[]};for(var T in this.dragOvers){var f=this.dragOvers[T];if(!this.isTypeOfDD(f)){continue;
}if(!this.isOverTarget(Q,f,this.mode,V)){d.outEvts.push(f);}I[T]=true;delete this.dragOvers[T];}for(var S in c.groups){if("string"!=typeof S){continue;}for(T in this.ids[S]){var G=this.ids[S][T];if(!this.isTypeOfDD(G)){continue;}if(G.isTarget&&!G.isLocked()&&G!=c){if(this.isOverTarget(Q,G,this.mode,V)){D[S]=true;if(M){d.dropEvts.push(G);}else{if(!I[G.id]){d.enterEvts.push(G);}else{d.overEvts.push(G);}this.dragOvers[G.id]=G;}}}}}this.interactionInfo={out:d.outEvts,enter:d.enterEvts,over:d.overEvts,drop:d.dropEvts,point:Q,draggedRegion:V,sourceRegion:this.locationCache[c.id],validDrop:M};for(var C in D){R.push(C);}if(M&&!d.dropEvts.length){this.interactionInfo.validDrop=false;if(c.events.invalidDrop){c.onInvalidDrop(W);c.fireEvent("invalidDropEvent",{e:W});}}for(T=0;T<E.length;T++){var Z=null;if(d[E[T]+"Evts"]){Z=d[E[T]+"Evts"];}if(Z&&Z.length){var H=E[T].charAt(0).toUpperCase()+E[T].substr(1),Y="onDrag"+H,J="b4Drag"+H,P="drag"+H+"Event",X="drag"+H;if(this.mode){if(c.events[J]){c[J](W,Z,R);L[Y]=c.fireEvent(J+"Event",{event:W,info:Z,group:R});}if(c.events[X]&&(L[Y]!==false)){c[Y](W,Z,R);c.fireEvent(P,{event:W,info:Z,group:R});}}else{for(var a=0,U=Z.length;a<U;++a){if(c.events[J]){c[J](W,Z[a].id,R[0]);L[Y]=c.fireEvent(J+"Event",{event:W,info:Z[a].id,group:R[0]});}if(c.events[X]&&(L[Y]!==false)){c[Y](W,Z[a].id,R[0]);c.fireEvent(P,{event:W,info:Z[a].id,group:R[0]});}}}}}},getBestMatch:function(E){var G=null;var D=E.length;if(D==1){G=E[0];}else{for(var F=0;F<D;++F){var C=E[F];if(this.mode==this.INTERSECT&&C.cursorIsOver){G=C;break;}else{if(!G||!G.overlap||(C.overlap&&G.overlap.getArea()<C.overlap.getArea())){G=C;}}}}return G;},refreshCache:function(D){var F=D||this.ids;for(var C in F){if("string"!=typeof C){continue;}for(var E in this.ids[C]){var G=this.ids[C][E];if(this.isTypeOfDD(G)){var H=this.getLocation(G);if(H){this.locationCache[G.id]=H;}else{delete this.locationCache[G.id];}}}}},verifyEl:function(D){try{if(D){var C=D.offsetParent;if(C){return true;}}}catch(E){}return false;},getLocation:function(H){if(!this.isTypeOfDD(H)){return null;}var F=H.getEl(),K,E,D,M,L,N,C,J,G;try{K=YAHOO.util.Dom.getXY(F);}catch(I){}if(!K){return null;}E=K[0];D=E+F.offsetWidth;M=K[1];L=M+F.offsetHeight;N=M-H.padding[0];C=D+H.padding[1];J=L+H.padding[2];G=E-H.padding[3];return new YAHOO.util.Region(N,C,J,G);},isOverTarget:function(K,C,E,F){var G=this.locationCache[C.id];if(!G||!this.useCache){G=this.getLocation(C);this.locationCache[C.id]=G;}if(!G){return false;}C.cursorIsOver=G.contains(K);var J=this.dragCurrent;if(!J||(!E&&!J.constrainX&&!J.constrainY)){return C.cursorIsOver;}C.overlap=null;if(!F){var H=J.getTargetCoord(K.x,K.y);var D=J.getDragEl();F=new YAHOO.util.Region(H.y,H.x+D.offsetWidth,H.y+D.offsetHeight,H.x);}var I=F.intersect(G);if(I){C.overlap=I;return(E)?true:C.cursorIsOver;}else{return false;}},_onUnload:function(D,C){this.unregAll();},unregAll:function(){if(this.dragCurrent){this.stopDrag();this.dragCurrent=null;}this._execOnAll("unreg",[]);this.ids={};},elementCache:{},getElWrapper:function(D){var C=this.elementCache[D];if(!C||!C.el){C=this.elementCache[D]=new this.ElementWrapper(YAHOO.util.Dom.get(D));}return C;},getElement:function(C){return YAHOO.util.Dom.get(C);},getCss:function(D){var C=YAHOO.util.Dom.get(D);return(C)?C.style:null;},ElementWrapper:function(C){this.el=C||null;this.id=this.el&&C.id;this.css=this.el&&C.style;},getPosX:function(C){return YAHOO.util.Dom.getX(C);},getPosY:function(C){return YAHOO.util.Dom.getY(C);},swapNode:function(E,C){if(E.swapNode){E.swapNode(C);}else{var F=C.parentNode;var D=C.nextSibling;if(D==E){F.insertBefore(E,C);}else{if(C==E.nextSibling){F.insertBefore(C,E);}else{E.parentNode.replaceChild(C,E);F.insertBefore(E,D);}}}},getScroll:function(){var E,C,F=document.documentElement,D=document.body;if(F&&(F.scrollTop||F.scrollLeft)){E=F.scrollTop;C=F.scrollLeft;}else{if(D){E=D.scrollTop;C=D.scrollLeft;}else{}}return{top:E,left:C};},getStyle:function(D,C){return YAHOO.util.Dom.getStyle(D,C);},getScrollTop:function(){return this.getScroll().top;},getScrollLeft:function(){return this.getScroll().left;},moveToEl:function(C,E){var D=YAHOO.util.Dom.getXY(E);YAHOO.util.Dom.setXY(C,D);},getClientHeight:function(){return YAHOO.util.Dom.getViewportHeight();},getClientWidth:function(){return YAHOO.util.Dom.getViewportWidth();},numericSort:function(D,C){return(D-C);},_timeoutCount:0,_addListeners:function(){var C=YAHOO.util.DDM;if(YAHOO.util.Event&&document){C._onLoad();}else{if(C._timeoutCount>2000){}else{setTimeout(C._addListeners,10);if(document&&document.body){C._timeoutCount+=1;}}}},handleWasClicked:function(C,E){if(this.isHandle(E,C.id)){return true;}else{var D=C.parentNode;while(D){if(this.isHandle(E,D.id)){return true;}else{D=D.parentNode;}}}return false;}};}();YAHOO.util.DDM=YAHOO.util.DragDropMgr;YAHOO.util.DDM._addListeners();}(function(){var A=YAHOO.util.Event;var B=YAHOO.util.Dom;YAHOO.util.DragDrop=function(E,C,D){if(E){this.init(E,C,D);}};YAHOO.util.DragDrop.prototype={events:null,on:function(){this.subscribe.apply(this,arguments);},id:null,config:null,dragElId:null,handleElId:null,invalidHandleTypes:null,invalidHandleIds:null,invalidHandleClasses:null,startPageX:0,startPageY:0,groups:null,locked:false,lock:function(){this.locked=true;},unlock:function(){this.locked=false;},isTarget:true,padding:null,dragOnly:false,useShim:false,_domRef:null,__ygDragDrop:true,constrainX:false,constrainY:false,minX:0,maxX:0,minY:0,maxY:0,deltaX:0,deltaY:0,maintainOffset:false,xTicks:null,yTicks:null,primaryButtonOnly:true,available:false,hasOuterHandles:false,cursorIsOver:false,overlap:null,b4StartDrag:function(C,D){},startDrag:function(C,D){},b4Drag:function(C){},onDrag:function(C){},onDragEnter:function(C,D){},b4DragOver:function(C){},onDragOver:function(C,D){},b4DragOut:function(C){},onDragOut:function(C,D){},b4DragDrop:function(C){},onDragDrop:function(C,D){},onInvalidDrop:function(C){},b4EndDrag:function(C){},endDrag:function(C){},b4MouseDown:function(C){},onMouseDown:function(C){},onMouseUp:function(C){},onAvailable:function(){},getEl:function(){if(!this._domRef){this._domRef=B.get(this.id);
}return this._domRef;},getDragEl:function(){return B.get(this.dragElId);},init:function(F,C,D){this.initTarget(F,C,D);A.on(this._domRef||this.id,"mousedown",this.handleMouseDown,this,true);for(var E in this.events){this.createEvent(E+"Event");}},initTarget:function(E,C,D){this.config=D||{};this.events={};this.DDM=YAHOO.util.DDM;this.groups={};if(typeof E!=="string"){this._domRef=E;E=B.generateId(E);}this.id=E;this.addToGroup((C)?C:"default");this.handleElId=E;A.onAvailable(E,this.handleOnAvailable,this,true);this.setDragElId(E);this.invalidHandleTypes={A:"A"};this.invalidHandleIds={};this.invalidHandleClasses=[];this.applyConfig();},applyConfig:function(){this.events={mouseDown:true,b4MouseDown:true,mouseUp:true,b4StartDrag:true,startDrag:true,b4EndDrag:true,endDrag:true,drag:true,b4Drag:true,invalidDrop:true,b4DragOut:true,dragOut:true,dragEnter:true,b4DragOver:true,dragOver:true,b4DragDrop:true,dragDrop:true};if(this.config.events){for(var C in this.config.events){if(this.config.events[C]===false){this.events[C]=false;}}}this.padding=this.config.padding||[0,0,0,0];this.isTarget=(this.config.isTarget!==false);this.maintainOffset=(this.config.maintainOffset);this.primaryButtonOnly=(this.config.primaryButtonOnly!==false);this.dragOnly=((this.config.dragOnly===true)?true:false);this.useShim=((this.config.useShim===true)?true:false);},handleOnAvailable:function(){this.available=true;this.resetConstraints();this.onAvailable();},setPadding:function(E,C,F,D){if(!C&&0!==C){this.padding=[E,E,E,E];}else{if(!F&&0!==F){this.padding=[E,C,E,C];}else{this.padding=[E,C,F,D];}}},setInitPosition:function(F,E){var G=this.getEl();if(!this.DDM.verifyEl(G)){if(G&&G.style&&(G.style.display=="none")){}else{}return;}var D=F||0;var C=E||0;var H=B.getXY(G);this.initPageX=H[0]-D;this.initPageY=H[1]-C;this.lastPageX=H[0];this.lastPageY=H[1];this.setStartPosition(H);},setStartPosition:function(D){var C=D||B.getXY(this.getEl());this.deltaSetXY=null;this.startPageX=C[0];this.startPageY=C[1];},addToGroup:function(C){this.groups[C]=true;this.DDM.regDragDrop(this,C);},removeFromGroup:function(C){if(this.groups[C]){delete this.groups[C];}this.DDM.removeDDFromGroup(this,C);},setDragElId:function(C){this.dragElId=C;},setHandleElId:function(C){if(typeof C!=="string"){C=B.generateId(C);}this.handleElId=C;this.DDM.regHandle(this.id,C);},setOuterHandleElId:function(C){if(typeof C!=="string"){C=B.generateId(C);}A.on(C,"mousedown",this.handleMouseDown,this,true);this.setHandleElId(C);this.hasOuterHandles=true;},unreg:function(){A.removeListener(this.id,"mousedown",this.handleMouseDown);this._domRef=null;this.DDM._remove(this);},isLocked:function(){return(this.DDM.isLocked()||this.locked);},handleMouseDown:function(J,I){var D=J.which||J.button;if(this.primaryButtonOnly&&D>1){return;}if(this.isLocked()){return;}var C=this.b4MouseDown(J),F=true;if(this.events.b4MouseDown){F=this.fireEvent("b4MouseDownEvent",J);}var E=this.onMouseDown(J),H=true;if(this.events.mouseDown){if(E===false){H=false;}else{H=this.fireEvent("mouseDownEvent",J);}}if((C===false)||(E===false)||(F===false)||(H===false)){return;}this.DDM.refreshCache(this.groups);var G=new YAHOO.util.Point(A.getPageX(J),A.getPageY(J));if(!this.hasOuterHandles&&!this.DDM.isOverTarget(G,this)){}else{if(this.clickValidator(J)){this.setStartPosition();this.DDM.handleMouseDown(J,this);this.DDM.stopEvent(J);}else{}}},clickValidator:function(D){var C=YAHOO.util.Event.getTarget(D);return(this.isValidHandleChild(C)&&(this.id==this.handleElId||this.DDM.handleWasClicked(C,this.id)));},getTargetCoord:function(E,D){var C=E-this.deltaX;var F=D-this.deltaY;if(this.constrainX){if(C<this.minX){C=this.minX;}if(C>this.maxX){C=this.maxX;}}if(this.constrainY){if(F<this.minY){F=this.minY;}if(F>this.maxY){F=this.maxY;}}C=this.getTick(C,this.xTicks);F=this.getTick(F,this.yTicks);return{x:C,y:F};},addInvalidHandleType:function(C){var D=C.toUpperCase();this.invalidHandleTypes[D]=D;},addInvalidHandleId:function(C){if(typeof C!=="string"){C=B.generateId(C);}this.invalidHandleIds[C]=C;},addInvalidHandleClass:function(C){this.invalidHandleClasses.push(C);},removeInvalidHandleType:function(C){var D=C.toUpperCase();delete this.invalidHandleTypes[D];},removeInvalidHandleId:function(C){if(typeof C!=="string"){C=B.generateId(C);}delete this.invalidHandleIds[C];},removeInvalidHandleClass:function(D){for(var E=0,C=this.invalidHandleClasses.length;E<C;++E){if(this.invalidHandleClasses[E]==D){delete this.invalidHandleClasses[E];}}},isValidHandleChild:function(F){var E=true;var H;try{H=F.nodeName.toUpperCase();}catch(G){H=F.nodeName;}E=E&&!this.invalidHandleTypes[H];E=E&&!this.invalidHandleIds[F.id];for(var D=0,C=this.invalidHandleClasses.length;E&&D<C;++D){E=!B.hasClass(F,this.invalidHandleClasses[D]);}return E;},setXTicks:function(F,C){this.xTicks=[];this.xTickSize=C;var E={};for(var D=this.initPageX;D>=this.minX;D=D-C){if(!E[D]){this.xTicks[this.xTicks.length]=D;E[D]=true;}}for(D=this.initPageX;D<=this.maxX;D=D+C){if(!E[D]){this.xTicks[this.xTicks.length]=D;E[D]=true;}}this.xTicks.sort(this.DDM.numericSort);},setYTicks:function(F,C){this.yTicks=[];this.yTickSize=C;var E={};for(var D=this.initPageY;D>=this.minY;D=D-C){if(!E[D]){this.yTicks[this.yTicks.length]=D;E[D]=true;}}for(D=this.initPageY;D<=this.maxY;D=D+C){if(!E[D]){this.yTicks[this.yTicks.length]=D;E[D]=true;}}this.yTicks.sort(this.DDM.numericSort);},setXConstraint:function(E,D,C){this.leftConstraint=parseInt(E,10);this.rightConstraint=parseInt(D,10);this.minX=this.initPageX-this.leftConstraint;this.maxX=this.initPageX+this.rightConstraint;if(C){this.setXTicks(this.initPageX,C);}this.constrainX=true;},clearConstraints:function(){this.constrainX=false;this.constrainY=false;this.clearTicks();},clearTicks:function(){this.xTicks=null;this.yTicks=null;this.xTickSize=0;this.yTickSize=0;},setYConstraint:function(C,E,D){this.topConstraint=parseInt(C,10);this.bottomConstraint=parseInt(E,10);this.minY=this.initPageY-this.topConstraint;this.maxY=this.initPageY+this.bottomConstraint;
if(D){this.setYTicks(this.initPageY,D);}this.constrainY=true;},resetConstraints:function(){if(this.initPageX||this.initPageX===0){var D=(this.maintainOffset)?this.lastPageX-this.initPageX:0;var C=(this.maintainOffset)?this.lastPageY-this.initPageY:0;this.setInitPosition(D,C);}else{this.setInitPosition();}if(this.constrainX){this.setXConstraint(this.leftConstraint,this.rightConstraint,this.xTickSize);}if(this.constrainY){this.setYConstraint(this.topConstraint,this.bottomConstraint,this.yTickSize);}},getTick:function(I,F){if(!F){return I;}else{if(F[0]>=I){return F[0];}else{for(var D=0,C=F.length;D<C;++D){var E=D+1;if(F[E]&&F[E]>=I){var H=I-F[D];var G=F[E]-I;return(G>H)?F[D]:F[E];}}return F[F.length-1];}}},toString:function(){return("DragDrop "+this.id);}};YAHOO.augment(YAHOO.util.DragDrop,YAHOO.util.EventProvider);})();YAHOO.util.DD=function(C,A,B){if(C){this.init(C,A,B);}};YAHOO.extend(YAHOO.util.DD,YAHOO.util.DragDrop,{scroll:true,autoOffset:function(C,B){var A=C-this.startPageX;var D=B-this.startPageY;this.setDelta(A,D);},setDelta:function(B,A){this.deltaX=B;this.deltaY=A;},setDragElPos:function(C,B){var A=this.getDragEl();this.alignElWithMouse(A,C,B);},alignElWithMouse:function(C,G,F){var E=this.getTargetCoord(G,F);if(!this.deltaSetXY){var H=[E.x,E.y];YAHOO.util.Dom.setXY(C,H);var D=parseInt(YAHOO.util.Dom.getStyle(C,"left"),10);var B=parseInt(YAHOO.util.Dom.getStyle(C,"top"),10);this.deltaSetXY=[D-E.x,B-E.y];}else{YAHOO.util.Dom.setStyle(C,"left",(E.x+this.deltaSetXY[0])+"px");YAHOO.util.Dom.setStyle(C,"top",(E.y+this.deltaSetXY[1])+"px");}this.cachePosition(E.x,E.y);var A=this;setTimeout(function(){A.autoScroll.call(A,E.x,E.y,C.offsetHeight,C.offsetWidth);},0);},cachePosition:function(B,A){if(B){this.lastPageX=B;this.lastPageY=A;}else{var C=YAHOO.util.Dom.getXY(this.getEl());this.lastPageX=C[0];this.lastPageY=C[1];}},autoScroll:function(J,I,E,K){if(this.scroll){var L=this.DDM.getClientHeight();var B=this.DDM.getClientWidth();var N=this.DDM.getScrollTop();var D=this.DDM.getScrollLeft();var H=E+I;var M=K+J;var G=(L+N-I-this.deltaY);var F=(B+D-J-this.deltaX);var C=40;var A=(document.all)?80:30;if(H>L&&G<C){window.scrollTo(D,N+A);}if(I<N&&N>0&&I-N<C){window.scrollTo(D,N-A);}if(M>B&&F<C){window.scrollTo(D+A,N);}if(J<D&&D>0&&J-D<C){window.scrollTo(D-A,N);}}},applyConfig:function(){YAHOO.util.DD.superclass.applyConfig.call(this);this.scroll=(this.config.scroll!==false);},b4MouseDown:function(A){this.setStartPosition();this.autoOffset(YAHOO.util.Event.getPageX(A),YAHOO.util.Event.getPageY(A));},b4Drag:function(A){this.setDragElPos(YAHOO.util.Event.getPageX(A),YAHOO.util.Event.getPageY(A));},toString:function(){return("DD "+this.id);}});YAHOO.util.DDProxy=function(C,A,B){if(C){this.init(C,A,B);this.initFrame();}};YAHOO.util.DDProxy.dragElId="ygddfdiv";YAHOO.extend(YAHOO.util.DDProxy,YAHOO.util.DD,{resizeFrame:true,centerFrame:false,createFrame:function(){var B=this,A=document.body;if(!A||!A.firstChild){setTimeout(function(){B.createFrame();},50);return;}var F=this.getDragEl(),E=YAHOO.util.Dom;if(!F){F=document.createElement("div");F.id=this.dragElId;var D=F.style;D.position="absolute";D.visibility="hidden";D.cursor="move";D.border="2px solid #aaa";D.zIndex=999;D.height="25px";D.width="25px";var C=document.createElement("div");E.setStyle(C,"height","100%");E.setStyle(C,"width","100%");E.setStyle(C,"background-color","#ccc");E.setStyle(C,"opacity","0");F.appendChild(C);A.insertBefore(F,A.firstChild);}},initFrame:function(){this.createFrame();},applyConfig:function(){YAHOO.util.DDProxy.superclass.applyConfig.call(this);this.resizeFrame=(this.config.resizeFrame!==false);this.centerFrame=(this.config.centerFrame);this.setDragElId(this.config.dragElId||YAHOO.util.DDProxy.dragElId);},showFrame:function(E,D){var C=this.getEl();var A=this.getDragEl();var B=A.style;this._resizeProxy();if(this.centerFrame){this.setDelta(Math.round(parseInt(B.width,10)/2),Math.round(parseInt(B.height,10)/2));}this.setDragElPos(E,D);YAHOO.util.Dom.setStyle(A,"visibility","visible");},_resizeProxy:function(){if(this.resizeFrame){var H=YAHOO.util.Dom;var B=this.getEl();var C=this.getDragEl();var G=parseInt(H.getStyle(C,"borderTopWidth"),10);var I=parseInt(H.getStyle(C,"borderRightWidth"),10);var F=parseInt(H.getStyle(C,"borderBottomWidth"),10);var D=parseInt(H.getStyle(C,"borderLeftWidth"),10);if(isNaN(G)){G=0;}if(isNaN(I)){I=0;}if(isNaN(F)){F=0;}if(isNaN(D)){D=0;}var E=Math.max(0,B.offsetWidth-I-D);var A=Math.max(0,B.offsetHeight-G-F);H.setStyle(C,"width",E+"px");H.setStyle(C,"height",A+"px");}},b4MouseDown:function(B){this.setStartPosition();var A=YAHOO.util.Event.getPageX(B);var C=YAHOO.util.Event.getPageY(B);this.autoOffset(A,C);},b4StartDrag:function(A,B){this.showFrame(A,B);},b4EndDrag:function(A){YAHOO.util.Dom.setStyle(this.getDragEl(),"visibility","hidden");},endDrag:function(D){var C=YAHOO.util.Dom;var B=this.getEl();var A=this.getDragEl();C.setStyle(A,"visibility","");C.setStyle(B,"visibility","hidden");YAHOO.util.DDM.moveToEl(B,A);C.setStyle(A,"visibility","hidden");C.setStyle(B,"visibility","");},toString:function(){return("DDProxy "+this.id);}});YAHOO.util.DDTarget=function(C,A,B){if(C){this.initTarget(C,A,B);}};YAHOO.extend(YAHOO.util.DDTarget,YAHOO.util.DragDrop,{toString:function(){return("DDTarget "+this.id);}});YAHOO.register("dragdrop",YAHOO.util.DragDropMgr,{version:"@VERSION@",build:"@BUILD@"});
/* /htapps/roger.babel/mb/web/yui2-lib/build/dragdrop/dragdrop-min.js */
(function(){YAHOO.util.Config=function(d){if(d){this.init(d);}};var b=YAHOO.lang,c=YAHOO.util.CustomEvent,a=YAHOO.util.Config;a.CONFIG_CHANGED_EVENT="configChanged";a.BOOLEAN_TYPE="boolean";a.prototype={owner:null,queueInProgress:false,config:null,initialConfig:null,eventQueue:null,configChangedEvent:null,init:function(d){this.owner=d;this.configChangedEvent=this.createEvent(a.CONFIG_CHANGED_EVENT);this.configChangedEvent.signature=c.LIST;this.queueInProgress=false;this.config={};this.initialConfig={};this.eventQueue=[];},checkBoolean:function(d){return(typeof d==a.BOOLEAN_TYPE);},checkNumber:function(d){return(!isNaN(d));},fireEvent:function(d,f){var e=this.config[d];if(e&&e.event){e.event.fire(f);}},addProperty:function(e,d){e=e.toLowerCase();this.config[e]=d;d.event=this.createEvent(e,{scope:this.owner});d.event.signature=c.LIST;d.key=e;if(d.handler){d.event.subscribe(d.handler,this.owner);}this.setProperty(e,d.value,true);if(!d.suppressEvent){this.queueProperty(e,d.value);}},getConfig:function(){var d={},f=this.config,g,e;for(g in f){if(b.hasOwnProperty(f,g)){e=f[g];if(e&&e.event){d[g]=e.value;}}}return d;},getProperty:function(d){var e=this.config[d.toLowerCase()];if(e&&e.event){return e.value;}else{return undefined;}},resetProperty:function(d){d=d.toLowerCase();var e=this.config[d];if(e&&e.event){if(d in this.initialConfig){this.setProperty(d,this.initialConfig[d]);return true;}}else{return false;}},setProperty:function(e,g,d){var f;e=e.toLowerCase();if(this.queueInProgress&&!d){this.queueProperty(e,g);return true;}else{f=this.config[e];if(f&&f.event){if(f.validator&&!f.validator(g)){return false;}else{f.value=g;if(!d){this.fireEvent(e,g);this.configChangedEvent.fire([e,g]);}return true;}}else{return false;}}},queueProperty:function(v,r){v=v.toLowerCase();var u=this.config[v],l=false,k,g,h,j,p,t,f,n,o,d,m,w,e;if(u&&u.event){if(!b.isUndefined(r)&&u.validator&&!u.validator(r)){return false;}else{if(!b.isUndefined(r)){u.value=r;}else{r=u.value;}l=false;k=this.eventQueue.length;for(m=0;m<k;m++){g=this.eventQueue[m];if(g){h=g[0];j=g[1];if(h==v){this.eventQueue[m]=null;this.eventQueue.push([v,(!b.isUndefined(r)?r:j)]);l=true;break;}}}if(!l&&!b.isUndefined(r)){this.eventQueue.push([v,r]);}}if(u.supercedes){p=u.supercedes.length;for(w=0;w<p;w++){t=u.supercedes[w];f=this.eventQueue.length;for(e=0;e<f;e++){n=this.eventQueue[e];if(n){o=n[0];d=n[1];if(o==t.toLowerCase()){this.eventQueue.push([o,d]);this.eventQueue[e]=null;break;}}}}}return true;}else{return false;}},refireEvent:function(d){d=d.toLowerCase();var e=this.config[d];if(e&&e.event&&!b.isUndefined(e.value)){if(this.queueInProgress){this.queueProperty(d);}else{this.fireEvent(d,e.value);}}},applyConfig:function(d,g){var f,e;if(g){e={};for(f in d){if(b.hasOwnProperty(d,f)){e[f.toLowerCase()]=d[f];}}this.initialConfig=e;}for(f in d){if(b.hasOwnProperty(d,f)){this.queueProperty(f,d[f]);}}},refresh:function(){var d;for(d in this.config){if(b.hasOwnProperty(this.config,d)){this.refireEvent(d);}}},fireQueue:function(){var e,h,d,g,f;this.queueInProgress=true;for(e=0;e<this.eventQueue.length;e++){h=this.eventQueue[e];if(h){d=h[0];g=h[1];f=this.config[d];f.value=g;this.eventQueue[e]=null;this.fireEvent(d,g);}}this.queueInProgress=false;this.eventQueue=[];},subscribeToConfigEvent:function(d,e,g,h){var f=this.config[d.toLowerCase()];if(f&&f.event){if(!a.alreadySubscribed(f.event,e,g)){f.event.subscribe(e,g,h);}return true;}else{return false;}},unsubscribeFromConfigEvent:function(d,e,g){var f=this.config[d.toLowerCase()];if(f&&f.event){return f.event.unsubscribe(e,g);}else{return false;}},toString:function(){var d="Config";if(this.owner){d+=" ["+this.owner.toString()+"]";}return d;},outputEventQueue:function(){var d="",g,e,f=this.eventQueue.length;for(e=0;e<f;e++){g=this.eventQueue[e];if(g){d+=g[0]+"="+g[1]+", ";}}return d;},destroy:function(){var e=this.config,d,f;for(d in e){if(b.hasOwnProperty(e,d)){f=e[d];f.event.unsubscribeAll();f.event=null;}}this.configChangedEvent.unsubscribeAll();this.configChangedEvent=null;this.owner=null;this.config=null;this.initialConfig=null;this.eventQueue=null;}};a.alreadySubscribed=function(e,h,j){var f=e.subscribers.length,d,g;if(f>0){g=f-1;do{d=e.subscribers[g];if(d&&d.obj==j&&d.fn==h){return true;}}while(g--);}return false;};YAHOO.lang.augmentProto(a,YAHOO.util.EventProvider);}());(function(){YAHOO.widget.Module=function(r,q){if(r){this.init(r,q);}else{}};var f=YAHOO.util.Dom,d=YAHOO.util.Config,n=YAHOO.util.Event,m=YAHOO.util.CustomEvent,g=YAHOO.widget.Module,i=YAHOO.env.ua,h,p,o,e,a={"BEFORE_INIT":"beforeInit","INIT":"init","APPEND":"append","BEFORE_RENDER":"beforeRender","RENDER":"render","CHANGE_HEADER":"changeHeader","CHANGE_BODY":"changeBody","CHANGE_FOOTER":"changeFooter","CHANGE_CONTENT":"changeContent","DESTROY":"destroy","BEFORE_SHOW":"beforeShow","SHOW":"show","BEFORE_HIDE":"beforeHide","HIDE":"hide"},j={"VISIBLE":{key:"visible",value:true,validator:YAHOO.lang.isBoolean},"EFFECT":{key:"effect",suppressEvent:true,supercedes:["visible"]},"MONITOR_RESIZE":{key:"monitorresize",value:true},"APPEND_TO_DOCUMENT_BODY":{key:"appendtodocumentbody",value:false}};g.IMG_ROOT=null;g.IMG_ROOT_SSL=null;g.CSS_MODULE="yui-module";g.CSS_HEADER="hd";g.CSS_BODY="bd";g.CSS_FOOTER="ft";g.RESIZE_MONITOR_SECURE_URL="javascript:false;";g.RESIZE_MONITOR_BUFFER=1;g.textResizeEvent=new m("textResize");g.forceDocumentRedraw=function(){var q=document.documentElement;if(q){q.className+=" ";q.className=YAHOO.lang.trim(q.className);}};function l(){if(!h){h=document.createElement("div");h.innerHTML=('<div class="'+g.CSS_HEADER+'"></div>'+'<div class="'+g.CSS_BODY+'"></div><div class="'+g.CSS_FOOTER+'"></div>');p=h.firstChild;o=p.nextSibling;e=o.nextSibling;}return h;}function k(){if(!p){l();}return(p.cloneNode(false));}function b(){if(!o){l();}return(o.cloneNode(false));}function c(){if(!e){l();}return(e.cloneNode(false));}g.prototype={constructor:g,element:null,header:null,body:null,footer:null,id:null,imageRoot:g.IMG_ROOT,initEvents:function(){var q=m.LIST;
this.beforeInitEvent=this.createEvent(a.BEFORE_INIT);this.beforeInitEvent.signature=q;this.initEvent=this.createEvent(a.INIT);this.initEvent.signature=q;this.appendEvent=this.createEvent(a.APPEND);this.appendEvent.signature=q;this.beforeRenderEvent=this.createEvent(a.BEFORE_RENDER);this.beforeRenderEvent.signature=q;this.renderEvent=this.createEvent(a.RENDER);this.renderEvent.signature=q;this.changeHeaderEvent=this.createEvent(a.CHANGE_HEADER);this.changeHeaderEvent.signature=q;this.changeBodyEvent=this.createEvent(a.CHANGE_BODY);this.changeBodyEvent.signature=q;this.changeFooterEvent=this.createEvent(a.CHANGE_FOOTER);this.changeFooterEvent.signature=q;this.changeContentEvent=this.createEvent(a.CHANGE_CONTENT);this.changeContentEvent.signature=q;this.destroyEvent=this.createEvent(a.DESTROY);this.destroyEvent.signature=q;this.beforeShowEvent=this.createEvent(a.BEFORE_SHOW);this.beforeShowEvent.signature=q;this.showEvent=this.createEvent(a.SHOW);this.showEvent.signature=q;this.beforeHideEvent=this.createEvent(a.BEFORE_HIDE);this.beforeHideEvent.signature=q;this.hideEvent=this.createEvent(a.HIDE);this.hideEvent.signature=q;},platform:function(){var q=navigator.userAgent.toLowerCase();if(q.indexOf("windows")!=-1||q.indexOf("win32")!=-1){return"windows";}else{if(q.indexOf("macintosh")!=-1){return"mac";}else{return false;}}}(),browser:function(){var q=navigator.userAgent.toLowerCase();if(q.indexOf("opera")!=-1){return"opera";}else{if(q.indexOf("msie 7")!=-1){return"ie7";}else{if(q.indexOf("msie")!=-1){return"ie";}else{if(q.indexOf("safari")!=-1){return"safari";}else{if(q.indexOf("gecko")!=-1){return"gecko";}else{return false;}}}}}}(),isSecure:function(){if(window.location.href.toLowerCase().indexOf("https")===0){return true;}else{return false;}}(),initDefaultConfig:function(){this.cfg.addProperty(j.VISIBLE.key,{handler:this.configVisible,value:j.VISIBLE.value,validator:j.VISIBLE.validator});this.cfg.addProperty(j.EFFECT.key,{handler:this.configEffect,suppressEvent:j.EFFECT.suppressEvent,supercedes:j.EFFECT.supercedes});this.cfg.addProperty(j.MONITOR_RESIZE.key,{handler:this.configMonitorResize,value:j.MONITOR_RESIZE.value});this.cfg.addProperty(j.APPEND_TO_DOCUMENT_BODY.key,{value:j.APPEND_TO_DOCUMENT_BODY.value});},init:function(v,u){var s,w;this.initEvents();this.beforeInitEvent.fire(g);this.cfg=new d(this);if(this.isSecure){this.imageRoot=g.IMG_ROOT_SSL;}if(typeof v=="string"){s=v;v=document.getElementById(v);if(!v){v=(l()).cloneNode(false);v.id=s;}}this.id=f.generateId(v);this.element=v;w=this.element.firstChild;if(w){var r=false,q=false,t=false;do{if(1==w.nodeType){if(!r&&f.hasClass(w,g.CSS_HEADER)){this.header=w;r=true;}else{if(!q&&f.hasClass(w,g.CSS_BODY)){this.body=w;q=true;}else{if(!t&&f.hasClass(w,g.CSS_FOOTER)){this.footer=w;t=true;}}}}}while((w=w.nextSibling));}this.initDefaultConfig();f.addClass(this.element,g.CSS_MODULE);if(u){this.cfg.applyConfig(u,true);}if(!d.alreadySubscribed(this.renderEvent,this.cfg.fireQueue,this.cfg)){this.renderEvent.subscribe(this.cfg.fireQueue,this.cfg,true);}this.initEvent.fire(g);},initResizeMonitor:function(){var r=(i.gecko&&this.platform=="windows");if(r){var q=this;setTimeout(function(){q._initResizeMonitor();},0);}else{this._initResizeMonitor();}},_initResizeMonitor:function(){var q,s,u;function w(){g.textResizeEvent.fire();}if(!i.opera){s=f.get("_yuiResizeMonitor");var v=this._supportsCWResize();if(!s){s=document.createElement("iframe");if(this.isSecure&&g.RESIZE_MONITOR_SECURE_URL&&i.ie){s.src=g.RESIZE_MONITOR_SECURE_URL;}if(!v){u=["<html><head><script ",'type="text/javascript">',"window.onresize=function(){window.parent.","YAHOO.widget.Module.textResizeEvent.","fire();};<","/script></head>","<body></body></html>"].join("");s.src="data:text/html;charset=utf-8,"+encodeURIComponent(u);}s.id="_yuiResizeMonitor";s.title="Text Resize Monitor";s.tabIndex=-1;s.setAttribute("role","presentation");s.style.position="absolute";s.style.visibility="hidden";var r=document.body,t=r.firstChild;if(t){r.insertBefore(s,t);}else{r.appendChild(s);}s.style.backgroundColor="transparent";s.style.borderWidth="0";s.style.width="2em";s.style.height="2em";s.style.left="0";s.style.top=(-1*(s.offsetHeight+g.RESIZE_MONITOR_BUFFER))+"px";s.style.visibility="visible";if(i.webkit){q=s.contentWindow.document;q.open();q.close();}}if(s&&s.contentWindow){g.textResizeEvent.subscribe(this.onDomResize,this,true);if(!g.textResizeInitialized){if(v){if(!n.on(s.contentWindow,"resize",w)){n.on(s,"resize",w);}}g.textResizeInitialized=true;}this.resizeMonitor=s;}}},_supportsCWResize:function(){var q=true;if(i.gecko&&i.gecko<=1.8){q=false;}return q;},onDomResize:function(s,r){var q=-1*(this.resizeMonitor.offsetHeight+g.RESIZE_MONITOR_BUFFER);this.resizeMonitor.style.top=q+"px";this.resizeMonitor.style.left="0";},setHeader:function(r){var q=this.header||(this.header=k());if(r.nodeName){q.innerHTML="";q.appendChild(r);}else{q.innerHTML=r;}if(this._rendered){this._renderHeader();}this.changeHeaderEvent.fire(r);this.changeContentEvent.fire();},appendToHeader:function(r){var q=this.header||(this.header=k());q.appendChild(r);this.changeHeaderEvent.fire(r);this.changeContentEvent.fire();},setBody:function(r){var q=this.body||(this.body=b());if(r.nodeName){q.innerHTML="";q.appendChild(r);}else{q.innerHTML=r;}if(this._rendered){this._renderBody();}this.changeBodyEvent.fire(r);this.changeContentEvent.fire();},appendToBody:function(r){var q=this.body||(this.body=b());q.appendChild(r);this.changeBodyEvent.fire(r);this.changeContentEvent.fire();},setFooter:function(r){var q=this.footer||(this.footer=c());if(r.nodeName){q.innerHTML="";q.appendChild(r);}else{q.innerHTML=r;}if(this._rendered){this._renderFooter();}this.changeFooterEvent.fire(r);this.changeContentEvent.fire();},appendToFooter:function(r){var q=this.footer||(this.footer=c());q.appendChild(r);this.changeFooterEvent.fire(r);this.changeContentEvent.fire();},render:function(s,q){var t=this;function r(u){if(typeof u=="string"){u=document.getElementById(u);
}if(u){t._addToParent(u,t.element);t.appendEvent.fire();}}this.beforeRenderEvent.fire();if(!q){q=this.element;}if(s){r(s);}else{if(!f.inDocument(this.element)){return false;}}this._renderHeader(q);this._renderBody(q);this._renderFooter(q);this._rendered=true;this.renderEvent.fire();return true;},_renderHeader:function(q){q=q||this.element;if(this.header&&!f.inDocument(this.header)){var r=q.firstChild;if(r){q.insertBefore(this.header,r);}else{q.appendChild(this.header);}}},_renderBody:function(q){q=q||this.element;if(this.body&&!f.inDocument(this.body)){if(this.footer&&f.isAncestor(q,this.footer)){q.insertBefore(this.body,this.footer);}else{q.appendChild(this.body);}}},_renderFooter:function(q){q=q||this.element;if(this.footer&&!f.inDocument(this.footer)){q.appendChild(this.footer);}},destroy:function(q){var r,s=!(q);if(this.element){n.purgeElement(this.element,s);r=this.element.parentNode;}if(r){r.removeChild(this.element);}this.element=null;this.header=null;this.body=null;this.footer=null;g.textResizeEvent.unsubscribe(this.onDomResize,this);this.cfg.destroy();this.cfg=null;this.destroyEvent.fire();},show:function(){this.cfg.setProperty("visible",true);},hide:function(){this.cfg.setProperty("visible",false);},configVisible:function(r,q,s){var t=q[0];if(t){if(this.beforeShowEvent.fire()){f.setStyle(this.element,"display","block");this.showEvent.fire();}}else{if(this.beforeHideEvent.fire()){f.setStyle(this.element,"display","none");this.hideEvent.fire();}}},configEffect:function(r,q,s){this._cachedEffects=(this.cacheEffects)?this._createEffects(q[0]):null;},cacheEffects:true,_createEffects:function(t){var q=null,u,r,s;if(t){if(t instanceof Array){q=[];u=t.length;for(r=0;r<u;r++){s=t[r];if(s.effect){q[q.length]=s.effect(this,s.duration);}}}else{if(t.effect){q=[t.effect(this,t.duration)];}}}return q;},configMonitorResize:function(s,r,t){var q=r[0];if(q){this.initResizeMonitor();}else{g.textResizeEvent.unsubscribe(this.onDomResize,this,true);this.resizeMonitor=null;}},_addToParent:function(q,r){if(!this.cfg.getProperty("appendtodocumentbody")&&q===document.body&&q.firstChild){q.insertBefore(r,q.firstChild);}else{q.appendChild(r);}},toString:function(){return"Module "+this.id;}};YAHOO.lang.augmentProto(g,YAHOO.util.EventProvider);}());(function(){YAHOO.widget.Overlay=function(p,o){YAHOO.widget.Overlay.superclass.constructor.call(this,p,o);};var i=YAHOO.lang,m=YAHOO.util.CustomEvent,g=YAHOO.widget.Module,n=YAHOO.util.Event,f=YAHOO.util.Dom,d=YAHOO.util.Config,k=YAHOO.env.ua,b=YAHOO.widget.Overlay,h="subscribe",e="unsubscribe",c="contained",j,a={"BEFORE_MOVE":"beforeMove","MOVE":"move"},l={"X":{key:"x",validator:i.isNumber,suppressEvent:true,supercedes:["iframe"]},"Y":{key:"y",validator:i.isNumber,suppressEvent:true,supercedes:["iframe"]},"XY":{key:"xy",suppressEvent:true,supercedes:["iframe"]},"CONTEXT":{key:"context",suppressEvent:true,supercedes:["iframe"]},"FIXED_CENTER":{key:"fixedcenter",value:false,supercedes:["iframe","visible"]},"WIDTH":{key:"width",suppressEvent:true,supercedes:["context","fixedcenter","iframe"]},"HEIGHT":{key:"height",suppressEvent:true,supercedes:["context","fixedcenter","iframe"]},"AUTO_FILL_HEIGHT":{key:"autofillheight",supercedes:["height"],value:"body"},"ZINDEX":{key:"zindex",value:null},"CONSTRAIN_TO_VIEWPORT":{key:"constraintoviewport",value:false,validator:i.isBoolean,supercedes:["iframe","x","y","xy"]},"IFRAME":{key:"iframe",value:(k.ie==6?true:false),validator:i.isBoolean,supercedes:["zindex"]},"PREVENT_CONTEXT_OVERLAP":{key:"preventcontextoverlap",value:false,validator:i.isBoolean,supercedes:["constraintoviewport"]}};b.IFRAME_SRC="javascript:false;";b.IFRAME_OFFSET=3;b.VIEWPORT_OFFSET=10;b.TOP_LEFT="tl";b.TOP_RIGHT="tr";b.BOTTOM_LEFT="bl";b.BOTTOM_RIGHT="br";b.PREVENT_OVERLAP_X={"tltr":true,"blbr":true,"brbl":true,"trtl":true};b.PREVENT_OVERLAP_Y={"trbr":true,"tlbl":true,"bltl":true,"brtr":true};b.CSS_OVERLAY="yui-overlay";b.CSS_HIDDEN="yui-overlay-hidden";b.CSS_IFRAME="yui-overlay-iframe";b.STD_MOD_RE=/^\s*?(body|footer|header)\s*?$/i;b.windowScrollEvent=new m("windowScroll");b.windowResizeEvent=new m("windowResize");b.windowScrollHandler=function(p){var o=n.getTarget(p);if(!o||o===window||o===window.document){if(k.ie){if(!window.scrollEnd){window.scrollEnd=-1;}clearTimeout(window.scrollEnd);window.scrollEnd=setTimeout(function(){b.windowScrollEvent.fire();},1);}else{b.windowScrollEvent.fire();}}};b.windowResizeHandler=function(o){if(k.ie){if(!window.resizeEnd){window.resizeEnd=-1;}clearTimeout(window.resizeEnd);window.resizeEnd=setTimeout(function(){b.windowResizeEvent.fire();},100);}else{b.windowResizeEvent.fire();}};b._initialized=null;if(b._initialized===null){n.on(window,"scroll",b.windowScrollHandler);n.on(window,"resize",b.windowResizeHandler);b._initialized=true;}b._TRIGGER_MAP={"windowScroll":b.windowScrollEvent,"windowResize":b.windowResizeEvent,"textResize":g.textResizeEvent};YAHOO.extend(b,g,{CONTEXT_TRIGGERS:[],init:function(p,o){b.superclass.init.call(this,p);this.beforeInitEvent.fire(b);f.addClass(this.element,b.CSS_OVERLAY);if(o){this.cfg.applyConfig(o,true);}if(this.platform=="mac"&&k.gecko){if(!d.alreadySubscribed(this.showEvent,this.showMacGeckoScrollbars,this)){this.showEvent.subscribe(this.showMacGeckoScrollbars,this,true);}if(!d.alreadySubscribed(this.hideEvent,this.hideMacGeckoScrollbars,this)){this.hideEvent.subscribe(this.hideMacGeckoScrollbars,this,true);}}this.initEvent.fire(b);},initEvents:function(){b.superclass.initEvents.call(this);var o=m.LIST;this.beforeMoveEvent=this.createEvent(a.BEFORE_MOVE);this.beforeMoveEvent.signature=o;this.moveEvent=this.createEvent(a.MOVE);this.moveEvent.signature=o;},initDefaultConfig:function(){b.superclass.initDefaultConfig.call(this);var o=this.cfg;o.addProperty(l.X.key,{handler:this.configX,validator:l.X.validator,suppressEvent:l.X.suppressEvent,supercedes:l.X.supercedes});o.addProperty(l.Y.key,{handler:this.configY,validator:l.Y.validator,suppressEvent:l.Y.suppressEvent,supercedes:l.Y.supercedes});
o.addProperty(l.XY.key,{handler:this.configXY,suppressEvent:l.XY.suppressEvent,supercedes:l.XY.supercedes});o.addProperty(l.CONTEXT.key,{handler:this.configContext,suppressEvent:l.CONTEXT.suppressEvent,supercedes:l.CONTEXT.supercedes});o.addProperty(l.FIXED_CENTER.key,{handler:this.configFixedCenter,value:l.FIXED_CENTER.value,validator:l.FIXED_CENTER.validator,supercedes:l.FIXED_CENTER.supercedes});o.addProperty(l.WIDTH.key,{handler:this.configWidth,suppressEvent:l.WIDTH.suppressEvent,supercedes:l.WIDTH.supercedes});o.addProperty(l.HEIGHT.key,{handler:this.configHeight,suppressEvent:l.HEIGHT.suppressEvent,supercedes:l.HEIGHT.supercedes});o.addProperty(l.AUTO_FILL_HEIGHT.key,{handler:this.configAutoFillHeight,value:l.AUTO_FILL_HEIGHT.value,validator:this._validateAutoFill,supercedes:l.AUTO_FILL_HEIGHT.supercedes});o.addProperty(l.ZINDEX.key,{handler:this.configzIndex,value:l.ZINDEX.value});o.addProperty(l.CONSTRAIN_TO_VIEWPORT.key,{handler:this.configConstrainToViewport,value:l.CONSTRAIN_TO_VIEWPORT.value,validator:l.CONSTRAIN_TO_VIEWPORT.validator,supercedes:l.CONSTRAIN_TO_VIEWPORT.supercedes});o.addProperty(l.IFRAME.key,{handler:this.configIframe,value:l.IFRAME.value,validator:l.IFRAME.validator,supercedes:l.IFRAME.supercedes});o.addProperty(l.PREVENT_CONTEXT_OVERLAP.key,{value:l.PREVENT_CONTEXT_OVERLAP.value,validator:l.PREVENT_CONTEXT_OVERLAP.validator,supercedes:l.PREVENT_CONTEXT_OVERLAP.supercedes});},moveTo:function(o,p){this.cfg.setProperty("xy",[o,p]);},hideMacGeckoScrollbars:function(){f.replaceClass(this.element,"show-scrollbars","hide-scrollbars");},showMacGeckoScrollbars:function(){f.replaceClass(this.element,"hide-scrollbars","show-scrollbars");},_setDomVisibility:function(o){f.setStyle(this.element,"visibility",(o)?"visible":"hidden");var p=b.CSS_HIDDEN;if(o){f.removeClass(this.element,p);}else{f.addClass(this.element,p);}},configVisible:function(x,w,t){var p=w[0],B=f.getStyle(this.element,"visibility"),o=this._cachedEffects||this._createEffects(this.cfg.getProperty("effect")),A=(this.platform=="mac"&&k.gecko),y=d.alreadySubscribed,q,v,s,r,u,z;if(B=="inherit"){v=this.element.parentNode;while(v.nodeType!=9&&v.nodeType!=11){B=f.getStyle(v,"visibility");if(B!="inherit"){break;}v=v.parentNode;}if(B=="inherit"){B="visible";}}if(p){if(A){this.showMacGeckoScrollbars();}if(o){if(p){if(B!="visible"||B===""||this._fadingOut){if(this.beforeShowEvent.fire()){z=o.length;for(s=0;s<z;s++){q=o[s];if(s===0&&!y(q.animateInCompleteEvent,this.showEvent.fire,this.showEvent)){q.animateInCompleteEvent.subscribe(this.showEvent.fire,this.showEvent,true);}q.animateIn();}}}}}else{if(B!="visible"||B===""){if(this.beforeShowEvent.fire()){this._setDomVisibility(true);this.cfg.refireEvent("iframe");this.showEvent.fire();}}else{this._setDomVisibility(true);}}}else{if(A){this.hideMacGeckoScrollbars();}if(o){if(B=="visible"||this._fadingIn){if(this.beforeHideEvent.fire()){z=o.length;for(r=0;r<z;r++){u=o[r];if(r===0&&!y(u.animateOutCompleteEvent,this.hideEvent.fire,this.hideEvent)){u.animateOutCompleteEvent.subscribe(this.hideEvent.fire,this.hideEvent,true);}u.animateOut();}}}else{if(B===""){this._setDomVisibility(false);}}}else{if(B=="visible"||B===""){if(this.beforeHideEvent.fire()){this._setDomVisibility(false);this.hideEvent.fire();}}else{this._setDomVisibility(false);}}}},doCenterOnDOMEvent:function(){var o=this.cfg,p=o.getProperty("fixedcenter");if(o.getProperty("visible")){if(p&&(p!==c||this.fitsInViewport())){this.center();}}},fitsInViewport:function(){var s=b.VIEWPORT_OFFSET,q=this.element,t=q.offsetWidth,r=q.offsetHeight,o=f.getViewportWidth(),p=f.getViewportHeight();return((t+s<o)&&(r+s<p));},configFixedCenter:function(s,q,t){var u=q[0],p=d.alreadySubscribed,r=b.windowResizeEvent,o=b.windowScrollEvent;if(u){this.center();if(!p(this.beforeShowEvent,this.center)){this.beforeShowEvent.subscribe(this.center);}if(!p(r,this.doCenterOnDOMEvent,this)){r.subscribe(this.doCenterOnDOMEvent,this,true);}if(!p(o,this.doCenterOnDOMEvent,this)){o.subscribe(this.doCenterOnDOMEvent,this,true);}}else{this.beforeShowEvent.unsubscribe(this.center);r.unsubscribe(this.doCenterOnDOMEvent,this);o.unsubscribe(this.doCenterOnDOMEvent,this);}},configHeight:function(r,p,s){var o=p[0],q=this.element;f.setStyle(q,"height",o);this.cfg.refireEvent("iframe");},configAutoFillHeight:function(t,s,p){var v=s[0],q=this.cfg,u="autofillheight",w="height",r=q.getProperty(u),o=this._autoFillOnHeightChange;q.unsubscribeFromConfigEvent(w,o);g.textResizeEvent.unsubscribe(o);this.changeContentEvent.unsubscribe(o);if(r&&v!==r&&this[r]){f.setStyle(this[r],w,"");}if(v){v=i.trim(v.toLowerCase());q.subscribeToConfigEvent(w,o,this[v],this);g.textResizeEvent.subscribe(o,this[v],this);this.changeContentEvent.subscribe(o,this[v],this);q.setProperty(u,v,true);}},configWidth:function(r,o,s){var q=o[0],p=this.element;f.setStyle(p,"width",q);this.cfg.refireEvent("iframe");},configzIndex:function(q,o,r){var s=o[0],p=this.element;if(!s){s=f.getStyle(p,"zIndex");if(!s||isNaN(s)){s=0;}}if(this.iframe||this.cfg.getProperty("iframe")===true){if(s<=0){s=1;}}f.setStyle(p,"zIndex",s);this.cfg.setProperty("zIndex",s,true);if(this.iframe){this.stackIframe();}},configXY:function(q,p,r){var t=p[0],o=t[0],s=t[1];this.cfg.setProperty("x",o);this.cfg.setProperty("y",s);this.beforeMoveEvent.fire([o,s]);o=this.cfg.getProperty("x");s=this.cfg.getProperty("y");this.cfg.refireEvent("iframe");this.moveEvent.fire([o,s]);},configX:function(q,p,r){var o=p[0],s=this.cfg.getProperty("y");this.cfg.setProperty("x",o,true);this.cfg.setProperty("y",s,true);this.beforeMoveEvent.fire([o,s]);o=this.cfg.getProperty("x");s=this.cfg.getProperty("y");f.setX(this.element,o,true);this.cfg.setProperty("xy",[o,s],true);this.cfg.refireEvent("iframe");this.moveEvent.fire([o,s]);},configY:function(q,p,r){var o=this.cfg.getProperty("x"),s=p[0];this.cfg.setProperty("x",o,true);this.cfg.setProperty("y",s,true);this.beforeMoveEvent.fire([o,s]);o=this.cfg.getProperty("x");s=this.cfg.getProperty("y");f.setY(this.element,s,true);
this.cfg.setProperty("xy",[o,s],true);this.cfg.refireEvent("iframe");this.moveEvent.fire([o,s]);},showIframe:function(){var p=this.iframe,o;if(p){o=this.element.parentNode;if(o!=p.parentNode){this._addToParent(o,p);}p.style.display="block";}},hideIframe:function(){if(this.iframe){this.iframe.style.display="none";}},syncIframe:function(){var o=this.iframe,q=this.element,s=b.IFRAME_OFFSET,p=(s*2),r;if(o){o.style.width=(q.offsetWidth+p+"px");o.style.height=(q.offsetHeight+p+"px");r=this.cfg.getProperty("xy");if(!i.isArray(r)||(isNaN(r[0])||isNaN(r[1]))){this.syncPosition();r=this.cfg.getProperty("xy");}f.setXY(o,[(r[0]-s),(r[1]-s)]);}},stackIframe:function(){if(this.iframe){var o=f.getStyle(this.element,"zIndex");if(!YAHOO.lang.isUndefined(o)&&!isNaN(o)){f.setStyle(this.iframe,"zIndex",(o-1));}}},configIframe:function(r,q,s){var o=q[0];function t(){var v=this.iframe,w=this.element,x;if(!v){if(!j){j=document.createElement("iframe");if(this.isSecure){j.src=b.IFRAME_SRC;}if(k.ie){j.style.filter="alpha(opacity=0)";j.frameBorder=0;}else{j.style.opacity="0";}j.style.position="absolute";j.style.border="none";j.style.margin="0";j.style.padding="0";j.style.display="none";j.tabIndex=-1;j.className=b.CSS_IFRAME;}v=j.cloneNode(false);v.id=this.id+"_f";x=w.parentNode;var u=x||document.body;this._addToParent(u,v);this.iframe=v;}this.showIframe();this.syncIframe();this.stackIframe();if(!this._hasIframeEventListeners){this.showEvent.subscribe(this.showIframe);this.hideEvent.subscribe(this.hideIframe);this.changeContentEvent.subscribe(this.syncIframe);this._hasIframeEventListeners=true;}}function p(){t.call(this);this.beforeShowEvent.unsubscribe(p);this._iframeDeferred=false;}if(o){if(this.cfg.getProperty("visible")){t.call(this);}else{if(!this._iframeDeferred){this.beforeShowEvent.subscribe(p);this._iframeDeferred=true;}}}else{this.hideIframe();if(this._hasIframeEventListeners){this.showEvent.unsubscribe(this.showIframe);this.hideEvent.unsubscribe(this.hideIframe);this.changeContentEvent.unsubscribe(this.syncIframe);this._hasIframeEventListeners=false;}}},_primeXYFromDOM:function(){if(YAHOO.lang.isUndefined(this.cfg.getProperty("xy"))){this.syncPosition();this.cfg.refireEvent("xy");this.beforeShowEvent.unsubscribe(this._primeXYFromDOM);}},configConstrainToViewport:function(p,o,q){var r=o[0];if(r){if(!d.alreadySubscribed(this.beforeMoveEvent,this.enforceConstraints,this)){this.beforeMoveEvent.subscribe(this.enforceConstraints,this,true);}if(!d.alreadySubscribed(this.beforeShowEvent,this._primeXYFromDOM)){this.beforeShowEvent.subscribe(this._primeXYFromDOM);}}else{this.beforeShowEvent.unsubscribe(this._primeXYFromDOM);this.beforeMoveEvent.unsubscribe(this.enforceConstraints,this);}},configContext:function(u,t,q){var x=t[0],r,o,v,s,p,w=this.CONTEXT_TRIGGERS;if(x){r=x[0];o=x[1];v=x[2];s=x[3];p=x[4];if(w&&w.length>0){s=(s||[]).concat(w);}if(r){if(typeof r=="string"){this.cfg.setProperty("context",[document.getElementById(r),o,v,s,p],true);}if(o&&v){this.align(o,v,p);}if(this._contextTriggers){this._processTriggers(this._contextTriggers,e,this._alignOnTrigger);}if(s){this._processTriggers(s,h,this._alignOnTrigger);this._contextTriggers=s;}}}},_alignOnTrigger:function(p,o){this.align();},_findTriggerCE:function(o){var p=null;if(o instanceof m){p=o;}else{if(b._TRIGGER_MAP[o]){p=b._TRIGGER_MAP[o];}}return p;},_processTriggers:function(s,v,r){var q,u;for(var p=0,o=s.length;p<o;++p){q=s[p];u=this._findTriggerCE(q);if(u){u[v](r,this,true);}else{this[v](q,r);}}},align:function(p,w,s){var v=this.cfg.getProperty("context"),t=this,o,q,u;function r(z,A){var y=null,x=null;switch(p){case b.TOP_LEFT:y=A;x=z;break;case b.TOP_RIGHT:y=A-q.offsetWidth;x=z;break;case b.BOTTOM_LEFT:y=A;x=z-q.offsetHeight;break;case b.BOTTOM_RIGHT:y=A-q.offsetWidth;x=z-q.offsetHeight;break;}if(y!==null&&x!==null){if(s){y+=s[0];x+=s[1];}t.moveTo(y,x);}}if(v){o=v[0];q=this.element;t=this;if(!p){p=v[1];}if(!w){w=v[2];}if(!s&&v[4]){s=v[4];}if(q&&o){u=f.getRegion(o);switch(w){case b.TOP_LEFT:r(u.top,u.left);break;case b.TOP_RIGHT:r(u.top,u.right);break;case b.BOTTOM_LEFT:r(u.bottom,u.left);break;case b.BOTTOM_RIGHT:r(u.bottom,u.right);break;}}}},enforceConstraints:function(p,o,q){var s=o[0];var r=this.getConstrainedXY(s[0],s[1]);this.cfg.setProperty("x",r[0],true);this.cfg.setProperty("y",r[1],true);this.cfg.setProperty("xy",r,true);},_getConstrainedPos:function(y,p){var t=this.element,r=b.VIEWPORT_OFFSET,A=(y=="x"),z=(A)?t.offsetWidth:t.offsetHeight,s=(A)?f.getViewportWidth():f.getViewportHeight(),D=(A)?f.getDocumentScrollLeft():f.getDocumentScrollTop(),C=(A)?b.PREVENT_OVERLAP_X:b.PREVENT_OVERLAP_Y,o=this.cfg.getProperty("context"),u=(z+r<s),w=this.cfg.getProperty("preventcontextoverlap")&&o&&C[(o[1]+o[2])],v=D+r,B=D+s-z-r,q=p;if(p<v||p>B){if(w){q=this._preventOverlap(y,o[0],z,s,D);}else{if(u){if(p<v){q=v;}else{if(p>B){q=B;}}}else{q=v;}}}return q;},_preventOverlap:function(y,w,z,u,C){var A=(y=="x"),t=b.VIEWPORT_OFFSET,s=this,q=((A)?f.getX(w):f.getY(w))-C,o=(A)?w.offsetWidth:w.offsetHeight,p=q-t,r=(u-(q+o))-t,D=false,v=function(){var x;if((s.cfg.getProperty(y)-C)>q){x=(q-z);}else{x=(q+o);}s.cfg.setProperty(y,(x+C),true);return x;},B=function(){var E=((s.cfg.getProperty(y)-C)>q)?r:p,x;if(z>E){if(D){v();}else{v();D=true;x=B();}}return x;};B();return this.cfg.getProperty(y);},getConstrainedX:function(o){return this._getConstrainedPos("x",o);},getConstrainedY:function(o){return this._getConstrainedPos("y",o);},getConstrainedXY:function(o,p){return[this.getConstrainedX(o),this.getConstrainedY(p)];},center:function(){var r=b.VIEWPORT_OFFSET,s=this.element.offsetWidth,q=this.element.offsetHeight,p=f.getViewportWidth(),t=f.getViewportHeight(),o,u;if(s<p){o=(p/2)-(s/2)+f.getDocumentScrollLeft();}else{o=r+f.getDocumentScrollLeft();}if(q<t){u=(t/2)-(q/2)+f.getDocumentScrollTop();}else{u=r+f.getDocumentScrollTop();}this.cfg.setProperty("xy",[parseInt(o,10),parseInt(u,10)]);this.cfg.refireEvent("iframe");if(k.webkit){this.forceContainerRedraw();}},syncPosition:function(){var o=f.getXY(this.element);
this.cfg.setProperty("x",o[0],true);this.cfg.setProperty("y",o[1],true);this.cfg.setProperty("xy",o,true);},onDomResize:function(q,p){var o=this;b.superclass.onDomResize.call(this,q,p);setTimeout(function(){o.syncPosition();o.cfg.refireEvent("iframe");o.cfg.refireEvent("context");},0);},_getComputedHeight:(function(){if(document.defaultView&&document.defaultView.getComputedStyle){return function(p){var o=null;if(p.ownerDocument&&p.ownerDocument.defaultView){var q=p.ownerDocument.defaultView.getComputedStyle(p,"");if(q){o=parseInt(q.height,10);}}return(i.isNumber(o))?o:null;};}else{return function(p){var o=null;if(p.style.pixelHeight){o=p.style.pixelHeight;}return(i.isNumber(o))?o:null;};}})(),_validateAutoFillHeight:function(o){return(!o)||(i.isString(o)&&b.STD_MOD_RE.test(o));},_autoFillOnHeightChange:function(r,p,q){var o=this.cfg.getProperty("height");if((o&&o!=="auto")||(o===0)){this.fillHeight(q);}},_getPreciseHeight:function(p){var o=p.offsetHeight;if(p.getBoundingClientRect){var q=p.getBoundingClientRect();o=q.bottom-q.top;}return o;},fillHeight:function(r){if(r){var p=this.innerElement||this.element,o=[this.header,this.body,this.footer],v,w=0,x=0,t=0,q=false;for(var u=0,s=o.length;u<s;u++){v=o[u];if(v){if(r!==v){x+=this._getPreciseHeight(v);}else{q=true;}}}if(q){if(k.ie||k.opera){f.setStyle(r,"height",0+"px");}w=this._getComputedHeight(p);if(w===null){f.addClass(p,"yui-override-padding");w=p.clientHeight;f.removeClass(p,"yui-override-padding");}t=Math.max(w-x,0);f.setStyle(r,"height",t+"px");if(r.offsetHeight!=t){t=Math.max(t-(r.offsetHeight-t),0);}f.setStyle(r,"height",t+"px");}}},bringToTop:function(){var s=[],r=this.element;function v(z,y){var B=f.getStyle(z,"zIndex"),A=f.getStyle(y,"zIndex"),x=(!B||isNaN(B))?0:parseInt(B,10),w=(!A||isNaN(A))?0:parseInt(A,10);if(x>w){return -1;}else{if(x<w){return 1;}else{return 0;}}}function q(y){var x=f.hasClass(y,b.CSS_OVERLAY),w=YAHOO.widget.Panel;if(x&&!f.isAncestor(r,y)){if(w&&f.hasClass(y,w.CSS_PANEL)){s[s.length]=y.parentNode;}else{s[s.length]=y;}}}f.getElementsBy(q,"div",document.body);s.sort(v);var o=s[0],u;if(o){u=f.getStyle(o,"zIndex");if(!isNaN(u)){var t=false;if(o!=r){t=true;}else{if(s.length>1){var p=f.getStyle(s[1],"zIndex");if(!isNaN(p)&&(u==p)){t=true;}}}if(t){this.cfg.setProperty("zindex",(parseInt(u,10)+2));}}}},destroy:function(o){if(this.iframe){this.iframe.parentNode.removeChild(this.iframe);}this.iframe=null;b.windowResizeEvent.unsubscribe(this.doCenterOnDOMEvent,this);b.windowScrollEvent.unsubscribe(this.doCenterOnDOMEvent,this);g.textResizeEvent.unsubscribe(this._autoFillOnHeightChange);if(this._contextTriggers){this._processTriggers(this._contextTriggers,e,this._alignOnTrigger);}b.superclass.destroy.call(this,o);},forceContainerRedraw:function(){var o=this;f.addClass(o.element,"yui-force-redraw");setTimeout(function(){f.removeClass(o.element,"yui-force-redraw");},0);},toString:function(){return"Overlay "+this.id;}});}());(function(){YAHOO.widget.OverlayManager=function(g){this.init(g);};var d=YAHOO.widget.Overlay,c=YAHOO.util.Event,e=YAHOO.util.Dom,b=YAHOO.util.Config,f=YAHOO.util.CustomEvent,a=YAHOO.widget.OverlayManager;a.CSS_FOCUSED="focused";a.prototype={constructor:a,overlays:null,initDefaultConfig:function(){this.cfg.addProperty("overlays",{suppressEvent:true});this.cfg.addProperty("focusevent",{value:"mousedown"});},init:function(i){this.cfg=new b(this);this.initDefaultConfig();if(i){this.cfg.applyConfig(i,true);}this.cfg.fireQueue();var h=null;this.getActive=function(){return h;};this.focus=function(j){var k=this.find(j);if(k){k.focus();}};this.remove=function(k){var m=this.find(k),j;if(m){if(h==m){h=null;}var l=(m.element===null&&m.cfg===null)?true:false;if(!l){j=e.getStyle(m.element,"zIndex");m.cfg.setProperty("zIndex",-1000,true);}this.overlays.sort(this.compareZIndexDesc);this.overlays=this.overlays.slice(0,(this.overlays.length-1));m.hideEvent.unsubscribe(m.blur);m.destroyEvent.unsubscribe(this._onOverlayDestroy,m);m.focusEvent.unsubscribe(this._onOverlayFocusHandler,m);m.blurEvent.unsubscribe(this._onOverlayBlurHandler,m);if(!l){c.removeListener(m.element,this.cfg.getProperty("focusevent"),this._onOverlayElementFocus);m.cfg.setProperty("zIndex",j,true);m.cfg.setProperty("manager",null);}if(m.focusEvent._managed){m.focusEvent=null;}if(m.blurEvent._managed){m.blurEvent=null;}if(m.focus._managed){m.focus=null;}if(m.blur._managed){m.blur=null;}}};this.blurAll=function(){var k=this.overlays.length,j;if(k>0){j=k-1;do{this.overlays[j].blur();}while(j--);}};this._manageBlur=function(j){var k=false;if(h==j){e.removeClass(h.element,a.CSS_FOCUSED);h=null;k=true;}return k;};this._manageFocus=function(j){var k=false;if(h!=j){if(h){h.blur();}h=j;this.bringToTop(h);e.addClass(h.element,a.CSS_FOCUSED);k=true;}return k;};var g=this.cfg.getProperty("overlays");if(!this.overlays){this.overlays=[];}if(g){this.register(g);this.overlays.sort(this.compareZIndexDesc);}},_onOverlayElementFocus:function(i){var g=c.getTarget(i),h=this.close;if(h&&(g==h||e.isAncestor(h,g))){this.blur();}else{this.focus();}},_onOverlayDestroy:function(h,g,i){this.remove(i);},_onOverlayFocusHandler:function(h,g,i){this._manageFocus(i);},_onOverlayBlurHandler:function(h,g,i){this._manageBlur(i);},_bindFocus:function(g){var h=this;if(!g.focusEvent){g.focusEvent=g.createEvent("focus");g.focusEvent.signature=f.LIST;g.focusEvent._managed=true;}else{g.focusEvent.subscribe(h._onOverlayFocusHandler,g,h);}if(!g.focus){c.on(g.element,h.cfg.getProperty("focusevent"),h._onOverlayElementFocus,null,g);g.focus=function(){if(h._manageFocus(this)){if(this.cfg.getProperty("visible")&&this.focusFirst){this.focusFirst();}this.focusEvent.fire();}};g.focus._managed=true;}},_bindBlur:function(g){var h=this;if(!g.blurEvent){g.blurEvent=g.createEvent("blur");g.blurEvent.signature=f.LIST;g.focusEvent._managed=true;}else{g.blurEvent.subscribe(h._onOverlayBlurHandler,g,h);}if(!g.blur){g.blur=function(){if(h._manageBlur(this)){this.blurEvent.fire();}};g.blur._managed=true;}g.hideEvent.subscribe(g.blur);
},_bindDestroy:function(g){var h=this;g.destroyEvent.subscribe(h._onOverlayDestroy,g,h);},_syncZIndex:function(g){var h=e.getStyle(g.element,"zIndex");if(!isNaN(h)){g.cfg.setProperty("zIndex",parseInt(h,10));}else{g.cfg.setProperty("zIndex",0);}},register:function(g){var k=false,h,j;if(g instanceof d){g.cfg.addProperty("manager",{value:this});this._bindFocus(g);this._bindBlur(g);this._bindDestroy(g);this._syncZIndex(g);this.overlays.push(g);this.bringToTop(g);k=true;}else{if(g instanceof Array){for(h=0,j=g.length;h<j;h++){k=this.register(g[h])||k;}}}return k;},bringToTop:function(m){var i=this.find(m),l,g,j;if(i){j=this.overlays;j.sort(this.compareZIndexDesc);g=j[0];if(g){l=e.getStyle(g.element,"zIndex");if(!isNaN(l)){var k=false;if(g!==i){k=true;}else{if(j.length>1){var h=e.getStyle(j[1].element,"zIndex");if(!isNaN(h)&&(l==h)){k=true;}}}if(k){i.cfg.setProperty("zindex",(parseInt(l,10)+2));}}j.sort(this.compareZIndexDesc);}}},find:function(g){var l=g instanceof d,j=this.overlays,p=j.length,k=null,m,h;if(l||typeof g=="string"){for(h=p-1;h>=0;h--){m=j[h];if((l&&(m===g))||(m.id==g)){k=m;break;}}}return k;},compareZIndexDesc:function(j,i){var h=(j.cfg)?j.cfg.getProperty("zIndex"):null,g=(i.cfg)?i.cfg.getProperty("zIndex"):null;if(h===null&&g===null){return 0;}else{if(h===null){return 1;}else{if(g===null){return -1;}else{if(h>g){return -1;}else{if(h<g){return 1;}else{return 0;}}}}}},showAll:function(){var h=this.overlays,j=h.length,g;for(g=j-1;g>=0;g--){h[g].show();}},hideAll:function(){var h=this.overlays,j=h.length,g;for(g=j-1;g>=0;g--){h[g].hide();}},toString:function(){return"OverlayManager";}};}());(function(){YAHOO.widget.Tooltip=function(p,o){YAHOO.widget.Tooltip.superclass.constructor.call(this,p,o);};var e=YAHOO.lang,n=YAHOO.util.Event,m=YAHOO.util.CustomEvent,c=YAHOO.util.Dom,j=YAHOO.widget.Tooltip,h=YAHOO.env.ua,g=(h.ie&&(h.ie<=6||document.compatMode=="BackCompat")),f,i={"PREVENT_OVERLAP":{key:"preventoverlap",value:true,validator:e.isBoolean,supercedes:["x","y","xy"]},"SHOW_DELAY":{key:"showdelay",value:200,validator:e.isNumber},"AUTO_DISMISS_DELAY":{key:"autodismissdelay",value:5000,validator:e.isNumber},"HIDE_DELAY":{key:"hidedelay",value:250,validator:e.isNumber},"TEXT":{key:"text",suppressEvent:true},"CONTAINER":{key:"container"},"DISABLED":{key:"disabled",value:false,suppressEvent:true},"XY_OFFSET":{key:"xyoffset",value:[0,25],suppressEvent:true}},a={"CONTEXT_MOUSE_OVER":"contextMouseOver","CONTEXT_MOUSE_OUT":"contextMouseOut","CONTEXT_TRIGGER":"contextTrigger"};j.CSS_TOOLTIP="yui-tt";function k(q,o){var p=this.cfg,r=p.getProperty("width");if(r==o){p.setProperty("width",q);}}function d(p,o){if("_originalWidth" in this){k.call(this,this._originalWidth,this._forcedWidth);}var q=document.body,u=this.cfg,t=u.getProperty("width"),r,s;if((!t||t=="auto")&&(u.getProperty("container")!=q||u.getProperty("x")>=c.getViewportWidth()||u.getProperty("y")>=c.getViewportHeight())){s=this.element.cloneNode(true);s.style.visibility="hidden";s.style.top="0px";s.style.left="0px";q.appendChild(s);r=(s.offsetWidth+"px");q.removeChild(s);s=null;u.setProperty("width",r);u.refireEvent("xy");this._originalWidth=t||"";this._forcedWidth=r;}}function b(p,o,q){this.render(q);}function l(){n.onDOMReady(b,this.cfg.getProperty("container"),this);}YAHOO.extend(j,YAHOO.widget.Overlay,{init:function(p,o){j.superclass.init.call(this,p);this.beforeInitEvent.fire(j);c.addClass(this.element,j.CSS_TOOLTIP);if(o){this.cfg.applyConfig(o,true);}this.cfg.queueProperty("visible",false);this.cfg.queueProperty("constraintoviewport",true);this.setBody("");this.subscribe("changeContent",d);this.subscribe("init",l);this.subscribe("render",this.onRender);this.initEvent.fire(j);},initEvents:function(){j.superclass.initEvents.call(this);var o=m.LIST;this.contextMouseOverEvent=this.createEvent(a.CONTEXT_MOUSE_OVER);this.contextMouseOverEvent.signature=o;this.contextMouseOutEvent=this.createEvent(a.CONTEXT_MOUSE_OUT);this.contextMouseOutEvent.signature=o;this.contextTriggerEvent=this.createEvent(a.CONTEXT_TRIGGER);this.contextTriggerEvent.signature=o;},initDefaultConfig:function(){j.superclass.initDefaultConfig.call(this);this.cfg.addProperty(i.PREVENT_OVERLAP.key,{value:i.PREVENT_OVERLAP.value,validator:i.PREVENT_OVERLAP.validator,supercedes:i.PREVENT_OVERLAP.supercedes});this.cfg.addProperty(i.SHOW_DELAY.key,{handler:this.configShowDelay,value:200,validator:i.SHOW_DELAY.validator});this.cfg.addProperty(i.AUTO_DISMISS_DELAY.key,{handler:this.configAutoDismissDelay,value:i.AUTO_DISMISS_DELAY.value,validator:i.AUTO_DISMISS_DELAY.validator});this.cfg.addProperty(i.HIDE_DELAY.key,{handler:this.configHideDelay,value:i.HIDE_DELAY.value,validator:i.HIDE_DELAY.validator});this.cfg.addProperty(i.TEXT.key,{handler:this.configText,suppressEvent:i.TEXT.suppressEvent});this.cfg.addProperty(i.CONTAINER.key,{handler:this.configContainer,value:document.body});this.cfg.addProperty(i.DISABLED.key,{handler:this.configContainer,value:i.DISABLED.value,supressEvent:i.DISABLED.suppressEvent});this.cfg.addProperty(i.XY_OFFSET.key,{value:i.XY_OFFSET.value.concat(),supressEvent:i.XY_OFFSET.suppressEvent});},configText:function(p,o,q){var r=o[0];if(r){this.setBody(r);}},configContainer:function(q,p,r){var o=p[0];if(typeof o=="string"){this.cfg.setProperty("container",document.getElementById(o),true);}},_removeEventListeners:function(){var r=this._context,o,q,p;if(r){o=r.length;if(o>0){p=o-1;do{q=r[p];n.removeListener(q,"mouseover",this.onContextMouseOver);n.removeListener(q,"mousemove",this.onContextMouseMove);n.removeListener(q,"mouseout",this.onContextMouseOut);}while(p--);}}},configContext:function(t,p,u){var s=p[0],v,o,r,q;if(s){if(!(s instanceof Array)){if(typeof s=="string"){this.cfg.setProperty("context",[document.getElementById(s)],true);}else{this.cfg.setProperty("context",[s],true);}s=this.cfg.getProperty("context");}this._removeEventListeners();this._context=s;v=this._context;if(v){o=v.length;if(o>0){q=o-1;do{r=v[q];n.on(r,"mouseover",this.onContextMouseOver,this);
n.on(r,"mousemove",this.onContextMouseMove,this);n.on(r,"mouseout",this.onContextMouseOut,this);}while(q--);}}}},onContextMouseMove:function(p,o){o.pageX=n.getPageX(p);o.pageY=n.getPageY(p);},onContextMouseOver:function(q,p){var o=this;if(o.title){p._tempTitle=o.title;o.title="";}if(p.fireEvent("contextMouseOver",o,q)!==false&&!p.cfg.getProperty("disabled")){if(p.hideProcId){clearTimeout(p.hideProcId);p.hideProcId=null;}n.on(o,"mousemove",p.onContextMouseMove,p);p.showProcId=p.doShow(q,o);}},onContextMouseOut:function(q,p){var o=this;if(p._tempTitle){o.title=p._tempTitle;p._tempTitle=null;}if(p.showProcId){clearTimeout(p.showProcId);p.showProcId=null;}if(p.hideProcId){clearTimeout(p.hideProcId);p.hideProcId=null;}p.fireEvent("contextMouseOut",o,q);p.hideProcId=setTimeout(function(){p.hide();},p.cfg.getProperty("hidedelay"));},doShow:function(r,o){var t=this.cfg.getProperty("xyoffset"),p=t[0],s=t[1],q=this;if(h.opera&&o.tagName&&o.tagName.toUpperCase()=="A"){s+=12;}return setTimeout(function(){var u=q.cfg.getProperty("text");if(q._tempTitle&&(u===""||YAHOO.lang.isUndefined(u)||YAHOO.lang.isNull(u))){q.setBody(q._tempTitle);}else{q.cfg.refireEvent("text");}q.moveTo(q.pageX+p,q.pageY+s);if(q.cfg.getProperty("preventoverlap")){q.preventOverlap(q.pageX,q.pageY);}n.removeListener(o,"mousemove",q.onContextMouseMove);q.contextTriggerEvent.fire(o);q.show();q.hideProcId=q.doHide();},this.cfg.getProperty("showdelay"));},doHide:function(){var o=this;return setTimeout(function(){o.hide();},this.cfg.getProperty("autodismissdelay"));},preventOverlap:function(s,r){var o=this.element.offsetHeight,q=new YAHOO.util.Point(s,r),p=c.getRegion(this.element);p.top-=5;p.left-=5;p.right+=5;p.bottom+=5;if(p.contains(q)){this.cfg.setProperty("y",(r-o-5));}},onRender:function(s,r){function t(){var w=this.element,v=this.underlay;if(v){v.style.width=(w.offsetWidth+6)+"px";v.style.height=(w.offsetHeight+1)+"px";}}function p(){c.addClass(this.underlay,"yui-tt-shadow-visible");if(h.ie){this.forceUnderlayRedraw();}}function o(){c.removeClass(this.underlay,"yui-tt-shadow-visible");}function u(){var x=this.underlay,w,v,z,y;if(!x){w=this.element;v=YAHOO.widget.Module;z=h.ie;y=this;if(!f){f=document.createElement("div");f.className="yui-tt-shadow";}x=f.cloneNode(false);w.appendChild(x);this.underlay=x;this._shadow=this.underlay;p.call(this);this.subscribe("beforeShow",p);this.subscribe("hide",o);if(g){window.setTimeout(function(){t.call(y);},0);this.cfg.subscribeToConfigEvent("width",t);this.cfg.subscribeToConfigEvent("height",t);this.subscribe("changeContent",t);v.textResizeEvent.subscribe(t,this,true);this.subscribe("destroy",function(){v.textResizeEvent.unsubscribe(t,this);});}}}function q(){u.call(this);this.unsubscribe("beforeShow",q);}if(this.cfg.getProperty("visible")){u.call(this);}else{this.subscribe("beforeShow",q);}},forceUnderlayRedraw:function(){var o=this;c.addClass(o.underlay,"yui-force-redraw");setTimeout(function(){c.removeClass(o.underlay,"yui-force-redraw");},0);},destroy:function(){this._removeEventListeners();j.superclass.destroy.call(this);},toString:function(){return"Tooltip "+this.id;}});}());(function(){YAHOO.widget.Panel=function(v,u){YAHOO.widget.Panel.superclass.constructor.call(this,v,u);};var s=null;var e=YAHOO.lang,f=YAHOO.util,a=f.Dom,t=f.Event,m=f.CustomEvent,k=YAHOO.util.KeyListener,i=f.Config,h=YAHOO.widget.Overlay,o=YAHOO.widget.Panel,l=YAHOO.env.ua,p=(l.ie&&(l.ie<=6||document.compatMode=="BackCompat")),g,q,c,d={"BEFORE_SHOW_MASK":"beforeShowMask","BEFORE_HIDE_MASK":"beforeHideMask","SHOW_MASK":"showMask","HIDE_MASK":"hideMask","DRAG":"drag"},n={"CLOSE":{key:"close",value:true,validator:e.isBoolean,supercedes:["visible"]},"DRAGGABLE":{key:"draggable",value:(f.DD?true:false),validator:e.isBoolean,supercedes:["visible"]},"DRAG_ONLY":{key:"dragonly",value:false,validator:e.isBoolean,supercedes:["draggable"]},"UNDERLAY":{key:"underlay",value:"shadow",supercedes:["visible"]},"MODAL":{key:"modal",value:false,validator:e.isBoolean,supercedes:["visible","zindex"]},"KEY_LISTENERS":{key:"keylisteners",suppressEvent:true,supercedes:["visible"]},"STRINGS":{key:"strings",supercedes:["close"],validator:e.isObject,value:{close:"Close"}}};o.CSS_PANEL="yui-panel";o.CSS_PANEL_CONTAINER="yui-panel-container";o.FOCUSABLE=["a","button","select","textarea","input","iframe"];function j(v,u){if(!this.header&&this.cfg.getProperty("draggable")){this.setHeader("&#160;");}}function r(v,u,w){var z=w[0],x=w[1],y=this.cfg,A=y.getProperty("width");if(A==x){y.setProperty("width",z);}this.unsubscribe("hide",r,w);}function b(v,u){var y,x,w;if(p){y=this.cfg;x=y.getProperty("width");if(!x||x=="auto"){w=(this.element.offsetWidth+"px");y.setProperty("width",w);this.subscribe("hide",r,[(x||""),w]);}}}YAHOO.extend(o,h,{init:function(v,u){o.superclass.init.call(this,v);this.beforeInitEvent.fire(o);a.addClass(this.element,o.CSS_PANEL);this.buildWrapper();if(u){this.cfg.applyConfig(u,true);}this.subscribe("showMask",this._addFocusHandlers);this.subscribe("hideMask",this._removeFocusHandlers);this.subscribe("beforeRender",j);this.subscribe("render",function(){this.setFirstLastFocusable();this.subscribe("changeContent",this.setFirstLastFocusable);});this.subscribe("show",this._focusOnShow);this.initEvent.fire(o);},_onElementFocus:function(z){if(s===this){var y=t.getTarget(z),x=document.documentElement,v=(y!==x&&y!==window);if(v&&y!==this.element&&y!==this.mask&&!a.isAncestor(this.element,y)){try{this._focusFirstModal();}catch(w){try{if(v&&y!==document.body){y.blur();}}catch(u){}}}}},_focusFirstModal:function(){var u=this.firstElement;if(u){u.focus();}else{if(this._modalFocus){this._modalFocus.focus();}else{this.innerElement.focus();}}},_addFocusHandlers:function(v,u){if(!this.firstElement){if(l.webkit||l.opera){if(!this._modalFocus){this._createHiddenFocusElement();}}else{this.innerElement.tabIndex=0;}}this._setTabLoop(this.firstElement,this.lastElement);t.onFocus(document.documentElement,this._onElementFocus,this,true);s=this;},_createHiddenFocusElement:function(){var u=document.createElement("button");
u.style.height="1px";u.style.width="1px";u.style.position="absolute";u.style.left="-10000em";u.style.opacity=0;u.tabIndex=-1;this.innerElement.appendChild(u);this._modalFocus=u;},_removeFocusHandlers:function(v,u){t.removeFocusListener(document.documentElement,this._onElementFocus,this);if(s==this){s=null;}},_focusOnShow:function(v,u,w){if(u&&u[1]){t.stopEvent(u[1]);}if(!this.focusFirst(v,u,w)){if(this.cfg.getProperty("modal")){this._focusFirstModal();}}},focusFirst:function(w,u,z){var v=this.firstElement,y=false;if(u&&u[1]){t.stopEvent(u[1]);}if(v){try{v.focus();y=true;}catch(x){}}return y;},focusLast:function(w,u,z){var v=this.lastElement,y=false;if(u&&u[1]){t.stopEvent(u[1]);}if(v){try{v.focus();y=true;}catch(x){}}return y;},_setTabLoop:function(u,v){this.setTabLoop(u,v);},setTabLoop:function(x,z){var v=this.preventBackTab,w=this.preventTabOut,u=this.showEvent,y=this.hideEvent;if(v){v.disable();u.unsubscribe(v.enable,v);y.unsubscribe(v.disable,v);v=this.preventBackTab=null;}if(w){w.disable();u.unsubscribe(w.enable,w);y.unsubscribe(w.disable,w);w=this.preventTabOut=null;}if(x){this.preventBackTab=new k(x,{shift:true,keys:9},{fn:this.focusLast,scope:this,correctScope:true});v=this.preventBackTab;u.subscribe(v.enable,v,true);y.subscribe(v.disable,v,true);}if(z){this.preventTabOut=new k(z,{shift:false,keys:9},{fn:this.focusFirst,scope:this,correctScope:true});w=this.preventTabOut;u.subscribe(w.enable,w,true);y.subscribe(w.disable,w,true);}},getFocusableElements:function(v){v=v||this.innerElement;var x={},u=this;for(var w=0;w<o.FOCUSABLE.length;w++){x[o.FOCUSABLE[w]]=true;}return a.getElementsBy(function(y){return u._testIfFocusable(y,x);},null,v);},_testIfFocusable:function(u,v){if(u.focus&&u.type!=="hidden"&&!u.disabled&&v[u.tagName.toLowerCase()]){return true;}return false;},setFirstLastFocusable:function(){this.firstElement=null;this.lastElement=null;var u=this.getFocusableElements();this.focusableElements=u;if(u.length>0){this.firstElement=u[0];this.lastElement=u[u.length-1];}if(this.cfg.getProperty("modal")){this._setTabLoop(this.firstElement,this.lastElement);}},initEvents:function(){o.superclass.initEvents.call(this);var u=m.LIST;this.showMaskEvent=this.createEvent(d.SHOW_MASK);this.showMaskEvent.signature=u;this.beforeShowMaskEvent=this.createEvent(d.BEFORE_SHOW_MASK);this.beforeShowMaskEvent.signature=u;this.hideMaskEvent=this.createEvent(d.HIDE_MASK);this.hideMaskEvent.signature=u;this.beforeHideMaskEvent=this.createEvent(d.BEFORE_HIDE_MASK);this.beforeHideMaskEvent.signature=u;this.dragEvent=this.createEvent(d.DRAG);this.dragEvent.signature=u;},initDefaultConfig:function(){o.superclass.initDefaultConfig.call(this);this.cfg.addProperty(n.CLOSE.key,{handler:this.configClose,value:n.CLOSE.value,validator:n.CLOSE.validator,supercedes:n.CLOSE.supercedes});this.cfg.addProperty(n.DRAGGABLE.key,{handler:this.configDraggable,value:(f.DD)?true:false,validator:n.DRAGGABLE.validator,supercedes:n.DRAGGABLE.supercedes});this.cfg.addProperty(n.DRAG_ONLY.key,{value:n.DRAG_ONLY.value,validator:n.DRAG_ONLY.validator,supercedes:n.DRAG_ONLY.supercedes});this.cfg.addProperty(n.UNDERLAY.key,{handler:this.configUnderlay,value:n.UNDERLAY.value,supercedes:n.UNDERLAY.supercedes});this.cfg.addProperty(n.MODAL.key,{handler:this.configModal,value:n.MODAL.value,validator:n.MODAL.validator,supercedes:n.MODAL.supercedes});this.cfg.addProperty(n.KEY_LISTENERS.key,{handler:this.configKeyListeners,suppressEvent:n.KEY_LISTENERS.suppressEvent,supercedes:n.KEY_LISTENERS.supercedes});this.cfg.addProperty(n.STRINGS.key,{value:n.STRINGS.value,handler:this.configStrings,validator:n.STRINGS.validator,supercedes:n.STRINGS.supercedes});},configClose:function(y,v,z){var A=v[0],x=this.close,u=this.cfg.getProperty("strings"),w;if(A){if(!x){if(!c){c=document.createElement("a");c.className="container-close";c.href="#";}x=c.cloneNode(true);w=this.innerElement.firstChild;if(w){this.innerElement.insertBefore(x,w);}else{this.innerElement.appendChild(x);}x.innerHTML=(u&&u.close)?u.close:"&#160;";t.on(x,"click",this._doClose,this,true);this.close=x;}else{x.style.display="block";}}else{if(x){x.style.display="none";}}},_doClose:function(u){t.preventDefault(u);this.hide();},configDraggable:function(v,u,w){var x=u[0];if(x){if(!f.DD){this.cfg.setProperty("draggable",false);return;}if(this.header){a.setStyle(this.header,"cursor","move");this.registerDragDrop();}this.subscribe("beforeShow",b);}else{if(this.dd){this.dd.unreg();}if(this.header){a.setStyle(this.header,"cursor","auto");}this.unsubscribe("beforeShow",b);}},configUnderlay:function(D,C,z){var B=(this.platform=="mac"&&l.gecko),E=C[0].toLowerCase(),v=this.underlay,w=this.element;function x(){var F=false;if(!v){if(!q){q=document.createElement("div");q.className="underlay";}v=q.cloneNode(false);this.element.appendChild(v);this.underlay=v;if(p){this.sizeUnderlay();this.cfg.subscribeToConfigEvent("width",this.sizeUnderlay);this.cfg.subscribeToConfigEvent("height",this.sizeUnderlay);this.changeContentEvent.subscribe(this.sizeUnderlay);YAHOO.widget.Module.textResizeEvent.subscribe(this.sizeUnderlay,this,true);}if(l.webkit&&l.webkit<420){this.changeContentEvent.subscribe(this.forceUnderlayRedraw);}F=true;}}function A(){var F=x.call(this);if(!F&&p){this.sizeUnderlay();}this._underlayDeferred=false;this.beforeShowEvent.unsubscribe(A);}function y(){if(this._underlayDeferred){this.beforeShowEvent.unsubscribe(A);this._underlayDeferred=false;}if(v){this.cfg.unsubscribeFromConfigEvent("width",this.sizeUnderlay);this.cfg.unsubscribeFromConfigEvent("height",this.sizeUnderlay);this.changeContentEvent.unsubscribe(this.sizeUnderlay);this.changeContentEvent.unsubscribe(this.forceUnderlayRedraw);YAHOO.widget.Module.textResizeEvent.unsubscribe(this.sizeUnderlay,this,true);this.element.removeChild(v);this.underlay=null;}}switch(E){case"shadow":a.removeClass(w,"matte");a.addClass(w,"shadow");break;case"matte":if(!B){y.call(this);}a.removeClass(w,"shadow");a.addClass(w,"matte");break;default:if(!B){y.call(this);
}a.removeClass(w,"shadow");a.removeClass(w,"matte");break;}if((E=="shadow")||(B&&!v)){if(this.cfg.getProperty("visible")){var u=x.call(this);if(!u&&p){this.sizeUnderlay();}}else{if(!this._underlayDeferred){this.beforeShowEvent.subscribe(A);this._underlayDeferred=true;}}}},configModal:function(v,u,x){var w=u[0];if(w){if(!this._hasModalityEventListeners){this.subscribe("beforeShow",this.buildMask);this.subscribe("beforeShow",this.bringToTop);this.subscribe("beforeShow",this.showMask);this.subscribe("hide",this.hideMask);h.windowResizeEvent.subscribe(this.sizeMask,this,true);this._hasModalityEventListeners=true;}}else{if(this._hasModalityEventListeners){if(this.cfg.getProperty("visible")){this.hideMask();this.removeMask();}this.unsubscribe("beforeShow",this.buildMask);this.unsubscribe("beforeShow",this.bringToTop);this.unsubscribe("beforeShow",this.showMask);this.unsubscribe("hide",this.hideMask);h.windowResizeEvent.unsubscribe(this.sizeMask,this);this._hasModalityEventListeners=false;}}},removeMask:function(){var v=this.mask,u;if(v){this.hideMask();u=v.parentNode;if(u){u.removeChild(v);}this.mask=null;}},configKeyListeners:function(x,u,A){var w=u[0],z,y,v;if(w){if(w instanceof Array){y=w.length;for(v=0;v<y;v++){z=w[v];if(!i.alreadySubscribed(this.showEvent,z.enable,z)){this.showEvent.subscribe(z.enable,z,true);}if(!i.alreadySubscribed(this.hideEvent,z.disable,z)){this.hideEvent.subscribe(z.disable,z,true);this.destroyEvent.subscribe(z.disable,z,true);}}}else{if(!i.alreadySubscribed(this.showEvent,w.enable,w)){this.showEvent.subscribe(w.enable,w,true);}if(!i.alreadySubscribed(this.hideEvent,w.disable,w)){this.hideEvent.subscribe(w.disable,w,true);this.destroyEvent.subscribe(w.disable,w,true);}}}},configStrings:function(v,u,w){var x=e.merge(n.STRINGS.value,u[0]);this.cfg.setProperty(n.STRINGS.key,x,true);},configHeight:function(x,v,y){var u=v[0],w=this.innerElement;a.setStyle(w,"height",u);this.cfg.refireEvent("iframe");},_autoFillOnHeightChange:function(x,v,w){o.superclass._autoFillOnHeightChange.apply(this,arguments);if(p){var u=this;setTimeout(function(){u.sizeUnderlay();},0);}},configWidth:function(x,u,y){var w=u[0],v=this.innerElement;a.setStyle(v,"width",w);this.cfg.refireEvent("iframe");},configzIndex:function(v,u,x){o.superclass.configzIndex.call(this,v,u,x);if(this.mask||this.cfg.getProperty("modal")===true){var w=a.getStyle(this.element,"zIndex");if(!w||isNaN(w)){w=0;}if(w===0){this.cfg.setProperty("zIndex",1);}else{this.stackMask();}}},buildWrapper:function(){var w=this.element.parentNode,u=this.element,v=document.createElement("div");v.className=o.CSS_PANEL_CONTAINER;v.id=u.id+"_c";if(w){w.insertBefore(v,u);}v.appendChild(u);this.element=v;this.innerElement=u;a.setStyle(this.innerElement,"visibility","inherit");},sizeUnderlay:function(){var v=this.underlay,u;if(v){u=this.element;v.style.width=u.offsetWidth+"px";v.style.height=u.offsetHeight+"px";}},registerDragDrop:function(){var v=this;if(this.header){if(!f.DD){return;}var u=(this.cfg.getProperty("dragonly")===true);this.dd=new f.DD(this.element.id,this.id,{dragOnly:u});if(!this.header.id){this.header.id=this.id+"_h";}this.dd.startDrag=function(){var x,z,w,C,B,A;if(YAHOO.env.ua.ie==6){a.addClass(v.element,"drag");}if(v.cfg.getProperty("constraintoviewport")){var y=h.VIEWPORT_OFFSET;x=v.element.offsetHeight;z=v.element.offsetWidth;w=a.getViewportWidth();C=a.getViewportHeight();B=a.getDocumentScrollLeft();A=a.getDocumentScrollTop();if(x+y<C){this.minY=A+y;this.maxY=A+C-x-y;}else{this.minY=A+y;this.maxY=A+y;}if(z+y<w){this.minX=B+y;this.maxX=B+w-z-y;}else{this.minX=B+y;this.maxX=B+y;}this.constrainX=true;this.constrainY=true;}else{this.constrainX=false;this.constrainY=false;}v.dragEvent.fire("startDrag",arguments);};this.dd.onDrag=function(){v.syncPosition();v.cfg.refireEvent("iframe");if(this.platform=="mac"&&YAHOO.env.ua.gecko){this.showMacGeckoScrollbars();}v.dragEvent.fire("onDrag",arguments);};this.dd.endDrag=function(){if(YAHOO.env.ua.ie==6){a.removeClass(v.element,"drag");}v.dragEvent.fire("endDrag",arguments);v.moveEvent.fire(v.cfg.getProperty("xy"));};this.dd.setHandleElId(this.header.id);this.dd.addInvalidHandleType("INPUT");this.dd.addInvalidHandleType("SELECT");this.dd.addInvalidHandleType("TEXTAREA");}},buildMask:function(){var u=this.mask;if(!u){if(!g){g=document.createElement("div");g.className="mask";g.innerHTML="&#160;";}u=g.cloneNode(true);u.id=this.id+"_mask";document.body.insertBefore(u,document.body.firstChild);this.mask=u;if(YAHOO.env.ua.gecko&&this.platform=="mac"){a.addClass(this.mask,"block-scrollbars");}this.stackMask();}},hideMask:function(){if(this.cfg.getProperty("modal")&&this.mask&&this.beforeHideMaskEvent.fire()){this.mask.style.display="none";a.removeClass(document.body,"masked");this.hideMaskEvent.fire();}},showMask:function(){if(this.cfg.getProperty("modal")&&this.mask&&this.beforeShowMaskEvent.fire()){a.addClass(document.body,"masked");this.sizeMask();this.mask.style.display="block";this.showMaskEvent.fire();}},sizeMask:function(){if(this.mask){var v=this.mask,w=a.getViewportWidth(),u=a.getViewportHeight();if(v.offsetHeight>u){v.style.height=u+"px";}if(v.offsetWidth>w){v.style.width=w+"px";}v.style.height=a.getDocumentHeight()+"px";v.style.width=a.getDocumentWidth()+"px";}},stackMask:function(){if(this.mask){var u=a.getStyle(this.element,"zIndex");if(!YAHOO.lang.isUndefined(u)&&!isNaN(u)){a.setStyle(this.mask,"zIndex",u-1);}}},render:function(u){return o.superclass.render.call(this,u,this.innerElement);},_renderHeader:function(u){u=u||this.innerElement;o.superclass._renderHeader.call(this,u);},_renderBody:function(u){u=u||this.innerElement;o.superclass._renderBody.call(this,u);},_renderFooter:function(u){u=u||this.innerElement;o.superclass._renderFooter.call(this,u);},destroy:function(u){h.windowResizeEvent.unsubscribe(this.sizeMask,this);this.removeMask();if(this.close){t.purgeElement(this.close);}o.superclass.destroy.call(this,u);},forceUnderlayRedraw:function(){var v=this.underlay;a.addClass(v,"yui-force-redraw");
setTimeout(function(){a.removeClass(v,"yui-force-redraw");},0);},toString:function(){return"Panel "+this.id;}});}());(function(){YAHOO.widget.Dialog=function(j,i){YAHOO.widget.Dialog.superclass.constructor.call(this,j,i);};var b=YAHOO.util.Event,g=YAHOO.util.CustomEvent,e=YAHOO.util.Dom,a=YAHOO.widget.Dialog,f=YAHOO.lang,h={"BEFORE_SUBMIT":"beforeSubmit","SUBMIT":"submit","MANUAL_SUBMIT":"manualSubmit","ASYNC_SUBMIT":"asyncSubmit","FORM_SUBMIT":"formSubmit","CANCEL":"cancel"},c={"POST_METHOD":{key:"postmethod",value:"async"},"POST_DATA":{key:"postdata",value:null},"BUTTONS":{key:"buttons",value:"none",supercedes:["visible"]},"HIDEAFTERSUBMIT":{key:"hideaftersubmit",value:true}};a.CSS_DIALOG="yui-dialog";function d(){var m=this._aButtons,k,l,j;if(f.isArray(m)){k=m.length;if(k>0){j=k-1;do{l=m[j];if(YAHOO.widget.Button&&l instanceof YAHOO.widget.Button){l.destroy();}else{if(l.tagName.toUpperCase()=="BUTTON"){b.purgeElement(l);b.purgeElement(l,false);}}}while(j--);}}}YAHOO.extend(a,YAHOO.widget.Panel,{form:null,initDefaultConfig:function(){a.superclass.initDefaultConfig.call(this);this.callback={success:null,failure:null,argument:null};this.cfg.addProperty(c.POST_METHOD.key,{handler:this.configPostMethod,value:c.POST_METHOD.value,validator:function(i){if(i!="form"&&i!="async"&&i!="none"&&i!="manual"){return false;}else{return true;}}});this.cfg.addProperty(c.POST_DATA.key,{value:c.POST_DATA.value});this.cfg.addProperty(c.HIDEAFTERSUBMIT.key,{value:c.HIDEAFTERSUBMIT.value});this.cfg.addProperty(c.BUTTONS.key,{handler:this.configButtons,value:c.BUTTONS.value,supercedes:c.BUTTONS.supercedes});},initEvents:function(){a.superclass.initEvents.call(this);var i=g.LIST;this.beforeSubmitEvent=this.createEvent(h.BEFORE_SUBMIT);this.beforeSubmitEvent.signature=i;this.submitEvent=this.createEvent(h.SUBMIT);this.submitEvent.signature=i;this.manualSubmitEvent=this.createEvent(h.MANUAL_SUBMIT);this.manualSubmitEvent.signature=i;this.asyncSubmitEvent=this.createEvent(h.ASYNC_SUBMIT);this.asyncSubmitEvent.signature=i;this.formSubmitEvent=this.createEvent(h.FORM_SUBMIT);this.formSubmitEvent.signature=i;this.cancelEvent=this.createEvent(h.CANCEL);this.cancelEvent.signature=i;},init:function(j,i){a.superclass.init.call(this,j);this.beforeInitEvent.fire(a);e.addClass(this.element,a.CSS_DIALOG);this.cfg.setProperty("visible",false);if(i){this.cfg.applyConfig(i,true);}this.beforeHideEvent.subscribe(this.blurButtons,this,true);this.subscribe("changeBody",this.registerForm);this.initEvent.fire(a);},doSubmit:function(){var q=YAHOO.util.Connect,r=this.form,l=false,o=false,s,n,m,j;switch(this.cfg.getProperty("postmethod")){case"async":s=r.elements;n=s.length;if(n>0){m=n-1;do{if(s[m].type=="file"){l=true;break;}}while(m--);}if(l&&YAHOO.env.ua.ie&&this.isSecure){o=true;}j=this._getFormAttributes(r);q.setForm(r,l,o);var k=this.cfg.getProperty("postdata");var p=q.asyncRequest(j.method,j.action,this.callback,k);this.asyncSubmitEvent.fire(p);break;case"form":r.submit();this.formSubmitEvent.fire();break;case"none":case"manual":this.manualSubmitEvent.fire();break;}},_getFormAttributes:function(k){var i={method:null,action:null};if(k){if(k.getAttributeNode){var j=k.getAttributeNode("action");var l=k.getAttributeNode("method");if(j){i.action=j.value;}if(l){i.method=l.value;}}else{i.action=k.getAttribute("action");i.method=k.getAttribute("method");}}i.method=(f.isString(i.method)?i.method:"POST").toUpperCase();i.action=f.isString(i.action)?i.action:"";return i;},registerForm:function(){var i=this.element.getElementsByTagName("form")[0];if(this.form){if(this.form==i&&e.isAncestor(this.element,this.form)){return;}else{b.purgeElement(this.form);this.form=null;}}if(!i){i=document.createElement("form");i.name="frm_"+this.id;this.body.appendChild(i);}if(i){this.form=i;b.on(i,"submit",this._submitHandler,this,true);}},_submitHandler:function(i){b.stopEvent(i);this.submit();this.form.blur();},setTabLoop:function(i,j){i=i||this.firstButton;j=j||this.lastButton;a.superclass.setTabLoop.call(this,i,j);},_setTabLoop:function(i,j){i=i||this.firstButton;j=this.lastButton||j;this.setTabLoop(i,j);},setFirstLastFocusable:function(){a.superclass.setFirstLastFocusable.call(this);var k,j,m,n=this.focusableElements;this.firstFormElement=null;this.lastFormElement=null;if(this.form&&n&&n.length>0){j=n.length;for(k=0;k<j;++k){m=n[k];if(this.form===m.form){this.firstFormElement=m;break;}}for(k=j-1;k>=0;--k){m=n[k];if(this.form===m.form){this.lastFormElement=m;break;}}}},configClose:function(j,i,k){a.superclass.configClose.apply(this,arguments);},_doClose:function(i){b.preventDefault(i);this.cancel();},configButtons:function(t,s,n){var o=YAHOO.widget.Button,v=s[0],l=this.innerElement,u,q,k,r,p,j,m;d.call(this);this._aButtons=null;if(f.isArray(v)){p=document.createElement("span");p.className="button-group";r=v.length;this._aButtons=[];this.defaultHtmlButton=null;for(m=0;m<r;m++){u=v[m];if(o){k=new o({label:u.text,type:u.type});k.appendTo(p);q=k.get("element");if(u.isDefault){k.addClass("default");this.defaultHtmlButton=q;}if(f.isFunction(u.handler)){k.set("onclick",{fn:u.handler,obj:this,scope:this});}else{if(f.isObject(u.handler)&&f.isFunction(u.handler.fn)){k.set("onclick",{fn:u.handler.fn,obj:((!f.isUndefined(u.handler.obj))?u.handler.obj:this),scope:(u.handler.scope||this)});}}this._aButtons[this._aButtons.length]=k;}else{q=document.createElement("button");q.setAttribute("type","button");if(u.isDefault){q.className="default";this.defaultHtmlButton=q;}q.innerHTML=u.text;if(f.isFunction(u.handler)){b.on(q,"click",u.handler,this,true);}else{if(f.isObject(u.handler)&&f.isFunction(u.handler.fn)){b.on(q,"click",u.handler.fn,((!f.isUndefined(u.handler.obj))?u.handler.obj:this),(u.handler.scope||this));}}p.appendChild(q);this._aButtons[this._aButtons.length]=q;}u.htmlButton=q;if(m===0){this.firstButton=q;}if(m==(r-1)){this.lastButton=q;}}this.setFooter(p);j=this.footer;if(e.inDocument(this.element)&&!e.isAncestor(l,j)){l.appendChild(j);}this.buttonSpan=p;}else{p=this.buttonSpan;
j=this.footer;if(p&&j){j.removeChild(p);this.buttonSpan=null;this.firstButton=null;this.lastButton=null;this.defaultHtmlButton=null;}}this.changeContentEvent.fire();},getButtons:function(){return this._aButtons||null;},focusFirst:function(k,i,n){var j=this.firstFormElement,m=false;if(i&&i[1]){b.stopEvent(i[1]);if(i[0]===9&&this.firstElement){j=this.firstElement;}}if(j){try{j.focus();m=true;}catch(l){}}else{if(this.defaultHtmlButton){m=this.focusDefaultButton();}else{m=this.focusFirstButton();}}return m;},focusLast:function(k,i,n){var o=this.cfg.getProperty("buttons"),j=this.lastFormElement,m=false;if(i&&i[1]){b.stopEvent(i[1]);if(i[0]===9&&this.lastElement){j=this.lastElement;}}if(o&&f.isArray(o)){m=this.focusLastButton();}else{if(j){try{j.focus();m=true;}catch(l){}}}return m;},_getButton:function(j){var i=YAHOO.widget.Button;if(i&&j&&j.nodeName&&j.id){j=i.getButton(j.id)||j;}return j;},focusDefaultButton:function(){var i=this._getButton(this.defaultHtmlButton),k=false;if(i){try{i.focus();k=true;}catch(j){}}return k;},blurButtons:function(){var o=this.cfg.getProperty("buttons"),l,n,k,j;if(o&&f.isArray(o)){l=o.length;if(l>0){j=(l-1);do{n=o[j];if(n){k=this._getButton(n.htmlButton);if(k){try{k.blur();}catch(m){}}}}while(j--);}}},focusFirstButton:function(){var m=this.cfg.getProperty("buttons"),k,i,l=false;if(m&&f.isArray(m)){k=m[0];if(k){i=this._getButton(k.htmlButton);if(i){try{i.focus();l=true;}catch(j){}}}}return l;},focusLastButton:function(){var n=this.cfg.getProperty("buttons"),j,l,i,m=false;if(n&&f.isArray(n)){j=n.length;if(j>0){l=n[(j-1)];if(l){i=this._getButton(l.htmlButton);if(i){try{i.focus();m=true;}catch(k){}}}}}return m;},configPostMethod:function(j,i,k){this.registerForm();},validate:function(){return true;},submit:function(){if(this.validate()){if(this.beforeSubmitEvent.fire()){this.doSubmit();this.submitEvent.fire();if(this.cfg.getProperty("hideaftersubmit")){this.hide();}return true;}else{return false;}}else{return false;}},cancel:function(){this.cancelEvent.fire();this.hide();},getData:function(){var A=this.form,k,t,w,m,u,r,q,j,x,l,y,B,p,C,o,z,v;function s(n){var i=n.tagName.toUpperCase();return((i=="INPUT"||i=="TEXTAREA"||i=="SELECT")&&n.name==m);}if(A){k=A.elements;t=k.length;w={};for(z=0;z<t;z++){m=k[z].name;u=e.getElementsBy(s,"*",A);r=u.length;if(r>0){if(r==1){u=u[0];q=u.type;j=u.tagName.toUpperCase();switch(j){case"INPUT":if(q=="checkbox"){w[m]=u.checked;}else{if(q!="radio"){w[m]=u.value;}}break;case"TEXTAREA":w[m]=u.value;break;case"SELECT":x=u.options;l=x.length;y=[];for(v=0;v<l;v++){B=x[v];if(B.selected){o=B.attributes.value;y[y.length]=(o&&o.specified)?B.value:B.text;}}w[m]=y;break;}}else{q=u[0].type;switch(q){case"radio":for(v=0;v<r;v++){p=u[v];if(p.checked){w[m]=p.value;break;}}break;case"checkbox":y=[];for(v=0;v<r;v++){C=u[v];if(C.checked){y[y.length]=C.value;}}w[m]=y;break;}}}}}return w;},destroy:function(i){d.call(this);this._aButtons=null;var j=this.element.getElementsByTagName("form"),k;if(j.length>0){k=j[0];if(k){b.purgeElement(k);if(k.parentNode){k.parentNode.removeChild(k);}this.form=null;}}a.superclass.destroy.call(this,i);},toString:function(){return"Dialog "+this.id;}});}());(function(){YAHOO.widget.SimpleDialog=function(e,d){YAHOO.widget.SimpleDialog.superclass.constructor.call(this,e,d);};var c=YAHOO.util.Dom,b=YAHOO.widget.SimpleDialog,a={"ICON":{key:"icon",value:"none",suppressEvent:true},"TEXT":{key:"text",value:"",suppressEvent:true,supercedes:["icon"]}};b.ICON_BLOCK="blckicon";b.ICON_ALARM="alrticon";b.ICON_HELP="hlpicon";b.ICON_INFO="infoicon";b.ICON_WARN="warnicon";b.ICON_TIP="tipicon";b.ICON_CSS_CLASSNAME="yui-icon";b.CSS_SIMPLEDIALOG="yui-simple-dialog";YAHOO.extend(b,YAHOO.widget.Dialog,{initDefaultConfig:function(){b.superclass.initDefaultConfig.call(this);this.cfg.addProperty(a.ICON.key,{handler:this.configIcon,value:a.ICON.value,suppressEvent:a.ICON.suppressEvent});this.cfg.addProperty(a.TEXT.key,{handler:this.configText,value:a.TEXT.value,suppressEvent:a.TEXT.suppressEvent,supercedes:a.TEXT.supercedes});},init:function(e,d){b.superclass.init.call(this,e);this.beforeInitEvent.fire(b);c.addClass(this.element,b.CSS_SIMPLEDIALOG);this.cfg.queueProperty("postmethod","manual");if(d){this.cfg.applyConfig(d,true);}this.beforeRenderEvent.subscribe(function(){if(!this.body){this.setBody("");}},this,true);this.initEvent.fire(b);},registerForm:function(){b.superclass.registerForm.call(this);var e=this.form.ownerDocument,d=e.createElement("input");d.type="hidden";d.name=this.id;d.value="";this.form.appendChild(d);},configIcon:function(k,j,h){var d=j[0],e=this.body,f=b.ICON_CSS_CLASSNAME,l,i,g;if(d&&d!="none"){l=c.getElementsByClassName(f,"*",e);if(l.length===1){i=l[0];g=i.parentNode;if(g){g.removeChild(i);i=null;}}if(d.indexOf(".")==-1){i=document.createElement("span");i.className=(f+" "+d);i.innerHTML="&#160;";}else{i=document.createElement("img");i.src=(this.imageRoot+d);i.className=f;}if(i){e.insertBefore(i,e.firstChild);}}},configText:function(e,d,f){var g=d[0];if(g){this.setBody(g);this.cfg.refireEvent("icon");}},toString:function(){return"SimpleDialog "+this.id;}});}());(function(){YAHOO.widget.ContainerEffect=function(e,h,g,d,f){if(!f){f=YAHOO.util.Anim;}this.overlay=e;this.attrIn=h;this.attrOut=g;this.targetElement=d||e.element;this.animClass=f;};var b=YAHOO.util.Dom,c=YAHOO.util.CustomEvent,a=YAHOO.widget.ContainerEffect;a.FADE=function(d,f){var g=YAHOO.util.Easing,i={attributes:{opacity:{from:0,to:1}},duration:f,method:g.easeIn},e={attributes:{opacity:{to:0}},duration:f,method:g.easeOut},h=new a(d,i,e,d.element);h.handleUnderlayStart=function(){var k=this.overlay.underlay;if(k&&YAHOO.env.ua.ie){var j=(k.filters&&k.filters.length>0);if(j){b.addClass(d.element,"yui-effect-fade");}}};h.handleUnderlayComplete=function(){var j=this.overlay.underlay;if(j&&YAHOO.env.ua.ie){b.removeClass(d.element,"yui-effect-fade");}};h.handleStartAnimateIn=function(k,j,l){l.overlay._fadingIn=true;b.addClass(l.overlay.element,"hide-select");if(!l.overlay.underlay){l.overlay.cfg.refireEvent("underlay");
}l.handleUnderlayStart();l.overlay._setDomVisibility(true);b.setStyle(l.overlay.element,"opacity",0);};h.handleCompleteAnimateIn=function(k,j,l){l.overlay._fadingIn=false;b.removeClass(l.overlay.element,"hide-select");if(l.overlay.element.style.filter){l.overlay.element.style.filter=null;}l.handleUnderlayComplete();l.overlay.cfg.refireEvent("iframe");l.animateInCompleteEvent.fire();};h.handleStartAnimateOut=function(k,j,l){l.overlay._fadingOut=true;b.addClass(l.overlay.element,"hide-select");l.handleUnderlayStart();};h.handleCompleteAnimateOut=function(k,j,l){l.overlay._fadingOut=false;b.removeClass(l.overlay.element,"hide-select");if(l.overlay.element.style.filter){l.overlay.element.style.filter=null;}l.overlay._setDomVisibility(false);b.setStyle(l.overlay.element,"opacity",1);l.handleUnderlayComplete();l.overlay.cfg.refireEvent("iframe");l.animateOutCompleteEvent.fire();};h.init();return h;};a.SLIDE=function(f,d){var i=YAHOO.util.Easing,l=f.cfg.getProperty("x")||b.getX(f.element),k=f.cfg.getProperty("y")||b.getY(f.element),m=b.getClientWidth(),h=f.element.offsetWidth,j={attributes:{points:{to:[l,k]}},duration:d,method:i.easeIn},e={attributes:{points:{to:[(m+25),k]}},duration:d,method:i.easeOut},g=new a(f,j,e,f.element,YAHOO.util.Motion);g.handleStartAnimateIn=function(o,n,p){p.overlay.element.style.left=((-25)-h)+"px";p.overlay.element.style.top=k+"px";};g.handleTweenAnimateIn=function(q,p,r){var s=b.getXY(r.overlay.element),o=s[0],n=s[1];if(b.getStyle(r.overlay.element,"visibility")=="hidden"&&o<l){r.overlay._setDomVisibility(true);}r.overlay.cfg.setProperty("xy",[o,n],true);r.overlay.cfg.refireEvent("iframe");};g.handleCompleteAnimateIn=function(o,n,p){p.overlay.cfg.setProperty("xy",[l,k],true);p.startX=l;p.startY=k;p.overlay.cfg.refireEvent("iframe");p.animateInCompleteEvent.fire();};g.handleStartAnimateOut=function(o,n,r){var p=b.getViewportWidth(),s=b.getXY(r.overlay.element),q=s[1];r.animOut.attributes.points.to=[(p+25),q];};g.handleTweenAnimateOut=function(p,o,q){var s=b.getXY(q.overlay.element),n=s[0],r=s[1];q.overlay.cfg.setProperty("xy",[n,r],true);q.overlay.cfg.refireEvent("iframe");};g.handleCompleteAnimateOut=function(o,n,p){p.overlay._setDomVisibility(false);p.overlay.cfg.setProperty("xy",[l,k]);p.animateOutCompleteEvent.fire();};g.init();return g;};a.prototype={init:function(){this.beforeAnimateInEvent=this.createEvent("beforeAnimateIn");this.beforeAnimateInEvent.signature=c.LIST;this.beforeAnimateOutEvent=this.createEvent("beforeAnimateOut");this.beforeAnimateOutEvent.signature=c.LIST;this.animateInCompleteEvent=this.createEvent("animateInComplete");this.animateInCompleteEvent.signature=c.LIST;this.animateOutCompleteEvent=this.createEvent("animateOutComplete");this.animateOutCompleteEvent.signature=c.LIST;this.animIn=new this.animClass(this.targetElement,this.attrIn.attributes,this.attrIn.duration,this.attrIn.method);this.animIn.onStart.subscribe(this.handleStartAnimateIn,this);this.animIn.onTween.subscribe(this.handleTweenAnimateIn,this);this.animIn.onComplete.subscribe(this.handleCompleteAnimateIn,this);this.animOut=new this.animClass(this.targetElement,this.attrOut.attributes,this.attrOut.duration,this.attrOut.method);this.animOut.onStart.subscribe(this.handleStartAnimateOut,this);this.animOut.onTween.subscribe(this.handleTweenAnimateOut,this);this.animOut.onComplete.subscribe(this.handleCompleteAnimateOut,this);},animateIn:function(){this._stopAnims(this.lastFrameOnStop);this.beforeAnimateInEvent.fire();this.animIn.animate();},animateOut:function(){this._stopAnims(this.lastFrameOnStop);this.beforeAnimateOutEvent.fire();this.animOut.animate();},lastFrameOnStop:true,_stopAnims:function(d){if(this.animOut&&this.animOut.isAnimated()){this.animOut.stop(d);}if(this.animIn&&this.animIn.isAnimated()){this.animIn.stop(d);}},handleStartAnimateIn:function(e,d,f){},handleTweenAnimateIn:function(e,d,f){},handleCompleteAnimateIn:function(e,d,f){},handleStartAnimateOut:function(e,d,f){},handleTweenAnimateOut:function(e,d,f){},handleCompleteAnimateOut:function(e,d,f){},toString:function(){var d="ContainerEffect";if(this.overlay){d+=" ["+this.overlay.toString()+"]";}return d;}};YAHOO.lang.augmentProto(a,YAHOO.util.EventProvider);})();YAHOO.register("container",YAHOO.widget.Module,{version:"@VERSION@",build:"@BUILD@"});
/* /htapps/roger.babel/mb/web/yui2-lib/build/container/container-min.js */
YAHOO.util.Connect={_msxml_progid:["Microsoft.XMLHTTP","MSXML2.XMLHTTP.3.0","MSXML2.XMLHTTP"],_http_headers:{},_has_http_headers:false,_use_default_post_header:true,_default_post_header:"application/x-www-form-urlencoded; charset=UTF-8",_default_form_header:"application/x-www-form-urlencoded",_use_default_xhr_header:true,_default_xhr_header:"XMLHttpRequest",_has_default_headers:true,_isFormSubmit:false,_default_headers:{},_poll:{},_timeOut:{},_polling_interval:50,_transaction_id:0,startEvent:new YAHOO.util.CustomEvent("start"),completeEvent:new YAHOO.util.CustomEvent("complete"),successEvent:new YAHOO.util.CustomEvent("success"),failureEvent:new YAHOO.util.CustomEvent("failure"),abortEvent:new YAHOO.util.CustomEvent("abort"),_customEvents:{onStart:["startEvent","start"],onComplete:["completeEvent","complete"],onSuccess:["successEvent","success"],onFailure:["failureEvent","failure"],onUpload:["uploadEvent","upload"],onAbort:["abortEvent","abort"]},setProgId:function(a){this._msxml_progid.unshift(a);},setDefaultPostHeader:function(a){if(typeof a=="string"){this._default_post_header=a;this._use_default_post_header=true;}else{if(typeof a=="boolean"){this._use_default_post_header=a;}}},setDefaultXhrHeader:function(a){if(typeof a=="string"){this._default_xhr_header=a;}else{this._use_default_xhr_header=a;}},setPollingInterval:function(a){if(typeof a=="number"&&isFinite(a)){this._polling_interval=a;}},createXhrObject:function(g){var d,a,b;try{a=new XMLHttpRequest();d={conn:a,tId:g,xhr:true};}catch(c){for(b=0;b<this._msxml_progid.length;++b){try{a=new ActiveXObject(this._msxml_progid[b]);d={conn:a,tId:g,xhr:true};break;}catch(f){}}}finally{return d;}},getConnectionObject:function(a){var c,d=this._transaction_id;try{if(!a){c=this.createXhrObject(d);}else{c={tId:d};if(a==="xdr"){c.conn=this._transport;c.xdr=true;}else{if(a==="upload"){c.upload=true;}}}if(c){this._transaction_id++;}}catch(b){}return c;},asyncRequest:function(h,d,g,a){var b=g&&g.argument?g.argument:null,e=this,f,c;if(this._isFileUpload){c="upload";}else{if(g&&g.xdr){c="xdr";}}f=this.getConnectionObject(c);if(!f){return null;}else{if(g&&g.customevents){this.initCustomEvents(f,g);}if(this._isFormSubmit){if(this._isFileUpload){window.setTimeout(function(){e.uploadFile(f,g,d,a);},10);return f;}if(h.toUpperCase()=="GET"){if(this._sFormData.length!==0){d+=((d.indexOf("?")==-1)?"?":"&")+this._sFormData;}}else{if(h.toUpperCase()=="POST"){a=a?this._sFormData+"&"+a:this._sFormData;}}}if(h.toUpperCase()=="GET"&&(g&&g.cache===false)){d+=((d.indexOf("?")==-1)?"?":"&")+"rnd="+new Date().valueOf().toString();}if(this._use_default_xhr_header){if(!this._default_headers["X-Requested-With"]){this.initHeader("X-Requested-With",this._default_xhr_header,true);}}if((h.toUpperCase()==="POST"&&this._use_default_post_header)&&this._isFormSubmit===false){this.initHeader("Content-Type",this._default_post_header);}if(f.xdr){this.xdr(f,h,d,g,a);return f;}f.conn.open(h,d,true);if(this._has_default_headers||this._has_http_headers){this.setHeader(f);}this.handleReadyState(f,g);f.conn.send(a||"");if(this._isFormSubmit===true){this.resetFormState();}this.startEvent.fire(f,b);if(f.startEvent){f.startEvent.fire(f,b);}return f;}},initCustomEvents:function(a,c){var b;for(b in c.customevents){if(this._customEvents[b][0]){a[this._customEvents[b][0]]=new YAHOO.util.CustomEvent(this._customEvents[b][1],(c.scope)?c.scope:null);a[this._customEvents[b][0]].subscribe(c.customevents[b]);}}},handleReadyState:function(c,d){var b=this,a=(d&&d.argument)?d.argument:null;if(d&&d.timeout){this._timeOut[c.tId]=window.setTimeout(function(){b.abort(c,d,true);},d.timeout);}this._poll[c.tId]=window.setInterval(function(){if(c.conn&&c.conn.readyState===4){window.clearInterval(b._poll[c.tId]);delete b._poll[c.tId];if(d&&d.timeout){window.clearTimeout(b._timeOut[c.tId]);delete b._timeOut[c.tId];}b.completeEvent.fire(c,a);if(c.completeEvent){c.completeEvent.fire(c,a);}b.handleTransactionResponse(c,d);}},this._polling_interval);},handleTransactionResponse:function(b,j,d){var f,a,h=(j&&j.argument)?j.argument:null,c=(b.r&&b.r.statusText==="xdr:success")?true:false,i=(b.r&&b.r.statusText==="xdr:failure")?true:false,k=d;try{if((b.conn.status!==undefined&&b.conn.status!==0)||c){f=b.conn.status;}else{if(i&&!k){f=0;}else{f=13030;}}}catch(g){f=13030;}if((f>=200&&f<300)||f===1223||c){a=b.xdr?b.r:this.createResponseObject(b,h);if(j&&j.success){if(!j.scope){j.success(a);}else{j.success.apply(j.scope,[a]);}}this.successEvent.fire(a);if(b.successEvent){b.successEvent.fire(a);}}else{switch(f){case 12002:case 12029:case 12030:case 12031:case 12152:case 13030:a=this.createExceptionObject(b.tId,h,(d?d:false));if(j&&j.failure){if(!j.scope){j.failure(a);}else{j.failure.apply(j.scope,[a]);}}break;default:a=(b.xdr)?b.response:this.createResponseObject(b,h);if(j&&j.failure){if(!j.scope){j.failure(a);}else{j.failure.apply(j.scope,[a]);}}}this.failureEvent.fire(a);if(b.failureEvent){b.failureEvent.fire(a);}}this.releaseObject(b);a=null;},createResponseObject:function(a,h){var d={},k={},f,c,g,b;try{c=a.conn.getAllResponseHeaders();g=c.split("\n");for(f=0;f<g.length;f++){b=g[f].indexOf(":");if(b!=-1){k[g[f].substring(0,b)]=YAHOO.lang.trim(g[f].substring(b+2));}}}catch(j){}d.tId=a.tId;d.status=(a.conn.status==1223)?204:a.conn.status;d.statusText=(a.conn.status==1223)?"No Content":a.conn.statusText;d.getResponseHeader=k;d.getAllResponseHeaders=c;d.responseText=a.conn.responseText;d.responseXML=a.conn.responseXML;if(h){d.argument=h;}return d;},createExceptionObject:function(h,d,a){var f=0,g="communication failure",c=-1,b="transaction aborted",e={};e.tId=h;if(a){e.status=c;e.statusText=b;}else{e.status=f;e.statusText=g;}if(d){e.argument=d;}return e;},initHeader:function(a,d,c){var b=(c)?this._default_headers:this._http_headers;b[a]=d;if(c){this._has_default_headers=true;}else{this._has_http_headers=true;}},setHeader:function(a){var b;if(this._has_default_headers){for(b in this._default_headers){if(YAHOO.lang.hasOwnProperty(this._default_headers,b)){a.conn.setRequestHeader(b,this._default_headers[b]);
}}}if(this._has_http_headers){for(b in this._http_headers){if(YAHOO.lang.hasOwnProperty(this._http_headers,b)){a.conn.setRequestHeader(b,this._http_headers[b]);}}this._http_headers={};this._has_http_headers=false;}},resetDefaultHeaders:function(){this._default_headers={};this._has_default_headers=false;},abort:function(e,g,a){var d,b=(g&&g.argument)?g.argument:null;e=e||{};if(e.conn){if(e.xhr){if(this.isCallInProgress(e)){e.conn.abort();window.clearInterval(this._poll[e.tId]);delete this._poll[e.tId];if(a){window.clearTimeout(this._timeOut[e.tId]);delete this._timeOut[e.tId];}d=true;}}else{if(e.xdr){e.conn.abort(e.tId);d=true;}}}else{if(e.upload){var c="yuiIO"+e.tId;var f=document.getElementById(c);if(f){YAHOO.util.Event.removeListener(f,"load");document.body.removeChild(f);if(a){window.clearTimeout(this._timeOut[e.tId]);delete this._timeOut[e.tId];}d=true;}}else{d=false;}}if(d===true){this.abortEvent.fire(e,b);if(e.abortEvent){e.abortEvent.fire(e,b);}this.handleTransactionResponse(e,g,true);}return d;},isCallInProgress:function(a){a=a||{};if(a.xhr&&a.conn){return a.conn.readyState!==4&&a.conn.readyState!==0;}else{if(a.xdr&&a.conn){return a.conn.isCallInProgress(a.tId);}else{if(a.upload===true){return document.getElementById("yuiIO"+a.tId)?true:false;}else{return false;}}}},releaseObject:function(a){if(a&&a.conn){a.conn=null;a=null;}}};(function(){var g=YAHOO.util.Connect,h={};function d(i){var j='<object id="YUIConnectionSwf" type="application/x-shockwave-flash" data="'+i+'" width="0" height="0">'+'<param name="movie" value="'+i+'">'+'<param name="allowScriptAccess" value="always">'+"</object>",k=document.createElement("div");document.body.appendChild(k);k.innerHTML=j;}function b(l,i,j,n,k){h[parseInt(l.tId)]={"o":l,"c":n};if(k){n.method=i;n.data=k;}l.conn.send(j,n,l.tId);}function e(i){d(i);g._transport=document.getElementById("YUIConnectionSwf");}function c(){g.xdrReadyEvent.fire();}function a(j,i){if(j){g.startEvent.fire(j,i.argument);if(j.startEvent){j.startEvent.fire(j,i.argument);}}}function f(j){var k=h[j.tId].o,i=h[j.tId].c;if(j.statusText==="xdr:start"){a(k,i);return;}j.responseText=decodeURI(j.responseText);k.r=j;if(i.argument){k.r.argument=i.argument;}this.handleTransactionResponse(k,i,j.statusText==="xdr:abort"?true:false);delete h[j.tId];}g.xdr=b;g.swf=d;g.transport=e;g.xdrReadyEvent=new YAHOO.util.CustomEvent("xdrReady");g.xdrReady=c;g.handleXdrResponse=f;})();(function(){var e=YAHOO.util.Connect,g=YAHOO.util.Event,a=document.documentMode?document.documentMode:false;e._isFileUpload=false;e._formNode=null;e._sFormData=null;e._submitElementValue=null;e.uploadEvent=new YAHOO.util.CustomEvent("upload");e._hasSubmitListener=function(){if(g){g.addListener(document,"click",function(k){var j=g.getTarget(k),i=j.nodeName.toLowerCase();if((i==="input"||i==="button")&&(j.type&&j.type.toLowerCase()=="submit")){e._submitElementValue=encodeURIComponent(j.name)+"="+encodeURIComponent(j.value);}});return true;}return false;}();function h(w,r,m){var v,l,u,s,z,t=false,p=[],y=0,o,q,n,x,k;this.resetFormState();if(typeof w=="string"){v=(document.getElementById(w)||document.forms[w]);}else{if(typeof w=="object"){v=w;}else{return;}}if(r){this.createFrame(m?m:null);this._isFormSubmit=true;this._isFileUpload=true;this._formNode=v;return;}for(o=0,q=v.elements.length;o<q;++o){l=v.elements[o];z=l.disabled;u=l.name;if(!z&&u){u=encodeURIComponent(u)+"=";s=encodeURIComponent(l.value);switch(l.type){case"select-one":if(l.selectedIndex>-1){k=l.options[l.selectedIndex];p[y++]=u+encodeURIComponent((k.attributes.value&&k.attributes.value.specified)?k.value:k.text);}break;case"select-multiple":if(l.selectedIndex>-1){for(n=l.selectedIndex,x=l.options.length;n<x;++n){k=l.options[n];if(k.selected){p[y++]=u+encodeURIComponent((k.attributes.value&&k.attributes.value.specified)?k.value:k.text);}}}break;case"radio":case"checkbox":if(l.checked){p[y++]=u+s;}break;case"file":case undefined:case"reset":case"button":break;case"submit":if(t===false){if(this._hasSubmitListener&&this._submitElementValue){p[y++]=this._submitElementValue;}t=true;}break;default:p[y++]=u+s;}}}this._isFormSubmit=true;this._sFormData=p.join("&");this.initHeader("Content-Type",this._default_form_header);return this._sFormData;}function d(){this._isFormSubmit=false;this._isFileUpload=false;this._formNode=null;this._sFormData="";}function c(i){var j="yuiIO"+this._transaction_id,l=(a===9)?true:false,k;if(YAHOO.env.ua.ie&&!l){k=document.createElement('<iframe id="'+j+'" name="'+j+'" />');if(typeof i=="boolean"){k.src="javascript:false";}}else{k=document.createElement("iframe");k.id=j;k.name=j;}k.style.position="absolute";k.style.top="-1000px";k.style.left="-1000px";document.body.appendChild(k);}function f(j){var m=[],k=j.split("&"),l,n;for(l=0;l<k.length;l++){n=k[l].indexOf("=");if(n!=-1){m[l]=document.createElement("input");m[l].type="hidden";m[l].name=decodeURIComponent(k[l].substring(0,n));m[l].value=decodeURIComponent(k[l].substring(n+1));this._formNode.appendChild(m[l]);}}return m;}function b(m,y,n,l){var t="yuiIO"+m.tId,u="multipart/form-data",w=document.getElementById(t),p=(a>=8)?true:false,z=this,v=(y&&y.argument)?y.argument:null,x,s,k,r,j,q;j={action:this._formNode.getAttribute("action"),method:this._formNode.getAttribute("method"),target:this._formNode.getAttribute("target")};this._formNode.setAttribute("action",n);this._formNode.setAttribute("method","POST");this._formNode.setAttribute("target",t);if(YAHOO.env.ua.ie&&!p){this._formNode.setAttribute("encoding",u);}else{this._formNode.setAttribute("enctype",u);}if(l){x=this.appendPostData(l);}this._formNode.submit();this.startEvent.fire(m,v);if(m.startEvent){m.startEvent.fire(m,v);}if(y&&y.timeout){this._timeOut[m.tId]=window.setTimeout(function(){z.abort(m,y,true);},y.timeout);}if(x&&x.length>0){for(s=0;s<x.length;s++){this._formNode.removeChild(x[s]);}}for(k in j){if(YAHOO.lang.hasOwnProperty(j,k)){if(j[k]){this._formNode.setAttribute(k,j[k]);}else{this._formNode.removeAttribute(k);}}}this.resetFormState();
q=function(){var i,A,B;if(y&&y.timeout){window.clearTimeout(z._timeOut[m.tId]);delete z._timeOut[m.tId];}z.completeEvent.fire(m,v);if(m.completeEvent){m.completeEvent.fire(m,v);}r={tId:m.tId,argument:v};try{i=w.contentWindow.document.getElementsByTagName("body")[0];A=w.contentWindow.document.getElementsByTagName("pre")[0];if(i){if(A){B=A.textContent?A.textContent:A.innerText;}else{B=i.textContent?i.textContent:i.innerText;}}r.responseText=B;r.responseXML=w.contentWindow.document.XMLDocument?w.contentWindow.document.XMLDocument:w.contentWindow.document;}catch(o){}if(y&&y.upload){if(!y.scope){y.upload(r);}else{y.upload.apply(y.scope,[r]);}}z.uploadEvent.fire(r);if(m.uploadEvent){m.uploadEvent.fire(r);}g.removeListener(w,"load",q);setTimeout(function(){document.body.removeChild(w);z.releaseObject(m);},100);};g.addListener(w,"load",q);}e.setForm=h;e.resetFormState=d;e.createFrame=c;e.appendPostData=f;e.uploadFile=b;})();YAHOO.register("connection",YAHOO.util.Connect,{version:"@VERSION@",build:"@BUILD@"});
/* /htapps/roger.babel/mb/web/yui2-lib/build/connection/connection-min.js */
/*!
Copyright (c) 2011, 2012 Julien Wajsberg <felash@gmail.com>
All rights reserved.

Official repository: https://github.com/julienw/jquery-trap-input
License is there: https://github.com/julienw/jquery-trap-input/blob/master/LICENSE
This is version 1.2.0.
*/(function(a,b){function d(a){if(a.keyCode===9){var b=!!a.shiftKey;e(this,a.target,b)&&(a.preventDefault(),a.stopPropagation())}}function e(a,b,c){var d=i(a),e=b,f,g,h,j;do{f=d.index(e),g=f+1,h=f-1,j=d.length-1;switch(f){case-1:return!1;case 0:h=j;break;case j:g=0}c&&(g=h),e=d.get(g);try{e.focus()}catch(k){}}while(b===b.ownerDocument.activeElement);return!0}function f(){return this.tabIndex>0}function g(){return!this.tabIndex}function h(a,b){return a.t-b.t||a.i-b.i}function i(b){var c=a(b),d=[],e=0;return m.enable&&m.enable(),c.find("a[href], link[href], [draggable=true], [contenteditable=true], :input:enabled, [tabindex=0]").filter(":visible").filter(g).each(function(a,b){d.push({v:b,t:0,i:e++})}),c.find("[tabindex]").filter(":visible").filter(f).each(function(a,b){d.push({v:b,t:b.tabIndex,i:e++})}),m.disable&&m.disable(),d=a.map(d.sort(h),function(a){return a.v}),a(d)}function j(){return this.keydown(d),this.data(c,!0),this}function k(){return this.unbind("keydown",d),this.removeData(c),this}function l(){return!!this.data(c)}var c="trap.isTrapping";a.fn.extend({trap:j,untrap:k,isTrapping:l});var m={};a.find.find&&a.find.attr!==a.attr&&function(){function e(a){var d=a.getAttributeNode(c);return d&&d.specified?parseInt(d.value,10):b}function f(){d[c]=d.tabIndex=e}function g(){delete d[c],delete d.tabIndex}var c="tabindex",d=a.expr.attrHandle;m={enable:f,disable:g}}()})(jQuery);
/* /htapps/roger.babel/mdp-web/jquery/jquery.trap.min.js */
/**
 * Boxy 0.1.4 - Facebook-style dialog, with frills
 *
 * (c) 2008 Jason Frame
 * Licensed under the MIT License (LICENSE)
 */
 
/*
 * jQuery plugin
 *
 * Options:
 *   message: confirmation message for form submit hook (default: "Please confirm:")
 * 
 * Any other options - e.g. 'clone' - will be passed onto the boxy constructor (or
 * Boxy.load for AJAX operations)
 */
jQuery.fn.boxy = function(options) {
    options = options || {};
    return this.each(function() {      
        var node = this.nodeName.toLowerCase(), self = this;
        if (node == 'a') {
            jQuery(this).click(function() {
                var active = Boxy.linkedTo(this),
                    href = this.getAttribute('href'),
                    localOptions = jQuery.extend({actuator: this, title: this.title}, options);
                    
                if (active) {
                    active.show();
                } else if (href.indexOf('#') >= 0) {
                    var content = jQuery(href.substr(href.indexOf('#'))),
                        newContent = content.clone(true);
                    content.remove();
                    localOptions.unloadOnHide = false;
                    new Boxy(newContent, localOptions);
                } else { // fall back to AJAX; could do with a same-origin check
                    if (!localOptions.cache) localOptions.unloadOnHide = true;
                    Boxy.load(this.href, localOptions);
                }
                
                return false;
            });
        } else if (node == 'form') {
            jQuery(this).bind('submit.boxy', function() {
                Boxy.confirm(options.message || 'Please confirm:', function() {
                    jQuery(self).unbind('submit.boxy').submit();
                });
                return false;
            });
        }
    });
};

//
// Boxy Class

function Boxy(element, options) {
    
    this.boxy = jQuery(Boxy.WRAPPER);
    jQuery.data(this.boxy[0], 'boxy', this);
    
    this.visible = false;
    this.options = jQuery.extend({}, Boxy.DEFAULTS, options || {});
    
    if (this.options.modal) {
        this.options = jQuery.extend(this.options, {center: true, draggable: false});
    }
    
    // options.actuator == DOM element that opened this boxy
    // association will be automatically deleted when this boxy is remove()d
    if (this.options.actuator) {
        jQuery.data(this.options.actuator, 'active.boxy', this);
    }
    
    this.setContent(element || "<div></div>");
    this._setupTitleBar();
    
    this.boxy.css('display', 'none').appendTo(document.body);
    this.toTop();

    if (this.options.fixed) {
        if (jQuery.browser.msie && jQuery.browser.version < 7) {
            this.options.fixed = false; // IE6 doesn't support fixed positioning
        } else {
            this.boxy.addClass('fixed');
        }
    }
    
    if (this.options.center && Boxy._u(this.options.x, this.options.y)) {
        this.center();
    } else {
        this.moveTo(
            Boxy._u(this.options.x) ? this.options.x : Boxy.DEFAULT_X,
            Boxy._u(this.options.y) ? this.options.y : Boxy.DEFAULT_Y
        );
    }
    
    if (this.options.show) this.show();

};

Boxy.EF = function() {};

jQuery.extend(Boxy, {
    
    WRAPPER:    "<table cellspacing='0' cellpadding='0' border='0' class='boxy-wrapper'>" +
                "<tr><td class='top-left'></td><td class='top'></td><td class='top-right'></td></tr>" +
                "<tr><td class='left'></td><td class='boxy-inner'></td><td class='right'></td></tr>" +
                "<tr><td class='bottom-left'></td><td class='bottom'></td><td class='bottom-right'></td></tr>" +
                "</table>",
    
    DEFAULTS: {
        title:                  null,           // titlebar text. titlebar will not be visible if not set.
        closeable:              true,           // display close link in titlebar?
        draggable:              true,           // can this dialog be dragged?
        clone:                  false,          // clone content prior to insertion into dialog?
        actuator:               null,           // element which opened this dialog
        center:                 true,           // center dialog in viewport?
        show:                   true,           // show dialog immediately?
        modal:                  false,          // make dialog modal?
        fixed:                  true,           // use fixed positioning, if supported? absolute positioning used otherwise
        closeText:              '[close]',      // text to use for default close link
        unloadOnHide:           false,          // should this dialog be removed from the DOM after being hidden?
        clickToFront:           false,          // bring dialog to foreground on any click (not just titlebar)?
        behaviours:             Boxy.EF,        // function used to apply behaviours to all content embedded in dialog.
        afterDrop:              Boxy.EF,        // callback fired after dialog is dropped. executes in context of Boxy instance.
        afterShow:              Boxy.EF,        // callback fired after dialog becomes visible. executes in context of Boxy instance.
        afterHide:              Boxy.EF,        // callback fired after dialog is hidden. executed in context of Boxy instance.
        beforeUnload:           Boxy.EF         // callback fired after dialog is unloaded. executed in context of Boxy instance.
    },
    
    DEFAULT_X:          50,
    DEFAULT_Y:          50,
    zIndex:             1337,
    dragConfigured:     false, // only set up one drag handler for all boxys
    resizeConfigured:   false,
    dragging:           null,
    
    // load a URL and display in boxy
    // url - url to load
    // options keys (any not listed below are passed to boxy constructor)
    //   type: HTTP method, default: GET
    //   cache: cache retrieved content? default: false
    //   filter: jQuery selector used to filter remote content
    load: function(url, options) {
        
        options = options || {};
        
        var ajax = {
            url: url, type: 'GET', dataType: 'html', cache: false, success: function(html) {
                html = jQuery(html);
                if (options.filter) html = jQuery(options.filter, html);
                new Boxy(html, options);
            }
        };
        
        jQuery.each(['type', 'cache'], function() {
            if (this in options) {
                ajax[this] = options[this];
                delete options[this];
            }
        });
        
        jQuery.ajax(ajax);
        
    },
    
    // allows you to get a handle to the containing boxy instance of any element
    // e.g. <a href='#' onclick='alert(Boxy.get(this));'>inspect!</a>.
    // this returns the actual instance of the boxy 'class', not just a DOM element.
    // Boxy.get(this).hide() would be valid, for instance.
    get: function(ele) {
        var p = jQuery(ele).parents('.boxy-wrapper');
        return p.length ? jQuery.data(p[0], 'boxy') : null;
    },
    
    // returns the boxy instance which has been linked to a given element via the
    // 'actuator' constructor option.
    linkedTo: function(ele) {
        return jQuery.data(ele, 'active.boxy');
    },
    
    // displays an alert box with a given message, calling optional callback
    // after dismissal.
    alert: function(message, callback, options) {
        return Boxy.ask(message, ['OK'], callback, options);
    },
    
    // displays an alert box with a given message, calling after callback iff
    // user selects OK.
    confirm: function(message, after, options) {
        return Boxy.ask(message, ['OK', 'Cancel'], function(response) {
            if (response == 'OK') after();
        }, options);
    },
    
    // asks a question with multiple responses presented as buttons
    // selected item is returned to a callback method.
    // answers may be either an array or a hash. if it's an array, the
    // the callback will received the selected value. if it's a hash,
    // you'll get the corresponding key.
    ask: function(question, answers, callback, options) {
        
        options = jQuery.extend({modal: true, closeable: false},
                                options || {},
                                {show: true, unloadOnHide: true});
        
        var body = jQuery('<div></div>').append(jQuery('<div class="question"></div>').html(question));
        
        // ick
        var map = {}, answerStrings = [];
        if (answers instanceof Array) {
            for (var i = 0; i < answers.length; i++) {
                map[answers[i]] = answers[i];
                answerStrings.push(answers[i]);
            }
        } else {
            for (var k in answers) {
                map[answers[k]] = k;
                answerStrings.push(answers[k]);
            }
        }
        
        var buttons = jQuery('<form class="answers"></form>');
        buttons.html(jQuery.map(answerStrings, function(v) {
            return "<input type='button' value='" + v + "' />";
        }).join(' '));
        
        jQuery('input[type=button]', buttons).click(function() {
            var clicked = this;
            Boxy.get(this).hide(function() {
                if (callback) callback(map[clicked.value]);
            });
        });
        
        body.append(buttons);
        
        new Boxy(body, options);
        
    },
    
    // returns true if a modal boxy is visible, false otherwise
    isModalVisible: function() {
        return jQuery('.boxy-modal-blackout').length > 0;
    },
    
    _u: function() {
        for (var i = 0; i < arguments.length; i++)
            if (typeof arguments[i] != 'undefined') return false;
        return true;
    },
    
    _handleResize: function(evt) {
        var d = jQuery(document);
        jQuery('.boxy-modal-blackout').css('display', 'none').css({
            width: d.width(), height: d.height()
        }).css('display', 'block');
    },
    
    _handleDrag: function(evt) {
        var d;
        if (d = Boxy.dragging) {
            d[0].boxy.css({left: evt.pageX - d[1], top: evt.pageY - d[2]});
        }
    },
    
    _nextZ: function() {
        return Boxy.zIndex++;
    },
    
    _viewport: function() {
        var d = document.documentElement, b = document.body, w = window;
        return jQuery.extend(
            jQuery.browser.msie ?
                { left: b.scrollLeft || d.scrollLeft, top: b.scrollTop || d.scrollTop } :
                { left: w.pageXOffset, top: w.pageYOffset },
            !Boxy._u(w.innerWidth) ?
                { width: w.innerWidth, height: w.innerHeight } :
                (!Boxy._u(d) && !Boxy._u(d.clientWidth) && d.clientWidth != 0 ?
                    { width: d.clientWidth, height: d.clientHeight } :
                    { width: b.clientWidth, height: b.clientHeight }) );
    }

});

Boxy.prototype = {
    
    // Returns the size of this boxy instance without displaying it.
    // Do not use this method if boxy is already visible, use getSize() instead.
    estimateSize: function() {
        this.boxy.css({visibility: 'hidden', display: 'block'});
        var dims = this.getSize();
        this.boxy.css('display', 'none').css('visibility', 'visible');
        return dims;
    },
                
    // Returns the dimensions of the entire boxy dialog as [width,height]
    getSize: function() {
        return [this.boxy.width(), this.boxy.height()];
    },
    
    // Returns the dimensions of the content region as [width,height]
    getContentSize: function() {
        var c = this.getContent();
        return [c.width(), c.height()];
    },
    
    // Returns the position of this dialog as [x,y]
    getPosition: function() {
        var b = this.boxy[0];
        return [b.offsetLeft, b.offsetTop];
    },
    
    // Returns the center point of this dialog as [x,y]
    getCenter: function() {
        var p = this.getPosition();
        var s = this.getSize();
        return [Math.floor(p[0] + s[0] / 2), Math.floor(p[1] + s[1] / 2)];
    },
                
    // Returns a jQuery object wrapping the inner boxy region.
    // Not much reason to use this, you're probably more interested in getContent()
    getInner: function() {
        return jQuery('.boxy-inner', this.boxy);
    },
    
    // Returns a jQuery object wrapping the boxy content region.
    // This is the user-editable content area (i.e. excludes titlebar)
    getContent: function() {
        return jQuery('.boxy-content', this.boxy);
    },
    
    // Replace dialog content
    setContent: function(newContent) {
        newContent = jQuery(newContent).css({display: 'block'}).addClass('boxy-content');
        if (this.options.clone) newContent = newContent.clone(true);
        this.getContent().remove();
        this.getInner().append(newContent);
        this._setupDefaultBehaviours(newContent);
        this.options.behaviours.call(this, newContent);
        return this;
    },
    
    // Move this dialog to some position, funnily enough
    moveTo: function(x, y) {
        this.moveToX(x).moveToY(y);
        return this;
    },
    
    // Move this dialog (x-coord only)
    moveToX: function(x) {
        if (typeof x == 'number') this.boxy.css({left: x});
        else this.centerX();
        return this;
    },
    
    // Move this dialog (y-coord only)
    moveToY: function(y) {
        if (typeof y == 'number') this.boxy.css({top: y});
        else this.centerY();
        return this;
    },
    
    // Move this dialog so that it is centered at (x,y)
    centerAt: function(x, y) {
        var s = this[this.visible ? 'getSize' : 'estimateSize']();
        if (typeof x == 'number') this.moveToX(x - s[0] / 2);
        if (typeof y == 'number') this.moveToY(y - s[1] / 2);
        return this;
    },
    
    centerAtX: function(x) {
        return this.centerAt(x, null);
    },
    
    centerAtY: function(y) {
        return this.centerAt(null, y);
    },
    
    // Center this dialog in the viewport
    // axis is optional, can be 'x', 'y'.
    center: function(axis) {
        var v = Boxy._viewport();
        var o = this.options.fixed ? [0, 0] : [v.left, v.top];
        if (!axis || axis == 'x') this.centerAt(o[0] + v.width / 2, null);
        if (!axis || axis == 'y') this.centerAt(null, o[1] + v.height / 2);
        return this;
    },
    
    // Center this dialog in the viewport (x-coord only)
    centerX: function() {
        return this.center('x');
    },
    
    // Center this dialog in the viewport (y-coord only)
    centerY: function() {
        return this.center('y');
    },
    
    // Resize the content region to a specific size
    resize: function(width, height, after) {
        if (!this.visible) return;
        var bounds = this._getBoundsForResize(width, height);
        this.boxy.css({left: bounds[0], top: bounds[1]});
        this.getContent().css({width: bounds[2], height: bounds[3]});
        if (after) after(this);
        return this;
    },
    
    // Tween the content region to a specific size
    tween: function(width, height, after) {
        if (!this.visible) return;
        var bounds = this._getBoundsForResize(width, height);
        var self = this;
        this.boxy.stop().animate({left: bounds[0], top: bounds[1]});
        this.getContent().stop().animate({width: bounds[2], height: bounds[3]}, function() {
            if (after) after(self);
        });
        return this;
    },
    
    // Returns true if this dialog is visible, false otherwise
    isVisible: function() {
        return this.visible;    
    },
    
    // Make this boxy instance visible
    show: function() {
        if (this.visible) return;
        if (this.options.modal) {
            var self = this;
            if (!Boxy.resizeConfigured) {
                Boxy.resizeConfigured = true;
                jQuery(window).resize(function() { Boxy._handleResize(); });
            }
            this.modalBlackout = jQuery('<div class="boxy-modal-blackout"></div>')
                .css({zIndex: Boxy._nextZ(),
                      opacity: 0.7,
                      width: jQuery(document).width(),
                      height: jQuery(document).height()})
                .appendTo(document.body);
            this.toTop();
            if (this.options.closeable) {
                jQuery(document.body).bind('keypress.boxy', function(evt) {
                    var key = evt.which || evt.keyCode;
                    if (key == 27) {
                        self.hide();
                        jQuery(document.body).unbind('keypress.boxy');
                    }
                });
                this.modalBlackout.bind('click', function() { self.hide(); });
            }
        }
        this.boxy.stop().css({opacity: 1}).show();
        this.visible = true;
        this._fire('afterShow');
        return this;
    },
    
    // Hide this boxy instance
    hide: function(after) {
        if (!this.visible) return;
        var self = this;
        if (this.options.modal) {
            jQuery(document.body).unbind('keypress.boxy');
            this.modalBlackout.animate({opacity: 0}, function() {
                jQuery(this).remove();
            });
        }
        this.boxy.stop().animate({opacity: 0}, 300, function() {
            self.boxy.css({display: 'none'});
            self.visible = false;
            self._fire('afterHide');
            if (after) after(self);
            if (self.options.unloadOnHide) self.unload();
        });
        return this;
    },
    
    toggle: function() {
        this[this.visible ? 'hide' : 'show']();
        return this;
    },
    
    hideAndUnload: function(after) {
        this.options.unloadOnHide = true;
        this.hide(after);
        return this;
    },
    
    unload: function() {
        this._fire('beforeUnload');
        this.boxy.remove();
        if (this.options.actuator) {
            jQuery.data(this.options.actuator, 'active.boxy', false);
        }
    },
    
    // Move this dialog box above all other boxy instances
    toTop: function() {
        this.boxy.css({zIndex: Boxy._nextZ()});
        return this;
    },
    
    // Returns the title of this dialog
    getTitle: function() {
        return jQuery('> .title-bar h2', this.getInner()).html();
    },
    
    // Sets the title of this dialog
    setTitle: function(t) {
        jQuery('> .title-bar h2', this.getInner()).html(t);
        return this;
    },
    
    //
    // Don't touch these privates
    
    _getBoundsForResize: function(width, height) {
        var csize = this.getContentSize();
        var delta = [width - csize[0], height - csize[1]];
        var p = this.getPosition();
        return [Math.max(p[0] - delta[0] / 2, 0),
                Math.max(p[1] - delta[1] / 2, 0), width, height];
    },
    
    _setupTitleBar: function() {
        if (this.options.title) {
            var self = this;
            var tb = jQuery("<div class='title-bar'></div>").html("<h2>" + this.options.title + "</h2>");
            if (this.options.closeable) {
                tb.append(jQuery("<a href='#' class='close'></a>").html(this.options.closeText));
            }
            if (this.options.draggable) {
                tb[0].onselectstart = function() { return false; }
                tb[0].unselectable = 'on';
                tb[0].style.MozUserSelect = 'none';
                if (!Boxy.dragConfigured) {
                    jQuery(document).mousemove(Boxy._handleDrag);
                    Boxy.dragConfigured = true;
                }
                tb.mousedown(function(evt) {
                    self.toTop();
                    Boxy.dragging = [self, evt.pageX - self.boxy[0].offsetLeft, evt.pageY - self.boxy[0].offsetTop];
                    jQuery(this).addClass('dragging');
                }).mouseup(function() {
                    jQuery(this).removeClass('dragging');
                    Boxy.dragging = null;
                    self._fire('afterDrop');
                });
            }
            this.getInner().prepend(tb);
            this._setupDefaultBehaviours(tb);
        }
    },
    
    _setupDefaultBehaviours: function(root) {
        var self = this;
        if (this.options.clickToFront) {
            root.click(function() { self.toTop(); });
        }
        jQuery('.close', root).click(function() {
            self.hide();
            return false;
        }).mousedown(function(evt) { evt.stopPropagation(); });
    },
    
    _fire: function(event) {
        this.options[event].call(this);
    }
    
};

/* /htapps/roger.babel/mdp-web/jquery/boxy/jquery.boxy.js */
var displayCBFeedback = function() {
    
    var DEFAULT_EMAIL_VALUE = "[Your email address]";
    var pathname = window.location.pathname;
    var emailLen = 96;
    var commentsLen = 256;

    // Shib
    var cgi_elem = "/cgi";
    if (pathname.indexOf("/shcgi/") >= 0) {
        cgi_elem = "/shcgi";
    }
    var feedbackUrl = cgi_elem + "/feedback";

    var html = '<div id="mdpFeedbackForm">' + 
                  '<form method="POST" action="{feedbackUrl}" id="CBfeedback" name="CBfeedback">' + 
                    '<input type="hidden" value="cb" name="m" />' + 
                    '<input type="hidden" value="Collection Builder" name="id" />' +
                    '<div id="mdpEmail" class="row">' + 
                      '<label id="mdpEmailLabel" for="email">To request a reply, enter your email address below.</label>' + 
                      '<span><input id="email" name="email" class="overlay" value="{DEFAULT_EMAIL_VALUE}" size="50" maxlength="{emailLen}" /></span>' + 
                    '</div>' + 
                    '<div id="mdpFlexible_2_Other" class="row">' + 
                      '<label id="mdpCommentsLabel" for="comments">Problems or comments?</label>' + 
                      '<textarea name="comments" id="comments" class="overlay" rows="4" maxlength="{commentsLen}"></textarea>' + 
                    '</div>' +
                    '<div id="emptyFBError" aria-live="assertive" aria-atomic="true"></div>' + 
                    '<div id="mdpFBtools">' + 
                      '<div class="mdpFBbuttons">' + 
                        '<input id="mdpFBinputbutton" type="submit" name="op" value="Submit" />' + 
                        '<a id="mdpFBcancel" href="#"><strong>Cancel</strong></a>' + 
                      '</div>' + 
                    '</div>' + 
                  '</form>' + 
                '</div>';
    html = html.replace('{DEFAULT_EMAIL_VALUE}', DEFAULT_EMAIL_VALUE)
               .replace('{feedbackUrl}', feedbackUrl)
               .replace('{emailLen}', emailLen)
               .replace('{commentsLen}', commentsLen)
    var $div = $(html).appendTo("body");
    var $frm = $div.find("form");
    var frm = $frm.get(0);

    var dialog = new Boxy($div, {
        show : false,
        modal: true,
        draggable : false,
        closeable : true,
        clone : false,
        unloadOnHide: true,
        title : "Feedback"
    });
    
    if ( ! $frm.data('initialized') ) {
      // bind the events in the closure in order to share the DEFAULT_EMAIL_VALUE variable
      $("#email")
        .bind('click', function() {
          clickclear(this, DEFAULT_EMAIL_VALUE);
        })
        .bind('focus', function() {
          clickclear(this, DEFAULT_EMAIL_VALUE);
        })
        .bind('blur', function() {
          clickrecall(this, DEFAULT_EMAIL_VALUE);
        })

      $("input[type=submit], #mdpFBcancel", $frm).click(function(e) {
          var clicked = this;
          e.preventDefault();
          
          // get a version of the dialog that 
          // has the most current visibility settings
          var dialog = Boxy.get(this);

          if ( $(this).attr('id') == "mdpFBcancel" ) {
              dialog.hide().getContent().untrap();
              return false;
          }

          var isEmpty = 1;

          var postData = {};

          for (var i=0; i < frm.length; i++)
          {
              if ((frm.elements[i].type == 'checkbox' || frm.elements[i].type == 'radio')
                  && frm.elements[i].checked) {
                  isEmpty = 0;
                  postData[frm.elements[i].name] = frm.elements[i].value;
              }
              else if ((frm.elements[i].type == 'text' || frm.elements[i].type == 'textarea')
                  && (frm.elements[i].value.length > 0)
                  && (frm.elements[i].value != DEFAULT_EMAIL_VALUE)) {
                  isEmpty = 0;
                  postData[frm.elements[i].name] = frm.elements[i].value;
              }
              else if ( frm.elements[i].type == 'hidden' ) {
                postData[frm.elements[i].name] = frm.elements[i].value;
              }
          }

          if (isEmpty == 1) {
              $(frm).find("#emptyFBError").append('<strong>You must enter feedback before submitting or cancel.</strong>');
              return false;
          }

          $(frm).submit();
      });
      $frm.data('initialized', true);
    }
    
    // empty out the form
    $("#emptyFBError").empty();
    
    dialog.show().getContent().trap();
    // focus on the title of the dialog; moves focus into the dialog
    dialog.getInner().find(".title-bar h2").attr('tabindex', '-1').focus();

    return false;
};

$(document).ready(function() {
    
    $("#feedback, #feedback_footer").click(function(e) {
          e.preventDefault();
          displayCBFeedback();
          return false;
    })

})
/* /htapps/roger.babel/mdp-web/js/feedbackCBForm.js */
//Script: newCollOverlayCore.js

var DEFAULT_COLL_NAME = "Collection Name";
var DEFAULT_DESC = "Description";
var COLL_NAME = [];

var maxCharsColl = 50;
var charsTypedColl = 0;
var charsRemainingColl = maxCharsColl - charsTypedColl;
var maxCharsDesc = 150;
var charsTypedDesc = 0;
var charsRemainingDesc = maxCharsDesc - charsTypedDesc;

var formWidth = 400;
var URL = null;
var referrer = "";
var dup = 0;


YAHOO.namespace("mbooks");

function setPostURL(url) { URL = url; }
function getPostURL() { return URL; }

function setReferrer(ref) { referrer = ref; }
function getReferrer() { return referrer; }

function getNewCollForm () {
    var mbCgi = "/cgi/mb";
    if ( window.location.href.indexOf("/shcgi/") > -1 ) {
      mbCgi = "/shcgi/mb";
    } 
  
    var width = formWidth - 100;
    var formHTML = 
        "<form method='get' id='newcoll' name='newcoll' action='" + mbCgi + "'><table>";
    
    formHTML = 
        formHTML + 
        "<tr><td>" +
	"<div><input name='cn' type='text' style='width:" 
        + width + 
        "px' maxlength='" 
        + maxCharsColl + 
        "' " +   
	"class='overlay' id='cn' onclick=\"clickclear(this, 'Collection Name')\" onfocus=\"clickclear(this, 'Collection Name')\" onblur=\"clickrecall(this,'Collection Name')\" onKeyUp=\"CheckCollLength()\" value='Collection Name'/> " +
	"</div></td><td><div id='charsRemainingColl'>" +
	"<div class='bd'></div></div></td></tr>"+
	"<tr><td><div><textarea style='width:" 
        + width +
        "px;margin-left:0px;' name='desc' id='desc' class='overlay' rows='4' onclick=\"clickclear(this, 'Description')\" onfocus=\"clickclear(this, 'Description')\" onblur=\"clickrecall(this,'Description')\" style=\"font-family:Arial\" onKeyUp=\"CheckDescLength()\">" + 
	"Description</textarea></div></td>" +
	"<td><div id='charsRemainingDesc'><div class='bd'></div></div>" +
	"</td></tr></table>" 
        + getSharedOptions() +
	"<div id='collType'><div class='bd'></div></div> " +
	"<div id='searchParams'><div class='bd'></div></div> " +
	"<div id='invalidName'><div class='bd'></div></div> " +
	"<div id='itemsSelected'><div class='bd'></div></div>" +
	"<div id='defaultCollParams'><div class='bd'></div></div>" +
	"<table name='buttons'> <tr> " +
	"<td id='addC'><button id='addc' type='submit'>Add</button></td> " +
	"<td id='addI'><button id='additnc' type='submit'>Add</button></td>"+
        //tbw test for ls
	"<td id='addItems'><button id='additsnc' type='submit'>Add</button></td>"+
	"<td id='copy'><button id='copyitnc' type='submit'>Copy</button></td> "+
	"<td id='move'><button id='movitnc' type='submit'>Move</button></td> "+
	"<input id='action' type='hidden' name='a' value='?'></td>" +
	"<td width='100px' align='right'><a id='cancel' href=''>Cancel</a></td> "+
	"</tr> </table>" +
        "</form>";
    return formHTML;
}

function getSharedOptions() {
    var options = "<table><tr><td><INPUT type='radio' name='shrd' id='shrd_priv' value='0' checked='yes'/>Private</td>";
    if(isLoggedIn()===true) 
    {
	options = options + "<td>&nbsp;</td><td><INPUT type='radio' name='shrd' id='shrd_publ' value='1'/>Public</td>";
	options = options + "</tr></table>";		
    }
    else 
    {
	options = options + "</tr></table>";
	options = options + "<span class='loginNC' style='color:#FF4040'>Login to create public and/or permanent collections</span>";
    }
    
    return options;
}

//tbw LS hack
function getLS_COLL_NAME(){
    var CollWidget= document.getElementById('LSaddItemSelect');
    var Opts=CollWidget.options;
    var collname = new Array();
    for (var i=0; i<Opts.length; i++){
        collname[i]=Opts[i].text;
    }
    return collname;
}


function init() {
    // Init array of existing coll names to prevent duplication
    var pg = getURLParam('page', location.href);
    
    if (pg != "home") 
    {	
	
        //XXX tbw hack for LS here
        var action = getURLParam('a', location.href);
        if (action === "srchls"){
            COLL_NAME = getLS_COLL_NAME();
        }
        else{
            COLL_NAME = getCollArray();// regular way to get array from embedded javascript 
        }
        
        
        
        var widthInPixels = formWidth + "px";
        
        var view = getURLParam('view', location.href);
        
        var browser = navigator.appName;
        
        if (browser =="Microsoft Internet Explorer" && view =="pdf") //Make non-modal iframe for IE pdf 
        {
            YAHOO.mbooks.newCollectionPanel = new YAHOO.widget.Panel("newCollectionPanel", { width:widthInPixels, visible:false, draggable:true, constraintoviewport:true, fixedcenter:true, close:true, modal:false, x:100, y:200, iframe: true} );
        }
        else if (browser =="Microsoft Internet Explorer" && view !="pdf")  //Make non-modal non-iframe for IE non-pdf
        {
            YAHOO.mbooks.newCollectionPanel = new YAHOO.widget.Panel("newCollectionPanel", { width:widthInPixels, visible:false, draggable:true, constraintoviewport:true, fixedcenter:true, close:true, modal:false, x:100, y:200} );
        }
        else if(view =="pdf")  //Make modal iframe for pdf view in other browsers 
        {
            YAHOO.mbooks.newCollectionPanel = new YAHOO.widget.Panel("newCollectionPanel", { width:widthInPixels, visible:false, draggable:true, constraintoviewport:true, fixedcenter:true, close:true, modal:true, x:100, y:200, iframe: true} );
        }
        else //Make modal non-iframe for non-pdf view in other browsers 
        {
            YAHOO.mbooks.newCollectionPanel = new YAHOO.widget.Panel("newCollectionPanel", { width:widthInPixels, visible:false, draggable:true, constraintoviewport:true, fixedcenter:true, close:true, modal:true, x:100, y:200} );
        }		
        
        if(isLoggedIn()===true) {
            YAHOO.mbooks.newCollectionPanel.setHeader("New Collection");			
        }
        else 
        {
            YAHOO.mbooks.newCollectionPanel.setHeader("New Temporary Collection");				
        }
        YAHOO.mbooks.newCollectionPanel.setBody(getNewCollForm());		
        YAHOO.mbooks.newCollectionPanel.render("overlay");
        
        //Character counts
        YAHOO.mbooks.collChars = new YAHOO.widget.Module("collChars", { visible: true });
        YAHOO.mbooks.collChars.render();
        YAHOO.mbooks.descChars = new YAHOO.widget.Module("descChars", { visible: true });
        YAHOO.mbooks.descChars.render();
        
        //Hide error messages
        YAHOO.mbooks.invalidName = new YAHOO.widget.Module("invalidName", { visible: false });
        YAHOO.mbooks.invalidName.render();
        YAHOO.mbooks.errormsg = new YAHOO.widget.Module("errormsg", { visible: false });
        YAHOO.mbooks.errormsg.render();
        
        //Hide selected items and params
        YAHOO.mbooks.itemsSelected = new YAHOO.widget.Module("itemsSelected", { visible: false });
        YAHOO.mbooks.itemsSelected.render();
        YAHOO.mbooks.defaultCollParams = new YAHOO.widget.Module("defaultCollParams", { visible: false });
        YAHOO.mbooks.defaultCollParams.render();
        YAHOO.mbooks.collType = new YAHOO.widget.Module("collType", { visible: false});
        YAHOO.mbooks.collType.hide();
        YAHOO.mbooks.collType.render();
        YAHOO.mbooks.searchParams = new YAHOO.widget.Module("searchParams", { visible: false });
        YAHOO.mbooks.searchParams.hide();
        YAHOO.mbooks.searchParams.render();	
	
	
        //Hide character counts upon submit
        YAHOO.mbooks.charsRemainingColl = new YAHOO.widget.Module("charsRemainingColl", { visible: true });
        YAHOO.mbooks.charsRemainingColl.setBody(charsRemainingColl + "");
        YAHOO.mbooks.charsRemainingColl.render();
        YAHOO.mbooks.charsRemainingDesc = new YAHOO.widget.Module("charsRemainingDesc", { visible: true });
        YAHOO.mbooks.charsRemainingDesc.setBody(charsRemainingDesc + "");
        YAHOO.mbooks.charsRemainingDesc.render();
        
        //Hide unrelated buttons
        YAHOO.mbooks.addC = new YAHOO.widget.Module("addC", { visible: false });
        YAHOO.mbooks.addC.render();
        YAHOO.mbooks.addI = new YAHOO.widget.Module("addI", { visible: false });
        YAHOO.mbooks.addI.render();
        YAHOO.mbooks.addItems = new YAHOO.widget.Module("addItems", { visible: false });
        YAHOO.mbooks.addItems.render();
        
        YAHOO.mbooks.copy = new YAHOO.widget.Module("copy", { visible: false });
        YAHOO.mbooks.copy.render();
        YAHOO.mbooks.move = new YAHOO.widget.Module("move", { visible: false });
        YAHOO.mbooks.move.render();
        
        //Add listener to form submit: This will cover when the form is submitted by clicking any of the submit buttons on the form or by enter in Safari
        YAHOO.util.Event.addListener("newcoll", "submit", interceptNewCollSubmit);
        
        //Add listener to cancel link
        YAHOO.util.Event.addListener("cancel", "click", interceptNewCollSubmit);
    }
}

function SetCharsRemainingColl(charsRemaining) {
    YAHOO.mbooks.charsRemainingColl.setBody(charsRemaining + "");
}
function CheckCollLength() {
    if(maxCharsColl <= 0) { return; }
    if(charsRemainingColl <= 0) { 
	document.newcoll.cn.value = document.newcoll.cn.value.substring(0, maxCharsColl);	
	charsRemainingColl = 0;
    }
    
    var textfield = document.newcoll.cn.value;
    charsTypedColl = textfield.length;
    charsRemainingColl = maxCharsColl - charsTypedColl;
    SetCharsRemainingColl(charsRemainingColl);	
    document.newcoll.cn.focus();
}

function SetCharsRemainingDesc(charsRemaining) {
    YAHOO.mbooks.charsRemainingDesc.setBody(charsRemaining + "");
}

function CheckDescLength() {
    if(maxCharsDesc <= 0) { return; }
    if(charsRemainingDesc <= 0) { 
	document.newcoll.desc.value = document.newcoll.desc.value.substring(0, maxCharsDesc);	
	charsRemainingDesc = 0;
    }
    
    var textfield = document.newcoll.desc.value;
    charsTypedDesc = textfield.length;
    charsRemainingDesc = maxCharsDesc - charsTypedDesc;
    SetCharsRemainingDesc(charsRemainingDesc);	
    document.newcoll.desc.focus();
} 

function checkIt(agent, string) {
    var place = agent.indexOf(string) + 1;
    return place;
}

function initializeButtons() {
    YAHOO.mbooks.addC.hide();
    YAHOO.mbooks.addI.hide();
    YAHOO.mbooks.addItems.hide();
    YAHOO.mbooks.copy.hide();
    YAHOO.mbooks.move.hide();
}

function initializeInputs() {
    document.newcoll.cn.value = DEFAULT_COLL_NAME;
    document.newcoll.desc.value = DEFAULT_DESC;
    charsRemainingDesc = maxCharsDesc;
    SetCharsRemainingDesc(charsRemainingDesc);
    charsRemainingColl = maxCharsColl;
    SetCharsRemainingColl(charsRemainingColl);
}

var interceptNewCollSubmit = function(e) {
    var newCollName = document.newcoll.cn.value;
    
    YAHOO.mbooks.errormsg.hide();
    YAHOO.mbooks.invalidName.hide();
    
    if (this.id=="cancel") {
	YAHOO.mbooks.newCollectionPanel.hide();
	YAHOO.util.Event.preventDefault(e);
	initializeInputs();
    }
    else {
	var trimmedName = trimString(newCollName);
	
	if (newCollName==DEFAULT_COLL_NAME || newCollName=="" || trimmedName=="") {
	    YAHOO.util.Event.preventDefault(e);
	    YAHOO.mbooks.invalidName.setBody("<br/><b>You must enter a collection name</b><br/>");
	    YAHOO.mbooks.invalidName.show();
	}
	else if (newCollName.indexOf('"') > -1) {
	    YAHOO.util.Event.preventDefault(e);
	    YAHOO.mbooks.invalidName.setBody("<br/><b>You can use single quotes but not double quotes. </b><br/>");
	    YAHOO.mbooks.invalidName.show();
	}
	else {
	    dup = 0;
	    for (var i=0; i<COLL_NAME.length; i++) {
		if (newCollName==COLL_NAME[i]) {
		    dup = 1;
		}
	    }
            
	    if (dup==1) {
		YAHOO.util.Event.preventDefault(e);
		YAHOO.mbooks.invalidName.setBody("<br/><b>A collection with that name already exists</b><br/>");
		YAHOO.mbooks.invalidName.show();
	    }
	    else {
		var desc = document.newcoll.desc.value;
		if(desc==DEFAULT_DESC) {
		    desc = "";
		}							
		if (getReferrer() == "CB" || getReferrer() == "CV") { 
		    if (desc==DEFAULT_DESC || desc=="") {
			document.newcoll.desc.value = "";
		    }
		    
		    var action = getURLParam('a', location.href);
		    var query = getURLParam('q1', location.href);
		    
		    //Return to personal collection view after creating a new collection from collection builder
		    if (getReferrer() == "CV" && action != "listsrch") {					
			YAHOO.mbooks.collType.setBody(
			    "<INPUT type='hidden' name='colltype' id='coll_type' value='priv'/>");
			YAHOO.mbooks.collType.show();
		    }					
		    
		    //If search results page, hide coll type and preserve query params 
		    if (action == "listsrch") {					
			YAHOO.mbooks.searchParams.setBody(
			    "<INPUT type='hidden' name='page' id='page_type' value='srchresults'/>" +
				"<INPUT type='hidden' name='q1' id='page_type' value='" + query + "'/>");
			YAHOO.mbooks.searchParams.show();						
			YAHOO.mbooks.collType.hide();
		    }					
		}
		else if (getReferrer() == "PT"  || getReferrer() == "LS") {
                    
                    var priv = document.newcoll.shrd_priv.checked;
                    var shrd;
                    if (priv === true) {
                        shrd = 0;
                    }
                    else {
                        shrd = 1;
                    }
		    initializeInputs();
	            
		    YAHOO.util.Event.preventDefault(e);
		    
		    newCollName = encodeURIComponent(newCollName);
		    desc = encodeURIComponent(desc);
		    
		    //Set URL here
		    setPostURL(getPostURL() + ";cn=" + newCollName + ";desc=" + desc + ";shrd=" + shrd);
		    YAHOO.mbooks.newCollectionPanel.hide();
                    
		    setRequestUrl(getPostURL());
		    processRequest();
		}
		//else { alert("other referrer"); }				
		
	    }
	}
    }
}

//Init method is now called by newCollOverlayPT and newCollOverlayCB so that
//overlay is hidden from screenheaders until invoked
//YAHOO.util.Event.addListener(window, "load", init); 


//End newCollOverlayCore.js

/* /htapps/roger.babel/mdp-web/js/newCollOverlayCore.js */
//Script: newCollOverlayCB.js
//This javascript is used for collection list and collection items views. 

YAHOO.namespace("mbooks");

//Methods for collection items view
var DEFAULT_COLL_MENU_OPTION = "Select Collection";
var NEW_COLL_MENU_OPTION = "[CREATE NEW COLLECTION]";
var SRC_COLLECTION = "";
var ITEMS_SELECTED = [];
var DEFAULT_SLICE_SIZE=25;//XXX need to get this dynamically from xsl/javascript?

function initCB() {
	
	init();	
	
	//This is the confirmation message "# items have.." that appears after a successful action
	//The alert id may or may exist in the html, but when it does, it will be hidden when
	//a error message is displayed.
	//YAHOO.mbooks.errormsg is already declared in newCollOverlayCore.js
	YAHOO.mbooks.alert = new YAHOO.widget.Module("alert", { visible: false });
	YAHOO.mbooks.alert.render();	 

	YAHOO.mbooks.defaultCollParams.setBody("<input type='hidden' id='newcoll_sz' name ='sz' value='" + DEFAULT_SLICE_SIZE +"'>"+
		"<input type='hidden' id='newcoll_pn' name ='pn' value='1'>" +
		"<input type='hidden' id='newcoll_sort' name ='sort' value='title_a'>");
	YAHOO.mbooks.defaultCollParams.show();

	populateSelected();

	setReferrer("CB");

}

/*********************************************************************
   function getCgiParams

   usage:  var p = getCgiParams();
   var action =p.a
   var title =p.ti
   WARNING:  There seems to be a problem calling with array notation
   i.e.  Do not use   var action =p[a]
***********************************************************************/
function getCgiParams(){
  var params = {}; //empty hash
  var loc = window.location.toString();
  var temp = loc.split(/\?/);
  var pairs = temp[1].split(/\;|\&/);
  for (var i = 0; i < pairs.length; i++){
    var keyvalue = pairs[i].split(/\=/);
    var key = keyvalue[0];
    var value = keyvalue[1];
    params[key] = value;
  }
  return params;
}

function populateHiddenItemsField() {
	var results = "<INPUT type='hidden' value='" + SRC_COLLECTION + "' name='c' id='c'>";
	for (var i=0;i<ITEMS_SELECTED.length;i++) {
		results = results + "<INPUT type='hidden' value='" + ITEMS_SELECTED[i] + "' name='iid' id='id'>";
	}

	YAHOO.mbooks.itemsSelected.setBody(results);
	YAHOO.mbooks.itemsSelected.show();
	return results;
}

function populateSelected() {
	var frm = document.getElementById("form1");
	ITEMS_SELECTED = [];

	for (var i=0;i<frm.length;i++)
	{
          //	don't include the "checkAll" button :tbw
          if(frm.elements[i].type == 'checkbox' && frm.elements[i].checked && frm.elements[i].id !=='checkAll') {
		   ITEMS_SELECTED.push(frm.elements[i].value);
		}

	 }
}

function addPagingParams()
{
  // get hidden params and use them to replace the defaults in newcoll form
  var params=getCgiParams();

  if (params['sz'] != null)
  {
    document.newcoll.elements["newcoll_sz"].value = params['sz'];
  }
  if (params['pn'] != null)
  {
    document.newcoll.elements["newcoll_pn"].value = params['pn'];
  }
  if (params['sort'] != null)
  {
	  document.newcoll.elements["newcoll_sort"].value = params['sort'];
  }
  
}

var interceptNewCollMenu = function(e) 
{
	initCB();

        //tbw IE workaround
        var a_action;
        if (this.id == "copyit"){a_action ="copyit" };
        if (this.id == "movit"){a_action ="movit" };
        if (this.id == "delit"){a_action ="delit" };
        var myForm = document.getElementById('form1');
        myForm.a.setAttribute('value', a_action);
        //tbw

	YAHOO.mbooks.errormsg.hide();

	var selectedCollectionNameHTML = document.getElementById('c2')[document.getElementById('c2').selectedIndex].innerHTML;
	var selectedCollectionNameVal = document.getElementById('c2').value;

	if(ITEMS_SELECTED.length==0) 
	{
		YAHOO.mbooks.errormsg.setBody("<div class='error'>You must choose an item</div>");
		YAHOO.mbooks.errormsg.show();
		YAHOO.util.Event.preventDefault(e);
	}
	//Check to see if dropdown item selected is still "Select Collection"
	//this is different for ie than other browsers, thus the two conditionnels
	else if( ((selectedCollectionNameHTML==DEFAULT_COLL_MENU_OPTION) || (selectedCollectionNameVal==DEFAULT_COLL_MENU_OPTION)) &&
		(this.id == "copyit" || this.id =="movit" || this.id =="addI")) 
	{
		YAHOO.mbooks.errormsg.setBody("<div class='error'>You must select a collection.</div>");
		YAHOO.mbooks.errormsg.show();
                YAHOO.mbooks.alert.hide();
		YAHOO.util.Event.preventDefault(e);
	}
	//Check to see if dropdown item selected is new collection
	//this is different for ie than other browsers, thus the two conditionnels
	else if( (selectedCollectionNameHTML==NEW_COLL_MENU_OPTION) || (selectedCollectionNameVal==NEW_COLL_MENU_OPTION)) 
	{

		SRC_COLLECTION = document.form1.c.value;
		populateHiddenItemsField();
		addPagingParams();

		YAHOO.util.Event.preventDefault(e);

		//initializeButtons();

		if(this.id == "addC")
		{
			YAHOO.mbooks.addC.show();
		}
		else if(this.id == "addI")
		{
			document.newcoll.elements["additnc"].textContent = "Add " + ITEMS_SELECTED.length + " item(s)";
			document.newcoll.elements["additnc"].value = document.newcoll.elements["additnc"].textContent;
			document.newcoll.elements["action"].value="additnc";
			YAHOO.mbooks.addI.show();
		}
		else if(this.id == "copyit")
		{
			document.newcoll.elements["copyitnc"].textContent = "Copy " + ITEMS_SELECTED.length + " item(s)";
			document.newcoll.elements["copyitnc"].value = document.newcoll.elements["copyitnc"].textContent;
			document.newcoll.elements["action"].value="copyitnc";
			YAHOO.mbooks.copy.show();
		}

		else if(this.id == "movit")
		{
			document.newcoll.elements["movitnc"].textContent = "Move " + ITEMS_SELECTED.length + " item(s)";
			document.newcoll.elements["movitnc"].value = document.newcoll.elements["movitnc"].textContent;
			document.newcoll.elements["action"].value="movitnc";
			YAHOO.mbooks.move.show();
		}

		//Add listener to cancel link	
		YAHOO.util.Event.addListener("cancel", "click", interceptNewCollSubmit);
		
		YAHOO.mbooks.charsRemainingColl.show();
		YAHOO.mbooks.charsRemainingDesc.show();
		YAHOO.mbooks.newCollectionPanel.show();
	}
	else 
	{
            YAHOO.mbooks.errormsg.hide();
	    YAHOO.util.Event.preventDefault(e);

            //tbw IE6 workaround
            var addNumItems = ITEMS_SELECTED.length;
            var COLL_SIZE_ARRAY = getCollSizeArray();
            var coll_id = selectedCollectionNameVal;
            var collSize = COLL_SIZE_ARRAY[coll_id];
            if (confirmLarge(collSize, addNumItems)) {
                myForm.submit();
            }
	}
}


var interceptEditCollButton = function(e) {
	initCB();

	YAHOO.mbooks.errormsg.hide();

	var editCollName = document.getElementById('CollNameEdit').value;
        var userError = 0;
        if (editCollName==DEFAULT_COLL_MENU_OPTION || editCollName==NEW_COLL_MENU_OPTION) {
                // Prevent use of system names
		YAHOO.mbooks.errormsg.setBody('<div class="error">"' + editCollName + '" cannot be used to name a collection.  Please choose a different name.</div>');
                userError = 1;
	}
        else {
                var nameExists = 0;
                var currCollName = document.getElementById('currCollName').innerHTML;
                for (var i=0; i<COLL_NAME.length; i++) {
                        if(editCollName==COLL_NAME[i]) {
                                if (editCollName!=currCollName) {
                                        nameExists = 1;
                                }
                        }
                }
                if (nameExists==1) {
                        YAHOO.mbooks.errormsg.setBody('<div class="error">You already have a collection named "' + editCollName + '"</div>');
                        userError = 1;
                }
        }

        if (userError==1) {
                YAHOO.util.Event.preventDefault(e);
                YAHOO.mbooks.errormsg.show();
                YAHOO.mbooks.alert.hide();
        }
        else {
		var editForm = document.getElementById('editcoll');
		editForm.submit();
	}
}

YAHOO.util.Event.addListener("copyit", "click", interceptNewCollMenu);
YAHOO.util.Event.addListener("movit",  "click", interceptNewCollMenu);
YAHOO.util.Event.addListener("delit",  "click", interceptNewCollMenu);
YAHOO.util.Event.addListener("editc",  "click", interceptEditCollButton);

//Methods for collection list view

function initCV() {
	
	init();
	setReferrer("CV");		
}

var interceptNewCollButton = function(e) {
	initCV();
	
	YAHOO.util.Event.preventDefault(e);

	initializeButtons();	

	YAHOO.mbooks.addC.show();
	document.newcoll.elements["action"].value="addc";
		
	//Add listener to cancel link
	YAHOO.util.Event.addListener("cancel", "click", interceptNewCollSubmit);	
	
	YAHOO.mbooks.newCollectionPanel.show();
}

YAHOO.util.Event.addListener("createNewColl", "click", interceptNewCollButton);

//End newCollOverlayCB.js

/* /htapps/roger.babel/mb/web/js/newCollOverlayCB.js */

function get_selected(id)
{
  var s=document.getElementById(id);
  var indexSelected = s.selectedIndex;
  var selected = s.options[indexSelected].value;
  return selected;

}

function jumpToColl()
{
  var l = window.location;
  var host = l.host;
  var path = l.pathname;
  var prot = l.protocol;
  var params = l.search;

  //  alert("input host is "+ host + " path is " + path +" params is " + params + "proto is " + prot);

  var c = get_selected('jumpToColl');

  var new_params = 'a=listis;c=' + c ;

  /** right now we only get sz param.  Do we want sort param as well**/
  var sz;
  var regex =/(sz=[^\&\;]+)[\&\;]/;
    
  var result = params.match(regex);
  if (result !== null)
  {
    sz = result[1];
    // alert("sz is now " + sz + "[1] is " + result[1] + "2" + result[2] + "0" +result[0]);
    new_params = new_params + ';' + sz +';';
  }

  /* When called from pageturner or LS (pt or ls) go to collection builder (mb) */
  path = path.replace(/ptsearch/g, "mb");
  path = path.replace(/pt/g, "mb");
  path = path.replace(/ls/g, "mb");

  var newloc = prot +'//'+ host + path +'?' + new_params;
  //  alert("newloc is "+ newloc);
  window.location = newloc;

}



/**Functions for sorting widget  **/
function doSort()
{
  var temploc= window.location.toString();
  var new_sort = get_selected('SortWidgetSort');
  var new_loc;

  //if there is a sort replace it
  if (/sort/.test(temploc))
  {
    new_loc = temploc.replace(/sort=(title|auth|date|rel)_[ad]/,"sort="+new_sort);
  }
  else
  {
    // otherwise add it  do we need to add & or ; ?
    new_loc = temploc + ";sort=" + new_sort;
  }
  window.location=new_loc;
}

/**End functions for sort widget   **/

/** 
Slice widget code
When user changes slice size in slice size widget, initiate a redisplay the list with only that number of records/slice
**/

/**  can't discover how to do an "onChange" in YUI so using regular javascript in the XSL/HTML instead of YUI**/
//YAHOO.util.Event.addListener("sz", "click", redisplay_new_slice_size);

function get_new_size(which)
{
  var s=document.getElementById(which);
  var indexSelected = s.selectedIndex;
  var new_size = s.options[indexSelected].value;
  return new_size;
}


function redisplay_new_slice_size(which_paging)
{
  var which = which_paging;
  var temploc = window.location.toString();
  var new_size = get_new_size(which);
  var new_loc1;
  var new_loc2;

  //fix for fac bac solr  if there is a new size we need to redo solr search because solr is doing the paging
  if (/a=listsrchm/.test(temploc))
  {
    // alert("temloc is "+temploc);
     new_loc1=temploc.replace(/a=listsrchm/,"a=srchm");
     temploc=new_loc1;
  }

  //if there is a sz replace it
  if (/sz/.test(temploc))
  {
     new_loc1=temploc.replace(/sz=(\d+)/,"sz="+new_size);
  }
  else
  {
    // otherwise add it  do we need to add & or ; ?
    new_loc1=temploc+ ";sz=" + new_size;
  }

  if (/pn/.test(new_loc1))
    {
      new_loc2=new_loc1.replace(/pn=(\d+)/,"pn=1"); 
      //reset page to first page
    }
    else
    {
      new_loc2=new_loc1 + ";pn=1";
    }

  //   alert("new_loc1 is " + new_loc1 +"\ncurrent loc is "+ temploc + "\nnew size is" + new_size + "\nnew_loc2 is " + new_loc2 );

    location=new_loc2;
}



/**  End slice size code **/


/** XXX  now this does not only contain the checkall code so these global vars are probably not ok **/
/***

var tag='input' ;//checkbox
var class='iid';
***/
var root=document.getElementById('itemTable');

var checkboxes;

var  checkIt= function(el)
{
  el.checked=true;
};

var  unCheckIt= function(el)
{
  el.checked=false;
};
  
var checkAll =function()
{
  checkboxes = YAHOO.util.Dom.getElementsByClassName('iid','input',root,checkIt);
};


var uncheckAll =function()
{
  checkboxes = YAHOO.util.Dom.getElementsByClassName('iid','input',root,unCheckIt);
};

var changeAllCheckboxes  =  function(e)
{
  var master;
  if (typeof e.currentTarget != 'undefined')
  {
     master=e.currentTarget;
  }
  else
  {
    //DOM workaround for I.E.
          master=e.srcElement;
  }
 
  if (master.checked === true)
  {
    checkAll();
  }
  else
  {
    uncheckAll();
  }
};


function initCheckall()
{
  YAHOO.util.Event.addListener("checkAll", "click", changeAllCheckboxes);

}

// this is how to do a body onload in YUI : YAHOO.util.Event.addListener(window, "load", initCheckall);

/****************************************************************************************/
/** general js utility function**/


function doYouReally(collname)
{
  return  confirm("Really delete collection: " + collname + "?");
}

function confirmLarge(collSize, addNumItems) {
    if (collSize + addNumItems <= 1000) {
        //alert("Coll will remain small ...");
        return true;
    }
    else if (collSize <= 1000) {
        var numStr;
        if (addNumItems > 1) {
            numStr = "these " + addNumItems + " items";
        }
        else {
            numStr = "this item";
        }
        var msg = "Note: Your collection contains " + collSize + " items.  Adding " + numStr + " to your collection will increase its size to more than 1000 items.  This means your collection will not be searchable until it is indexed, usually within 48 hours.  After that, just newly added items will see this delay before they can be searched. \n\nDo you want to proceed?"
    
        var answer = confirm(msg);
    
        if (answer) {
            //alert("Ok adding ...");
            return true;
        }
        else {
            //alert ("Not adding ....");
            return false;
        }
    }
    else {
        //alert("Coll already large ...");
        return true;
    }
}


//End listUtils.js

/* /htapps/roger.babel/mdp-web/js/listUtils.js */
//Script: overlayUtils.js

function clickclear(thisfield, defaulttext) {
    if (thisfield.value == defaulttext) {
        thisfield.value = "";
    }
}

function clickrecall(thisfield, defaulttext) {  
    if (thisfield.value == "") {
        thisfield.value = defaulttext;
    }
}

//Javascript function below adapted from http://snipplr.com/view/463/get-url-params-2-methods/ 
function getURLParam(strParamName, strHref) {
    var strReturn = "";
    var link ="";
    if (strHref !== null) {
	link = strHref;
    }
    
    if ( link.indexOf("?") > -1 ) {
	var strQueryString = link.substr(link.indexOf("?")).toLowerCase();
	var aQueryString;
	
	//If URL contains &, split on &. If not, assume ;
	//This is here to catch the two types of URLs in MBooks
	//The prev, next buttons use ;
	//The page number form for image and ocr view uses &
	if (strHref.indexOf("&") > -1) { 
	    aQueryString = strQueryString.split("&");
	}
	else {
	    aQueryString = strQueryString.split(";");
	}
        
	for ( var iParam = 0; iParam < aQueryString.length; iParam++ ) {			
	    if (aQueryString[iParam].indexOf(strParamName + "=") > -1 ) {
		var aParam = aQueryString[iParam].split("=");
		strReturn = aParam[1];
		break;
	    }
	}
    }
    
    return strReturn;
}


//Strip xml PI <?xml ...?> from input string
function stripXMLPI(inputText) {
    var returnText = inputText.replace(/<\?xml.*\?>/, "");
    return returnText;
}

function trimString (str) {
    return str.replace(/^\s+/g, '').replace(/\s+$/g, '');
}

//end of overlayUtils.js

/* /htapps/roger.babel/mdp-web/js/overlayUtils.js */

YAHOO.namespace("mbooks");

var sDEBUG = false;
//var sDEBUG = true;


function dMsg(msg) {
    if (sDEBUG === true) {
        alert(msg);
    }
}


function displayErrorMsg(Msg) {
    search_errormsg.setBody(Msg);
    search_errormsg.show();
}

/*********************************************************************
   function getCgiParams

XXX copied from newCollOverlayCB.js  Should go in some common utility js!!

   usage:  var p = getCgiParams();
   var action =p.a
   var title =p.ti
   WARNING:  There seems to be a problem calling with array notation
   i.e.  Do not use   var action =p[a]
***********************************************************************/
function getCgiParams(){
    var params = {}; //empty hash
    var loc = window.location.toString();
    var temp = loc.split(/\?/);
    if (temp[1]) {
        var pairs = temp[1].split(/\;|\&/);
        for (var i = 0; i < pairs.length; i++){
            var keyvalue = pairs[i].split(/\=/);
            var key = keyvalue[0];
            var value = keyvalue[1];
            params[key] = value;
        }
    }
    return params;
}


// Get form function for items
function getForm(e) {
    return  document.getElementById('itemlist_searchform');
}

function initSearchErrorMessage(formId) {
    // For list_items and list_search_results need to use same div as other javascript
    //So we ignore the formId passed in
    var MsgId='errormsg';
    search_errormsg = new YAHOO.widget.Module(MsgId, { visible: false });
    search_errormsg.render();
}


function processSearch(e) {
    dMsg("processSearch was called");
    
    var myForm = getForm(e);
    var q1 = myForm.q1.value;
    var formId = myForm.id;
    
    // pass form  id into error message processing for use in list colls
    initSearchErrorMessage(formId);
    
    q1 = q1.replace(/^\s*|\s*$/g,'');
    
    if (q1 === "") {
        var emptyQueryMsg="<div class='error'>Please enter a search term.</div>";
        displayErrorMsg(emptyQueryMsg);
        return false;
    }
    else {
        return myForm.submit();
    }
}

var interceptSubmitByEnter = function(e) {
    YAHOO.util.Event.stopEvent(e);
    processSearch(e);
    return false;
};

/****** This code moved from searchAjaxItems.js now that we are not doing search on list_coll page we don't need
        separate searchAjaxColl.js and searchAjaxItems.js ******/




/*****************************************************************************
This is not needed or used for now:
var interceptSubmitByClick = function(e)
{
  processSearch(e);
}
YAHOO.util.Event.addListener("srch", "click", interceptSubmitByClick);
*****************************************************************************/

YAHOO.util.Event.addListener("itemlist_searchform", "submit", interceptSubmitByEnter);



/* /htapps/roger.babel/mdp-web/js/search.js */
// define a console if not exists
if ( window.console === undefined ) {
    window.console = {
        log : function() { }
    }
}

var HT = HT || {};

HT.track_pageview = function(args) {
  if ( window.location.hash ) {
    args = $.extend({}, { colltype : window.location.hash.substr(1) }, args);
  }
  var params = $.param(args);
  if ( params ) { params = "?" + params; }
  if ( pageTracker != null ) {
    var fn = function() {
        try {
            pageTracker._trackPageview(window.location.pathname + params);
        } catch(e) { console.log(e); }
    };
    
    _gaq.push(fn);
  }
}

HT.track_event = function(args) {
    args = $.extend({}, { category : 'MB' }, args)
    if ( pageTracker != null ) {

        var fn = function() {
            try {
                pageTracker._trackEvent(args.category, args.action, args.label, undefined, true);
            } catch(e) { console.log(e); }
        };
        
        _gaq.push(fn);
    }
}
/* /htapps/roger.babel/mb/web/js/mb.js */
$(document).ready(function() {
  $(".tracked").click(function() {
    var href = $(this).attr('href');
    pageTracker._trackEvent('cbActions', 'click', "CB - branded " + $(this).text() + " link");
    setTimeout(function() {
      window.location.href = href;
    }, 500);
    return false;
  })
})
/* /htapps/roger.babel/mb/web/js/tracking.js */
