// ==UserScript==
// @name        Gerrit Jira backreferences
// @namespace   xored
// @description Adds backlinks from Gerrit to JIRA
// @include     https://git.eclipse.org/*
// @include		https://hudson.eclipse.org/rcptt/*job/rcptt-all-gerrit/
// @version     3
// @grant       GM_getValue
// @grant       GM_setValue
// @grant       GM_log
// ==/UserScript==

//GM_log = function (data) {};

var gerritHrefReg = /https:\/\/git.eclipse.org\/r\/#\/c\/(\d+)\//;
var changeInfoXpath = './/table[@class="infoBlock changeInfoBlock"]/tbody';
var jiraLinkReg = /https:\/\/[\w\.]+\/browse\/([^\/ #\?]+)(\/.*)?/;
var hudsonLinkReg = /https:\/\/(.*)(?:\/view\/\w+)?\/job\/([\w\-]+)\/(\d+)\/?/;


function deserialize(name, def) {
	return eval(GM_getValue(name, (def || '({})')));
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
	if (array.length != 1)
		throw new Error("There are " + array.length + " elements of "+parent.outerHTML.substr(0, 500)+" :" + array);
	return array[0];
}

function getIssueNumberFromLink(link) {
	var res = jiraLinkReg.exec(link);
	if (res)
		return res[1];
	return null;
}

GM_log("Location: " + document.location + ", referer: " + document.referrer + ", normalized gerrit: " +  normalizeGerritUrl(location.href) );

var hudsonLinks = deserialize("hudsonLinks", {});


function updateGerritInformation(gerritUrl) {
	var jiraLink = jiraLinks[gerritUrl];
	if (jiraLink) {
		GM_log("JIRA link: " + jiraLink);
		extendChangeInformation("JIRA", getIssueNumberFromLink(jiraLink), jiraLink);
	}
	if (gerritUrl) {
		var hudsonLink = hudsonLinks[gerritUrl];
		GM_log("Hudson link: " + hudsonLink);
		if (hudsonLink)
			extendChangeInformation("Hudson", extractJobId(hudsonLink), hudsonLink);
	}
}


if (normalizeGerritUrl(location.href)) {
	var jiraLinks = deserialize("jiraLinks", {});
	var gerritUrl = normalizeGerritUrl(location.href);
	if (getIssueNumberFromLink(document.referrer)) {
		jiraLinks[normalizeGerritUrl(location.href)] = document.referrer;
		serialize("jiraLinks", jiraLinks);
	}
	function onGerritChange() {
		GM_log("Mutated");
		var gerritLink = normalizeGerritUrl(location.href);
		if (gerritLink)
			updateGerritInformation(gerritLink);
	}
	window.addEventListener ("hashchange", onGerritChange,  false);
	window.addEventListener('load', onGerritChange, false);
	
} else if (document.location.href.contains("/job/")) {
	window.addEventListener('load', function() {
		var log = "";
		var present = {};
		extractBuildHistory(function (hudsonUrl, gerritUrl) {
			if (present[gerritUrl])
				return;
			present[gerritUrl] = true;
			gerritUrl = normalizeGerritUrl(gerritUrl);
			hudsonLinks[gerritUrl] = hudsonUrl;
			log+=(gerritUrl + " : " + hudsonUrl + "\n");
		});
		serialize("hudsonLinks", hudsonLinks);
		GM_log("Found history: \n" + log);
	});
}

function extractJobId(hudsonUrl) {
	var res = hudsonLinkReg.exec(hudsonUrl)
	if (!res) 
		throw new Error(hudsonUrl + " is not a hudson link");
	return res[2] + "/" + res[3];
}

function normalizeGerritUrl(gerritUrl) {
	//Normal form: https://git.eclipse.org/r/38663
	//Final form: https://git.eclipse.org/r/#/c/38105/ 
	var exp = /https:\/\/([\w\.\-]+)\/r(?:\/#\/c)?\/(\d+)\/?/;
	var res = exp.exec(gerritUrl);
	if (!res)
		return null;
	return "https://"+res[1]+"/r/" + res[2] + "/";
}



function extractBuildHistory(callback) {
	var rows = getNodes("id('buildHistory')//tr[contains(@class, 'build-row no-wrap')]");
	for(var i in rows) {
		var row = rows[i];
		var hudsonUrl = getNode("td[2]/a", row).href;
		var gerritCell = getNode("td[4]/a", row);
		var gerritUrl = gerritCell.href;
		callback(hudsonUrl, gerritUrl);
	}
	return history;	
}

function addJiraLink(jiraLink) {
	return extendChangeInformation("JIRA", getIssueNumberFromLink(jiraLink), jiraLink);
}

function extendChangeInformation(field, name, link) {
	var infoTable = getNode(changeInfoXpath);
	var row = document.createElement("tr");
	if (name && link)
		value = '<a href="'+link +'">'+name+'</a>';
	else 
		value = 'None';
	row.innerHTML = '<td class="header">'+field+'</td><td>'+value+'</td>';

	infoTable.appendChild(row);
}

