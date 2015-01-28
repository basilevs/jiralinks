// ==UserScript==
// @name        Test results
// @namespace   basilevs
// @include     https://hudson.eclipse.org/rcptt*/job/rcptt-all-gerrit/*
// @include     https://hudson.eclipse.org/rcptt*/job/rcptt-tests/*
// @require		https://github.com/basilevs/jiralinks/raw/master/utils.js	
// @version     1
// @grant       GM_log
// ==/UserScript==


var link = getNode("(id('left-top-nav')/a)[last()]");

var buildNum = parseInt(link.textContent.replace(/#/g, ""), 10);
var url = link.href.replace("lastBuild", ""+buildNum);
var tasks = document.getElementById('tasks');

if (getNodes("//table[contains(@class, 'progress-bar')]").length == 0) {
	var div = document.createElement("div");
	div.innerHTML = "<img style='margin: 2px;' src='/rcptt/static/f580e051/images/24x24/clipboard.png'> <a href='" + url +"artifact/rcpttTests/target/results/tests.html'>RCPTT Report</a>";
	tasks.appendChild(div);
}