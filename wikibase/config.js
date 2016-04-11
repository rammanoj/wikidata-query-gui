/* exported CONFIG */
var CONFIG = ( function ( window, $ ) {
	'use strict';

	var configDeploy = {
			api : {
				sparql : {
					uri : '/bigdata/namespace/wdq/sparql'
				}
			},
			visualEditor: {
				entitySearchEndpointPath : 'https://www.wikidata.org/w/'
			}
	};

	var configLocal = $.extend(true, configDeploy,  {
		api : {
			sparql : {
				uri : 'https://query.wikidata.org/bigdata/namespace/wdq/sparql'
			}
		}
	} );


	var hostname = window.location.hostname.toLowerCase();

	if( hostname === '' ||
		hostname === 'localhost' ||
		hostname === '127.0.0.1'){
		return configLocal;
	}

	return configDeploy;

} )( window, jQuery );