'use-strict'
var newpct = require('./find-torrents.js');
var transmission = require('./download-torrents.js');

var input = document.querySelector('.search_bar');
input.addEventListener('keyup', function (e) {
    if (e.keyCode == 13) { // ENTER KEY
        search(input.value);
    }
});

var searchButton = document.querySelector('.search_button');
searchButton.addEventListener('click', function (e) {
    while (ul.firstChild) {
        ul.removeChild(ul.firstChild);
    }
    search(input.value);
});

function search(term) {
    console.log("SEARCHING " + term);
    newpct.find(term, 1).then((res) => {
        console.log("FINISHED SEARCH " + res.length);
        populate(res);
    }).catch((err) => {
        console.log("ERROR " + err);
    });
}

var ul = document.querySelector('.search_results');
function populate(res) {
    for (var i = 0; i < res.length; i++) {
        ul.appendChild(item(res[i]));
    }
}

function item(item) {
    var li = document.createElement('li');
    li.className = 'list-group-item'
    li.appendChild(image(item));
    li.appendChild(container(item));
    return li;
}

function container(item) {
    var div = document.createElement('div');
    div.className = 'media-body';
    div.appendChild(title(item));
    var p = document.createElement('p');
    p.className = 'padded-vertically'
    p.appendChild(downloadButton(item));
    div.appendChild(p);
    return div;
}

function image(item) {
    var image = document.createElement('img');
    image.className = 'img-circle media-object pull-left';
    image.src = item.image;
    image.width = 40;
    image.height = 40;
    return image;
}

function title(item) {
    var strong = document.createElement('strong');
    strong.appendChild(document.createTextNode(item.title.replace("�", "ñ")));
    return strong;
}

function downloadButton(item) {
    var button = document.createElement('button');
    button.className = 'btn btn-mini btn-default';
    button.appendChild(document.createTextNode('Download'));
    var span = document.createElement('span');
    span.className = 'icon icon-download icon-text';
    button.appendChild(span);
    button.addEventListener('click', function (e) {
        transmission.download(item.torrent_download_url);
    });
    return button;
}

var nextPageButton = document.querySelector('.next_page_button');
nextPageButton.addEventListener('click', function (e) {
    nextPage();
});

function nextPage() {
    console.log("NEXT PAGE");
    newpct.nextPage().then((res) => {
        console.log("FINISHED NEXT PAGE " + res.length);
        populate(res);
    }).catch((err) => {
        console.log("ERROR " + err);
    });
}

window.addEventListener('scroll', function() {
   if(window.scrollTop() + $(window).height() == $(document).height()) {
       alert("bottom!");
   }
});