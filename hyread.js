const rp = require('request-promise-native');
const cheerio = require('cheerio');
const url = require('url');

function searchBooks(keywords = '') {
  // URL encode
  // keywords = encodeURIComponent(keywords);

  const base = `https://ebook.hyread.com.tw/searchList.jsp`;

  const options = {
    uri: base,
    qs: {
      search_field: 'FullText',
      MZAD: 0,
      search_input: keywords,
    },
    resolveWithFullResponse: true,
    simple: false,
    gzip: true,
    timeout: 10000,
  };

  return rp(options).then(response =>{
    if (!(/^2/.test('' + response.statusCode))) {
      // console.log('Not found or error in hyread!');

      return [];
    }

    return _getBooks(cheerio.load(response.body), base);
  }).catch(error => {
    console.log(error.message);

    return [];
  });
}

// parse 找書
function _getBooks($, base) {
  $rows = $('table.picview').children('tbody').children('tr');

  let books = [];

  // 找不到就是沒這書
  if ($rows.length === 0) {
    console.log('Not found in hyread!');

    return books;
  }

  // 每列都有數本
  $rows.each((rowIndex, columns) => {
    // 每本的內容
    $(columns).children('td').each((i, elem) => {
      // 有聲書會多一層結構
      $linkBlock = $(elem).children('div.voicebg').children('a');

      if ($linkBlock.length === 0) {
        $linkBlock = $(elem).children('a');
      }

      const book = {
        id: $(elem).children('h3').children('a').prop('href').replace(/bookDetail.jsp\?id=/, ''),
        thumbnail: $linkBlock.children('img').prop('src'),
        title: $(elem).children('h3').children('a').text(),
        link: url.resolve(base, $linkBlock.prop('href')),
        priceCurrency: 'TWD',
        price: parseFloat($(elem).children('span').children('b').text().replace(/定價：|元,/g, '')),
        // about: ,
      };

      books.push(book);
    });
  });

  return books;
}

exports.searchBooks = searchBooks;
