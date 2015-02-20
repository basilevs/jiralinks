// ==UserScript==
// @name        Test results
// @namespace   basilevs
// @include     https://hudson.eclipse.org/rcptt*/job/rcptt-all-gerrit/*
// @include     https://hudson.eclipse.org/rcptt*/job/rcptt-tests/*
// @include     https://hudson.eclipse.org/rcptt*/job/mockups-tests/*
// @require		https://github.com/basilevs/jiralinks/raw/master/utils.js	
// @version     4
// @grant       GM_log
// ==/UserScript==

var jobToTestPath = {
	"rcptt-tests": "rcpttTests",
	"rcptt-all-gerrit": "rcpttTests",
	"mockups-tests": "tests"
};


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

if (!isNaN(buildNum) && path) {
	var inProgress = getNodes("//table[contains(@class, 'progress-bar')]").length != 0;
	var segment = ""+buildNum;
	var url = link.href.replace(/\/(lastBuild|\d+)\/$/, "/"+segment+"/");

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
	if (!inProgress)
		appendDiv("<img style='margin: 2px;' src='/rcptt/static/f580e051/images/24x24/clipboard.png'> <a href='" + url +"target/results/tests.html'>RCPTT Report</a>");
	appendDiv("<img style='margin: 2px;' src='/rcptt/static/f580e051/images/24x24/terminal.png'> <a href='" + url +"target/results/aut-console-0_console.log'>AUT консоль</a>");
}


