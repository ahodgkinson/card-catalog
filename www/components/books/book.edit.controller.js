// book.edit.controller.js

(function() {

  'use strict';

  angular.
    module('cardCatalog.BookEditController', ['ngResource', 'ngMessages']).
    controller('BookEditController', BookEditController);

  BookEditController.$inject = [
      '$scope',
      '$window',
      '$location',
      'log',
      'util',
      'book',
      'bookEditOptions',
      'prefsService',
      'bookService',
      'isbndbService',
      'scannerService',
      '$ionicPopover',
      '$ionicModal'
  ];

  function BookEditController(
      $scope,
      $window,
      $location,
      log,
      util,
      book,
      bookEditOptions,
      prefsService,
      bookService,
      isbndbService,
      scannerService,
      $ionicPopover,
      $ionicModal )
  {
    log.log("BookEditController: start");

    if ( !prefsService.isUserNameSet()) {
      $scope.prefsShow();
    }

    if (book === null) {
      log.toast("Internal error: book is null");
      return;
    }

    // -- Setup

    var query = $location.search();

    log.log("BookEditController: isbn: "+query.isbn);

    if (util.empty(book._id)) {
      log.log("BookEditController: book._id is not set");
      book.isbn  = query.isbn;
      book.owner = prefsService.getUserName();
    } else {
      log.log("BookEditController: book._id is set: "+book._id);
    }

    var requiredFields = ['isbn'];

    initScope(book, bookEditOptions);

    // -- Methods

    function bookEditSave() {
      log.log('BookEditController.bookEditSave: data: ', JSON.stringify($scope.bookEditData));
      $scope.bookEditData.owner = prefsService.getUserName();

      bookService.put($scope.bookEditData).then(
        function(res) {
          log.toast("Book Saved");
          log.log("BookEditController.bookEditSave: OK: _id: "+res.id+", redirecting to: "+res.id);
          $window.location.href = "#/app/books/"+res.id;
        },
        function(err) {
          if (err.status == 409) {
            log.toast("Warning: Unable to save: duplicate ISBN");
            $scope.bookEditData._id = null;
          } else {
            log.toast("Error saving record: "+err.message);
            log.error("BookEditController.bookEditSave: ERROR: err: "+JSON.stringify(err));
          }
        }
      );
    }

    // -- Call barcode scanner

    function doScan() {
      log.log("BookEditController.doScan: start");
      scannerService.scan().then(function(res) {
        log.log("BookEditController.doScan: res: "+res);
        $scope.bookEditData.isbn = res;
      });
    };

    // -- Get book details from online database

    function setBookDetails() {
      var isbn = $scope.bookEditData.isbn;

      log.log("BookEditController.setBookDetails: idbn: "+isbn);

      isbndbService.get(isbn).then(
        function(data) {
          log.log("BookEditController.setBookDetails: success");

          if (!data) {
            log.toast( "Warning: Book not found");
          } else {
            log.toast( "Book found, setting details..");
            $scope.bookEditData.title     = data.title;
            $scope.bookEditData.author    = data.author;
            $scope.bookEditData.publisher = data.publisher;
          }
        },
        function(err) {
          log.toast( "Warning: Unable to access book database");
          log.error("BookEditController.setBookDetails");
        }
      );
    }

    // -- Initialize

    function initScope(book, bookEditOptions) {
      log.log("BookEditController.initScope");

      $scope.bookEditSave    = bookEditSave;
      $scope.bookEditData    = book;
      $scope.bookEditOptions = bookEditOptions;
      $scope.doScan          = doScan;

      $scope.setBookDetails  = setBookDetails;

      // Create HTML for tabs (workaround see https://github.com/driftyco/ionic/issues/1503#issuecomment-222364824)
      $scope.scope = $scope;

      // Pass self to use it in _changeForm
      $scope.initScope = initScope;
    }
  }
})();
