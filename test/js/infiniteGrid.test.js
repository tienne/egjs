var HTML = '<li class="item"><div><img></img></div></li>';
var imglist = ["http://thumb.comic.naver.net/webtoon/25455/thumbnail/title_thumbnail_20100614120245_t125x101.jpg", "http://thumb.comic.naver.net/webtoon/25455/369/inst_thumbnail_20150824151122.jpg", "http://thumb.comic.naver.net/webtoon/25455/368/inst_thumbnail_20150817151137.jpg", "http://thumb.comic.naver.net/webtoon/25455/367/inst_thumbnail_20150810145539.jpg", "http://thumb.comic.naver.net/webtoon/25455/366/inst_thumbnail_20150803143116.jpg", "http://thumb.comic.naver.net/webtoon/25455/365/inst_thumbnail_20150727120816.jpg", "http://thumb.comic.naver.net/webtoon/25455/364/inst_thumbnail_20150720184900.jpg", "http://thumb.comic.naver.net/webtoon/25455/363/inst_thumbnail_20150713114138.jpg", "http://thumb.comic.naver.net/webtoon/25455/362/inst_thumbnail_20150706133629.jpg", "http://thumb.comic.naver.net/webtoon/25455/361/inst_thumbnail_20150624164209.jpg", "http://thumb.comic.naver.net/webtoon/25455/360/inst_thumbnail_20150622152654.jpg", "http://thumb.comic.naver.net/webtoon/25455/359/inst_thumbnail_20150615141213.jpg", "http://thumb.comic.naver.net/webtoon/25455/358/inst_thumbnail_20150608135433.jpg", "http://thumb.comic.naver.net/webtoon/25455/357/inst_thumbnail_20150601135204.jpg", "http://thumb.comic.naver.net/webtoon/25455/356/inst_thumbnail_20150522121047.jpg", "http://thumb.comic.naver.net/webtoon/25455/355/inst_thumbnail_20150518120949.jpg", "http://thumb.comic.naver.net/webtoon/25455/354/inst_thumbnail_20150511150235.jpg", "http://thumb.comic.naver.net/webtoon/25455/353/inst_thumbnail_20150504122037.jpg", "http://thumb.comic.naver.net/webtoon/25455/352/inst_thumbnail_20150106004005.jpg", "http://thumb.comic.naver.net/webtoon/25455/351/inst_thumbnail_20141229145942.jpg", "http://thumb.comic.naver.net/webtoon/25455/350/inst_thumbnail_20141222155245.jpg", "http://thumb.comic.naver.net/webtoon/25455/349/inst_thumbnail_20141212180336.jpg", "http://thumb.comic.naver.net/webtoon/25455/348/inst_thumbnail_20141201141813.jpg", "http://thumb.comic.naver.net/webtoon/25455/347/inst_thumbnail_20141124135647.jpg", "http://thumb.comic.naver.net/webtoon/25455/346/inst_thumbnail_20141117150140.jpg", "http://thumb.comic.naver.net/webtoon/25455/345/inst_thumbnail_20141110153559.jpg", "http://thumb.comic.naver.net/webtoon/25455/344/inst_thumbnail_20141103144248.jpg", "http://thumb.comic.naver.net/webtoon/25455/343/inst_thumbnail_20141027162333.jpg", "http://thumb.comic.naver.net/webtoon/25455/342/inst_thumbnail_20141020122337.jpg", "http://thumb.comic.naver.net/webtoon/25455/341/inst_thumbnail_20141013122602.jpg", "http://thumb.comic.naver.net/webtoon/25455/340/inst_thumbnail_20141006142907.jpg"];
var getContent = function(className, x) {
	var s = "";
	x = x || ( (parseInt(Math.random() * 100) % 10) +1 ) ;
	for(var i=0; i<x; i++) {
		s+= HTML;
	}
	var $el = $(s);
	$el.addClass(className).find("img").height(function() {
		var val = parseInt(Math.random() * 100,10);
		var r = parseInt(Math.random() * 100,10)%imglist.length;
		$(this).attr("src", imglist[r]);
		return val < 40 ? 40 : val;
	});
	return $el;
};

module("infiniteGrid Test", {
	setup : function() {
		this.inst = null;
	},
	teardown : function() {
		if(this.inst) {
			this.inst.destroy();
			this.inst = null;
		}
	}
});


