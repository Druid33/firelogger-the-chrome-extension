/**
 * HeaderParser
 *
 * Parser for firefoxheaders.
 *
 * @type {Object}
 */
var HeaderParser = {

    /**
     * getLogsFromHeaders
     *
     * Parse all headers for headers from firelogger and then convert it to log object
     *
     * Inspired by Matous Skala from his chrome-firelogger (https://github.com/MattSkala/chrome-firelogger)
     *
     * @access public
     * @author Peter Skultety <petko.skultety@gmail.com>
     * @param  {array/object} response_headers pole hlaviciek odpovede
     * @return {array}                  dekodovane firelogger objekty
     */
    getLogsFromHeaders : function getLogsFromHeaders(response_headers) {
        var buffers = {},
            profiles = {},
            pattern = /^firelogger-([0-9a-f]+)-(\d+)/i,
            key,
            packets = [],
            bufferId,
            buffer,
            packet,
            log,
            logs = [],
            unorderedLogs = [],
            i
            ;

        function parseHeader(name, value) {
            var res = pattern.exec(name);
            if (!res) return;
            buffers[res[1]] = buffers[res[1]] || [];
            buffers[res[1]][res[2]] = value;
        }

        for (key in response_headers) {
            parseHeader(response_headers[key].name, response_headers[key].value);
        }

        for (bufferId in buffers) {
            if (!buffers.hasOwnProperty(bufferId)) continue;
            buffer = buffers[bufferId].join('');
            buffer = Base64.decode(buffer);
            buffer = Utf8.decode(buffer);
            packet = JSON.parse(buffer);
            packets.push(packet);
        }
        for (packet in packets) {
            packet = packets[packet];
            for (i = 0; i < packet.logs.length; i++) {
                log = packet.logs[i];
                if ( (log.order !== '') && (log.order !== null) && (log.order !== undefined) ) {
                    if (logs[log.order] === undefined) {
                        logs[log.order] = log;
                    } else {
                        unorderedLogs.push(log);
                    }
                } else {
                    unorderedLogs.push(log);
                }

            }
        }

        for (i = 0; i < unorderedLogs.length; i++) {
            logs.push(unorderedLogs[i]);
        }
        return logs;
    },


    /**
     * createTextFromFireLoggerLog
     *
     * Parse log object, create html text with syntax highlight and included arguments
     *
     * @access [public]
     * @author Peter Skultety <petko.skultety@gmail.com>
     * @param  {[type]} log [description]
     * @return {[type]}     [description]
     */
    createTextFromFireLoggerLog : function createTextFromFireLoggerLog(log) {
        var outputMsg = '',
            args = log.args,
            regExp = new RegExp("%[sodif]{1}", 'g'),
            i;

        if (log.message !== undefined && log.message !== "" && log.message !== null) {
            outputMsg = log.message;
        } else if (log.template !== undefined && log.template !== "" && log.template !== null) {
            outputMsg = log.template;
        }

        // highlight syntax of JSON and SQL
        outputMsg = SyntaxHighlighter.syntaxHighlight(outputMsg);

        // include arguments
        if (args.length > 0) {
            args.reverse();
            outputMsg = outputMsg.replace(regExp, function(match){
                var item = args.pop(),
                    stringifiedItem;
                if ( (item instanceof Array) || (typeof item === "object" ) ) {
                    stringifiedItem = SyntaxHighlighter.syntaxHighlight(JSON.stringify(item, undefined, 4));
                } else {
                    stringifiedItem = item;
                }

                return stringifiedItem;
            });
        }

        // include unreferenced arguments
        args.reverse();
        for (i = 0; i < args.length; i++) {
            if ( (args[i] instanceof Array) || (typeof args[i] === "object" ) ) {
                outputMsg = outputMsg + ' ' + SyntaxHighlighter.syntaxHighlight(JSON.stringify(args[i], undefined, 4));
            } else {
                outputMsg = outputMsg + ' ' + SyntaxHighlighter.syntaxHighlight(args[i]);
            }
        }


        return outputMsg;
    }

};