// book.detail.controller.js

(function() {

  'use strict';

  angular.
    module('cardCatalog.BookDetailController', ['ngResource']).
    controller('BookDetailController',BookDetailController);

  BookDetailController.$inject = [
      '$scope',
      '$rootScope',
      '$window',
      '$location',
      '$ionicPopover',
      '$ionicPopup',
      '$ionicModal',
      '$stateParams',
      'log',
      'book',
      'prefsService',
      'util',
      'bookService'
  ];

  function BookDetailController(
      $scope,
      $rootScope,
      $window,
      $location,
      $ionicPopover,
      $ionicPopup,
      $ionicModal,
      $stateParams,
      log,
      book,
      prefsService,
      util,
      bookService)
  {
    log.log("BookDetailController: start");

    if (util.empty(book)) {
        log.error("BookDetailController: ERROR: book is null");
        return;
    }

    initScope(book, $stateParams.revision);

    log.log("BookDetailController: created_at: "+book.created_at);
    log.log("BookDetailController: updated_at: "+book.updated_at);

    // --- Popover Processing

    $ionicPopover.fromTemplateUrl('components/books/book.detail.popover.html', {
      scope: $scope
    }).then(function(popover) {
      $scope.popover = popover;
    });

    $scope.openPopover = function($event) {
      $scope.popover.show($event);
    };

    $scope.closePopover = function() {
      $scope.popover.hide();
    };

    // ===== Menu Processing

    // -- Edit book

    $scope.bookEditShow = function(id) {

      if (book.owner != prefsService.getUserName()) {
        log.toast("Warning: You cannot edit books belonging to other users");
        return;
      }

      log.log("BookDetailController.bookEditShow: id="+id);
      $window.location.href = "#/app/books/" + id + "/edit";
    };

    $scope.editMenu = function(id) {
      log.log("BookDetailController.editMenu: _id=" + id);
      $scope.bookEditShow(id);
      $scope.closePopover();
    };

    // -- Delete book, with confirm alert

    $scope.deleteBook = function() {
      $scope.closePopover();

      if (book.owner != prefsService.getUserName()) {
        log.toast("Warning: You cannot delete books belonging to other users");
        return;
      }

      var confirmPopup = $ionicPopup.confirm({
        title: '<strong>Confirm Delete</strong>',
        template: 'You cannot undo this operation'
      });

      confirmPopup.then(function(res) {
        if (res) {
          bookService.remove(book).then(
            function() {
              log.toast("Book Deleted");
              $window.location.href = "#/app/home/";
            }, function(err) {
              log.error("BookDetailController.deleteBook: ERROR: "+JSON.stringify(err));
              log.toast("ERROR Deleting book");
            }
          );
        }
      });
    };

    function back() {
      $window.history.back();
    }

    // -- Initialize

    function initScope(book, revision) {
      $scope.book = book;
      $scope.revision = revision;
      $scope.back = back;

      $scope.record_created_at = util.getDate(book.created_at);
      $scope.record_updated_at = util.getDate(book.updated_at);
      $scope.scope = $scope;
    }

    log.log("BookDetailController: done");
  }

})();
