// book.list.controller.js

(function() {

  'use strict';

  angular.
    module('cardCatalog.BookListController', ['ngResource']).
    controller('BookListController', bookListController);

  bookListController.$inject = [
      '$scope',
      '$location',
      '$stateParams',
      '$ionicPopover',
      'log',
      'util',
      'prefsService',
      'bookService'
  ];

  function bookListController(
      $scope,
      $location,
      $stateParams,
      $ionicPopover,
      log,
      util,
      prefsService,
      bookService )
  {
    log.log("BookListController: start");

    // -- Process search query inputs

    $scope.query = $location.search();
    log.log("BookListController: search query: "+JSON.stringify($scope.query));

    if (!util.empty($scope.query.isbn)) {
      $scope.isbn  = $scope.query.isbn;
      log.log("BookListController: isbn: "+$scope.isbn);
    }

    if (!util.empty($scope.query.words)) {
      // Convert words string into am array of lower case words
      //   Make lower case, remove non-alpha chars & split into an array
      $scope.words = $scope.query.words.toLowerCase().trim().replace(/\W/g,' ').split(/\s+/);
      log.log("BookListController: words: "+JSON.stringify($scope.words));
    } else {
      $scope.words = [];
    }

    // -- Sort Configuration

    $scope.sort_config = {		// Allowed sort orders, with 'asc' & 'desc'
      "isbn": "ISNB",
      "title": "Title",
      "author": "Author",
      "publisher": "Publisher",
      "updated_at": "Updated date",
    };
    $scope.sort = "updated_at asc"; 	// Default sort: newest records first

    // -- Generate book list

    $scope.limit = 250;

    $scope.isRunning = false;
    $scope.books = [];
    $scope.booksUnfiltered = [];
    $scope.lastBook = null;

    $scope.fetchMore = function() {
      log.log("BookListController.fetchMore: start");
      getBooks($scope.isbn, $scope.words, $stateParams.conflicts);
    };

    $scope.noMoreData = false;

    // -- Read books from DB
    //
    // Handles
    // - Sorting
    // - Search by an array or words, or lookup by ISBN
    // - Infinite scroll, reading ten more records when user scrolls to the bottom of list

    function getBooks(isbn, words, local_is_conflict) {
      if ($scope.isRunning) return;

      $scope.isRunning = true;

      log.log("BookListController.getBooks: ========== start ===========");
      log.log("BookListController.getBooks:   sort: "+$scope.sort);
      log.log("BookListController.getBooks:   isbn: "+isbn);
      log.log("BookListController.getBooks:   words: "+JSON.stringify(words));

      if ($scope.noMoreData) { // getBooks is called twice if count is less then limit and sort is pressed
        log.log("BookListController.getBooks:   returning: due to called twice");
        return;
      }
      var sort = $scope.sort.split(' ');  // sort[0] = sort field, sort[1] = sort direction

      var options = { 'limit': $scope.limit };
      var lastKey = null;
      if ($scope.lastBook) {
        lastKey = isbn ? isbn + '-' : '';
        lastKey += $scope.lastBook[sort[0]];
        // Skip all of the records with the same key
        options.skip = 0;
        for(var i=$scope.booksUnfiltered.length-1; i>=0; i--) {
          if ($scope.booksUnfiltered[i][sort[0]] == lastKey) { // TODO error here!
            options.skip++;
          } else {
            break;
          }
        }
      } else {
        lastKey = isbn;
      }

      log.log("BookListController.getBooks: lastKey: "+lastKey);

      if (sort[1] == 'desc') {
        log.log("BookListController.getBooks: descending search");
        options.descending = true;
        if (lastKey) {
          options.startkey = isbn + '~~~';
        }
        if (isbn) {
          options.endkey = lastKey;
        }
      } else {
        options.startkey = lastKey;
        if (isbn) {
          options.endkey = isbn + '~~~';
        }
      }

      var viewFields;
      if (isbn && sort[0] != 'isbn') {
        viewFields = ['isbn', sort[0]];
      } else {
        viewFields = [sort[0]];
      }

      log.log("BookListController.getBooks: --------------");
      log.log("BookListController.getBooks: $scope.limit: "+$scope.limit);
      log.log("BookListController.getBooks: options: "+JSON.stringify(options));

      bookService.createFieldView(viewFields).then(
        function(viewPath) {
          bookService.getByViewKey(viewPath, null, options).then(
            function(recs) {
              log.log("BookListController.getBooks: recs.length: "+recs.length);
              if (recs.length) {
                $scope.books = $scope.books.concat(filter(recs, words));
                $scope.booksUnfiltered = $scope.booksUnfiltered.concat(recs);
                $scope.lastBook = recs[length-1];
                log.log("BookListController.getBooks: $scope.books.length: "+$scope.books.length);
                $scope.$broadcast('scroll.infiniteScrollComplete');
                log.log("BookListController.getBooks: scroll.infiniteScrollComplete");
              }
              if (recs.length < $scope.limit || recs.length === 0) {
                log.log("BookListController.getBooks: NO MORE DATA");
                $scope.lastBook = null;
                $scope.noMoreData = true;
              }
              $scope.isRunning = false;
              $scope.noMoreData = true;
            }, function(err) {
              log.error("BookListController.getBooks: ERROR: bookService: "+err.message);
              $scope.isRunning = false;
            }
          );
        }, function(err) {
          log.error("BookListController.getBooks: ERROR: createFieldView: "+err.message);
          $scope.isRunning = false;
        }
      );
    }

    // --- Add filtered records

    function filter(recs, words) {
      log.log("BookListController.filter: start: recs: "+recs.length);
      if (words.length < 1) {
        log.log("BookListController.filter: returning: "+recs.length+" (ALL)");
        return recs;
      }

      var filtered = [];
      for (var i=0, len=recs.length; i<len; i++) {
        if (match(recs[i], words)) {
          filtered.push(recs[i]);
        }
      }
      log.log("BookListController.filter: returning: "+filtered.length+" (filtered)");
      return filtered;
    }

    // --- Match record by words:
    //
    // Book has to match all search words
    // Returns true on a match or all search words

    function match(book, words) {

      var text = [book.title, book.author, book.publisher, book.keywords].join(' ').replace(/\W/g,' ').toLowerCase();
      for (var i=0, len=words.length; i<len; i++) {
        if (text.indexOf(words[i]) < 0) {
          return false;
        }
      }
      return true;
    }

    // --- Popover Processing

    $ionicPopover.fromTemplateUrl('components/books/book.list.popover.html', {
      scope: $scope
    }).then( function(popover) {
      $scope.popover = popover;
    });

    $scope.openPopover = function($event) {
      $scope.popover.show($event);
    };

    $scope.closePopover = function() {
      $scope.popover.hide();
    };

    // --- Menu processing

    $scope.sortList = function(sort) {
      log.log("BookListController.sortList: sort=" + sort);
      prefsService.setBookSort(sort);
      $scope.sort = sort;
      $scope.noMoreData = false;
      $scope.books = [];
      $scope.booksUnfiltered = [];
      $scope.lastBook = null;
      getBooks($scope.isbn, $scope.words, $stateParams.conflicts);
      $scope.closePopover();
    };

    log.log("BookListController: done");
  }
})();
