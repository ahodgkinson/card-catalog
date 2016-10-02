// sync.controller.js

(function() {

  'use strict';

  angular.
    module('cardCatalog.SyncController', ['ngResource']).
    controller('SyncController', SyncController);

  SyncController.$inject = [
      '$scope',
      '$ionicPopup',
      '$q',
      'log',
      'prefsService',
      'pouchdbService'
  ];

  function SyncController(
      $scope,
      $ionicPopup,
      $q,
      log,
      prefsService,
      pouchdbService)
  {

    if ( !prefsService.isUserNameSet()) {
      $scope.prefsShow();
    }

    // -- Controller variables

    var vm = this;

    vm.stats     = {books: 0}; 	// Counts of book records
    vm.conflicts = {books: 0}; 	// Counts of book records with confllicts

    vm.recount   = recount;
    vm.upload    = upload;
    vm.download  = download;
    vm.purge     = purge;

    vm.downloading = false;
    vm.uploading   = false;

    // -- Activation

    activate();

    function activate() {
      log.log("SyncController.activate");
      vm.recount();
    }

    // -- Upload/Download Status, for preventing multiple concurrent operations

    function loading() {
      return downloading || uploading;
    }

    // -- Get record counts (returns a promise to wiat for all counts)

    function recount() {
      vm.stats.pouch  = '-';
      vm.stats.books  = '-';

      var tasks = [];

      tasks.push( function() {
        return pouchdbService.getRecordCounts().then(function(counts) {
          vm.stats.books  = counts.book;
        });
      });

      tasks.push( function() {
        return pouchdbService.getRecordCounts(true).then(function(counts) {
          vm.conflicts.books  = counts.book;
        });
      });

      tasks.push( function() {
        return pouchdbService.count().then(function(count) {
          vm.stats.pouch = count;
        });
      });

      return $q.serial(tasks);
    }

    // -- Server Upload

    function upload() {
      if (vm.loading) {
        log.log("SyncController.upload: already loading.. ignored");
      }
      vm.uploading = true;

      pouchdbService.upload().then(
        function(count) {
          log.info("SyncController.upload: puchDB upload complete: OK: records: "+count);
          recount().then(
            function(res) {
              log.toast("Uploaded records: "+count);
              vm.uploading = false;
            }, function(err) {
              log.error("SyncController.upload: recount: ERROR: "+JSON.stringify(err));
              log.toast("Recount Error");
              vm.uploading = false;
            }
          );
        },
        function(err) {
          log.error("SyncController.upload: complete: ERROR: "+err.message);
          log.toast("Upload Error (database)");
          vm.uploading = false;
        }
      );

      log.log("SyncController.upload: return");
    }

    // -- Server Download

    function download() {
      if (vm.loading) {
        log.log("SyncController.download: already loading.. ignored");
      }
      vm.downloading = true;

      pouchdbService.download().then(
        function(count) {
          log.info("SyncController.download: complete: OK: records: "+count);
          log.toast("Downloaded records: "+count);
          recount().then(
            function(res) {
              vm.downloading = false;
            }, function(err) {
              log.error("SyncController.download: recount: ERROR: "+JSON.stringify(err));
              log.toast("Recount Error");
              vm.downloading = false;
            }
          );
        },
        function(err) {
          log.error("SyncController.download: complete: ERROR: "+err.message);
          log.toast("Download Error (database)");
          vm.downloading = false;
        }
      );

      log.log("SyncController.download: return");
    }

    // -- Local database purge

    function purge() {
      log.log("SyncController.purge: start");

      var confirmPopup = $ionicPopup.confirm({
        title:      'Confirm Reset',
        tunTitel:   'This operation cannot be undone.',
        template:   'Are you sure you want to reset the application and delete the local database and all its contents?',
        cancelText: 'Cancel',
        cancelType: 'button-calm',
        okText:     'Reset',
        okType:     'button-assertive'
      });

      confirmPopup.then(function (res) {
        if (res) {
          log.log("SyncController.purge: purge confirmed");
          pouchdbService.purge().then(function(res) {
            recount();
            log.toast("Database deleted");
          });
        } else {
          log.log("SyncController.purge: purge cancelled");
        }
      });

      log.log("SyncController.purge: return");
    }
  }

})();
