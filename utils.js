function deserialize(name, def) {
	def = (def || '({})');
	var rv =  eval(GM_getValue(name, def));
	if (!rv)
		return def;
	return rv;
}

function serialize(name, val) {
	GM_setValue(name, uneval(val));
}

function getNodes(expression, parent) {
	GM_log("Looking for " + expression);
	if (!parent)
		parent = document;
	var i = document.evaluate(expression, parent, null, XPathResult.UNORDERED_NODE_ITERATOR_TYPE , null);
    if (!i)
        throw new Error("Invalid query: "+expression);
	var rv = [];
    while (data = i.iterateNext()) {
		GM_log("Node");
		rv.push(data);
    }
	GM_log("Found " + rv.length + " nodes");
	return rv;
}

function getOnly(array) {
	if (array.length != 1)
		throw new Error("Array contains " + array.length + " elements:" + array);
	return array[0];
}

function getNode(expression, parent) {
	var array = getNodes(expression, parent);
	if (array.length != 1) {
		var descr = "None";
		if (parent)
			descr = parent.outerHTML.substr(0, 500)
		throw new Error("There are " + array.length + " elements of "+descr+" :" + array + ", for expression: " + expression);
	}
	return array[0];
}

function getPreviousSibling(start, type) {
	while (start) {
		start = start.previousSibling;
		if (!start)
			return null;
		if (start.localName == type)
			return start;
	}
	return null;
}
