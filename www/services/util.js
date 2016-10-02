// util.js

(function() {

  'use strict';

  angular.
    module('cardCatalog.util', ['ngResource']).
    service('util', util);

  util.$inject = [];

  function util() {

    var service = {
      empty:      empty,
      lastItem:   lastItem,
      getDate:    function getDate(date) { return Date(date); },
      now:        function() { return (new Date()).toISOString(); },
    };

    return service;

    // -- Public methods

    function empty(data) {
      if(typeof(data) == 'number' || typeof(data) == 'boolean') { 
        return false; 
      }
      if(typeof(data) == 'undefined' || data === null) {
        return true; 
      }
      if(typeof(data.length) != 'undefined') {
        return data.length === 0;
      }
      for(var i in data) {
        if(data.hasOwnProperty(i)) { return false; }
      }
      return true;
    }

    // -- Return the last item of an array or null is it's empty

    function lastItem(array) {
      var count = array.length;
      return (count > 0) ? array[count-1] : null;
    }
  }

})();
