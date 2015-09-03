eg.module("infiniteGrid",[window.jQuery, eg, window, window.Outlayer, window.global],function($, ns, global, Outlayer){
	if(!Outlayer) {
		ns.InfiniteGrid = ns.Class({});
		return;
	}

	// for IE -- start
	var hasEventListener = !!global.addEventListener;
	var eventPrefix = hasEventListener? "" : "on";
	var bindMethod = hasEventListener ? "addEventListener" : "attachEvent";
	var unbindMethod = hasEventListener ? "removeEventListener" : "detachEvent";
	function bindImage(ele, callback) {
		ele[bindMethod](eventPrefix + "load", callback, true);
		ele[bindMethod](eventPrefix + "error", callback, true);
	}
	function unbindImage(ele, callback) {
		ele[unbindMethod](eventPrefix + "load", callback, true);
		ele[unbindMethod](eventPrefix + "error", callback, true);
	}
	// for IE -- end
	function clone(target, source, what) {
		var s;
		$.each(what, function(i,v) {
			s = source[v];
			if(s != null) {
				if($.isArray(s)) {
					target[v] = $.merge([], s);
				} else if($.isPlainObject(s)) {
					target[v] = $.extend(true, {}, s);
				} else {
					target[v] = s;
				}
			}
		});
		return target;
	}

	var InfiniteGridCore = Outlayer.create("InfiniteGrid");
	$.extend(InfiniteGridCore.prototype, {
		resetLayout : function() {
			this._resetLayout();
			this._isLayoutInited = true;
		},
		// @override (from layout)
		_resetLayout : function() {
			if(!this._isLayoutInited) {
				this._registGroupKey(this.options.defaultGroupKey, this.items);
			}
			this.getSize();	// create size property
			this._measureColumns();
		},
		// @override
		_getContainerSize : function() {
			return {
				height: Math.max.apply( Math, this._appendCols ),
				width : this.size.outerWidth
			};
		},
		// @override
		_getItemLayoutPosition : function(item) {
			if(this._equalItemSize) {
				item.size = this._equalItemSize;
			} else {
				item.getSize();
			}
			(item.isAppend == null) && (item.isAppend = true);
			var y, shortColIndex,
				isAppend = item.isAppend,
				cols = isAppend ? this._appendCols : this._prependCols;
			y = Math[isAppend ? "min" : "max"].apply( Math, cols );
			shortColIndex = $.inArray( y , cols );
			cols[shortColIndex] = y + (isAppend ? item.size.outerHeight : -item.size.outerHeight);

			return {
				x: this.columnWidth * shortColIndex,
				y: isAppend ? y : y-item.size.outerHeight
			};
		},
		updateCols : function(isAppend) {
			var col = isAppend ? this._appendCols : this._prependCols,
				items = this._getColItems(isAppend),
				base = this._isFitted || isAppend ? 0 : this.getMinY(items);
			for(var i=0, item, len = col.length; i < len; i++) {
				if(item = items[i]) {
					col[i] = item.position.y + ( isAppend ? item.size.outerHeight : - base);
				} else {
					col[i] = 0;
				}
			}
			return base;
			// console.trace(isAppend ? "_appendCols" : "_prependCols", col, base);
		},
		getMinY : function(items) {
			return Math.min.apply( Math, $.map(items, function(v) { 				
				return v ? v.position.y : 0;
			}) );
		},
		_measureColumns : function() {
			var containerWidth = this.size.outerWidth,
				columnWidth = this._getColumnWidth(),
				cols = containerWidth / columnWidth,
				excess = columnWidth - containerWidth % columnWidth;
			// if overshoot is less than a pixel, round up, otherwise floor it
			cols = Math.max( Math[ excess && excess < 1 ? "round" : "floor" ]( cols ), 1);
			// reset column Y
			this._appendCols = [];
			this._prependCols = [];
			while(cols--) {
				this._appendCols.push( 0 );
				this._prependCols.push( 0 );
			}
		},
		_getColumnWidth : function() {
			if(!this.columnWidth) {
				var el = this.items[0] && this.items[0].element,
					size;
				if(el) {
					/* jshint ignore:start */
					size = getSize(el);
					/* jshint ignore:end */
				} else {
					size = {
						outerWidth : 0,
						outerHeight : 0
					};
				}
				this.options.isEqualSize && (this._equalItemSize = size);
				this.columnWidth = size.outerWidth || this.size.outerWidth;
			}
			return this.columnWidth;
		},
		_getColIdx : function(item) {
			return parseInt(item.position.x/parseInt(this.columnWidth,10),10);
		},
		_getColItems : function(isTail) {
			var len = this._appendCols.length,
				colItems = new Array(len),
				item, idx, count = 0,
				i = isTail ? this.items.length-1 : 0;
			while( item = this.items[i] ) {
				idx = this._getColIdx(item);
				if( !colItems[idx] ) {
					colItems[idx] = item;
					if(++count === len) {
						return colItems;
					}
				}
				i += isTail ? -1 : 1;
			}
			return colItems;
		},
		clone : function(target, source) {
			clone(target, source, ["_equalItemSize", "_appendCols", "_prependCols", "columnWidth", "size", "options"]);
			target.items = target.items || [];
			target.items.length = source.items.length;
			$.each(source.items, function(i) {
				target.items[i] = clone(target.items[i] || {}, source.items[i], ["position", "size", "isAppend", "groupKey"]);
			});
			return target;
		},
		itemize : function(elements, groupKey) {
			var items = this._itemize(elements);
			this._registGroupKey(groupKey, items);
			return items;
		},
		_registGroupKey : function(groupKey, array) {
			if( groupKey != null ) {
				for(var i=0,v; v = array[i]; i++) {
					v.groupKey = groupKey;
				}
			}
		},		
		// @override
		destroy : function() {
			this.off();
			Outlayer.prototype.destroy.apply(this);
		}
	});
	
	/**
	 * To build Grid layout UI. 
	 * InfiniteGrid is composed of Outlayer. but this component supports recycle-dom. 
	 * the more you add contents, a number of DOM are fixed.
	 * @group egjs
	 * @ko 그리드 레이아웃을 구성하는 UI 컴포넌트. InfiniteGrid는 Outlayer로 구성되어 있다. 하지만, 이 컴포넌트는 recycle-dom을 지원한다. 
	 * 컨텐츠를 계속 증가하면 할수록 일정한 DOM 개수를 유지할수 있다.
	 * @class
	 * @name eg.InfiniteGrid
	 * @extends eg.Component
	 *
	 * @param {HTMLElement|String|jQuery} element wrapper element <ko>기준 요소</ko>
	 * @param {Object} [options]
	 * @param {Number} [options.itemSelector] specifies which child elements will be used as item elements in the layout. <ko>레이아웃의 아이템으로 사용될 엘리먼트들의 셀렉터</ko>
	 * @param {Boolean} [options.isEqualSize] determine if the size of all of items are same. <ko> 모든 아이템의 사이즈가 동일한지를 지정한다</ko>
	 * @param {Boolean} [options.defaultGroupKey] when initialzed if you have items in markup, groupkey of them are 'defaultGroupkey' <ko>초기화할때 마크업에 아이템이 있다면, defalutGroupKey를 groupKey로 지정한다</ko>
	 * @param {Boolean} [options.count] if count is more than zero, grid is recyclied. <ko>count값이 0보다 클 경우, 그리드는 일정한 dom 개수를 유지한다</ko>
	 *
	 *  @see Outlayer {@link https://github.com/metafizzy/outlayer}
	 */
	ns.InfiniteGrid = ns.Class.extend(ns.Component, {
		construct : function(el, options) {
			var opts = $.extend({
				"isEqualSize" : false,
				"defaultGroupKey" : null,
				"count" : 30
			}, options);
			opts["transitionDuration"] = 0;		// don't use this option.
			opts["isInitLayout"] = false;	// isInitLayout is always 'false' in order to controll layout.
			this.core = new InfiniteGridCore(el, opts).on("layoutComplete", $.proxy(this._onlayoutComplete,this));
			this._reset();			
			if(this.core.$element.children().length > 0) {
				this.layout();
			}
		},
		_onlayoutComplete : function(e) {
			var distance = 0, 
				isAppend = this._isAppendType;
			if(isAppend === false) {
				this._isFitted = false;
				this._fit(true);
				distance = this.core.items[e.length].position.y;
			}
			this._isProcessing = false;
			this._isAppendType = null;
			this.trigger("layoutComplete", {
				target : e.concat(),
				isAppend : isAppend,
				distance : distance
			});
		},
		/**
		 * Get current status
		 * @ko infiniteGrid의 현재상태를 반환한다.
		 * @method eg.InfiniteGrid#getStatue
		 * @return {Object} infiniteGrid status Object
		 */
		getStatus : function() {
			var data=[];
			for(var p in this) {
			    if(this.hasOwnProperty(p) && /^_/.test(p)) {
			        data.push(p);
			    }
			}
			return {
				core : this.core.clone({}, this.core),
				data : clone({}, this, data),
				html : this.core.$element.html(),
				cssText : this.core.element.style.cssText
			};
		},
		/**
		 * Set to current status
		 * @ko infiniteGrid의 현재상태를 설정한다.
		 * @method eg.InfiniteGrid#setStatus
		 * @param {Object} status Object
		 */
		setStatus : function(status) {
			this.core.element.style.cssText = status.cssText;
			this.core.$element.html(status.html);
			this.core.items = this.core.itemize( this.core.$element.children().toArray() );
			this.core.clone(this.core, status.core);
			$.extend(this, status.data);
		},
		/**
		 * Check if element is appending or prepending
		 * @ko append나 prepend가 진행중일 경우 true를 반환한다.
		 * @method eg.InfiniteGrid#isProcessing
		 * @return {Boolean}
		 */
		isProcessing : function() {
			return this._isProcessing;
		},
		/**
		 * Check if elements are recycling mode
		 * @ko recycle 모드 여부를 반환한다.
		 * @method eg.InfiniteGrid#isRecycling
		 * @return {Boolean}
		 */
		isRecycling : function() {
			return this.core.options.count > 0 && this._isRecycling;
		},
		/**
		 * Get group keys
		 * @ko 그룹키들을 반환한다.
		 * @method eg.InfiniteGrid#getGroupKeys
		 * @return {Array} groupKeys
		 */
		getGroupKeys : function() {
			var result = [];
			if(this.core._isLayoutInited) {
				for(var i=0,item; item = this.core.items[i]; i++) {
					result.push(item.groupKey);
				}
			}
			return result;
		},
		/**
		 * Rearrang layout
		 * @ko 레이아웃을 재배치한다.
		 * @method eg.InfiniteGrid#layout
		 */
		layout : function() {
			this._isProcessing = true;
			this._isAppendType = true;
			for(var i=0,v; v = this.core.items[i]; i++) {
				v.isAppend = true;
			}
			this.core.layout();
		},
		/**
		 * Append elemensts
		 * @ko 엘리먼트를 append 한다.
		 * @method eg.InfiniteGrid#append
		 * @param {Array} elements to be appended elements <ko>append될 엘리먼트 배열</ko>
		 * @param {Number|String} [groupKey] to be appended groupkey of elements<ko>append될 엘리먼트의 그룹키</ko>
		 * @return {Number} length a number of elements
		 */
		append : function(elements, groupKey) {
			if(this._isProcessing ||  elements.length === 0 ) { return; }

			this._isRecycling = (this.core.items.length + elements.length) >= this.core.options.count;
			this._insert(elements, groupKey, true);
			return elements.length;
		},
		/**
		 * Prepend elemensts
		 * @ko 엘리먼트를 prepend 한다.
		 * @method eg.InfiniteGrid#prepend
		 * @param {Array} elements to be prepended elements <ko>prepend될 엘리먼트 배열</ko>
		 * @param {Number|String} [groupKey] to be prepended groupkey of elements<ko>prepend될 엘리먼트의 그룹키</ko>
		 * @return {Number} length a number of elements
		 */
		prepend : function(elements, groupKey) {
			if(!this.isRecycling() || this._isProcessing || elements.length === 0 ) { return; }
			if(elements.length - this._contentCount  > 0) {
				elements = elements.slice(elements.length - this._contentCount);
			}
			// prepare fit content
			this._fit();
			this._insert(elements, groupKey, false);
			return elements.length;
		},
		_insert : function(elements, groupKey, isAppend ) {
			if(elements.length === 0) {
				return;
			}
			var items = this.core.itemize(elements, groupKey);
			this._isAppendType = isAppend;
			this._contentCount += isAppend ? items.length : -items.length;
			this.isRecycling() && this._adjustRange(isAppend, elements.length);
			this.core.$element[isAppend ? "append" : "prepend"](elements);
			for(var i=0,item; item = items[i]; i++) {
				item.isAppend = isAppend;
			}
			if(isAppend) {
				this.core.items = this.core.items.concat( items );
			} else {
	  			this.core.items = items.concat(this.core.items.slice(0));
				items = items.reverse();
			}
			!this.core._isLayoutInited && this.core.resetLayout();		// for init-items

			var needCheck = this._checkImageLoaded(elements),
				checkCount = needCheck.length;
			checkCount > 0 ? this._waitImageLoaded(items, checkCount) : this.core.layoutItems( items, true );
		},
		_adjustRange : function (isTop, addtional) {
			var targets, idx, diff = this.core.items.length + addtional - this.core.options.count;
			// console.info("cur-tot", this.core.items.length ,"diff", diff, "andditional", addtional);
			if(diff <= 0 || (idx = this._getDelimiterIndex(isTop, diff)) < 0 ) {
				return;
			}
			// console.warn("_adjustRange", idx, this.getGroupKeyRange(), "+" , addtional)
			if(isTop) {
				targets = this.core.items.slice(0,idx);
				this.core.items = this.core.items.slice(idx);
				this._isFitted = false;
			} else {
				targets = this.core.items.slice(idx);
				this.core.items = this.core.items.slice(0, idx);
			}
			// @todo improve performance
			for(var i=0, item, len=targets.length; i < len; i++) {
				item = targets[i].element;
				item.parentNode.removeChild( item );
			}
		},
		_getDelimiterIndex : function(isTop, removeCount) {
			var len = this.core.items.length;
			if( len < removeCount) {
				return -1;
			}
						
			var	i, idx = 0,
				baseIdx = isTop ? removeCount-1 : len-removeCount,
				targetIdx = baseIdx + (isTop ? 1 : -1),
				groupKey = this.core.items[baseIdx].groupKey;
			// console.info("_getDelimiterIndex", "baseIdx", baseIdx, "targetIdx", targetIdx, "removeCount",removeCount,groupKey);
			if(groupKey != null && groupKey === this.core.items[targetIdx].groupKey) {
				if(isTop) {
					for(i=baseIdx; i>0; i--) {
						if(groupKey !== this.core.items[i].groupKey) {
							break;
						}
					}
					idx =  i === 0 ? -1 : i+1;
				} else {
					for(i=baseIdx; i<len; i++) {
						if(groupKey !== this.core.items[i].groupKey) {
							break;
						}
					}
					idx = i === len ? -1 : i;
				}
			} else {
				idx = isTop? targetIdx : baseIdx;
			}
			return idx;
		},
		// fit size
		_fit : function(applyDom) {
			// for caching
			if(this.core.options.count <= 0) {
				this._fit = $.noop();
				this._isFitted = true;
				return;
			}
			if(this._isFitted) {
				return;
			}
			var item, height, i=0, 
				y = this.core.updateCols();	// for prepend
			while(item = this.core.items[i++]) {
				item.position.y -= y;
				applyDom && item.css( {
					"top" : 	item.position.y + "px"
				});
			}
			this.core.updateCols(true);	// for append
			height = this.core._getContainerSize().height;
			applyDom && this.core._setContainerMeasure( height, false );
			this._isFitted = true;
		},
		/**
		 * Clear elements and data
		 * @ko 엘리먼트와 데이터를 지운다.
		 * @method eg.InfiniteGrid#clear
		 */
		clear : function() {
			this.core.$element.empty();
			this.core.items.length = 0;
			this._reset();
			this.layout();
		},
		_reset : function() {
			this._isAppendType = null;
			this._isFitted = true;
			this._isProcessing = false;
			this._isRecycling = false;
			this._contentCount = this.core.items.length;
		},
		_checkImageLoaded : function(elements) {
			var needCheck = [];
			$(elements).each(function(k,v) {
				if(v.nodeName === "IMG") {
					!v.complete && needCheck.push(v);
				} else if(v.nodeType && (v.nodeType === 1 || v.nodeType === 9 || v.nodeType === 11)) {	// ELEMENT_NODE, DOCUMENT_NODE, DOCUMENT_FRAGMENT_NODE
					needCheck = needCheck.concat($(v).find("img").filter(function(fk,fv) {
						return !fv.complete;
					}).toArray());
				}
			});
			return needCheck;
		},
		_waitImageLoaded : function(items, checkCount) {
			var core = this.core;
			function onCheck() {
				checkCount--;
				if(checkCount <= 0) {
					unbindImage(core.element, onCheck);
					core.layoutItems( items, true );
				}
			}
			bindImage(this.core.element, onCheck);
		},
		/**
		 * Release resources and off custom events
		 * @ko 모든 커스텀 이벤트와 자원을 해제한다.
		 * @method eg.InfiniteGrid#destroy
		 */
		destroy : function() {
			if(this.core) {
				this.core.destroy();
				this.core = null;
			}
			this.off();
		}
	});
});