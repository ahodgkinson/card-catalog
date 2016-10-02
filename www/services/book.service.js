// book.service.js

(function() {

  'use strict';

  angular
    .module('cardCatalog.bookService', ['ngResource'])
    .service('bookService', bookService);

  bookService.$inject = [
    '$q',
    'pouchdbService',
  ];

  function bookService( $q, pouchdbService ) {

    var TYPE = "book";

    var service = {
      table:          TYPE,

      get:            function(isbn) { return pouchdbService.get(isbn);      },
      put:            function(rec)  { return pouchdbService.put(TYPE, rec); },
      remove:         function(rec)  { return pouchdbService.remove(rec);    },

      getByViewKey:   function(view, key, options) { return pouchdbService.getByViewKey(view, key, options); },
      createFieldView: function(fields, emitUndef, conflicts) { return pouchdbService.createFieldView(TYPE, fields, emitUndef, conflicts); },
    };

    return service;
  }

})();
