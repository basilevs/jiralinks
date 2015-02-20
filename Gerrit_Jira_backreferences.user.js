// ==UserScript==
// @name        Gerrit Jira backreferences
// @namespace   xored
// @description Adds backlinks from Gerrit to JIRA
// @include     https://git.eclipse.org/*
// @include		https://hudson.eclipse.org/rcptt/*job/rcptt-all-gerrit/
// @require		https://github.com/basilevs/jiralinks/raw/master/utils.js
// @version     6
// @grant       GM_getValue
// @grant       GM_setValue
// @grant       GM_log
// ==/UserScript==

//GM_log = function (data) {};

var changeInfoXpath = "id('change_infoTable')/tbody";
var jiraLinkReg = /https:\/\/[\w\.]+\/browse\/([^\/ #\?]+)(\/.*)?/;
var hudsonLinkReg = /https:\/\/(.*)(?:\/view\/\w+)?\/job\/([\w\-]+)\/(\d+)\/?/;

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
}

function wrapInTimeout(delegate, delay) {
	return function () {
		window.setTimeout(delegate, delay);
	};
}

if (location.href.contains("/r/")) {
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
	window.addEventListener ("hashchange", wrapInTimeout(onGerritChange, 1000),  false);
	window.addEventListener('load', wrapInTimeout(onGerritChange, 2000), false);
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

function addJiraLink(jiraLink) {
	return extendChangeInformation("JIRA", getIssueNumberFromLink(jiraLink), jiraLink);
}

function extendChangeInformation(field, name, link) {
	var infoTable = getNode(changeInfoXpath);
	var lastRow = getNode("tr[last()]", infoTable);
	var row = document.createElement("tr");
	if (name && link)
		value = '<a href="'+link +'">'+name+'</a>';
	else 
		value = 'None';
	row.innerHTML = '<th>'+field+'</th><td>'+value+'</td>';
	infoTable.insertBefore(row, lastRow);

}

