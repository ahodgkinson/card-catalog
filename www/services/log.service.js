// log.service.js

(function() {

  'use strict';

  angular.
    module('cardCatalog.log', ['ngResource']).
    factory('log', log);

  log.$inject = [
    '$log',
    '$ionicPlatform',
    '$cordovaToast',
    'prefsService'
  ];

  function log(
    $log,
    $ionicPlatform,
    $cordovaToast,
    prefsService )
  {
    var LOG=1;
    var DEBUG=2;
    var INFO=3;
    var WARN=4;
    var ERROR=5;

    var service = {
      toast: toast,
      log: log,
      debug: debug,
      info: info,
      warn: warn,
      error: error,
      getLevelOptions: getLevelOptions
    };

    // -- Display a Toast Message

    function toast(msg) {
      info("TOAST: \""+msg+"\"");
      $ionicPlatform.ready(function() {
        $cordovaToast.show( msg, 'long', 'center');
      });
    }

    // -- Log-level methods

    function log(message) {
      if ( prefsService.getLogLevel() <= LOG ) { $log.log(getFileAndLine() + ': ' + message); }
    }
    function debug(message) {
      if ( prefsService.getLogLevel() <= DEBUG ) { $log.debug(getFileAndLine() + ': ' + message); }
    }
    function info(message) {
      if ( prefsService.getLogLevel() <= INFO ) { $log.info(getFileAndLine() + ': ' + message); }
    }
    function warn(message) {
      if ( prefsService.getLogLevel() <= WARN ) { $log.warn(getFileAndLine() + ': ' + message); }
    }
    function error(message) {
      $log.error(getFileAndLine() + ': ' + message);
    }

    function getLevelOptions() {
      return [
        {id: LOG,   name: "Log"},
        {id: DEBUG, name: "Debug"},
        {id: INFO,  name: "Info"},
        {id: WARN,  name: "Warning"},
        {id: ERROR, name: "Error"}
      ];
    }

    // -- Private helper methods

    function getFileAndLine() {
      var err = getErrorObject();
      return err.stack.split("\n")[5].match(/[a-zA-Z0-9.:)]*$/)[0].split(')')[0];
    }

    function getErrorObject(){
      try { throw Error(''); } catch(err) { return err; }
    }

    return service;
  }

})();
