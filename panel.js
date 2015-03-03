var filter = {
		debug : true,
		info : true,
		warning : true,
		error : true,
		critical : true
	},
	filterButtons = {},
	logElement,
	globalMsgElement
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

	// we procces only some type of responses
	if (regExp.test(mimeType)) {
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
	if (filter[logLevel] === true) {
		responseMsg.style.display = 'block';
	} else {
		responseMsg.style.display = 'none';
	}

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
			responseDiv.setAttribute('data-expanded',"0");
			responseMsgsDiv.style.display = 'none';
			expandCollapsedImg.src="ico/colapse.png";

		} else {
			responseDiv.setAttribute('data-expanded',"1");
			responseMsgsDiv.style.display = 'block';
			expandCollapsedImg.src="ico/expand.png";
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
		i,j,
		logLevel
		;

	// proccess all responses
	for (i = 0; i < responses.length ; i++) {

		// find all responseMsgs elements
		responseMsgs = responses[i].lastElementChild.childNodes;

		// process all reposnseMsg
		for (j =0 ; j < responseMsgs.length; j++) {
			responseMsg = responseMsgs[j];
			logLevel = responseMsg.getAttribute('data-loglevel');
			// display or hide element according to relevant filter status
			if (filter[logLevel] === true) {
				responseMsg.style.display = 'block';
			} else {
				responseMsg.style.display = 'none';
			}
		}
	}
}

