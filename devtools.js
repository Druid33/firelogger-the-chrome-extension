var fireLoggerPanel;

chrome.devtools.panels.create("Logger",
							  "coldfusion10.png",
							  "panel.html",
							  function(panel) {
								fireLoggerPanel = panel;
							}
);
