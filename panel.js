var filter = {
		debug : true,
		info : true,
		warning : true,
		error : true,
		critical : true
	},
	filterButtons = {},
	logElement,
	globalMsgElement,
	persistLog = true,
	collapseOldLog = true,
	contextFilter = false
;

window.onload = function(){

	// save references to filter buttons and some other elements
	filterButtons.debug = document.getElementById('debugFilter');
	filterButtons.info = document.getElementById('infoFilter');
	filterButtons.warning = document.getElementById('warningFilter');
	filterButtons.error = document.getElementById('errorFilter');
	filterButtons.critical = document.getElementById('criticalFilter');

	logElement = document.getElementById("log");
	globalMsgElement = document.getElementById("globalMsg");

	// all element evenst must be defined here.
	// Definition in html is not working.
	document.getElementById('clearFilter').onclick = function() {clearLog();};

	filterButtons.debug.onclick = function() {switchFilter('debug');};
	filterButtons.info.onclick = function() {switchFilter('info');};
	filterButtons.warning.onclick = function() {switchFilter('warning');};
	filterButtons.error.onclick = function() {switchFilter('error');};
	filterButtons.critical.onclick = function() {switchFilter('critical');};

	// changing color theme
	document.getElementById("themeSelector").onchange = function(value) {
		var style = this.value,
			link = document.getElementById("globalStyle")
			;
		if (style) {
			link.setAttribute('href','css/'+style);
		}
	};

	//set logs to persistant between requests
	document.getElementById("persistCheckBox").onchange = function() {
		persistLog = !persistLog;
	};

	//set log to collapse, before add new one
	document.getElementById("collapseOldCheckBox").onchange = function() {
		collapseOldLog = !collapseOldLog;
	};


	//set contextFilter variable after text filter value change
	//and call applyFitlers() metod, to apply all filters
	document.getElementById("textFilter").onsearch = function() {
		if (this.value === '') {
			contextFilter = false;
		} else {
			contextFilter = this.value;
		}

		applyFilter();
	};



	// default font definition
	logElement.style.fontSize = 14;

	// decreasing font size
	document.getElementById('fontDown').onclick = function() {
		var fontSize = parseInt(logElement.style.fontSize,10) ;

		logElement.style.fontSize =  fontSize - 1;
	};

	// increasing font size
	document.getElementById('fontUp').onclick = function() {
		var fontSize = parseInt(logElement.style.fontSize,10) ;

		logElement.style.fontSize =  fontSize + 1;
	};

	// turn on/off firelogger
	document.getElementById('loggerOnOffBtn').onclick = function() {
		var btn = this;
		if (btn.getAttribute('data-value') === "1") {
			if (stopFireLogger()) {
				btn.setAttribute('data-value',"0");
				btn.innerHTML="Turn ON";
				showGlobalMsg("FireLogger is OFF now!");
			}

		} else {
			if (startFireLogger()) {
				btn.setAttribute('data-value',"1");
				btn.innerHTML="Turn OFF";
				hideGlobalMsg();
			}

		}
	};

	// turn firelogger on
	startFireLogger();
};

/**
 * showGlobalMsg
 *
 * Display some message for users bellow toolbar in red row
 *
 * @access [public]
 * @author Peter Skultety <petko.skultety@gmail.com>
 * @param  string $text text of message
 * @return {[type]}       [description]
 */
function showGlobalMsg(text) {
	globalMsgElement.innerHTML = text;
	globalMsgElement.style.display = 'block';
	// increase margin of log element otherwise globalMsgElement hide first
	// response link
	logElement.style.marginTop = '64px';
	return true;
}

/**
 * hideGlobalMsg
 *
 * Hide displayed message bar
 *
 * @access [public]
 * @author Peter Skultety <petko.skultety@gmail.com>
 * @return {[type]} [description]
 */
function hideGlobalMsg() {
	globalMsgElement.innerHTML="";
	globalMsgElement.style.display = 'none';
	logElement.style.marginTop = '32px';
	return true;
}

/**
 * startFireLogger
 *
 * start sending firelogger header to server and proccessing responses
 *
 * @access [public]
 * @author Peter Skultety <petko.skultety@gmail.com>
 * @return {[type]} [description]
 */
function startFireLogger(){
	// add listener onRequestFinished
	if (chrome.devtools) {
		chrome.devtools.network.onRequestFinished.addListener(processResponseHeaders);
	}
	// send message to background page, to attach listener onBeforeSendHeaders
	// we can not attach it here
	if (chrome.extension) {
		chrome.extension.sendRequest({
			command: "fireLoggerOn",
			tabId: chrome.devtools.tabId,
		});
	}
	return true;
}


/**
 * stopFireLogger
 *
 * stop sending firelogger header to server and proccessing responses
 *
 * @access [public]
 * @author Peter Skultety <petko.skultety@gmail.com>
 * @return {[type]} [description]
 */
