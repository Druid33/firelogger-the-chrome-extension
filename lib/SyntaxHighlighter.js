/**
 * SyntaxHighlighter
 *
 * Highlighter fro JSON and SQL.
 * Highlighting is provided by nesting keywords to span element with class
 *
 * @type {Object}
 * @author Peter Skultety <petko.skultety@gmail.com>
 */
var SyntaxHighlighter = {

    /**
     * syntaxHighlight
     *
     * Highlight keywords from input parameter and return html text.
     * can highlight JSON and SQL syntax
     *
     * @access public
     * @author Peter Skultety <petko.skultety@gmail.com>
     * @param  string text input test
     * @return string      highlighted text
     */
    syntaxHighlight : function syntaxHighlight(text) {

        if ( (text[0] === '[') || (text[0] === '{') ) {
            return this.syntaxHighlightJson(text);
        } else if ( this.isSql(text)) {
            return this.syntaxHighlightSql(text);
        } else {
            return text;
        }
    },

    /**
     * isSql
     *
     * Dummy check if text has SQL syntax
     *
     * @access [public]
     * @author Peter Skultety <petko.skultety@gmail.com>
     * @param  {[type]}  text [description]
     * @return {Boolean}      [description]
     */
    isSql : function isSql(text) {
        var regExp = new RegExp('^[ ]*(SELECT|INSERT|UPDATE|DELETE|ALTER|CREATE|BEGIN|WITH){1}');
        if (regExp.test(text)) {
            return true;
        } else {
            return false;
        }
    },

    /**
     * syntaxHighlightSql
     *
     * BIG Thanks to http://thecodeplayer.com/walkthrough/mysql-syntax-highlighter-javascript-regex
     *
     * @access [public]
     * @param  {[type]} sql [description]
     * @return {[type]}     [description]
     */
    syntaxHighlightSql : function syntaxHighlightSql(sql) {
        //full list of reserved words: http://dev.mysql.com/doc/refman/5.0/en/reserved-words.html
        var reservedWords = ["AND", "AS", "ASC", "BETWEEN", "BY", "CASE", "CURRENT_DATE", "CURRENT_TIME", "DELETE", "DESC", "DISTINCT", "EACH", "ELSE", "ELSEIF", "FALSE", "FOR", "FROM", "GROUP", "HAVING", "IF", "IN", "INSERT", "INTERVAL", "INTO", "IS", "JOIN", "KEY", "KEYS", "LEFT", "LIKE", "LIMIT", "MATCH", "NOT", "NULL", "ON", "OPTION", "OR", "ORDER", "OUT", "OUTER", "REPLACE", "RIGHT", "SELECT", "SET", "TABLE", "THEN", "TO", "TRUE", "UPDATE", "UNION","VALUES", "WHEN", "WHERE","WITH"],
            regExp,
            c,
            i,j

        ;

        //as you can see keywords are still purple inside comments.
        //we will create a filter function to remove those spans. This function will noe be used in .replace() instead of a replacement string
        function clear_spans(match)
        {
            match = match.replace(/<span.*?>/g, "");
            match = match.replace(/<\/span>/g, "");
            return "<span class=\"sql-comment\">"+match+"</span>";
        }

        //regex time
        //highlighting special characters. /, *, + are escaped using a backslash
        //'g' = global modifier = to replace all occurances of the match
        //$1 = backreference to the part of the match inside the brackets (....)
        sql = sql.replace(/(=|%|\/|\*|-|,|;|\+|<|>)/g, "<span class=\"sql-special-char\">$1</span>");

        //strings - text inside single quotes and backticks
        sql = sql.replace(/(['`].*?['`])/g, "<span class=\"sql-string\">$1</span>");

        //numbers - same color as strings
        sql = sql.replace(/([ ]\d+[ ])/g, "<span class=\"sql-string\">$1</span>");

        //functions - any string followed by a '('
        sql = sql.replace(/(\w*?)\(/g, "<span class=\"sql-function\">$1</span>(");

        //brackets - same as special chars
        sql = sql.replace(/([\(\)])/g, "<span class=\"sql-special-char\">$1</span>");

        //bind params
        sql = sql.replace(/( :\w+)/g, "<span class=\"sql-bind-param\">$1</span>");

        //reserved mysql keywords
        for(i = 0; i < reservedWords.length; i++)
        {
            //regex pattern will be formulated based on the array values surrounded by word boundaries. since the replace function does not accept a string as a regex pattern, we will use a regex object this time
            regExp = new RegExp("\\b"+reservedWords[i]+"\\b", "gi");
            sql = sql.replace(regExp, "<span class=\"sql-keyword\">"+reservedWords[i]+"</span>");
        }

        //comments - tricky...
        //comments starting with a '#'
        sql = sql.replace(/(#.*?\n)/g, clear_spans);

        //comments starting with '-- '
        //first we need to remove the spans applied to the '--' as a special char
        sql = sql.replace(/<span class=\"sql-special-char\">-<\/span><span class=\"sql-special-char\">-<\/span>/g, "--");
        sql = sql.replace(/(-- .*?\n)/g, clear_spans);

        //comments inside /*...*/
        //filtering out spans attached to /* and */ as special chars
        sql = sql.replace(/<span class=\"sql-special-char\">\/<\/span><span class=\"sql-special-char\">\*<\/span>/g, "/*");
        sql = sql.replace(/<span class=\"sql-special-char\">\*<\/span><span class=\"sql-special-char\">\/<\/span>/g, "*/");
        //In JS the dot operator cannot match newlines. So we will use [\s\S] as a hack to select everything(space or non space characters)
        sql = sql.replace(/(\/\*[\s\S]*?\*\/)/g, clear_spans);

        return sql;

    },

    /**
     * syntaxHighlightJson
     *
     * Highlight JSON syntax.
     *
     * I find this code somewhere on the net. Thanks to unknown author :)
     *
     * @access [public]
     * @param  {[type]} json [description]
     * @return {[type]}      [description]
     */
    syntaxHighlightJson : function syntaxHighlightJson(json) {
        json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function (match) {
            var cls = 'number';
            if (/^"/.test(match)) {
                if (/:$/.test(match)) {
                    cls = 'key';
                } else {
                    cls = 'string';
                }
            } else if (/true|false/.test(match)) {
                cls = 'boolean';
            } else if (/null/.test(match)) {
                cls = 'null';
            }
            return '<span class="' + cls + '">' + match + '</span>';
        });
    }
};