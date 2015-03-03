
// this is listner to extension messages.
// If we can send proccess message from another extension or extension panel
// we do it here like this.
//
chrome.extension.onRequest.addListener(function(request) {
	switch(request.command) {
		// turn firelogger on
		case 'fireLoggerOn':
			chrome.webRequest.onBeforeSendHeaders.addListener(
			appendFireLoggerHeader,
			{
			urls: ["<all_urls>"]
			},
			["blocking", "requestHeaders"]
			);
			break;

		// turn firelogger off
		case 'fireLoggerOff':
			chrome.webRequest.onBeforeSendHeaders.removeListener(appendFireLoggerHeader);
			break;
	}
});

/**
 * appendFireLoggerHeader
 *
 * add firelogger header to request headers
 *
 * @access [public]
 * @author Peter Skultety <petko.skultety@gmail.com>
 * @param  object details request?
 * @return {[type]}         [description]
 */
function appendFireLoggerHeader(details) {
	details.requestHeaders.push({
		name: 'X-FireLogger',
		value: '1.3'
	});
	return {
		requestHeaders: details.requestHeaders
	};
}