function stopFireLogger(){
	// remove listener from onRequestFinished
	if (chrome.devtools) {
		chrome.devtools.network.onRequestFinished.removeListener(processResponseHeaders);
	}
	// send message to background page, to remove listener from onBeforeSendHeaders
	// we can not remove it here
	if (chrome.extension) {
		chrome.extension.sendRequest({
			command: "fireLoggerOff",
			tabId: chrome.devtools.tabId,
		});
	}
	return true;
}


/**
 * processResponseHeaders
 *
 * Dekode response headers, find the firelogger headers and convert it to objects.
 * Each firelogger message will by one object
 * Then procces all this objects (format them and display them in DOM)
 *
 * @access [public]
 * @author Peter Skultety <petko.skultety@gmail.com>
 * @param  {[type]} request [description]
 * @return {[type]}         [description]
 */
function processResponseHeaders(request){
	var resposeHeaders = request.response.headers,
		mimeType = request.response.content.mimeType,
		logs,
		regExp = new RegExp("text\/html|application\/json"),
		i;

	// if persist checkbox is not checked, log must be cleared
	if (!persistLog) {
		clearLog();
	}

	// we procces only some type of responses
	if (regExp.test(mimeType)) {

		// compress old response, if checkbox is checked
		if (collapseOldLog && logElement.lastElementChild) {
			collapseResponse(logElement.lastElementChild);
		}

		// parse firelogger messages from headers and "convert" them to objects
		logs = HeaderParser.getLogsFromHeaders(resposeHeaders);

		// craete div element for messages from this response
		// and append them to end of log area
		logElement.appendChild(createResponseDiv(request.request.url));

		// procces all logs (format them and display them in DOM)
		for (i = 0; i < logs.length; i++) {
			processLog(logs[i]);
		}
	}
	return true;
}

/**
 * processLog
 *
 * Convert log to text and insert it into DOMm to the right place
 *
 * @access [public]
 * @author Peter Skultety <petko.skultety@gmail.com>
 * @param  object log one firelogger message from server
 * @return {[type]}     [description]
 */
function processLog(log) {
	var responseMsgElement,
		htmlText
	;

	// first convert log to html text.
	// That include injecting arguments and syntax highlighting.
	htmlText = HeaderParser.createTextFromFireLoggerLog(log);

	// create element to display text from logger and fill it with text
	responseMsgElement = createResponseMsgElement(log.level, htmlText, log.style);

	// append element to the end of the responseMsgs in the last responseDiv
	logElement.lastElementChild.lastElementChild.appendChild(responseMsgElement);

	return true;
}



/**
 * createResponseMsgElement
 *
 * create html element to display text from firelogger message
 *
 * @access [public]
 * @author Peter Skultety <petko.skultety@gmail.com>
 * @param  string logLevel level of the message: debig, info,...
 * @param  string htmlText text from firelogger in html with style and so..
 * @param  string style custom style for this log message.
 * @return htmlElement     [description]
 */
function createResponseMsgElement(logLevel, htmlText, syle) {
	var responseMsg = document.createElement('pre')
		;

	responseMsg.className = "response-msg " + logLevel;
	responseMsg.setAttribute('data-loglevel', logLevel);

	responseMsg.innerHTML = htmlText;

	// TODO
	// 27.2.2015 Peter Skultety: append custom style to existed
	// first parse them or ?
	// if (style) {
	//  styles = parseCustomStyle(style);
	// 	responseMsg.style...
	// }

	// dispay or hide element according to active filters
	applyFiltersToMsg(responseMsg);


	// if (filter[logLevel] === true) {
	// 	responseMsg.style.display = 'block';
	// } else {
	// 	responseMsg.style.display = 'none';
	// }

	return responseMsg;
}

/**
 * createResponseDiv
 *
 * create new html elements for displaing info from one response
 *
 * @access [public]
 * @param string url uri of the request
 * @author Peter Skultety <petko.skultety@gmail.com>
 * @return {[type]} [description]
 */
function createResponseDiv(url){
	var responseDiv = document.createElement("div"),
		responseUrlDiv = document.createElement("div"),
		expandCollapsedImg = document.createElement("img"),
		urlTextSpan = document.createElement("span"),
		responseMsgsDiv = document.createElement("div")
	;

	// set up element for request link and append childs
	responseUrlDiv.className = "response-url";
	expandCollapsedImg.src="ico/expand.png";
	urlTextSpan.innerHTML = url;
	responseUrlDiv.appendChild(expandCollapsedImg);
	responseUrlDiv.appendChild(urlTextSpan);

	// add onClick event. Click on element hide messages from this request
	responseUrlDiv.onclick = function() {
		var responseDiv = this.parentNode,
			expandCollapsedImg = this.childNodes[0],
			responseMsgsDiv = responseDiv.lastElementChild
			;
		if (responseDiv.getAttribute('data-expanded') === "1" ) {
			collapseResponse(responseDiv);
			// responseDiv.setAttribute('data-expanded',"0");
			// responseMsgsDiv.style.display = 'none';
			// expandCollapsedImg.src="ico/colapse.png";

		} else {
			expandResponse(responseDiv);
			// responseDiv.setAttribute('data-expanded',"1");
			// responseMsgsDiv.style.display = 'block';
			// expandCollapsedImg.src="ico/expand.png";
		}

	};

	responseMsgsDiv.className = "response-msgs"	;

	// create main element for response and append child to them
	responseDiv.className = "response-div";
	responseDiv.setAttribute('data-expanded',"1");
	responseDiv.appendChild(responseUrlDiv);
	responseDiv.appendChild(responseMsgsDiv);

	return responseDiv;
}

