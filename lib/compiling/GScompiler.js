(function () {
    "use strict";

/*
Salvatore di Dio demonstrated in his RapydGlow experiment (http://salvatore.pythonanywhere.com/RapydGlow)
how he was able to use the RapydScript Python-to-JavaScript compiler with GlowScript graphics.
This inspired the implementation of the VPython (vpython.org) API at glowscript.org.
Salvatore provided the file papercomp.js for operator overloading, based on the work of
    Juerg Lehni (PaperScript: http://scratchdisk.com/posts/operator-overloading).
                 https://github.com/paperjs/paper.js
He also assembled support for the ability to write synchronous code in the file transform-all.js,
based on the work of
    Bruno Jouhier (Streamline: https://github.com/Sage/streamlinejs), and
    Marijn Haverbeke (Acorn.js: https://github.com/marijnh; https://github.com/ternjs/acorn).
Supporting the VPython API in a browser is possible thanks to the work of
    Alexander Tsepkov (RapydScript: https://bitbucket.org/pyjeon/rapydscript) and
    Charles Law (browser-based RapydScript: http://pyjeon.pythonanywhere.com/static/rapydscript_online/index.html).

When the GlowScript project was launched in 2011 by David Scherer and Bruce Sherwood,
Scherer implemented operator overloading and synchronous code using libraries existing at that time.
In 2015 it became necessary to upgrade to newer libraries because compilation failed on some browsers.

In Jan. 2017 Bruce Sherwood updated the operator overloading (papercomp.js) machinery to use
the latest versions of the acorn and streamline libraries. He also changed from using the rapydscript of
Tsepkov to the rapydscript-ng of Kovid Goyal, which is closer to true Python and therefore better for the
purposes to which GlowScript is put. An attempt was made to update Streamline (permit synchronous code)
but failed because the new large ES6-based library could not be minified by uglify. When and if uglify
can perform the minification, a new attempt will be made to use the Streamline file li/compiling/transform-es6.js.
In the meantime transform.js is used (formerly named transform-all.js), the file obtained from Salvatore di Dio in 2015.

-----------------------------------------------------------------------------------------
HOW TO OBTAIN BROWSER VERSIONS OF THE RAPYDSCRIPT-NG, PAPERCOMP, AND STREAMLINE LIBRARIES
There are probably more efficient ways to obtain these libraries, but the following methods work.

For the rapydscript-ng in-browser Python-to-JavaScript transpiler, go to https://github.com/kovidgoyal/rapydscript-ng.
Search for "Embedding the RapydScript compiler in your webpage". There you will find a link to the transpiler file,
with instructions for how to use it. Store the file in lib/rapydscript/compiler.js. This file is updated whenever
the version number changes.

The in-browser transpiler includes a minimized copy of the run-time function. However, for a program exported
to the user's own web page, the transpiler is not present and a run-time file is need. Here is how to build
the rapydscript-ng runtime library (but see below for an alternative procedure):
1) Make sure node is installed.
2) In a new folder, execute "npm install rapydscript-ng".
3) Create a file named "input.py" in this folder that contains "a=1".
4) Execute "rapydscript --bare input.py > runtime.js".
5) At the end of the file "runtime.js", delete these lines:
	var __name__ = "__main__";
	
	var a;
	a = 1;
6) Copy the file to lib/rapydscript/runtime.js.

The instructions above for building the two RapydScript files are adequate if it is not necessary to
get the very latest version from the rapydscript-ng repository. If there have been commits to the
repository that you want, but there has been no version change, replace the instructions with the
following. I was unable to do this on Windows and did this on a Mac.
1) Make sure node and git are installed.
2) In a new folder, execute the following (taken from HACKING.md in the rapydscript-ng repository):
	git clone git://github.com/kovidgoyal/rapydscript-ng.git
	cd rapydscript-ng
	sudo npm link .
	sudo npm install  # This will automatically install the dependencies for RapydScript
3) Execute "sudo bin/rapydscript self --complete --test". This will build files in the "dev" folder.
4) Execute "sudo bin/web-repl-export embedded". This builds the "embedded" (in-browser) compiler.
5) Copy the file dev/baselib-plain-pretty.js to lib/rapydscript and change the name to runtime.js.
6) Copy the file embedded/rapydscript.js to lib/rapydscript and change the name to compiler.js.
7) Insert these statements at the start of runtime.js (this is a kludge; don't know how to invoke the new compiler):
	var RS_iterator_symbol = (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") ? Symbol.iterator : "iterator-Symbol-5d0927e5554349048cf0e3762a228256";
	var RS_kwargs_symbol = (typeof Symbol === "function") ? Symbol("kwargs-object") : "kwargs-object-Symbol-5d0927e5554349048cf0e3762a228256";
	var RS_cond_temp, RS_expr_temp, RS_last_exception;
	var RS_object_counter = 0;
	var RS_len;

The two rapydscript-ng files, compiler.js and runtime.js, have XY_ at the start of library entities,
where XY are non-ascii characters. This caused errors in the old streamline file (transform.js), 
so it was necessary to replace all XY characters with RS in both compiler.js and runtime.js. 
This may not be necessary in the future, if XY is acceptable to transform-es6.js.

For operator overloading, the source for lib/compiling/papercomp.js is at https://github.com/paperjs/paper.js,
at src/core/PaperScript.js; compare with papercomp.js, which was modified by Bruce Sherwood for greater speed.
Also needed is a current copy of acorn (acorn.es.js), a parser of JavaScript used by papercomp.js.
1) Make sure node has been installed.
2) In a new folder, execute "npm install acorn".
3) The file you want is node_modules/acorn/dist/acorn.es.js.
4) Copy the file to lib/compiling/acorn.es.js
5) Modify the end of the file to look like this:

	//export { version, parse, parseExpressionAt, tokenizer, parse_dammit, LooseParser, pluginsLoose, addLooseExports, Parser, plugins, defaultOptions, Position, SourceLocation, getLineInfo, Node, TokenType, tt as tokTypes, TokContext, types as tokContexts, isIdentifierChar, isIdentifierStart, Token, isNewLine, lineBreak, lineBreakG };
	
	//var exports = {
	//		acorn_parse: parse
	//	}

	//Export(exports)
	
	window.call_acorn_parse = parse // Bruce Sherwood; makes acorn accessible to GlowScript compiler

There is no current source outside GlowScript for lib/compiling/transform.js (formerly transform-all.js),
originally provided by Salvatore di Dio. The new but as yet unused file transform-es6.js was prepared thus:
1) Make sure node has been installed.
2) In a new folder, execute "npm install streamline". 
3) The file you want is node_modules/streamline/lib/browser/transform.js.
4) Copy the file to /lib/compiling/transform-es6.js
*/
    
	var VPython_import = null // can be vpython or visual or vis
	var VPython_names = []    // e.g. [box, cylinder] or [] if none specified (e.g. import vpython)
    var waitlist = [new RegExp('^def\\s*\\('), new RegExp('\\w*function\\w*'), 
                    new RegExp('^rate\\s*\\('), new RegExp('sleep\\s*\\('), 
                    new RegExp('^get_library\\s*\\('),  new RegExp('\\.waitfor\\s*\\('), 
                    new RegExp('\\.pause\\s*\\('), new RegExp('=\\s*read_local_file\\s*\\(') ]
	// In a previous version of Streamline it was possible to specify the callback tag as "wait",
	// but that option is not available in current Streamline; it must be "_"
	var GS_wait = '_'
    
	function waits(line, lang) {
		// Look for "wait" in certain statements and change to GS_wait or, if missing, supply GS_wait (which is _)
		for (var i=0; i<waitlist.length; i++) {
			if (i === 0 && lang != 'rapydscript') continue
			if (i == 1 && lang != 'javascript') continue
            var patt = waitlist[i]
            if (line.search(patt) >= 0) {
                var end = line.lastIndexOf(')')
                var ending = line.slice(end)
                var parencnt = 1
                var name = ''
                while (end >= 0) {
					end--
					if (end < 0) break
                    switch (line[end]) {
	                    case ("'"):
	                    case ('"'):
	                        return line.slice(0,end+1)+','+GS_wait+ending
	                    case (')'):
	                        parencnt++
	                        break
	                    case ('('):
	                        parencnt--
	                        if (parencnt === 0) {
                            	if (name == 'wait') return line.slice(0,end+1)+GS_wait+ending
	                            if (lang == 'vpython') {
	                            	if (name.length === 0) return line.slice(0,end+1)+GS_wait+ending
	                            	else return line.slice(0,end+1)+name+','+GS_wait+ending
	                            } else {
	                            	return line
	                            }
	                        } else {
	                            if (name == 'wait') return line.slice(0,end+1)+GS_wait+ending
	                        }
	                        break
	                    case (','):
	                        if (parencnt === 1) {
                                if (name == 'wait') return line.slice(0,end+1)+GS_wait+ending
                                else return line
	                        }
	                        break
	                    case (' '):
	                        break
	                    default:
	                        name = line[end]+name
                    }
				}
            }
        }
        return line
    }
	
	var lineno_string = 'RS_ls = ' // prepended to quoted line number; used in error return
	
    function preprocess(program, lang) { // manipulate the program source
		// The preprocessing includes inserting RS_ls = line number to enable error reporting of original source line
    	var c, lineno, lines, line, m, start
    	var parens = 0, brackets = 0, braces = 0
    	var lastleftparens = null, lastleftbracket = null, lastleftbrace = null
	    var indent = ''
    	var getline = /(^\s*)(.*)/
    	var newprogram = '', lastindent = ''
    	var firstquote = 0 // 0: no string; 1: string starts with '; 2: string starts with " (or """)
    	var continuedline = false
    	var indef = false // true if processing an anonymous def in RapydScript
    	var delim = '"'
    	var defindents = []  // stack of [def or class character location, length of def or class indent]
    	var whenpatt = /when[ ]/
        var pickpatt = /(\.pick)\s*(.)/
    	var defpatt = /def[^:]*:/
	    var classpatt = /class[^:]*:/
    	var print_optionspatt = /^print_options/
	    var decoration
	    lines = program.split('\n')
		for (lineno=0; lineno<lines.length; lineno++) {
			decoration = ''
		    m = lines[lineno].match(getline)
		    indent = m[1]
		    line = m[2]
		    if (line[0] == '#') continue
		    
		    m = line.match(print_optionspatt)
		    if (m) line = line.replace(/delete/, "remove") // RapydScript-NG chokes on "delete"; print_options accepts delete or remove

	    	if (lang != 'javascript' && line[0] == '@') { // such as @kwargs
	    		var nextline = lines[lineno+1]
	    		m = nextline.match(getline)
	    		if (m[2].slice(0,3) == 'def' || m[2].slice(0,6) == 'module') {
	    			decoration = line
	    			indent = m[1]
	    			line = m[2]
	    			lineno++
	    		} else {
	    			continue
	    		}
	    	}
		    
		    if (line.length === 0) continue
		    
			if (lang == 'vpython') {
		    	if (defindents.length > 0 && indent.length <= defindents[defindents.length-1][1]) defindents.pop()
		    	
		    	// 'from vpython import *'  // this is the default (or 'from vpython import *')
		    	// 'from vpython import box, vec  '  // selective version of vpython import
	    		// 'import vpython' // create vpython = {box:vp_box, sphere:vp_sphere, etc.}
	    		// 'from vpython import box, vec' // create vpython = {box:vp_box, vec:vec}

				if (VPython_import === null) VPython_names = []
				var w = line.split(' ')
				if (w[1] == '__future__') continue
				if (w[1] == 'visual.factorial') continue
	    		if (w[0] == 'from' && w[2] == 'import' && w.length >= 4) { // from X import a, b, c (or *)
	    			if (w[1] == 'visual.graph') {
	    				if (w[3] == '*') continue // from visual.graph import * is the only graph import supported at the moment
	    				return 'ERROR: Currently only "from visual.graph import *" is supported, line '+(lineno+2)+": "+lines[lineno]
	    			}
	    			if (!(w[1] == 'vpython' || w[1] == 'visual' || w[1] == 'vis')) {
	    				throw new Error("Line "+(lineno+2)+": cannot import from "+w[1])
	    			}
	    		    if (VPython_import === null) {
	    		    	if (w[3] == '*') continue // from vpython import * is the default
	    		    	VPython_import = w[1]
	    		        for (var j=3; j<w.length; j++) {
	    		            if (w[j].length > 0 && w[j] != ',') {
	    		                if (w[j].slice(-1) == ',') w[j] = w[j].slice(0,-1)
	    		                if (w[j] == ' ' || w[j] == '(' || w[j] == ')' || w[j][0] == '(' || w[j][-1] == ')') continue
	    		                VPython_names.push(w[j])
	    		            }
	    		        }
	    		    }
	    		    continue
	    		} else if (w[0] == 'import' && w.length == 2) { // import X
	    			if (w[1] == 'visual.graph') return 'ERROR: Currently only "from visual.graph import *" is supported, line '+(lineno+2)+": "+lines[lineno]
	    			if (!(w[1] == 'vpython' || w[1] == 'visual' || w[1] == 'vis')) 
	    				return "ERROR: Cannot import from "+w[1]+", line "+(lineno+2)+": "+lines[lineno]
	    		    if (VPython_import === null) {
	    		    	VPython_import = w[1]
	    		    }
	    		    continue
	    		} else if (w[0] == 'import') {
	    			if (w[1] == 'vpython' || w[1] == 'visual' || w[1] == 'vis') {
	    				if (w.length == 4 && w[2] == 'as') {
	    					VPython_import = w[3] // import vpython as vp
	    					continue
	    				} else return "ERROR: improper import statement, line "+(lineno+2)+": "+lines[lineno]
	    			} else {
	    				return "ERROR: Cannot import from "+w[1]+", line "+(lineno+2)+": "+lines[lineno]
	    			}
	    		}
			}
		    
	    	var doublequote = false, singlequote = false, backslash = false
	    	var previouscontinuedline = continuedline
	    	var triplequote = false // true if in the midst of """......"""
	    	var processedtriplequote = false
	    	var tline = ""
	    	for (var i=0; i<line.length; i++) {
	    		var previousquote = singlequote || doublequote || triplequote
	    		// If there are quotes we stay in this loop to collect the entire string
	    		var char = line[i]
	    		if (char == '\\' && i < line.length-1 && line[i+1] !== ' ') { // handle e.g. \"
	    			i++
	    			continue
	    		}
	    		switch (char) {
	    		case '#':
	    			if (!singlequote && !doublequote && !triplequote) { // remove trailing comments
			    			line = line.slice(0,i)
	    			}
	    			break
	    		case '"':
	    			if (i <= line.length-3 && line[i+1] == '"' && line[i+2] == '"') {
	    				if (triplequote && i <= line.length-4 && line[i+3] == '"') break
	    				triplequote = !triplequote
	    				processedtriplequote = true
	    				i += 2
	    			} else if (!triplequote && !singlequote) doublequote = !doublequote
	    			break
	    		case "'":
	    			if (i <= line.length-3 && line[i+1] == "'" && line[i+2] == "'") {
	    				if (triplequote && i <= line.length-4 && line[i+3] == "'") break
	    				triplequote = !triplequote
	    				processedtriplequote = true
	    				i += 2
	    			} else if (!triplequote && !doublequote) singlequote = !singlequote
	    			break
	    		}
	    		if (triplequote && i == line.length-1 && lineno < lines.length-1) {
	    			lineno++
	    			line += '\n' + lines[lineno]
	    		}
	    		if (singlequote || doublequote || triplequote) {
	    			if (i < line.length-1) continue
	    			if (lineno === lines.length-1) {
	    				var q = "single"
	    				if (doublequote) q = "double"
	    				else q = "triple"
	    				return "ERROR: Unbalanced "+q+" quotes"
	    			}
	    		}
	    		
	    		switch (char) {
	    		case ':':
	    			if (parens == 1) { // anonymous function
	    				indef = true
	    			}
	    			break
	    		case '(':
	    			if (i > 0 && line[i-1] == '\\') break // check for \( in a regular expression
	    			if (parens === 0) lastleftparens = lineno
	    			parens++
	    			break
	    		case ')':
	    			if (i > 0 && line[i-1] == '\\') break // check for \) in a regular expression
	    			parens--
	    			if (indef && parens == 0) indef = false
	    			break
	    		case '[':
	    			if (i > 0 && line[i-1] == '\\') break // check for \[ in a regular expression
	    			if (brackets === 0) lastleftbracket = lineno
	    			brackets++
	    			break
	    		case ']':
	    			if (i > 0 && line[i-1] == '\\') break // check for \] in a regular expression
	    			brackets--
	    			break
	    		case '{':
	    			if (i > 0 && line[i-1] == '\\') break // check for \{ in a regular expression
	    			if (braces === 0) lastleftbrace = lineno
	    			braces++
	    			break
	    		case '}':
	    			if (i > 0 && line[i-1] == '\\') break // check for \} in a regular expression
	    			braces--
	    			break
	    		}
	    		if (char == '\\') {
	    			if (i == line.length-1 || line[i+1] == ' ' || line[i+1] == '#')
		    			line = line.slice(0,i)
		    			backslash = true
		    			break
	    		}
	    	}
    		continuedline =  ( !indef && (backslash || (parens > 0) || (brackets > 0) || (braces > 0)) )

		    if (!previousquote) {
		    	if (lang == 'vpython') {
			    	var m = pickpatt.exec(line+' ') // convert v.pick -> v.pick()
			    	if (m) {
			    		if (m[2] != '(' && (m[2].search(/\w/) != 0)) {
			    			var i = m.index
			    			line = line.slice(0,i)+'.pick()'+line.slice(i+5)
			    		}
			    	}
		    	}
			    
			    if (!processedtriplequote) { // don't make adjustments inside a triplequote comment
			    	if (line.search(defpatt) >= 0 || line.search(classpatt) >= 0) {
			    		defindents.push([newprogram.length, indent.length]) // remember where this line is; it may need 'wait'
			    	} else {
				    	// Look for rate, sleep, get_library, .waitfor, .pause, read_local_file, and 
						// insert 'wait' argument (and if inside a function, insert earlier 'wait')
			    		var L = line.length
			    		line = waits(line, lang)
			    		
			    		if (lang == 'vpython' && line.length != L) {
			    			while (true) {
				    			var definfo = defindents.pop() // [location of def or class in newprogram, indent level]
				    			if (definfo == undefined) break
				    			var end = newprogram.slice(definfo[0]).search(/:/) + definfo[0]
				    			while (newprogram[end] !== ')') end--
				    			var i = end-1
				    			while (newprogram[i] == ' ') i--
				    			var insert
				    			if (newprogram[i] == '(') insert = GS_wait
				    			else insert = ','+GS_wait
				    			newprogram = newprogram.slice(0,end)+insert+newprogram.slice(end)
			    			}
			    		}
			    	}
			    }
		    }
    		
    		if (lang == 'vpython' || lang == 'rapydscript') {
			    // When outdent line starts with ')', the "N" must be indented.
			    // When outdent line starts with 'else' or 'elif', at the same level as prevous line,
			    //   don't insert a line number; it's this case:
			    //     if a: b
			    //     elif c: d
			    //     else e: f
		    	// Similarly, if outdent line starts with except or finally, don't insert a line number
			    
			    c = ''
			    if (indent.length < lastindent.length && ( line.charAt(0) == ')' || 
			    		line.substr(0,4) == 'else' ||
			    		line.substr(0,4) == 'elif' ||
			    	    line.substr(0,6) == 'except' || 
			    	    line.substr(0,7) == 'finally') ) {
			    	c = lastindent+lineno_string+delim+(lineno+2)+delim+'\n'
			    } else c = indent+lineno_string+delim+(lineno+2)+delim+'\n'
			    
		    	if (indent.length == lastindent.length && (line.substr(0,4) == 'elif' || line.substr(0,4) == 'else')) {
		    		c = ''
		    	} else if (line.substr(0,3) == '"""' || line.substr(0,3) == "'''" || line[0] == ')') {
		    		c = ''
		    	}
	
			    // need to indent the entire program two spaces
		    	if (previouscontinuedline) {
		    		newprogram = newprogram.slice(0,-1)+indent+line+'\n'
		    		indent = lastindent // keep the indent of the starting line of this continued sequence
		    	} else if (c == '') {
		    		newprogram += '  '+indent+line+'\n' 
		    	} else {
		    		if (decoration.length > 0) {
		    			newprogram += '  '+c+'  '+indent+decoration+'\n'
		    			newprogram += '  '+indent+line+'\n'
		    		} else {
		    			newprogram += '  '+c+'  '+indent+line+'\n'
		    		}
		    	}
    		} else { // javascript
    			newprogram += indent+line+'\n'
    		}

		    lastindent = indent
		    if (parens < 0) return "ERROR: Too many right parentheses, line "+(lineno+2)+": "+lines[lineno]
		    if (brackets < 0) return "ERROR: Too many right brackets, line "+(lineno+2)+": "+lines[lineno]
		    if (braces < 0) return "ERROR: Too many right braces, line "+(lineno+2)+": "+lines[lineno]		    
		}
    	if (parens > 0) return "ERROR: Missing right parenthesis, see line "+(lastleftparens+2)+": "+lines[lastleftparens]
	    else if (brackets > 0) return "ERROR: Missing right bracket, see line "+(lastleftbracket+2)+": "+lines[lastleftbracket]
	    else if (braces > 0) return "ERROR: Missing right brace, see line "+(lastleftbrace+2)+": "+lines[lastleftbrace]
	    else return newprogram
    }
    
    var linenopatt = /"(\d*)"/

    var RS_compiler

    function compile_rapydscript(rs_input) {
	    if (rs_input.slice(0,7) == 'ERROR: ') {
	    	throw new Error(rs_input.slice(7))
    	} else {
    	    if (RS_compiler === undefined) RS_compiler = RapydScript.create_embedded_compiler();
	        rs_input += '\n'; //just to be safe
	        try {
	        	var output = RS_compiler.compile(rs_input, {js_version:5}) // default is ES6; use ES5 until can update Stramline
	        	//var output = RS_compiler.compile(rs_input)
				return output.toString();
	        } catch(err) {
		        if (err.line === undefined) {
		        	throw new Error(err.message)
		        } else {
		    	    var lines = rs_input.split('\n')
		    	    var L = lines[err.line] // the text of the error line
		    	    var m = L.match(linenopatt) // may be '  "23"', inserted by insertLineNumbers()
		    	    if (m !== null) {
		    	    	throw new Error(err.message + "; line " + m[1] + ": "+lines[err.line+1])
		    	    } else {
		    	    	throw new Error(err.message +': '+lines[err.line])
		    	    }
		        }
	      	}
    	}
    }
    
    // vp_primitives come in two flavors: "box" for JavaScript/RapydScript and "vp_box" for VPython
    var vp_primitives = ["box", "sphere", "cylinder", "pyramid", "cone", "helix", "ellipsoid", "ring", "arrow", "compound", "graph"]
    
    var vp_other = ["canvas", "vec", "vector", "rate", "sleep", "update", "color", "extrusion", "paths", "shapes",
                    "vertex", "triangle", "quad", "label", "distant_light", "local_light", "attach_trail", "attach_arrow",
                    "sqrt", "pi", "abs", "sin", "cos", "tan", "asin", "acos", "atan", "atan2", "exp", "log", "pow",
                    "factorial", "combin", "button", "radio", "checkbox", "slider", "checkbox", "text",
                    "radians", "degrees", "gdisplay", "gcurve", "gdots", "gvbars", "ghbars",
                    "get_library", "read_local_file"]
    
    function compile(program, options) {
    	// options include lang ('javascript' or 'rapydscript' or 'vpython'), version,
    	//     run (true if will run the code, false if compiling for sharing, in which case don't call fontloading)
    	options = options || {}
    	window.__original = {text: program.split("\n")}
        window.__GSlang = options.lang
        var version = '["'+options.version+'", "glowscript"]' // e.g. ['1.1', 'glowscript']
        
        // Look for text object in program
    	// findtext finds "...text  (....." and findstart finds "text  (...." at start of program
        var findtext = /[^\.\w]text[\ ]*\(/
        var findstart = /^text[\ ]*\(/
    	var loadfonts = findtext.exec(program)
        if (!loadfonts) loadfonts = findstart.exec(program)
        // Not clear the following helped, because both this call to fontloading and the call inserted 
        // at the start of the compiled program led to accessing the font files twice.
        //if (options.run && loadfonts) fontloading() // trigger loading of font files for 3D text, in parallel with compilation (unless compiling for sharing)
        
        // Look for mention of MathJax in program; don't import it if it's not used
        var mathjax = program.indexOf('MathJax')
        mathjax = (mathjax >= 0) // if mathjax is true, need to import MathJax
        
        // Work around the problem that .delete is not allowed in JavaScript; for API need d = canvas() .... d.delete() to delete canvas:
        program = program.replace(/\.delete/g, ".remove")
        
        if (options.lang == "rapydscript" || options.lang == 'vpython') {
        	program = preprocess(program, options.lang)
    		var vars = ''
        	if (program.slice(0,7) == 'ERROR: ') {
        		compile_rapydscript(program)
        	} else {
	        	var prog
	        	if (options.lang == 'rapydscript') {
	        		prog = "def main(" + GS_wait + "):\n  version = "+version+"\n  window.__GSlang = 'rapydscript'\n  scene = canvas()\n  arange=range\n  print = GSprint\n" + program + "main"
	        	} else { // 'vpython'
	        		prog = "def main(" + GS_wait + "):\n  version = "+version+"\n"
        			prog += "  window.__GSlang = 'vpython'\n" // WebGLRenderer needs to know at run time what models to create
	        		if ( VPython_import === null) {
		        		for (var i = 0; i<vp_primitives.length; i++) prog += "  "+vp_primitives[i]+"=vp_"+vp_primitives[i]+"\n"
		        		prog += "  display=canvas\n  vector=vec\n"
	        		} else if (VPython_names.length > 0) { // e.g from vpython import box, cylinder
		        		vars += "  vector=vec\n"
		        		for (var i=0; i<vp_primitives.length; i++) {
	        				var name = vp_primitives[i]
	        				var n = VPython_names.indexOf(name)
	        				if (n >= 0) vars += "  "+name+"=vp_"+name+"\n"
	        				else vars += "  "+name+"=undefined\n"
	        			}
	        			var hasvector = (VPython_names.indexOf('vector') >= 0)
	        			for (var i=0; i<vp_other.length; i++) {
	        				var name = vp_other[i]
	        				if (name == 'vec' && hasvector) continue
	        				var n = VPython_names.indexOf(name)
	        				if (n < 0) vars += "  "+name+"=undefined\n"  // just undefine those entities not listed in the import; those listed need no mention
	        			}
	        			prog += vars
	        		} else { // import vpython or visual or vis, or import vpython or visual or vis as (VPython_import)
	        			var importpatt = new RegExp(VPython_import+'\\.(\\w+)', 'g')
	        			var m = program.match(importpatt) // has the form [vis.vector, vis.rate, vis.vector, .....]
	        			importpatt = new RegExp(VPython_import+'\\.(\\w+)')
	        			var attrs = {} // a dictionary containing all the objects referenced in the program
	        			for (var i=0; i<m.length; i++) {
	        				var a = importpatt.exec(m[i])[1] // extract "rate" from "vis.rate" or "visual.rate"
	        				if (!(a in attrs)) attrs[a] = a
	        			}
	        			var purge = '' // set variables unqualified by vis. or visual. to "undefined"
		        		vars += '    var '+VPython_import+'={'
	        			for (var i=0; i<vp_primitives.length; i++) {
	        				var name = vp_primitives[i]
	        				if (name in attrs) vars += name+':vp_'+name+', '
	        				else purge += "  "+name+'=undefined\n'
	        			}
	        			vars += 'canvas:canvas, '
	        			for (var i=0; i<vp_other.length; i++) {
	        				var name = vp_other[i]
	        				if (name == 'canvas') continue
	        				if (name in attrs) {
	        					if (name == 'vector') vars += 'vector:vec, '
	        					else vars += name+':'+name+', '
	        				} else {
	        					if (name == 'vec' && ('vector' in attrs)) continue
	        					purge += "  "+name+'=undefined\n'
	        				}
	        			}
	        			vars = vars.slice(0,-2)+'}\n'
	        			prog += purge
	        		}
	        		prog += "  print=GSprint\n  arange=range\n"
	        		if (VPython_import === null || VPython_names.length > 0) prog += "  scene = canvas()\n"
	        		else prog += "  scene = "+VPython_import+".canvas()\n"
	        		// Making dictionaries like those in Python causes problems in sending
	        		// object literals to JavaScript libraries, such as setting texture options.
	        		//prog += "  from __python__ import dict_literals, overload_getitem\n"
	        		
	        		prog += "  from pythonize import strings\n"
	        		prog += "  strings()\n"
	        		prog += program
	        	}
	        	
	        	program = compile_rapydscript(prog)
	        	var start = program.indexOf('window.__GSlang')
        		var arr = "Array.prototype['+']=function(r) {return this.concat(r)};\n"
        		if (VPython_names.length <= 0) arr += vars
        		// Was unable to make Array.prototype['*'] work here; gives stack overflow:
        		//arr +=    "    Array.prototype['*']=function(r) "
        		//arr +=    "{var _$_temp=this; for (var _$_i=1; _$_i<r; _$_i++) {_$_temp.push.apply(_$_temp,this)};return _$_temp};\n"
	        	//arr +=     "    Number.prototype['*'] = function (r) {" // check whether right operand is Number or vec or Array
		        //arr +=    "if (r instanceof vec) {return r.multiply(this)} else if (r instanceof Array) "
		        //arr +=    "{var _$_temp=r; for (var _$_i=1; _$_i<this; _$_i++) {_$_temp.push.apply(_$_temp,r)};return _$_temp} "
			    // +=    "else {return r*this}};\n"
	        	program = program.slice(0,start) + arr + program.slice(start-4)
        	}
        	
        } else { // JavaScript
        	program = preprocess(program, options.lang)
            var prog = "function main(" + GS_wait + ") {\n"
            prog += "var version = "+version+";\n"
            prog += "var scene = canvas();\n"
            // Placing this here instead of in vectors.js gives stack overflow:
    		//prog += "Number.prototype['*'] = function (r) {" // check whether right operand is Number or vec
        	//prog +=    "return (r instanceof vec) ? r.multiply(this) : r*this};\n"
            program = prog + program + "\n};\nmain"
        }
    	
        if (loadfonts) {
        	var s = "scene = canvas();\n"
            var sc = program.indexOf(s) + s.length
        	s = "    waitforfonts("+GS_wait+")\n"  // wait for font files
            program = program.slice(0,sc)+s+program.slice(sc,program.length)
        }

        var parsed = papercompile(program) // handle operator overloading
        
    	// Still using an old version of Streamline (lib/compiling/transform.js) because 
    	// uglify cannot minimize the new version (lib/compiling/transform-es6.js), which uses ES6.
    	// transform-es6.js is 1.8 MB, so it's important to minimize it.
        var prog = window.Streamline.transform(parsed, { alreadyParsed: true }) // permit synhronous code
    	//var prog = window.Streamline.transform(parsed, { alreadyParsed: true, runtime: "callbacks" }) // permit synhronous code
    	//var prog = Streamline.transform(parsed, { alreadyParsed: true, callback: wait }) // older version
    	
		program = prog.replace(/\n\n\n\n/g, '') // eliminate lots of white space
		// Reduce RS_ls = "4" to "4" (specifying original line number in output for error return purposes)
		if (options.lang != 'javascript') program = program.replace(new RegExp(' '+lineno_string, 'g'), ' ')
		
		if (loadfonts) program = "fontloading();\n" + program
		
		// Removing a final _() eliminates an irrelevant error message associated with Streamline:
		var s = GS_wait+'()'
		var sc = program.lastIndexOf(s)
		if (sc > -1) program = program.slice(0,sc) + program.slice(sc+s.length,program.length)
		
        //var p = program.split('\n')
    	//for (var i=0; i<p.length; i++) console.log(i, p[i])
    	return program
    }
    window.glowscript_compile = compile
		
})();