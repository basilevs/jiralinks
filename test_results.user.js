// ==UserScript==
// @name        Test results
// @namespace   basilevs
// @include     https://hudson.eclipse.org/rcptt*/job/rcptt-all-gerrit/*
// @include     https://hudson.eclipse.org/rcptt*/job/rcptt-tests/*
// @include     https://hudson.eclipse.org/rcptt*/job/mockups-tests/*
// @require		https://github.com/basilevs/jiralinks/raw/master/utils.js	
// @version     5
// @grant       GM_log
// @grant       GM_getValue
// @grant       GM_setValue
// ==/UserScript==

var jobToTestPath = {
	"rcptt-tests": "rcpttTests",
	"rcptt-all-gerrit": "rcpttTests",
	"mockups-tests": "tests"
};

function normalizeJobUrl(url) {
// Possible form: https://hudson.eclipse.org/rcptt/view/active/job/rcptt-all-gerrit/556/
// Normal form: https://hudson.eclipse.org/rcptt/job/rcptt-all-gerrit/
	var exp = /(.*)(?:\/view\/[^\/]+)?\/job\/([^\/]+)\/.*/;
	var res = exp.exec(url);
	if (!res)
		return null;
	return res[1]+"/job/"+res[2]+"/";
}

function normalizeGerritUrl(gerritUrl) {
	//Normal form: https://git.eclipse.org/r/38663
	//Final form: https://git.eclipse.org/r/#/c/38105/ 
	var exp = /https:\/\/([\w\.\-]+)\/r(?:\/#\/c)?\/(\d+)\/?/;
	var res = exp.exec(gerritUrl);
	if (!res)
		return null;
	return "https://"+res[1]+"/r/#/c/" + res[2] + "/";
}


if (document.location.href.contains("/job/")) {
	window.addEventListener('load', function() {
		var gerritLinks = deserialize("gerritLinks", {});
		var log = "";
		extractBuildHistory(function (hudsonUrl, gerritUrl) {
			hudsonUrl = normalizeJobUrl(hudsonUrl);
			gerritUrl = normalizeGerritUrl(gerritUrl);
			if (hudsonUrl && gerritUrl) {
				gerritLinks[hudsonUrl] = gerritUrl;
				log += (gerritUrl + " : " + hudsonUrl + "\n");
			}
		});
		serialize("gerritLinks", gerritLinks);
		GM_log("Found history: \n" + log);
	});
}


var link = getNode("id('left-top-nav')/a[contains(text(), '#')]");

var jobLink = getPreviousSibling(link, "a");
var jobName = "Bad job";
if (jobLink) {
	GM_log("Found: " + jobLink.outerHTML);
	jobName = jobLink.textContent;
}
var buildNum = parseInt(link.textContent.replace(/#/g, ""), 10);
var path = jobToTestPath[jobName];
GM_log("Path for job " + jobName + ": " + path);
GM_log("Build number: " + buildNum);



function extractBuildHistory(callback) {
	var rows = getNodes("id('buildHistory')//tr[contains(@class, 'build-row no-wrap')]");
	for(var i in rows) {
		var row = rows[i];
		var hudsonUrl = getNode("td[2]/a", row).href;
		var gerritCell = getNode("td[4]/a", row);
		var gerritUrl = normalizeGerritUrl(gerritCell.href);
		if (hudsonUrl && gerritUrl) 
			callback(hudsonUrl, gerritUrl);
		else 
			throw new Error("Failed to extract gerrit link from :" + row.innerHTML);
	}
	return history;	
}

if (!isNaN(buildNum) && path) {
	var inProgress = getNodes("//table[contains(@class, 'progress-bar')]").length != 0;
	var segment = ""+buildNum;
	var url = link.href.replace(/\/(lastBuild|\d+)\/$/, "/"+segment+"/");
	GM_log("Job url: " + url);
	var gerritLinks = deserialize("gerritLinks", {});
	if (!gerritLinks)
		throw new Error ("Can't get Gerrit index");
	var normalJobUrl = normalizeJobUrl(url);
	GM_log("Normal job url: " + normalJobUrl);
	var gerritLink = null;
	if (normalJobUrl)
		gerritLink = gerritLinks[normalJobUrl];

	if (inProgress) {
		url = url.replace(/\/\d+\/$/, "/ws/");
	} else {
		url += "artifact/";
	}
	url += path + "/";
	var tasks = document.getElementById('tasks');

	function appendDiv(innerHtml) {
		var div = document.createElement("div");
		div.innerHTML = innerHtml;
		tasks.appendChild(div);
	}	
	
	function createDiv(icon, url, text) {
		appendDiv("<img style='margin: 2px;' src='"+icon+"'> <a href='"+url+"'>"+text+"</a>");
	}
	if (!inProgress)
		createDiv('/rcptt/static/f580e051/images/24x24/clipboard.png', url +"target/results/tests.html", "RCPTT Report");
	createDiv('/rcptt/static/f580e051/images/24x24/terminal.png', url + "target/results/aut-console-0_console.log", "AUT консоль");
	if (gerritLink)
		createDiv('/rcptt/plugin/gerrit-trigger/images/icon16.png', url +"target/results/aut-console-0_console.log", "Change");
	
	
	
}


