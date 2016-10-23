'use-strict'

var request = require("request");
var pRequest = require("promisified-request").create(request);
var fScraper = require("form-scraper");
var xray = require('x-ray');
var Promise = require('promise');
var get = Promise.denodeify(request.get);
var nextPageUrl = undefined;

var x = xray({
  filters: {
    valid_torrent: function (value) {
      return (typeof value === 'string' && value === 'javascript:;') ? '' : value
    },
    trim: function (value) {
      return (typeof value === 'string') ? value.trim() : value
    }
  }
});

var find = function (searchTerm, limit = 3) {
  // Fetch search form
  var formStructure = fScraper.fetchForm("#frm_buscar", "http://www.newpct1.com/", pRequest);
  // Submit search form
  return fScraper.submitForm({ q: searchTerm }, fScraper.provideForm(formStructure), pRequest)
    .then((response) => {
      // Find results from the response body (raw html)
      return findFrom(response.body, limit);
    });
}

var nextPage = function () {
  // Fetch results from the next page
  console.log(nextPageUrl);
  return findFrom(nextPageUrl, 1);
}

function findFrom(initialContent, limit = 3) {
  // Fetch search form
  return Promise.resolve(initialContent)
    .then((htmlOrUrl) => {
      // Get json object list of search results from html or url
      return searchResults(htmlOrUrl, false, limit);
    }).then((items) => {
      // TV Shows are batched and they all have the same URL, so let's group them instead
      return Promise.resolve(uniqueBy(items, (item) => { return item.details_url }));
    }).then((items) => {
      // We need to work on each item separately
      let promises = items.map((item) => {
        // If it's a TV Show then get the json object list containing the episodes 
        if (item.details_url.indexOf("/series") != -1) {
          // This lets us map 1 TV shows to many episodes in the resulting list
          return searchResults(item.details_url, true, limit);
        }
        // If it's a regular film just continue normally
        return Promise.resolve(item);
      });
      // Wait till this is all executed
      return Promise.all(promises);
    }).then((items) => {
      // Flatten list (some items in the list contain a list of episodes) 
      return Promise.resolve([].concat.apply([], items));
    }).then((items) => {
      // Get the direct url for the torrent details (which contains the link for the torrent itself)
      return Promise.resolve(items.map((it) => {
        let suffix = it.details_url.split("newpct1.com/")[1];
        let url = "http://www.newpct1.com/descarga-torrent/" + suffix;
        it['torrent_details_url'] = url;
        return it;
      }));
    }).then((items) => {
      // We need to work on each item separately
      let promises = items.map((item) => {
        // Load torrent details
        let getDownloadUrlPromise = Promise.denodeify(
          x(item.torrent_details_url, '.page-box', '.btn-torrent@href | valid_torrent')
        );
        return getDownloadUrlPromise().then((torrentUrl) => {
          // Get torrent download URL
          return get(torrentUrl);
        }).then((response) => {
          // After resolving the download URL we get the actual torrent file URL
          item['torrent_download_url'] = response.request.uri.href;
          return Promise.resolve(item)
        }).catch((err) => { });
      });
      // Wait till this is all executed
      return Promise.all(promises);
    }).then((completeItems) => {
      // Sanity-check: get rid of invalid items
      return Promise.resolve(completeItems.filter((it) => {
        return it != undefined;
      }));
    });
}

function searchResults(where, isShow = false, limit = 3) {
  // Fetch the next page url and cache it to be able to paginate
  Promise.denodeify(x(where, '.pagination li:contains(Next) a@href'))().then((url) => { nextPageUrl = url; });

  let scrapSearch = Promise.denodeify(x(where, '.page-box .buscar-list li', [{
    title: 'a h2',
    // If it's a TV show then the 'rating' field contains the Quality of the torrent
    rating: isShow ? '.info h2 span:nth-child(5)' : '.info .votadas | trim',
    // Sometimes (for TV shows) the child selector is bugged, so we select every span and we'll fix it later
    date: isShow ? ['span'] : '.info span:nth-child(3)',
    size: isShow ? ['span'] : '.info span:nth-child(4)',
    image: 'img@src',
           // body > section > div.content > div > ul > li:nth-child(1) > a > img
      // show:body > section > div.content > div:nth-child(4) > ul > li:nth-child(1) > a > img 
    details_url: '.color a@href'
  }]))().then((items) => {
    // }]).paginate('.pagination li:contains(Next) a@href').limit(limit))().then((items) => { // TODO: Remove
    // Remove items that don't have a title (usually this is items that contain ads)
    return Promise.resolve(items.filter((it) => {
      return it['title'];
    }));
  });

  if (isShow) {
    // If it's a TV show then fix the date and size manually
    return scrapSearch.then((items) => {
      return Promise.resolve(items.map((item) => {
        item.date = item.date[4];
        item.size = item.size[5];
        return item;
      }));
    });
  } else {
    // Regular download, we're done here
    return scrapSearch;
  }
}

// Filters out items from a list that have a field that another item already has in the list.
function uniqueBy(list, key) {
  var seen = {};
  return list.filter(function (item) {
    var k = key(item);
    return seen.hasOwnProperty(k) ? false : (seen[k] = true);
  })
}

module.exports = {
  find,
  nextPage
}
