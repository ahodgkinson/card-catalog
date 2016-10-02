// localStorage.js

(function() { 

  'use strict';

  angular
    .module('cardCatalog.localStorage', ['ngResource'])

    .service('$localStorage', ['$window', function($window) {
      return {
        store: function(key, value) {
          $window.localStorage[key] = value;
        },
        get: function(key, defaultValue) {
          return $window.localStorage[key] || defaultValue;
        },
        storeObject: function(key, value) {
          $window.localStorage[key] = JSON.stringify(value);
        },
        getObject: function(key, defaultValue) {
          var object = $window.localStorage[key];
          if ( object === undefined ) {
            return defaultValue;
          } else {
            return JSON.parse(object);
          }
        }
      };
    }]);

})();
