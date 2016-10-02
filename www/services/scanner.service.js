// scanner.service.js

(function() {

  'use strict';

  angular
    .module('cardCatalog.scannerService', ['ngResource'])
    .service('scannerService', scannerService);

  scannerService.$inject = [
     '$q',
     'log',
     '$cordovaBarcodeScanner',
  ];

  function scannerService( 
     $q,
     log,
     $cordovaBarcodeScanner )
  {
    var service = {
      scan: scan,
    };

    return service;

    // -- Scan Barcode / QR Code

    function scan() {
      log.log("scannerService.scan");

      var deferred = $q.defer();
      $cordovaBarcodeScanner.scan().then(function(res) { 
        log.log("scannerService.scan: Result: text: "      + res.text);
        log.log("scannerService.scan: Result: format: "    + res.formt);
        log.log("scannerService.scan: Result: cancelled: " + (res.cancelled ? "YES" : "NO"));
  
        deferred.resolve(res.cancelled ? "" : res.text);
      }, function (err) { 
        log.toast("Service error: " + err.message);
        deferred.resolve("");
      });
  
      return deferred.promise;
    }
  }
   
})();