asyncTest("check a initialization (there are children)", function() {
	// Given
	this.inst = new eg.InfiniteGrid("#grid");
	this.inst.on("layoutComplete",function(e) {
		// Then
		equal(e.target.length, 6, "a number of elements are 6");
		equal(this.core.items.length, 6, "a number of elements are 6");
		equal(this.isProcessing(), false, "idel in layoutComplete");
		start();
	});
	// When
	// Then
	equal(this.inst.isProcessing(), false, "idel");

	// When
	this.inst.layout();
});

asyncTest("check a append after a initialization (there aren't children)", function() {
	// Given
	var $el = getContent("append");
	this.inst = new eg.InfiniteGrid("#nochildren_grid");
	
	// When
	equal(this.inst.isProcessing(), false, "idel");
	this.inst.on("layoutComplete",function(e) {
		// Then
		equal(e.target.length, $el.length, "a number of elements are " + $el.length);
		equal(this.core._appendCols.length, 2, "is correct columnWidth");
		equal(this.isProcessing(), false, "idel in layoutComplete");
		start();
	});
	this.inst.append($el);
});

asyncTest("check a append module", function() {
	// Given
	var addCount = 0,
		beforeItemsCount = 0;
	this.inst = new eg.InfiniteGrid("#nochildren_grid", {
		"count" : 18
	});

	// When
	this.inst.on("layoutComplete",function(e) {
		// Then
		equal(this.isProcessing(), false, "idel in layoutComplete " + addCount);
		equal(e.isAppend, true, "append type");
		equal(e.distance, 0, "check distance");
		if(this.isRecycling()) {
			equal(this.core.items.length, 18, "a number of elements are always 18");
		} else {
			equal(beforeItemsCount + e.target.length, this.core.items.length, "item added " + e.target.length);
			beforeItemsCount = this.core.items.length;
		}
		equal(this.core.$element.children().length, this.core.items.length, "a number of elements(DOM) -> " + this.core.items.length);
		if(addCount++ < 10) {
			this.append(getContent("append",5));
		} else {
			start();
		}
	});
	beforeItemsCount = this.inst.core.items.length;
	this.inst.append(getContent("append"));
});


asyncTest("check a append module with groupkey", function() {
	// Given
	var addCount = 0,
		groupkey = 0,
		beforeItemsCount = 0,
		group = {};
	this.inst = new eg.InfiniteGrid("#nochildren_grid", {
		"count" : 18
	});

	// When
	this.inst.on("layoutComplete",function(e) {
		// Then
		equal(this.isProcessing(), false, "idel in layoutComplete " + addCount);
		equal(e.isAppend, true, "append type");
		group[groupkey] = e.target.length;
		if(this.isRecycling()) {
			var groupKeys = this.getGroupKeys();
			var total = 0;
			for(var i=groupKeys[0]; i<=groupKeys[groupKeys.length-1]; i++) {
				total += group[i];
			}
			equal(this.core.items.length, total, "a number of elements are " + total);
		} else {
			equal(beforeItemsCount + e.target.length, this.core.items.length, "item added " + e.target.length);
			beforeItemsCount = this.core.items.length;
		}
		equal(this.core.$element.children().length, this.core.items.length, "a number of elements(DOM) -> " + this.core.items.length);
		if(addCount++ < 10) {
			this.append(getContent("append"), ++groupkey);
		} else {
			start();
		}
	});
	beforeItemsCount = this.inst.core.items.length;
	this.inst.append(getContent("append"), groupkey);
});

asyncTest("check a prepend module", function() {
	var addCount = 0,
		beforeItem = null;
	// Given
	this.inst = new eg.InfiniteGrid("#nochildren_grid", {
		"count" : 18
	});

	// When
	this.inst.prepend(getContent("prepend"));
	// Then
	equal(this.inst.core.items.length, 0, "a number of elements are always 0");
	equal(this.inst.core.$element.children().length, 0, "a number of elements(DOM) are always 0");

	// When
	this.inst.on("layoutComplete",function(e) {
		// When
		this.off();
		this.on("layoutComplete",function(e) {
			beforeItem = this.core.items[e.target.length];
			equal(this.isProcessing(), false, "idel in layoutComplete " + addCount);
			equal(e.isAppend, false, "prepend type");
			equal(e.distance, beforeItem.position.y, "check distance");
			equal(this.isRecycling(), true, "recycle mode");
			equal(this.core.items.length, 18, "a number of elements are always 18");
			equal(this.core.$element.children().length, 18, "a number of elements(DOM) are always 18");
			
			if(addCount++ < 10) {
				if(this.prepend(getContent("prepend")) == 0) {
					start();
				}
			} else {
				start();
			}
		});

		// Then
		this.prepend(getContent("prepend"));
	});

	// Then
	this.inst.append(getContent("append",20));
});


