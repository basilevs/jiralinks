// ==UserScript==
// @name        Test results
// @namespace   basilevs
// @include     https://hudson.eclipse.org/rcptt*/job/rcptt-all-gerrit/*
// @include     https://hudson.eclipse.org/rcptt*/job/rcptt-tests/*
// @require		https://github.com/basilevs/jiralinks/raw/master/utils.js	
// @version     3
// @grant       GM_log
// ==/UserScript==


var link = getNode("(id('left-top-nav')/a)[last()]");

var buildNum = parseInt(link.textContent.replace(/#/g, ""), 10);
if (!isNaN(buildNum)) {
	var inProgress = getNodes("//table[contains(@class, 'progress-bar')]").length != 0;
	var segment = ""+buildNum;
	var url = link.href.replace(/\/(lastBuild|\d+)\/$/, "/"+segment+"/");

	if (inProgress) {
		url = url.replace(/\/\d+\/$/, "/ws/");
	} else {
		url += "artifact/";
	}
	var tasks = document.getElementById('tasks');

	function appendDiv(innerHtml) {
		var div = document.createElement("div");
		div.innerHTML = innerHtml;
		tasks.appendChild(div);
	}
	if (!inProgress)
		appendDiv("<img style='margin: 2px;' src='/rcptt/static/f580e051/images/24x24/clipboard.png'> <a href='" + url +"rcpttTests/target/results/tests.html'>RCPTT Report</a>");
	appendDiv("<img style='margin: 2px;' src='/rcptt/static/f580e051/images/24x24/terminal.png'> <a href='" + url +"rcpttTests/target/results/aut-console-0_console.log'>AUT консоль</a>");
}


