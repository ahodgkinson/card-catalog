// about.controller.js

(function() {

  'use strict';

  angular
    .module('cardCatalog.AboutController', ['ngResource'])

    .controller('AboutController', ['$scope', 'log', function( $scope, log ) {
       log.log("AboutController");
    }])

})();
