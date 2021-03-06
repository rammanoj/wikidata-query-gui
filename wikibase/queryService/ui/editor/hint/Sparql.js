var wikibase = wikibase || {};
wikibase.queryService = wikibase.queryService || {};
wikibase.queryService.ui = wikibase.queryService.ui || {};
wikibase.queryService.ui.editor = wikibase.queryService.ui.editor || {};
wikibase.queryService.ui.editor.hint = wikibase.queryService.ui.editor.hint || {};

( function( $, wb ) {
	'use strict';

	var MODULE = wb.queryService.ui.editor.hint;

	var SPARQL_KEYWORDS = [
			'SELECT', 'SELECT * WHERE {\n\n}', 'OPTIONAL', 'OPTIONAL {\n\n}', 'WHERE',
			'WHERE {\n\n}', 'ORDER', 'ORDER BY', 'DISTINCT', 'SERVICE',
			'SERVICE wikibase:label { bd:serviceParam wikibase:language "[AUTO_LANGUAGE],en". }', 'BASE',
			'PREFIX', 'REDUCED', 'FROM', 'LIMIT', 'OFFSET', 'HAVING', 'UNION', 'SAMPLE',
			'(SAMPLE() AS )', 'COUNT', '(COUNT() AS )', 'DESC', 'DESC()', 'ASC', 'ASC()',
			'FILTER ()', 'FILTER NOT EXISTS', 'FILTER NOT EXISTS {\n\n}', 'UNION', 'UNION {\n\n}',
			'BIND', 'BIND ()', 'GROUP_CONCAT', '(GROUP_CONCAT() as )', 'ORDER BY',
			'#defaultView:Map', '#defaultView:ImageGrid', '#defaultView:Map', '#defaultView:BubbleChart',
			'#defaultView:TreeMap', '#defaultView:Tree', '#defaultView:Timeline', '#defaultView:Dimensions', '#defaultView:Graph', '#defaultView:LineChart', '#defaultView:BarChart', '#defaultView:ScatterChart', '#defaultView:AreaChart',
			'SERVICE wikibase:around {\n    ?place wdt:P625 ?location.\n    bd:serviceParam wikibase:center ? .\n    bd:serviceParam wikibase:radius ? .\n    bd:serviceParam wikibase:distance ?dist.\n  }',
			'SERVICE wikibase:box {\n    ?place wdt:P625 ?location.\n    bd:serviceParam wikibase:cornerWest ? .\n    bd:serviceParam wikibase:cornerEast ? .\n  }',
			'hint:Query hint:optimizer "None".',
			'#TEMPLATE={ "template": { "en": "Textual description of template, referencing ?var" }, "variables": { "?var": { "query": "SELECT ?id WHERE { ?id wdt:P31 wd:Q146. }" } } }'
	];

	var SPARQL_PREDICATES = [
			// wikibase:
			// property predicates
			'wikibase:rank', 'wikibase:badge', 'wikibase:propertyType', 'wikibase:directClaim',
			'wikibase:claim', 'wikibase:statementProperty', 'wikibase:statementValue',
			'wikibase:qualifier', 'wikibase:qualifierValue', 'wikibase:reference', 'wikibase:referenceValue',
			'wikibase:statementValueNormalized', 'wikibase:qualifierValueNormalized',
			'wikibase:referenceValueNormalized', 'wikibase:novalue',
			// entity types
			'wikibase:Property', // 'wikibase:Item' disabled on WDQS for performance reasons
			// data types
			'wikibase:Reference', 'wikibase:Dump', // 'wikibase:Statement' disabled on WDQS for performance reasons
			// ranks
			'wikibase:PreferredRank', 'wikibase:NormalRank', 'wikibase:DeprecatedRank', 'wikibase:BestRank',
			// value types
			'wikibase:TimeValue', 'wikibase:QuantityValue', 'wikibase:GlobecoordinateValue',
			// property types
			'wikibase:WikibaseItem', 'wikibase:CommonsMedia', 'wikibase:GlobeCoordinate',
			'wikibase:Monolingualtext', 'wikibase:Quantity', 'wikibase:String', 'wikibase:Time',
			'wikibase:Url', 'wikibase:ExternalId', 'wikibase:WikibaseProperty', 'wikibase:Math',
			// pageprops
			'wikibase:statements', 'wikibase:sitelinks',
			// time
			'wikibase:timeValue', 'wikibase:timePrecision', 'wikibase:timeTimezone', 'wikibase:timeCalendarModel',
			// quantity
			'wikibase:quantityAmount', 'wikibase:quantityUpperBound', 'wikibase:quantityLowerBound',
			'wikibase:quantityUnit', 'wikibase:quantityNormalized',
			// coordinate
			'wikibase:geoLatitude', 'wikibase:geoLongitude', 'wikibase:geoPrecision', 'wikibase:geoGlobe',
			// other
			'wikibase:wikiGroup',
			// schema: things
			'schema:about', 'schema:name', 'schema:description', 'schema:dateModified',
			'schema:Article', 'schema:inLanguage', 'schema:isPartOf',
			// rdfs: things
			'rdfs:label', 'rdf:type',
			// skos: things
			'skos:altLabel',
			// xsd:
			'xsd:dateTime', 'xsd:integer', 'xsd:decimal',
			// geo:
			'geo:wktLiteral',
			// owl:
			'owl:sameAs',
			// prov:
			'prov:wasDerivedFrom'

	];

	/**
	 * Code completion for Wikibase entities RDF prefixes in SPARQL completes SPARQL keywords and ?variables
	 *
	 * @class wikibase.queryService.ui.editor.hint.Sparql licence GNU GPL v2+
	 *
	 * @author Jonas Kress
	 * @constructor
	 */
	var SELF = MODULE.Sparql = function Sparql() {
	};

	/**
	 * Get list of hints
	 *
	 * @return {jQuery.Promise} Returns the completion as promise ({list:[], from:, to:})
	 */
	SELF.prototype.getHint = function( editorContent, lineContent, lineNum, cursorPos ) {
		var currentWord = this._getCurrentWord( lineContent, cursorPos ),
			hintList = [],
			deferred = new $.Deferred();

		if ( currentWord.word.indexOf( '?' ) === 0 ) {
			hintList = hintList.concat( this._getVariableHints( currentWord.word, this
					._getDefinedVariables( editorContent ) ) );
		}

		hintList = hintList.concat( this._getSPARQLHints( currentWord.word ) );

		if ( hintList.length > 0 ) {
			var hint = this._getHintCompletion( currentWord, hintList, lineNum );
			return deferred.resolve( hint ).promise();
		}

		return deferred.reject().promise();
	};

	SELF.prototype._getSPARQLHints = function( term ) {
		var list = [];

		$.each( SPARQL_KEYWORDS, function( key, keyword ) {
			if ( keyword.toLowerCase().indexOf( term.toLowerCase() ) >= 0 ) {
				list.push( keyword );
			}
		} );

		$.each( SPARQL_PREDICATES, function( key, keyword ) {
			if ( keyword.toLowerCase().indexOf( term.toLowerCase() ) === 0 ) {
				list.push( keyword );
			}
		} );

		return list;
	};

	SELF.prototype._getDefinedVariables = function( text ) {
		var variables = {};

		$.each( text.match( /\?\w+/g ), function( key, word ) {
			variables[ word ] = true;
		} );

		return Object.keys( variables );
	};

	SELF.prototype._getVariableHints = function( term, variables ) {
		var list = [];

		if ( !term || term === '?' ) {
			return variables;
		}

		$.each( variables, function( key, variable ) {
			if ( variable.toLowerCase().indexOf( term.toLowerCase() ) === 0 ) {
				list.push( variable );
			}
		} );

		return list;
	};

	SELF.prototype._getHintCompletion = function( currentWord, list, lineNumber ) {
		var completion = {
			list: []
		};
		completion.from = {
			line: lineNumber,
			char: currentWord.start
		};
		completion.to = {
			line: lineNumber,
			char: currentWord.end
		};
		completion.list = list;

		return completion;
	};

	SELF.prototype._getCurrentWord = function( line, position ) {
		var pos = position - 1;

		if ( pos < 0 ) {
			pos = 0;
		}

		while ( /[\w?#:]/.test( line.charAt( pos ) ) ) {
			pos--;
			if ( pos < 0 ) {
				break;
			}
		}
		var left = pos + 1;

		pos = position;
		while ( /[\w:]/.test( line.charAt( pos ) ) ) {
			pos++;
			if ( pos >= line.length ) {
				break;
			}
		}
		var right = pos;
		var word = line.substring( left, right );
		return {
			word: word,
			start: left,
			end: right
		};
	};

}( jQuery, wikibase ) );
