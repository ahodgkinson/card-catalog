// home.controller.js

(function() {

  'use strict';

  angular.
    module('cardCatalog.HomeController', ['ngResource']).
    controller('HomeController', HomeController);

  HomeController.$inject = [
    '$scope',
    '$location',
    'log',
    'scannerService'
  ];

  function HomeController(
    $scope,
    $location,
    log,
    scannerService )
  {
    log.log("HomeController");

    // ------ Search Handling

    $scope.isbn  = "";
    $scope.words = "";

    $scope.doScan = function() {
      scannerService.scan().then(function(res) {
        log.log("home.doScan: res: "+res);
        $scope.isbn = res;
      });
    };

    $scope.doSearchIsbn = function() {
      log.log("HomeController.doSearchIsbn: $scope.isbn: "+$scope.isbn);
      $location.path('/app/books').search({isbn: $scope.isbn});
    };

    $scope.doSearchWords = function() {
      log.log("HomeController.doSearchWords: $scope.words: "+$scope.words);
      $location.path('/app/books').search({words: $scope.words});
    };
  }

})();