asyncTest("check a prepend module with groupkey", function() {
	var addCount = 0,
		groupkey = 10,
		beforeItemsCount = 0,
		group = {};
	// Given
	this.inst = new eg.InfiniteGrid("#nochildren_grid", {
		"count" : 18
	});

	// When
	this.inst.on("layoutComplete",function(e) {
		// When
		group[10] = 20;
		this.off();
		this.on("layoutComplete",function(e) {
			equal(this.isProcessing(), false, "idel in layoutComplete " + addCount);
			equal(e.isAppend, false, "prepend type");
			group[groupkey] = e.target.length;
			if(this.isRecycling()) {
				var groupKeys = this.getGroupKeys();
				var total = 0;
				for(var i=groupKeys[groupKeys.length-1]; i>=groupKeys[0]; i--) {
					total += group[i];
				}
				equal(this.core.items.length, total, "a number of elements are " + total);
				equal(this.core.$element.children().length, this.core.items.length, "a number of elements(DOM) -> " + this.core.items.length);
			}

			if(addCount++ < 10) {
				if(this.prepend(getContent("prepend"), --groupkey) == 0) {
					start();
				}
			} else {
				start();
			}
		});
		beforeItemsCount = this.core.items.length;
		// Then
		this.prepend(getContent("prepend"), groupkey);
	});
	// Then	
	this.inst.append(getContent("append",20),groupkey--);
});

asyncTest("restore status", function() {
	var $el,
		getProperties = function(target) {
			var data=[];
			for(var p in target) {
			    if(target.hasOwnProperty(p) && /^_/.test(p)) {
			        data.push(p);
			    }
			}
			return data;
		};
	// Given
	this.inst = new eg.InfiniteGrid("#grid", {
		"count" : 18
	});

	// When
	this.inst.on("layoutComplete",function(e) {
		var properties = getProperties(this);
		var beforeStatus = this.getStatus();
		
		// Then
		equal(beforeStatus.html, this.core.$element.html(), "check html");
		equal(beforeStatus.cssText, this.core.element.style.cssText, "check cssText");
		beforeStatus.core.items.forEach(function(v,i,a) {
			deepEqual(v.position, this.core.items[i].position, "check html and position information");
			deepEqual(v.size, this.core.items[i].size,"check html and size information");
		}, this);
		deepEqual(beforeStatus.core._appendCols, this.core._appendCols, "check appendCol info");
		deepEqual(beforeStatus.core._prependCols, this.core._prependCols, "check appendCol info");
		deepEqual(beforeStatus.core.columnWidth, this.core.columnWidth, "check columnWidth info");
		deepEqual(beforeStatus.core.size, this.core.size, "check size info");
		deepEqual(beforeStatus.core.options, this.core.options, "check options info");
		properties.forEach(function(v,i,a) {
			equal(this[v], beforeStatus.data[v], "check infiniteGrid properties " + v	);
		}, this);

		// Given
		this.destroy();
		var infinite = new eg.InfiniteGrid("#grid", {
			"count" : 18
		});

		// When
		infinite.setStatus(beforeStatus);

		// Then
		equal(infinite.core.element.style.cssText, beforeStatus.cssText, "check cssText");
		infinite.core.items.forEach(function(v,i,a) {
			deepEqual(v.position, beforeStatus.core.items[i].position, "check html and position information");
			deepEqual(v.size, beforeStatus.core.items[i].size,"check html and size information");
			$el = $(v.element);
			deepEqual(v.position, {
				"x" : parseInt($el.css("left"),10),
				"y" : parseInt($el.css("top"),10)
			}, "check html and position information");
		});
		deepEqual(infinite.core._appendCols, beforeStatus.core._appendCols, "check appendCol info");
		deepEqual(infinite.core._prependCols, beforeStatus.core._prependCols, "check appendCol info");
		deepEqual(infinite.core.columnWidth, beforeStatus.core.columnWidth, "check columnWidth info");
		deepEqual(infinite.core.size, beforeStatus.core.size, "check size info");
		deepEqual(infinite.core.options, beforeStatus.core.options, "check options info");
		properties.forEach(function(v,i,a) {
			equal(infinite[v], beforeStatus.data[v], "check infiniteGrid properties " + v	);
		}, infinite);
		start();
	});

	// Then
	this.inst.append(getContent("append",50));
});

