(function() {

  'use strict';

  angular
    .module('cardCatalog.AppCtrl', ['ngResource'])
    .controller('AppCtrl', AppCtrl);

  function AppCtrl(
      $scope,
      $ionicModal,
      prefsService,
      log) 
  {
    log.log("AppCtrl");

    // With the new view caching in Ionic, Controllers are only called
    // when they are recreated or on app start, instead of every page change.
    // To listen for when this page is active (for example, to refresh data),
    // listen for the $ionicView.enter event:

    //$scope.$on('$ionicView.enter', function(e) {
    //});

    // ------ Preferences Modal

    $scope.prefsData = prefsService.getAll();
    $scope.logLevelOptions = log.getLevelOptions();

    $ionicModal.fromTemplateUrl('components/prefs/prefs.form.html', {
        scope: $scope
    }).then(function(modal) {
        $scope.prefsModal = modal;
    });

    $scope.prefsHide = function() {
        log.log('AppCtrl.prefsHide');
        $scope.prefsModal.hide();
    };

    $scope.prefsShow = function() {
        log.log('AppCtrl.prefsShow');
        $scope.prefsData = prefsService.getAll();
        $scope.prefsModal.show();
    };

    $scope.prefsSave = function() {
        log.log('AppCtrl.prefsSave: data: ', $scope.prefsData);

        if (!prefsService.isUserNameSet()) {
          return;
        }

        prefsService.setAll($scope.prefsData);

        $scope.debugMode = prefsService.isDebug();
        log.log('AppCtrl.prefsSave: data: debugMode='+JSON.stringify($scope.debugMode));
        $scope.prefsHide();
    };

    // ------ Global Debug Mode

    $scope.debugMode = prefsService.isDebug();
    log.log("AddCtrl: debugMode="+JSON.stringify($scope.debugMode));
  }

})();
