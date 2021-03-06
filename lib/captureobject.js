/**
 * capture object structure, support graph type object.
 * 
 * @process 
 *      1. analysis object, generate a tree.
 *      2. you can set the max deepth of the tree.
 *      3. node
 *              pointer: point the value of object or attribute of object
 *              type: the type of pointer, include leaf, function, array, map
 *              children: the son nodes of currrent node
 *              isShowed: if object has shown before in anothor node, this value will be true
 *              circleNode: if object has shown before in anothor node, point the node
 *         if isShowed is true, current node will not generate child nodes, because this object has shown before.
 *              
 * @author  ddchen
 *
 */

!(function() {

	var isArray = function(arr) {
		return Object.prototype.toString.call(arr) === "[object Array]";
	}

	var isFunction = function(fn) {
		return !!fn && !fn.nodeName && fn.constructor != String &&
			fn.constructor != RegExp && fn.constructor != Array &&
			/function/i.test(fn + "");
	}

	var isLeafType = function(leaf) {
		var type = typeof leaf;
		return type === "undefined" ||
			type === "boolean" ||
			type === "number" ||
			type === "string" ||
			leaf === null;
	}

	var getType = function(obj) {
		if (isLeafType(obj)) return "leaf";
		if (isFunction(obj)) return "function";
		if (isArray(obj)) return "array";
		return "map";
	}

	var Node = function(value, path) {
		path = path || "";
		this.pointer = value;
		this.type = getType(this.pointer);
		this.children = {};
		this.path = path;

		var arr = path.split(".");
		this.name = arr[arr.length - 1];
	}

	Node.prototype = {
		constructor: Node,
		addChild: function(name, child) {
			this.children[name] = child;
			child.parent = this;
		},
		getDeepth: function() {
			var count = 0;
			var parent = this.parent;
			while (parent) {
				count++;
				parent = parent.parent;
			}
			return count;
		},
		getChildList: function() {
			var childList = [];
			for (var name in this.children) {
				childList.push(this.children[name]);
			}
			return childList;
		},
		setCircle: function(node) {
			this.isShowed = true;
			this.circleNode = node;
		}
	}

	var contain = function(nodeList, nodeItem) {
		if (!isArray(nodeList)) return false;
		for (var i = 0; i < nodeList.length; i++) {
			if (nodeItem.pointer === nodeList[i].pointer) return nodeList[i];
		}
		return false;
	}

	var captureobject = (function() {

		var open = [];
		var close = [];
		var maxDeep = null;
		var ignore = null;

		var walk = function(obj) {
			var node = new Node(obj);
			open.push(node);
			while (open.length) {
				var curNode = open.pop();
				var children = generateChildren(curNode);
				open = open.concat(children);
				close.push(curNode);
			}
			return node;
		}

		var generateChildren = function(node) {
			var showedNode = contain(close, node);
			if (showedNode) {
				node.setCircle(showedNode);
			}

			var condition = checkExpandCondition(node);
			if (condition) {
				expandChildren(node);
			}
			return node.getChildList();
		}

		var checkExpandCondition = function(node) {
			var obj = node.pointer;
			var isShowed = node.isShowed;
			var condition = !isLeafType(obj) && !isShowed;
			if (maxDeep !== null) {
				if (node.getDeepth() + 1 > maxDeep) {
					condition = false;
				}
			}
			return condition;
		}

		var expandChildren = function(parentNode) {
			var obj = parentNode.pointer;
			for (var name in obj) {
				if (obj.hasOwnProperty(name) &&
					name !== "length") {
					expandChild(parentNode, name);
				}
			}
			if (obj.hasOwnProperty("length")) {
				expandChild(parentNode, "length");
			}
		}

		var expandChild = function(parentNode, name) {
			var obj = parentNode.pointer;
			var path = parentNode.path;
			var value = obj[name];
			var childPath = name;
			if (path) {
				childPath = path + "." + childPath;
			}
			if (!shouldIgnore(childPath)) {
				var childNode = new Node(value, childPath);
				parentNode.addChild(name, childNode);
			}
		}

		var shouldIgnore = function(path) {
			if (!ignore) return false;
			for (var i = 0; i < ignore.length; i++) {
				var item = ignore[i];
				if (typeof item === "string") {
					if (path === item) return true;
				} else if (item instanceof RegExp) {
					if (item.test(path)) return true;
				} else if (isFunction(item)) {
					if (item(path)) return true;
				}
			}
			return false;
		}

		return function(obj, conf) {
			conf = conf || {};
			open = [];
			close = [];
			maxDeep = conf.maxDepth;
			ignore = conf.ignore;
			return walk(obj);
		}
	})();

	if (typeof module !== "undefined" && module.exports) {
		module.exports = captureobject;
	} else {
		window.captureobject = captureobject;
	}
})();