asyncTest("check a clear", function() {
	// Given
	var beforeClear = true;
	this.inst = new eg.InfiniteGrid("#grid", {
		"isInitLayout" : false,
	});
	this.inst.on("layoutComplete",function(e) {
		// Then
		if(beforeClear) {
			equal(this.isProcessing(), false, "idel in layoutComplete");
			equal(e.target.length, 6, "a number of elements are 6");
			equal(this.core.items.length, 6, "a number of elements are 6");
			equal(this.core.$element.children().length, 6, "a number of DOM are 6");
			beforeClear = false;
			this.clear();
		} else {
			equal(e.target.length, 0, "a number of elements are 0");
			equal(this.core.items.length, 0, "a number of elements are 0");
			equal(this.core.$element.children().length, 0, "a number of DOM are 0");
			equal(this._addType, null, "addType is null");
			equal(this._isFitted, true, "isFitted is true");
			equal(this._contentCount, 0, "a number of contentCount are 0");
			start();
		}
	});
	// When
	// Then
	equal(this.inst.isProcessing(), false, "idel");

	// When
	this.inst.layout();
});


// test("check a count of contents", function() {
// 	// Given
// 	// When
// 	this.inst = new eg.InfiniteGrid("#grid", {
// 		"count" : 18
// 	});

// 	// Then
// 	equal(this.inst._contentCount, 6, "content is 6 from markup");
// 	equal(this.inst.isRecycling(), false, "elements are lacked");
	
// 	//When
// 	this.inst.append(getContent("append",10));

// 	// Then
// 	equal(this.inst._contentCount, 16, "content is 16 from api");
// 	equal(this.inst.isRecycling(), false, "elements are lacked");

// 	//When
// 	this.inst.prepend(getContent("prepend",10));
	
// 	// Then
// 	equal(this.inst._contentCount, 16, "prepend is ignored when isRecycling is false");
// 	equal(this.inst.isRecycling(), false, "elements are lacked");

// 	//When
// 	this.inst.append(getContent("append",10));
	
// 	// Then
// 	equal(this.inst._contentCount, 26, "content is 26 from api");
// 	equal(this.inst.isRecycling(), true, "recycle mode");

// 	//When
// 	this.inst.prepend(getContent("prepend",10));
	
// 	// Then
// 	equal(this.inst._contentCount, 16, "content removed 16");
// 	equal(this.inst.isRecycling(), true, "recycle mode");

// 	//When
// 	this.inst.prepend(getContent("prepend",10));
	
// 	// Then
// 	equal(this.inst._contentCount, 6, "content removed");
// 	equal(this.inst.isRecycling(), true, "recycle mode");

// 	//When
// 	this.inst.append(getContent("append",10));
	
// 	// Then
// 	equal(this.inst._contentCount, 16, "content is 16 from api");
// 	equal(this.inst.isRecycling(), true, "recycle mode");

// 	//When
// 	this.inst.prepend(getContent("prepend",15));
	
// 	// Then
// 	equal(this.inst._contentCount, 1, "content removed");
// 	equal(this.inst.isRecycling(), true, "recycle mode");

// 	// When
// 	this.inst.prepend(getContent("prepend",15));
	
// 	// Then
// 	equal(this.inst._contentCount, 0, "content removed");
// 	equal(this.inst.isRecycling(), true, "recycle mode");

// 	// When
// 	this.inst.prepend(getContent("prepend",15));
	
// 	// Then
// 	equal(this.inst._contentCount, 0, "content removed");
// 	equal(this.inst.isRecycling(), true, "recycle mode");
	
// 	//When
// 	this.inst.append(getContent("append",20));
	
// 	// Then
// 	equal(this.inst._contentCount, 20, "content is 26 from api");
// 	equal(this.inst.isRecycling(), true, "recycle mode");
// });