/**
 * expandResponse
 *
 * Show messages from server response
 *
 * @access public
 * @author Peter Skultety <petko.skultety@gmail.com>
 * @param  div element responseDiv Html element, which messages will be shown
 * @return {[type]}             [description]
 */
function expandResponse(responseDiv) {
	var expandCollapsedImg = responseDiv.childNodes[0].childNodes[0],
		responseMsgsDiv = responseDiv.childNodes[1]
	;

	responseDiv.setAttribute('data-expanded',"1");
	responseMsgsDiv.style.display = 'block';
	expandCollapsedImg.src="ico/expand.png";
}


/**
 * collapseResponse
 *
 * Hide messages from server response
 *
 * @access public
 * @author Peter Skultety <petko.skultety@gmail.com>
 * @param  div element responseDiv Html element, which messages will be hiden
 * @return {[type]}             [description]
 */
function collapseResponse(responseDiv) {
	var expandCollapsedImg = responseDiv.childNodes[0].childNodes[0],
		responseMsgsDiv = responseDiv.childNodes[1]
	;

	responseDiv.setAttribute('data-expanded',"0");
	responseMsgsDiv.style.display = 'none';
	expandCollapsedImg.src="ico/colapse.png";
}


/**
 * clearLog
 *
 * clear content of log elemente. Remove all messages
 *
 * @access [public]
 * @author Peter Skultety <petko.skultety@gmail.com>
 * @return {[type]} [description]
 */
function clearLog() {
	logElement.innerHTML = '';
}


/**
 * switchFilter
 *
 * Switch status of filter passed in parameter,
 * change ico for relevant button and
 * apply new filter status to all component
 *
 * @access [public]
 * @author Peter Skultety <petko.skultety@gmail.com>
 * @param  string logLevel level of filter to switch
 * @return {[type]}          [description]
 */
function switchFilter(logLevel) {
	// switch filter status in global variable
	filter[logLevel] = !filter[logLevel];

	// change ico for button representing this log level
	if (filter[logLevel]) {
		filterButtons[logLevel].src = 'ico/' + logLevel + '.png';
	} else {
		filterButtons[logLevel].src = 'ico/' + logLevel + 'Off.png';
	}

	// apply new filter status to all component
	applyFilter();

}

/**
 * applyFilter
 *
 * display or hide messages due filter status
 *
 * @access [public]
 * @author Peter Skultety <petko.skultety@gmail.com>
 * @return {[type]} [description]
 */
function applyFilter(){
	var responses = logElement.childNodes,
		responseMsgs,
		responseMsg,
		i,j
		;

	// proccess all responses
	for (i = 0; i < responses.length ; i++) {

		// find all responseMsgs elements
		responseMsgs = responses[i].lastElementChild.childNodes;

		// process all reposnseMsg
		for (j =0 ; j < responseMsgs.length; j++) {
			responseMsg = responseMsgs[j];
			applyFiltersToMsg(responseMsg);


		}
	}
}


/**
 * applyFiltersToMsg
 *
 * display or hide msg according to filters
 *
 * @access [public]
 * @author Peter Skultety <petko.skultety@gmail.com>
 * @param  div element responseMsg msg element
 * @return {[type]}             [description]
 */
function applyFiltersToMsg(responseMsg) {
	var logLevel,
		msgRawText,
		htmlText
	;

	logLevel = responseMsg.getAttribute('data-loglevel');
	// msgRawText = responseMsg.getAttribute('data-rawtext');
	htmlText = responseMsg.innerHTML;

	// display or hide element according to relevant filter status
	if (filter[logLevel] === true) {

		// apply context filter if its filled
		if (contextFilter !== false) {
			if ((htmlText.toLowerCase().indexOf(contextFilter.toLowerCase()) === -1)) {
				responseMsg.style.display = 'none';
			} else {
				responseMsg.style.display = 'block';
			}
		} else {
			responseMsg.style.display = 'block';
		}

	} else {
		responseMsg.style.display = 'none';
	}
}


/**
 * printDebugMsg
 *
 * print message to my debug log.
 * It is not possible access chrome console from developer tools panel.
 * (or... id dont know how to do it :) )
 *
 * @access public
 * @author Peter Skultety <petko.skultety@gmail.com>
 * @param  string text text to display
 * @return {[type]}      [description]
 */
function printDebugMsg(text){
	var msg = document.createElement("p")
	;
	msg.innerHTML = text;
	document.getElementById("debugLog").appendChild(msg);
}