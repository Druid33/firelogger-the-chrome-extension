FireLogger The Chrome Extension
===============================

extension similar to [FireLogger](http://firelogger.binaryage.com/) in Firefox. Display firelogger messages from server in separate panel/tab in chrome developer tools.
For quick test install extension, turn on developer tools and visit http://firelogger-php-tests.binaryage.com/basic.php


Features
---------
- display firelogger messages in separate panel/tab in developer tools
- syntax highlighting (JSON, SQL)
- filter by message level (log, info,...)
- color theme selector
- font resizer
- Turn on/off button (if headers are too big(typically due lot of firelogger headers) request can failed in chrome)
- filter by message content
- Persist button (automaticaly clear logger after page reload)


TODO
-----

- display date and time of message
- display row number of message



How to install
--------------

Quick instalation:

1. In list of files on top find file with name firelogger-the-chrome-extension.crx
2. Download it (Right-click on the file and choose "Save link as" or something similar)
3. open it with Chrome (right-click on file and choose "Open with...")

From github:

1. Clone the [repository](https://github.com/Druid33/firelogger-the-chrome-extension)
2. Install an extension into Chrome (Tools -> Extensions -> Load unpacked extension... or chrome://extensions/)

From chrome web store:

In progress...


How to use
----------

1. Open developer tools in chrome (press F12)
2. Click on panel/tab named "Logger"
3. Enjoy


Thanks for inspiration to
-------------------------
- Matous Skala [Chrome Firelogger](https://github.com/MattSkala/chrome-firelogger)
- http://www.webtoolkit.info/(http://www.webtoolkit.info/)
- http://thecodeplayer.com/walkthrough/mysql-syntax-highlighter-javascript-regex(http://thecodeplayer.com/walkthrough/mysql-syntax-highlighter-javascript-regex)


Screenshots
----------
![Preview1](https://github.com/Druid33/firelogger-the-chrome-extension/blob/master/img/Preview1.png)
![Preview2](https://github.com/Druid33/firelogger-the-chrome-extension/blob/master/img/Preview2.png)


Issues
------
If you find some bug, please report it [here](https://github.com/Druid33/firelogger-the-chrome-extension/issues).


Author
------
Peter Skultety,
petko.skultety@gmail.com,
https://github.com/Druid33
