// isbndb.service.js

(function() {

  'use strict';

  angular
    .module('cardCatalog.isbndbService', ['ngResource'])
    .service('isbndbService', isbndbService);

  isbndbService.$inject = [
    '$q',
    '$http',
    'log',
    'util',
    'prefsService',
  ];

  function isbndbService(
    $q,
    $http,
    log,
    util,
    prefsService
  ) {

    var service = {
      get:	get,
    };

    return service;

    // -- Public methods

    // Get JSON metadata about a book, given it's ISBN
    //
    //   Example URL: http://isbndb.com/api/v2/json/{API_KEY}/book/0596004117
    //
    //   Sample JSON data returned by IDBN DB, using the URL above:
    //
    //     {
    //       data: [ {
    //         isbn10: "0596004117",
    //         isbn13: "9780596004118",
    //         ...
    //         title: "JavaScript pocket reference",
    //         title_latin: "JavaScript pocket reference",
    //         title_long: "",
    //         publisher_name: "O'Reilly",
    //         publisher_text: "Sebastopol, Calif. : O'Reilly, 2002, c2003.",
    //         ...
    //         author_data: [
    //           { id: "flanagan_david", name: "Flanagan, David" },
    //           ...
    //         ],
    //         summary: "",
    //       ],
    //       index_searched: "isbn"
    //     }
    //
    // Returns a simple hash:
    //
    //     {
    //       title:         one of title_long, title_latin or title
    //       author:        name of first author
    //       publisher:     publisher_name
    //     }
    //
    //

    function get(isbn) { // returns a promise
      var deferred = $q.defer();

      var key = prefsService.getIsbnKey();
      var url = "http://isbndb.com/api/v2/json/"+key+"/book/"+isbn;

      log.log("isbndbService.getDetails: url: "+url);

      $http.get(url).then(
        function(res) {
          log.log("isbndbService.getDetails: get: success");

          var data = false;
          if ( !util.empty(res.data) && !util.empty(res.data.data)) {
            if ( res.data.data.constructor === Array || !util.empty(res.data.data[0])) {
              var rec = res.data.data[0];
              data = {};
              data.title     =  rec.title_long || rec.title_latin || rec.title;
              data.publisher =  rec.publisher_name;
              if (rec.author_data === Array || !util.empty(rec.author_data)) {
                data.author    =  rec.author_data[0].name;
              }
            }
          }
          deferred.resolve(data);
        },
        function(err) {
          log.log("isbndbService.getDetails: get: success");
          deferred.reject(err);
        }
      );
      
      return deferred.promise;
    }
  }

})();
