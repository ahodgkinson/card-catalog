(function() {

  // Convert a JSON date string (ISO-8601) or time in millis 
  // into a date string with format 'YYYY-MM-DD hh:mm:ss'

  'use strict';

  angular
    .module('cardCatalog.filters', [])

    .filter('millis', function() {
      return function(text, length) {
        return Date.parse(text);
      }
    });
})();
