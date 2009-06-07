/* Kodierung: UTF-8 */

/* #################################################################################### */

/* Helferfunktionen */

/* Core-Object-Prototypen */

if (!Object.forEach) {
	Object.forEach = function (object, func) {
		for (var property in object) {
			if (object.hasOwnProperty(property)) {
				func.call(object, property, object[property]);
			}
		}
	};
}

if (!Array.prototype.forEach) {
	Array.prototype.forEach = function (fun) {
		var len = this.length;
		if (typeof fun != "function") throw new TypeError();
		var thisp = arguments[1];
		for (var i = 0; i < len; i++) {
			if (i in this) {
				fun.call(thisp, this[i], i, this);
			}
		}
	};
}

if (!Array.prototype.filter) {
	Array.prototype.filter = function (fun) {
		var len = this.length;
		if (typeof fun != "function") throw new TypeError();
		var res = new Array();
		var thisp = arguments[1];
		for (var i = 0; i < len; i++) {
			if (i in this) {
				var val = this[i];
				if (fun.call(thisp, val, i, this)) {
					res.push(val);
				}
			}
		}
		return res;
	};
}

/*
String.prototype.escapeString = function () {
	return this.replace(/(\\(u\d{4}|x\d{2}|\d{3}))/g, "\\$1").replace(/"/g, "\\u0022").replace(/'/g, "\u0027");
};
*/

String.prototype.escapeHTML = function () {
	return this.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&lt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
};

/* DOM-Interface-Prototypen */

Node.prototype.contains = function (arg) {
	return (this.compareDocumentPosition(arg) & 16) == 16;
};

Element.prototype.getNodesByXPath = function (xpathExpression) {
	try {
		var result = document.evaluate(xpathExpression, this, null, XPathResult.ORDERED_NODE_ITERATOR_TYPE, null);
	} catch (e) {
		if (e.code == 51) {
			//console.log("Invalid Expression:", xpathExpression);
		} else {
			//console.log("Exception: ", e.name, "-", e.message, "xpathExpression:", xpathExpression);
		}
		return [];
	}
	var nodeArray = [], node;
	while (node = result.iterateNext()) {
		nodeArray.push(node);
	}
	return nodeArray;
};

/* Klassen */

(function () {
	var regexpCache = {};
	var p = Element.prototype;
	p.toggleClass = function (className) {
		if (this.hasClass(className)) {
			this.removeClass(className);
		} else {
			this.addClass(className);
		}
	};
	p.addClass = function (className) {
		if (!this.hasClass(className)) {
			if (this.className) {
				this.className += " " + className;
			} else {
				this.className = className;
			}
		}
	};
	p.removeClass = function (className) {
		var regexp = regexpCache[className];
		if (!regexp) {
			regexp = regexpCache[className] = new RegExp("(^|\\s)" + className + "(\\s|$)");
		}
		this.className = this.className.replace(regexp, "$2");
	};
	p.hasClass = function (className) {
		var regexp = regexpCache[className];
		if (!regexp) {
			regexp = regexpCache[className] = new RegExp("(^|\\s)" + className + "(\\s|$)");
		}
		return regexp.test(this.className);
	};
	delete p;
})();

/* #################################################################################### */

/* SELFHTML- und Forums-Namensraum */

var SELFHTML = {};

SELFHTML.Forum = {};

/* #################################################################################### */

/* Häufige XPath-Abfragefunktionen */

SELFHTML.Forum.getThreadStart = function (li) {
	return li.getNodesByXPath("ancestor::li[contains(@class, 'thread-start')]")[0];
};


/* #################################################################################### */

/* Debugging-Namensraum */

SELFHTML.Forum.Debug = {};

/* Helferfunktionen für XPath-Benchmarks */

