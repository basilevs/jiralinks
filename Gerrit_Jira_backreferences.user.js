// ==UserScript==
// @name        Gerrit Jira backreferences
// @namespace   xored
// @description Adds backlinks from Gerrit to JIRA
// @include     https://git.eclipse.org/*
// @version     1
// @grant       GM_getValue
// @grant       GM_setValue
// @grant       GM_log
// ==/UserScript==

//GM_log = function (data) {};

function deserialize(name, def) {
	return eval(GM_getValue(name, (def || '({})')));
}

function serialize(name, val) {
	GM_setValue(name, uneval(val));
}

function getNodes(expression) {
	GM_log("Looking for " + expression);
	var i = document.evaluate(expression, document, null, XPathResult.UNORDERED_NODE_ITERATOR_TYPE , null);
    if (!i)
        throw new Error("Invalid query: "+expression);
	var rv = [];
    while (data = i.iterateNext()) {
		GM_log("Node");
		rv.push(data);
    }
	return rv;
}

function getOnly(array) {
	if (array.length != 1)
		throw new Error("Array contains " + array.length + " elements:" + array);
	return array[0];
}

function getNode(expression) {
	var array = getNodes(expression);
	if (array.length != 1)
		throw new Error("Array contains " + array.length + " elements:" + array);
	return array[0];
}

var gerritHrefReg = /https:\/\/git.eclipse.org\/r\/#\/c\/(\d+)\//;
var changeInfoXpath = './/table[@class="infoBlock changeInfoBlock"]/tbody';
var jiraLinkReg = /https:\/\/[\w\.]+\/browse\/([^\/ #\?]+)(\/.*)?/;

GM_log("Location: " + document.location + ", referer: " + document.referrer);

var components =  gerritHrefReg.exec(""+location.href);
if (!components) {
	throw new Error("Can't find git change id in " + location.href);
}

var gerritId = components[1];

function getIssueNumberFromLink(link) {
	var res = jiraLinkReg.exec(link);
	if (res)
		return res[1];
	return null;
}

var jiraLinksKey = "jiraLinks";
var jiraLinks = deserialize(jiraLinksKey, {});
if (getIssueNumberFromLink(document.referrer)) {
	jiraLinks[gerritId] = document.referrer;
	serialize(jiraLinksKey, jiraLinks);
}


function extendChangeInformation(jiraLink) {
	var infoTable = getNode(changeInfoXpath);
	var row = document.createElement("tr");
	var issue = getIssueNumberFromLink(jiraLink);
	row.innerHTML = '<td class="header">JIRA</td><td><a href="'+jiraLink +'">'+issue+'</a></td>';
	infoTable.appendChild(row);
}

if (jiraLinks[gerritId])
	window.addEventListener('load', function() {extendChangeInformation(jiraLinks[gerritId]);});

//window.setTimeout(extendChangeInformation, 3000);
