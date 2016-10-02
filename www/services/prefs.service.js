// prefs.service.js

(function() {

  'use strict';

  angular.
    module('cardCatalog.prefsService', ['ngResource']).
    service('prefsService', prefsService);

  prefsService.$inject = [
    '$localStorage'
  ];

  function prefsService( $localStorage ) {

    var KEY = 'prefsData';			// Local storage key

    // -- Preference Defaults

    var DEFAULTS = {
      serverAuth: 	false, 			// Set to true to enable authentication. Not in GUI
      server:     	'http://alarp.works-organiser.com/cdb/books',
      username:   	'',			// Used for authentication & identifying book owners
      password:   	'',			// Hidden when serverAuth not set

      isbnKey:		'96F6BP2V',		// Hidden when debugMode not set

      debugMode:  	false,			// Enables display of internal variables
      logLevel:   	1, 			// 1=LOG, 4=WARN. See services/log.service.js
      bookSort:    	'updated_at desc',	// Not in GUI
    };

    // -- Public Methods

    var service = {
      getServer:   	function() { return get('server'    ); },
      getServerAuth:	function() { return get('serverAuth'); },
      getUserName:  	function() { return get('username'  ); },
      getPassword:  	function() { return get('password'  ); },

      getIsbnKey:	function() { return get('isbnKey'   ); },

      isDebug:      	function() { return get('debugMode' ); },
      getLogLevel:	function() { return get('logLevel'  ); },

      getBookSort:   	function() { return get('bookSort'  ); },

      setBookSort:   	function(value) { set('bookSort',  value); },

      getAll:      	function() { return extend($localStorage.getObject(KEY, DEFAULTS), DEFAULTS); },
      setAll:      	function(prefs) { $localStorage.storeObject(KEY, prefs); },

      isUserNameSet:	isUserNameSet,
    };

    return service;

    function isUserNameSet() {
      var username = get('username');
      if (username && username.length) {
        return true;
      } else {
        alert("You must set your user name in the preferences");
        return false;
      }
    }

    // -- Private methods

    function get(key) {
      return service.getAll()[key];
    }

    function set(key,value) {
      var prefs = service.getAll();
      prefs[key] = value.trim();
      service.setAll(prefs);
    }

    function extend(destination, source) {
      for (var property in source) {
        if (source.hasOwnProperty(property) && destination[property] === undefined) {
          destination[property] = source[property];
        }
      }
      return destination;
    }
  }

})();
