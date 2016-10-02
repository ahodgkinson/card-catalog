// card-catalog: app.js

(function() {

  'use strict';

  angular.
    module('cardCatalog', [

        /* -- App Controllers -- */
        'cardCatalog.AppCtrl',
        'cardCatalog.AboutController',
        'cardCatalog.ContactController',
        'cardCatalog.BookDetailController',
        'cardCatalog.BookListController',
        'cardCatalog.BookEditController',
        'cardCatalog.HomeController',
        'cardCatalog.SyncController',
        // 'cardCatalog.ConflictController',

        /* -- App Services -- */
        'cardCatalog.log',
        'cardCatalog.util',
        'cardCatalog.localStorage',
        'cardCatalog.prefsService',
        'cardCatalog.isbndbService',
        'cardCatalog.bookService',
        'cardCatalog.pouchdbService',
        'cardCatalog.scannerService',

        /* -- 3rd-Part Components -- */
        'ionic',
        'ngCordova',
        'q.serial',
        'pouchdb'
    ]).


    run(function($ionicPlatform, $rootScope, $ionicLoading, $localStorage, $cordovaSQLite, $ionicPopup, $ionicHistory, log) { // TODO move to startup file (app.activeate.js?)

      $ionicPlatform.ready(function() {
        // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
        // for form inputs)
        // if (window.cordova && window.cordova.plugins.Keyboard) {
        //    cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
        //    cordova.plugins.Keyboard.disableScroll(true);
        // }
        if (window.StatusBar) {
          // org.apache.cordova.statusbar required
          StatusBar.styleDefault();
        }
      });

      // Show exit confirmation on home page pressing back button
      $ionicPlatform.registerBackButtonAction(function(e) {

        e.preventDefault();

        function showConfirm() {
          var confirmPopup = $ionicPopup.confirm({
            title: '<strong>Exit Card Catalog?</strong>',
            template: 'Are you sure you want to exit?'
          });

          confirmPopup.then(function(res) {
            if (res) {
              ionic.Platform.exitApp();
            }
          });
        }

        // Is there a page to go back to?
        if ($ionicHistory.backView()) {
          // Go back in history
          $ionicHistory.backView().go();
        } else {
          // This is the last page: Show confirmation popup
          showConfirm();
        }

        return false;
      }, 101);


      // -- Publish subscribe processing

      $rootScope.$on('loading:show', function () {
        $ionicLoading.show({
          template: '<ion-spinner></ion-spinner> Loading ...'
        });
      });

      $rootScope.$on('loading:hide', function () {
        $ionicLoading.hide();
      });

      $rootScope.$on('$stateChangeStart', function () {
        console.log('$rootScope.$on: start...');
        $rootScope.$broadcast('loading:show');
      });

      $rootScope.$on('$stateChangeSuccess', function () {
        console.log('$rootScope.$on: done');
        $rootScope.$broadcast('loading:hide');
      });

      $rootScope.$on('$stateChangeError',
                function(event, toState, toParams, fromState, fromParams, error){
        $rootScope.$broadcast('loading:hide');
        $ionicPopup.alert({title: 'Error', template: error.message});
      });
    }).

    // ----- Application Routing

    config(function($stateProvider, $urlRouterProvider, $httpProvider) {

      // each request sends through its session cookie
      $httpProvider.defaults.withCredentials = true;

      $stateProvider.

      state('app', {
        url: '/app',
        'abstract': true,
        templateUrl: 'layout/sidebar.html',
        controller: 'AppCtrl'
      }).

      state('app.home', {
        url: '/home',
        views: {
          'mainContent': {
            templateUrl: 'components/home/home.html',
            controller: 'HomeController'
          }
        }
      }).

      state('app.sync', {
        url: '/sync',
        views: {
          'mainContent': {
            templateUrl: 'components/sync/sync.html',
            controller: 'SyncController',
            controllerAs: 'sync'
          }
        }
      }).

// TODO implement
//      // -- Books
//  
//      state('app.bookconflicts', {
//        url: '/books/:id/conflicts',
//        views: {
//          'mainContent': {
//            templateUrl: 'components/conflicts/conflict.html',
//            controller: 'ConflictController',
//            resolve: {
//              doc: ['$stateParams','bookService', function($stateParams, bookService) {
//                return bookService.get($stateParams.id, {'conflicts': true});
//              }],
//              doc_with_conflicts: ['$stateParams','bookService', function($stateParams, bookService) {
//                return bookService.getWithConflicts($stateParams.id);
//              }],
//              doc_service: [ 'bookService', function(bookService) {
//                return bookService;
//              }]
//            }
//          }
//        }
//      }).
    
      state('app.booknew', {
        url: '/books/new',	// must be before '/books/:id' !!!
        views: {
          'mainContent': {
            templateUrl: 'components/books/book.edit.html',
            controller: 'BookEditController',
            resolve: {
              book: [ 'bookService', function(bookService) {
                return {};
              }],
              bookEditOptions: [ 'bookService', function(bookService) {
                return {
                  title: "New Book"
                };
              }]
            }
          }
        }
      }).
    
      state('app.bookdetail', {
        url: '/books/:id?:revision',
        views: {
          'mainContent': {
            templateUrl: 'components/books/book.detail.html',
            controller: 'BookDetailController',
            resolve: {
              book: ['$stateParams','bookService', function($stateParams, bookService) {
                var options = {'conflicts': true};
                if ($stateParams.revision) {
                  options['rev']=$stateParams.revision;
                }
                return bookService.get($stateParams.id, options);
              }]
            }
          }
        }
      }).

      state('app.books', {
        url: '/books?:conflicts',
        views: {
          'mainContent': {
            templateUrl: 'components/books/book.list.html',
            controller: 'BookListController'
          }
        }
      }).

      state('app.bookedit', {
        url: '/books/:id/edit',
        views: {
          'mainContent': {
            templateUrl: 'components/books/book.edit.html',
            controller: 'BookEditController',
            resolve: {
              book: ['$stateParams','bookService', function($stateParams, bookService) {
                return bookService.get($stateParams.id);
              }],
              bookEditOptions: [ 'bookService', function(bookService) {
                return {
                  title: "Update Book"
                };
              }]
            }
          }
        }
      }).

      state('app.about', {
        url: '/about',
        views: {
          'mainContent': {
            templateUrl: 'components/about/about.html',
            controller: 'AboutController'
          }
        }
      }).

      state('app.contact', {
        url: '/contact',
        views: {
          'mainContent': {
            templateUrl: 'components/contact/contact.html',
            controller: 'ContactController'
          }
        }
      });

      // -- Default route

      $urlRouterProvider.otherwise('/app/home');

    });

})();