SELFHTML.Forum.Debug = function (xpathExpression, contextNode, iterations) {
	contextNode = contextNode || document.documentElement;
	iterations = iterations || 500;
	console.log("benchmarking", xpathExpression, "at", contextNode);
	var start = new Date().getTime();
	try {
		for (var i = 0; i < iterations; i++) {
			var result = document.evaluate(xpathExpression, contextNode, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
		}
	} catch (e) {
		console.debug(e);
		return;
	}
	var end = new Date().getTime();
	console.log(xpathExpression, "found", result.snapshotLength, "nodes in ", (end - start), "ms");
	return result;
};

Function.prototype.benchmark = function (iterations) {
	console.log("benchmarking a function");
	iterations = iterations || 1000;
	var start = new Date().getTime();
	for (var i = 0; i < iterations; i++) {
		var result = this();
	}
	var end = new Date().getTime();
	console.log(iterations, "iterations took", (end - start), "ms");
	return result;
};

/* #################################################################################### */

/* Modul-Initialisierung */

SELFHTML.Forum.Modules = {};

SELFHTML.Forum.Modules.queue = [];

SELFHTML.Forum.Modules.add = function (documentType, func) {
	SELFHTML.Forum.Modules.queue.push( { documentType : documentType, func : func } );
};

SELFHTML.Forum.Modules.init = function () {
	SELFHTML.Forum.Modules.queue.forEach(function (obj) {
		if (document.body.id == "selfforum-" + obj.documentType || obj.documentType == "all") {
			obj.func();
		}
	});
};

document.addEventListener("DOMContentLoaded", SELFHTML.Forum.Modules.init, false);

/* #################################################################################### */

/* Globale Initialisierung */

SELFHTML.Forum.Init = function () {
	SELFHTML.Forum.ready = true;
};

SELFHTML.Forum.Modules.add("all", SELFHTML.Forum.Init);

/* #################################################################################### */

/* Initialisierung Hauptseite */

SELFHTML.Forum.Init.hauptseite = function () {

	var F = SELFHTML.Forum;

	F.threadList = document.getElementById("root");
	if (!F.threadList) return;

};

SELFHTML.Forum.Modules.add("hauptseite", SELFHTML.Forum.Init.hauptseite);

/* #################################################################################### */

/* Cache */

SELFHTML.Forum.Cache = {};

SELFHTML.Forum.Cache.init = function () {

	var F = SELFHTML.Forum,
		allPostings = (F.postingsByAuthor = {}),
		threadStarts = (F.threadStartsByAuthor = {}),
		ownPostings = (F.ownPostings = []),
		allCategories = (F.postingsByCategory = {});

	F.threadList.getNodesByXPath("descendant::span[contains(@class, 'author')]").forEach(function (authorSpan) {

		var authorName = authorSpan.firstChild.nodeValue,
			postingSpan = authorSpan.parentNode,
			li = postingSpan.getNodesByXPath("ancestor::li[position() = 1]")[0],
			postingId = li.id,
			parentLi = li.parentNode.parentNode;

		if (li.hasClass("own-posting")) {
			ownPostings.push(li);
			if (!F.ownName) {
				F.ownName = authorName;
			}
		}

		(allPostings[authorName] || (allPostings[authorName] = [])).push(li);

		if (parentLi.hasClass("thread-start")) {
			(threadStarts[authorName] || (threadStarts[authorName] = [])).push(parentLi);
		}

		var result = postingSpan.getNodesByXPath("child::span[contains(@class, 'subject')]/child::*[contains(@class, 'category') or contains(@class, 'cathigh')]/child::text()");
		var categoryName = result[0].nodeValue;
		(allCategories[categoryName] || (allCategories[categoryName] = [])).push(li);

	});

};

SELFHTML.Forum.Modules.add("hauptseite", SELFHTML.Forum.Cache.init);

/* #################################################################################### */

/* Kontextmenü */

SELFHTML.Forum.ContextMenu = {};

SELFHTML.Forum.ContextMenu.init = function () {

	var F = SELFHTML.Forum, M = F.ContextMenu;
	M.target = document.getElementById("contextMenuTitle");
	F.threadList.addEventListener("click", M.toggle, false);
	F.threadList.addEventListener("mouseover", M.threadListMouseOver, true);

};

SELFHTML.Forum.Modules.add("hauptseite", SELFHTML.Forum.ContextMenu.init);

SELFHTML.Forum.ContextMenu.toggle = function (e) {

	var F = SELFHTML.Forum, C = F.Config, M = F.ContextMenu, Fi = F.Filter, S = F.Statistics,
		target = e.target,
		isAuthor = target.hasClass("author"),
		isNormalCategory = target.hasClass("category"),
		isHighlightedCategory = target.hasClass("cathigh"),
		isCategory = isNormalCategory || isHighlightedCategory;

	if (!(isAuthor || isCategory)) {
		M.hide();
		return;
	}

	var links = {};

	if (isAuthor) {

		var authorName = target.firstChild.nodeValue,
			isOwnPosting = target.hasClass("own-posting"),
			isWhitelisted = target.hasClass("whitelist")

		links["Filtere nach Autor"] = function () { Fi.filterByAuthor(authorName); };

		if (isWhitelisted) {
			links["Autor von der Whitelist löschen"] = function () { C.removeFromWhiteList(authorName); };
		} else if (!isOwnPosting) {
			links["Autor zur Whitelist hinzufügen"] = function () { C.addToWhiteList(authorName); };
		}
		if (!isOwnPosting) {
			links["Autor zur Blacklist hinzufügen"] = function () { C.addToBlackList(authorName); };
		}

		links["Zeige Autoren-Statistik"] = function () { S.show("author"); };


	} else if (isCategory) {

		var categoryName = target.childNodes[1].nodeValue;

		links["Filtere nach Themenbereich"] = function () { Fi.filterByCategory(categoryName); };

		if (isNormalCategory) {
			links["Themenbereich hervorheben"] = function () { C.addToHighlightCategories(categoryName); };
		} else {
			links["Themenbereich nicht mehr hervorheben"] = function () { C.removeFromHighlightCategories(categoryName); };
		}

		links["Zeige Themenbereich-Statistik"] = function () { S.show("category"); };

	}

	links["Menü ausblenden"] = function () { M.hide() };

	M.show(target, links);
};

SELFHTML.Forum.ContextMenu.show = function (target, links) {
	var F = SELFHTML.Forum, M = F.ContextMenu;
	if (M.target) {
		M.target.removeAttribute("id");
	}
	target.id = "contextMenuTitle";

	var layer = new F.Layer( { id : "contextMenu", tagName : "ul" } ), ul = layer.element;
	while (ul.firstChild) {
		ul.removeChild(ul.firstChild);
	}
	Object.forEach(links, function (title, originalHandler) {
		var handler = function (e) {
			e.preventDefault();
			originalHandler.call(this, e);
		};
		var li = document.createElement("li");
		ul.appendChild(li);
		var a = document.createElement("a");
		li.appendChild(a);
		a.href = "javascript:void(0)";
		a.addEventListener("click", handler, false);
		a.appendChild(document.createTextNode(title));
	});
	ul.style.top = (target.offsetTop + target.offsetHeight) + "px";
	ul.style.left = target.offsetLeft + "px";
	layer.show();
	M.target = target;
};

SELFHTML.Forum.ContextMenu.hide = function () {
	var F = SELFHTML.Forum, M = F.ContextMenu;
	if (M.target) {
		M.target.removeAttribute("id");
	}
	new F.Layer( { id : "contextMenu" } ).hide();
};

SELFHTML.Forum.ContextMenu.threadListMouseOver = function (e) {
	var F = SELFHTML.Forum, target = e.target;
	if (!target.hasClass("javascript-button") && (target.hasClass("author") || target.hasClass("category") || target.hasClass("cathigh"))) {
		target.addClass("javascript-button");
	}
};

/* #################################################################################### */

/* Layer-Abstraktion */

SELFHTML.Forum.Layer = function (options) {
	if (!options || !options.id) {
		return false;
	}
	var layers = arguments.callee.layers || (arguments.callee.layers = {});
	if (layers[options.id]) {
		return layers[options.id];
	}

	if (!options.tagName) {
		return;
	}
	if (!options.parent) {
		options.parent = document.body;
	}
	var element = document.createElement(options.tagName);
	element.id = options.id;
	if (options.className) {
		element.className = options.className;
	}
	options.parent.appendChild(element);
	this.element = element;
	layers[options.id]  = this;
};

SELFHTML.Forum.Layer.prototype = {
	show : function () {
		if (this.element) {
			this.element.style.display = "block";
		}
		return this;
	},
	hide : function () {
		if (this.element) {
			this.element.style.display = "none";
		}
		return this;
	},
	html : function (html) {
		if (this.element) {
			this.element.innerHTML = html;
		}
		return this;
	}
};

/* #################################################################################### */

/* Info-Meldung im Header */

SELFHTML.Forum.Info = {};

SELFHTML.Forum.Info.show = function (html) {
	new SELFHTML.Forum.Layer( { id : "scriptInfo", tagName : "div", parent : document.getElementById("kopf-haupt") } ).html(html).show();
};

SELFHTML.Forum.Info.hide = function (html) {
	new SELFHTML.Forum.Layer( { id : "scriptInfo" } ).hide();
};

/* #################################################################################### */

/* Filter */

SELFHTML.Forum.Filter = {};

SELFHTML.Forum.Filter.init = function () {
	var Fi = SELFHTML.Forum.Filter;
	Fi.active = false, Fi.highlightedPostings = [], Fi.filteredThreads = [];
	Fi.initCategoryFilter();
};

SELFHTML.Forum.Modules.add("hauptseite", SELFHTML.Forum.Filter.init);

SELFHTML.Forum.Filter.initCategoryFilter = function () {
	var F = SELFHTML.Forum, Fi = F.Filter,
		form = document.getElementById("themenfilter").getElementsByTagName("form")[0];
	form.addEventListener("submit", function (e) {
		e.preventDefault();
		var select = this.elements.lf,
			selectedOption = select.options[select.selectedIndex],
			categoryName = selectedOption.text;
		if (selectedOption.value) {
			Fi.filterByCategory(categoryName);
		} else {
			Fi.remove();
		}
	}, false);
};

SELFHTML.Forum.Filter.filterByAuthor = function (authorName) {
	var F = SELFHTML.Forum, Fi = F.Filter;

	Fi.remove();
	F.ContextMenu.hide();
	F.threadList.addClass("filter");

	var postings = F.postingsByAuthor[authorName] || [];
	postings.forEach(function (li) {
		li.addClass("highlighted");
		Fi.highlightedPostings.push(li);

		var threadStart = F.getThreadStart(li);
		threadStart.addClass("contains-filter-postings");
		Fi.filteredThreads.push(threadStart);

	});

	F.Info.show("Gefiltert nach Autor " + authorName + " &ndash; <a href='javascript:SELFHTML.Forum.Filter.remove()'>Filter entfernen</a>");

	Fi.active = true;
};

SELFHTML.Forum.Filter.filterByCategory = function (categoryName) {
	var F = SELFHTML.Forum, Fi = F.Filter;

	Fi.remove();
	F.ContextMenu.hide();
	F.threadList.addClass("filter");

	var postings = F.postingsByCategory[categoryName] || [];
	postings.forEach(function (li) {
		var threadStart = F.getThreadStart(li);
		threadStart.addClass("contains-filter-postings");
		Fi.filteredThreads.push(threadStart);
	});

	F.Info.show("Gefiltert nach Themenbereich " + categoryName + " &ndash; <a href='javascript:SELFHTML.Forum.Filter.remove()'>Filter entfernen</a>");

	Fi.active = true;
};

SELFHTML.Forum.Filter.remove = function () {
	var F = SELFHTML.Forum, Fi = F.Filter;
	if (!Fi.active) return;
	F.Info.hide();
	F.threadList.removeClass("filter");
	var threadStart, li;
	while (threadStart = Fi.filteredThreads.shift()) {
		threadStart.removeClass("contains-filter-postings");
	}
	while (li = Fi.highlightedPostings.shift()) {
		li.removeClass("highlighted");
	}
	Fi.active = false;
};

/* #################################################################################### */

SELFHTML.Forum.followupNotice = function () {

	var F = SELFHTML.Forum;

	F.newFollowupNodes = [];
	F.ownPostings.forEach(function (ownPosting) {
		ownPosting.getNodesByXPath("child::ul/child::li[not(contains(@class, 'visited'))]").forEach(function (followUpNode) {
			F.newFollowupNodes.push(followUpNode);
		});
	});

	/*
	An welches Element soll die Meldungsbox »Neue Antworten« angehängt werden?
	kopf-menu = Zelle in der linken Spalte in der Kopftabelle
	*/
	var targetId = "kopf-menue",
		targetElement = document.getElementById(targetId);
	if (!targetElement) return;

	var start = new Date().getTime(),
		newFollowups = [];

	F.newFollowupNodes.forEach(function (newFollowupNode) {

		var newFollowup = {};
		newFollowup.element = newFollowupNode;

		var posting = newFollowupNode.getNodesByXPath("(child::span | child::span/child::span)[contains(@class, 'posting')]")[0];

		var aElement = posting.getNodesByXPath("child::span[contains(@class, 'subject')]/child::a")[0];

		/* Link hat keine visited-Klasse, ist aber in der Browser-History als besucht markiert */
		if (window.getComputedStyle(aElement, null).outlineStyle == "solid") {
			return;
		}

		newFollowup.title = aElement.firstChild.nodeValue;
		newFollowup.href = aElement.href;

		var author = posting.getNodesByXPath("child::span[contains(@class, 'author')]/text()")[0];
		newFollowup.author = author.nodeValue;

		newFollowups.push(newFollowup);

	});

	/* Erzeuge Meldungsbox (div-Element mit h2-Element) */
	var layer = new F.Layer( { id : "followup-notice", tagName : "div", parent : targetElement } );

	var divHTML = "";
	if (newFollowups.length > 0) {
		layer.element.className = "new-anwers";
		divHTML += "<h2>Neue Antworten</h2>";
		divHTML += "<ul>";
		newFollowups.forEach(function (newFollowup) {
			divHTML += "<li><a href='" + newFollowup.href + "'>" + newFollowup.title.escapeHTML() + "</a>";
			divHTML += " von " + newFollowup.author.escapeHTML() + "</li>";
		});
		divHTML += "</ul>";
	} else {
		layer.element.className = "no-anwers";
		divHTML += "<h2>Keine neuen Antworten</h2>";
	}

	layer.html(divHTML);
}

SELFHTML.Forum.Modules.add("hauptseite", SELFHTML.Forum.followupNotice);

/* #################################################################################### */

SELFHTML.Forum.Config = {};

SELFHTML.Forum.Config.directives = {
	"BlackList" : { parameter : "blacklist", type : "list" },
	"WhiteList" : { parameter : "whitelst", type : "list" },
	"HighlightCategories" : { parameter : "highlightcats", type : "list" },
	"SortThreads" : { parameter : "sortthreads", type : "single" }
};

SELFHTML.Forum.Config.init = function () {
	var F = SELFHTML.Forum, C = F.Config;

	Object.forEach(C.directives, function (directive, obj) {
		if (obj.type != "list") return;
		C["addTo" + directive] = function (value) {
			C.setValue(directive, value);
			C.confirmReload();
		};
		C["removeFrom" + directive] = function (value) {
			C.removeValue(directive, value);
			C.confirmReload();
		};
	});
};

SELFHTML.Forum.Modules.add("hauptseite", SELFHTML.Forum.Config.init);

SELFHTML.Forum.Config.setValue = function (directive, value) {
	var F = SELFHTML.Forum, C = F.Config, obj = C.directives[directive];
	if (!obj) return;
	var uri  = userconf_uri + "?a=setvalue&directive=" + directive + "&" + obj.parameter + "=" + encodeURIComponent(value) +
		(obj.type == "list" ? "&type=stringlist" : "") + "&unique=" + new Date().getTime();
	xmlhttp_get_contents(xmlhttp, uri, null, null);
};

SELFHTML.Forum.Config.removeValue = function (directive, value) {
	var F = SELFHTML.Forum, C = F.Config, obj = C.directives[directive];
	if (!obj) return;
	var uri  = userconf_uri + "?a=removevalue&directive=" + directive + "&" + obj.parameter + "=" + encodeURIComponent(value) +
		(obj.type == "list" ? "&type=stringlist" : "") + "&unique=" + new Date().getTime();
	xmlhttp_get_contents(xmlhttp, uri, null, null);
};

SELFHTML.Forum.Config.confirmReload = function () {
	var reloadDialog = "Die Einstellung wurde auf dem Server gespeichert. Soll die Forumshauptseite jetzt neu geladen werden?";
	if (window.confirm(reloadDialog)) {
		location.reload();
	}
};

/* #################################################################################### */

/* Statistiken */

SELFHTML.Forum.Statistics = {};

SELFHTML.Forum.Statistics.init = function (type) {
	if (typeof type != "string") {
		arguments.callee("author");
		arguments.callee("category");
		return;
	}

	var F = SELFHTML.Forum, Fi = F.Filter, S = F.Statistics,
		postingsByType = (type == "author") ? F.postingsByAuthor : F.postingsByCategory,
		typeName, ranking = [];

	Object.forEach(postingsByType, function (typeName) {
		ranking.push( {
			"typeName" : typeName,
			"postingNumber" : postingsByType[typeName].length
		} );
	});

	ranking.sort(function (a, b) {
		return a.postingNumber > b.postingNumber ? -1 : 1;
	});

	if (type == "author") {
		F.authorRanking = ranking;
	} else {
		F.categoryRanking = ranking;
	}

	var html = "<p><a href='javascript:void(0)' class='hide'>Ausblenden</a></p>";
	html += "<table><tbody>";
	ranking.forEach(function (obj) {
		html += "<tr><th><a href='javascript:void(0)'>" + obj.typeName.escapeHTML() + "</th><td>" + obj.postingNumber + "</td></tr>";
	});
	html += "</tbody></table>";

	var layer = new F.Layer( { id : type + "Statistics", tagName : "div", className : "statistics" } );
	layer.html(html);
	layer.element.addEventListener("click", function (e) {
		e.preventDefault();
		var target = e.target;
		if (target.nodeName.toLowerCase() != "a") return;
		S.hide();
		if (target.hasClass("hide")) return;
		var filterFunctionName = "filterBy" + (type == "author" ? "Author" : "Category");
		Fi[filterFunctionName](target.textContent);
	}, false);

};

SELFHTML.Forum.Modules.add("hauptseite", SELFHTML.Forum.Statistics.init);

SELFHTML.Forum.Statistics.show = function (type) {
	var F = SELFHTML.Forum;
	F.ContextMenu.hide();
	var layer = new F.Layer( { id : type + "Statistics" } );
	layer.show();
	var top = window.pageYOffset + 10, height = window.innerHeight - 10 - 10 - (2 * 5) - 2 - 16;
	layer.element.style.top = top + "px";
	layer.element.style.maxHeight = height + "px";
};

SELFHTML.Forum.Statistics.hide = function () {
	var F = SELFHTML.Forum;
	new F.Layer( { id : "categoryStatistics" } ).hide();
	new F.Layer( { id : "authorStatistics" } ).hide();
};

/* #################################################################################### */

SELFHTML.Forum.Sorting = {};

SELFHTML.Forum.Sorting.init = function () {
	var sibling = document.getElementById("themenfilter");
	if (!sibling) return;
	var elem = document.createElement("div");
	elem.id = "sortierung";
	elem.innerHTML =
		"<p><strong>Sortierung der Threads:</strong></p>" +
		"<ul>" +
		"<li><label title='Threads nach Eröffnungsposting chronologisch absteigend sortieren (neue Threads oben, alte Threads unten)'><input type='radio' name='sortthreads' value='descending' />&nbsp;Absteigend (Standard)</label></li>" +
		"<li><label title='Threads nach Eröffnungsposting chronologisch absteigend sortieren (alte Threads oben, neue Threads unten)'><input type='radio' name='sortthreads' value='ascending' />&nbsp;Aufsteigend</label></li>" +
		"<li><label title='Threads nach dem jüngsten Posting sortieren (Threads mit neuen Postings oben, nicht mehr aktive unten)'><input type='radio' name='sortthreads' value='newestfirst' />&nbsp;Nach jüngstem Posting</label></li>" +
		"</ul>";
	elem.addEventListener("click", SELFHTML.Forum.Sorting.change, false);
	sibling.parentNode.insertBefore(elem, sibling);
};

SELFHTML.Forum.Modules.add("hauptseite", SELFHTML.Forum.Sorting.init);

SELFHTML.Forum.Sorting.change = function (e) {
	var C = SELFHTML.Forum.Config,
		target = e.target, targetName = target.nodeName.toLowerCase(),
		value;
	if (targetName != "input") {
		return;
	}
	e.stopPropagation();
	C.setValue("SortThreads", target.value);
	C.confirmReload();
};

/* #################################################################################### */