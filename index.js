/* eslint-disable no-use-before-define */
/* eslint-disable no-undef */

const imagebase = 'https://image.tmdb.org/t/p/original';
const imagebase92 = 'https://image.tmdb.org/t/p/w154';
const searchEndpoint = 'search/movie';
const movieEndpoint = 'movie';

const month = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];

// Since the CSS for stars is backwards the default rating is 1
let starNum = 4;
const api = '84c0eecf8b46a2b1c3460770ad19e7fa';
let WATCHED = [];
let FAVORITES = [];

/* HELPER FUNCTIONS and UTILS */
function dateToString(str) {
  const newDate = new Date(str);
  return `${month[newDate.getMonth()]} ${newDate.getDate()}, ${newDate.getFullYear()}`;
}

function beenWatchedNumbner(id) {
  let num = 0;
  WATCHED.forEach((element) => {
    if (element.movie.movie_id == id) num += 1;
  });

  return num;
}

function doubleDigits(int) {
  if (int < 10) return `0${int}`;
  return int;
}

function dateForInput(str) {
  const newDate = new Date(str);
  return `${newDate.getFullYear()}-${doubleDigits(newDate.getMonth() + 1)}-${doubleDigits(newDate.getDate())}`;
}

function reverseArray(arr) {
  const newArray = [];
  for (let i = arr.length - 1; i >= 0; i -= 1) {
    newArray.push(arr[i]);
  }
  return newArray;
}

function requestAPIHandler(endpoint, path, q) {
  return fetch(`https://api.themoviedb.org/3/${endpoint}${(path) ? `/${path}` : ''}?api_key=${api}&query=${q}`, { mode: 'cors' })
    .then((response) => response.json())
    .catch((err) => err);
}

function castToString(obj) {
  return `<li>${obj.name}</li>`;
}

function castToList(arr) {
  const brr = arr.slice(0, 16);
  const castList = brr.map((member) => castToString(member)).join('');
  return castList;
}

// Looking for Director in crew array
function findInArray(arr) {
  const found = arr.filter((word) => word.job === 'Director');
  if (found.length > 0) return found;
  return '(no director)';
}

function returnWatchString(obj) {
  return `<li data-id="${obj.id}"><div class="" style="position: relative; display: flex; flex-direction: column; text-align: center;"><span class="unwatched hidden">X</span><div class="movie_poster" data-movie-id=${obj.movie.movie_id} style="background-image: url('${obj.movie.movie_poster}')"></div><span class="edit--button" style="text-decoration: underline; margin-top: 5px;">Edit</span> </div><div class="movie_info"> <h1 class="movie_title">${`${obj.movie.movie_title} (${obj.movie.movie_year})`} </h1> <small>dir. ${obj.movie.movie_dir}</small><div style="margin-top: 10px; word-break: break-all;">${obj.review_content}</div><div style="margin-top: 10px; font-size: 14px;">Watched on <b>${dateToString(obj.date_watched)}</b></div> <div class="movie_stars" style="margin-top: 10px; font-size: 14px;">${obj.star_count} ★ </div></div> </li>`;
}

function getMovieDetailsWithCredits(id) {
  return Promise.all([requestAPIHandler(movieEndpoint, `${id}/credits`, ''), requestAPIHandler(movieEndpoint, id, '')]).then((values) => values);
}

function checkLocalStorage() {
  // Check browser support for Local Storage
  // Most modern browsers support
  if (typeof (Storage) !== 'undefined') {
    // Store

  } else {
    alert('Watched has an autosave feature for devices, but since your browser doesn\'t support it you won\'t be able to save your watched history without exporting manually.');
  }
}

function starFill(int) {
  const arrofstars = document.querySelectorAll('.rating span');
  starNum = int;
  for (let i = 4; i >= int; i -= 1) {
    $(arrofstars[i]).addClass('rating--selected');
  }
  for (let i = 0; i < int; i += 1) {
    $(arrofstars[i]).removeClass('rating--selected');
  }
}

function save() {
  const watchString = JSON.stringify(WATCHED);
  localStorage.setItem('WATCHED', watchString);
}

function read() {
  if (localStorage.getItem(('WATCHED'))) {
    WATCHED = JSON.parse(localStorage.getItem(('WATCHED')));
  } else {
    WATCHED = [];
  }
}

function removeWatched(id) {
  WATCHED.splice(id, 1);
  WATCHED.forEach((e, i) => {
    e.id = i;
  });
  findFavorites();
  save();
  renderHomeScreen();
}

function returnSearchResults(arr) {
  arr = arr.slice(0, 3);
  return arr.map((watch) => `<li data-movie-id="${watch.id}" data-movie-title="${watch.title}" data-movie-release="${watch.release_date.substring(0, 4)}"><div class="results--item"><div><img src="${(watch.poster_path) ? imagebase92 + watch.poster_path : `http://placehold.it/34x54?text=${watch.title}`}" /></div><span>${watch.title} (${watch.release_date.substring(0, 4)})</span></div></li>`);
}

function downloadObjectAsJson() {
  const dataStr = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(WATCHED))}`;
  const downloadAnchorNode = document.createElement('a');
  downloadAnchorNode.setAttribute('href', dataStr);
  downloadAnchorNode.setAttribute('download', 'watched.json');
  document.body.appendChild(downloadAnchorNode); // required for firefox
  downloadAnchorNode.click();
  downloadAnchorNode.remove();
}

// rename to gather favorites
function findFavorites() {
  FAVORITES = [];
  let newfav = '';
  let isFavorite = false;
  WATCHED.forEach((element, ind) => {
    if (element.favorite === true) {
      if (FAVORITES.length === 0) {
        newfav = element.movie;
        newfav.id = ind;
        FAVORITES.push(element.movie);
      } else {
        FAVORITES.forEach((favorite) => {
          if (element.movie.movie_id === favorite.movie_id && FAVORITES.length < 5) {
            isFavorite = true;
          }
        });
        if (!isFavorite) {
          newfav = element.movie;
          newfav.id = element.id;
          FAVORITES.push(newfav);
        }
      }
    }
  });
}

function closeOverlay() {
  $('#ui').off();
  findFavorites();
  $('#overlay').addClass('hidden');
  save();
  renderHomeScreen();
  onClickOutOfOverlay();
  onNavClick();
}

/* EVENT LISTENERS */
function onHomeButtonClick() {
  $('#gobackbutton').on('click', (e) => {
    e.stopPropagation();
    renderHomeScreen();
  });
}

function onClickOutOfOverlay() {
  $('#overlay').on('click', (e) => {
    e.stopPropagation();
    if ((e.target.id) == 'overlay') {
      $('#overlay').addClass('hidden');
      $('#overlay').off();
      $('#ui').off();
      onNavClick();
    }
  });
}

function favoriteEventListeners() {
  $('#favorite__drawer').on('click', 'li', (e) => {
    if (e.currentTarget.dataset.movieId) {
      window.scrollTo(0, 0);
      renderMovieDetail(e.currentTarget.dataset.movieId);
    }
  });

  $('#favorite__drawer li').hover(function (e) {
    $(this).find('.unfavorite').toggleClass('hidden');
  });
}

function onClickGuide() {
  $('.guide').on('click', () => {
    renderGuide();
  });
}

function deleteButtonListeners() {
  $('.unwatched').on('click', function (e) {
    e.stopPropagation();
    removeWatched($(this).closest('li').get()[0].dataset.id);
  });

  $('.unfavorite').on('click', function (e) {
    e.stopPropagation();
    WATCHED[$(this).closest('li').get()[0].dataset.id].favorite = false;
    findFavorites();
    save();
    renderHomeScreen();
  });
}

function onSearchOverlaySelectionClick() {
  $('#results').on('click', 'li', function (e) {
    requestAPIHandler(movieEndpoint, `${e.currentTarget.dataset.movieId}/credits`, '')
      .then((data) => {
        if (data.crew[0]) renderWatchDetail(e.currentTarget.dataset, $(this).find('img').get()[0].src, findInArray(data.crew)[0].name);
        else renderWatchDetail(e.currentTarget.dataset, $(this).find('img').get()[0].src, '(no director)');
      })
      .catch((err) => (err));
  });
}

function onStarClick() {
  $('.rating span').on('click', function (e) {
    starNum = 1;
    const ind = $('.rating span').index(this);
    starFill(ind);
  });
}

function onNavClick() {
  $('#addbutton').off();
  $('#addbutton').on('click', (e) => {
    e.stopPropagation();
    renderSearchOverlay();
    onClickOutOfOverlay();
  });
}

function onRecentlyWatchedClick() {
  $('#recent_watched div').click(function (e) {
    $(this).find('.unwatched').toggleClass('hidden');
  });

  $('#recent_watched .movie_title').click(function (e) {
    renderMovieDetail(WATCHED[(this).closest('li').dataset.id].movie.movie_id);
  });

  onNavClick();
  $('#recent_watched').on('dblclick', '.movie_poster', (e) => {
    window.scrollTo(0, 0);
    renderMovieDetail(e.currentTarget.dataset.movieId);
  });
}

function onWatchEditButtonClick() {
  $('.edit--button').on('click', function (e) {
    e.stopPropagation();
    renderWatchDetail(WATCHED[(this).closest('li').dataset.id]);
  });
}

function onExportButtonClick() {
  $('.exportButton').on('click', () => {
    downloadObjectAsJson();
  });
}

/* COMPONENT RENDER FUNCTIONS */
function renderGuide() {
  $('#ui').html('<span class="over">Click the + to search and add a movie!<br><br>Click on a movie under the recently watched to delete a movie from watch history.<br><br>Click or hover over your favorites to remove them from the favorites drawer.<br><br>Double click on a movie poster or click on the movie title on the home page to see details about the movie.<br><br>Click Usage Guide at the bottom of the page to revisit this guide.</span>');
  $('#overlay').removeClass('hidden');
  onClickOutOfOverlay();
}

function renderSearchOverlay() {
  $('#overlay').toggleClass('hidden');
  $('#ui').html('<div class="overlay-search"> <div class="search--group"> <input autofocus id="name" name="search" placeholder="Search!" > <i class="fa fa-search fa"></i></div><ul id="results"> </ul> </div>');
  $('#overlay').on('transitionend',
    (e) => {
      $('#name').focus();
    });

  $('#name').on('input', () => {
    requestAPIHandler(searchEndpoint, '', $('#name').val())
      .then((d) => returnSearchResults(d.results))
      .then((data) => {
        $('#results').html(data);
      })
      .catch((err) => err);
  });

  onSearchOverlaySelectionClick();
}

function renderFavorites() {
  let lis = '';
  for (let i = 0; i < 5; i++) {
    if (FAVORITES) {
      if (!(FAVORITES[i])) lis += '<li class="placeholder"></li>';
      else lis += `<li data-id=${FAVORITES[i].id} data-movie-id=${FAVORITES[i].movie_id}><span class="unfavorite hidden">X</span><img title="${FAVORITES[i].movie_title}" src="${FAVORITES[i].movie_poster}"/></li>`;
    }
  }
  const favorites = `<section id="favorites" class="pad"><small>FAVORITES:</small><ul id="favorite__drawer">${lis}</ul></section>`;
  $('main').html(favorites);
  favoriteEventListeners();
}

function returnMovieDetail(obj) {
  return `<section id="movie_detail"> <section id="movie-backdrop-container" style=" margin-bottom: 10px;background-image: url('${imagebase + obj[1].backdrop_path}')"> <div id="movie_backdrop"></div> </section> 
    <section class="content pad" style="margin-top: -200px;"><div class="movie_poster" style="margin-bottom: 20px;"> <img src="${imagebase92 + obj[1].poster_path}" /> </div><div class="movie_info"> <h2>${`${obj[1].title} (${obj[1].release_date.substring(0, 4)})`}</h2><small style="margin-bottom: 10px;">dir. ${findInArray(obj[0].crew)[0].name} — ${obj[1].runtime} mins</small> <div style="color: lightgreen;margin-top: 10px;" class="tagline"><small>${obj[1].tagline}</small></div><div class="times_watched" style="margin-bottom: 10px;    margin-top: 10px;">Watched <b>${beenWatchedNumbner(obj[0].id)}</b> time(s)</div> </div>
    <div class="movie_overview" style="margin-bottom: 40px;">${obj[1].overview}</div>
    <div class="movie_cast"> 
    <small>CAST</small> 
    <ul style="display: flex; flex-wrap: wrap;">${castToList(obj[0].cast)}</ul></div><div class="movie_crew"> 
    <small>CREW</small> 
    <ul style="display: flex; flex-wrap: wrap;">${castToList(obj[0].crew)}</ul> </div> <div class="imdb">More Info: <a href="https://www.imdb.com/title/${obj[1].imdb_id}">IMDb</a</div> </section> </section>`;
}

function renderRecentWatched() {
  let reverse = WATCHED;
  reverse = reverseArray(reverse);
  const renderWatchList = reverse.map((watch) => returnWatchString(watch)).join('');
  const watchedContain = `<section id="recent" class="pad"> <span id="recent_header"> <small>RECENTLY WATCHED:</small> <small class="exportButton" style="right: 0; position: absolute; text-decoration: underline;">EXPORT</small> </span><section id="recent_watched"><ul>${renderWatchList}</ul></section></section>`;
  $('main').append(watchedContain);
}

/* VIEW RENDER FUNCTIONS */
function renderHomeScreen() {
  $('#overlay').addClass('hidden');
  onClickGuide();
  onClickOutOfOverlay();
  $('main').css('padding-top', '85px');
  $('#addbutton').off();
  read();
  findFavorites();
  renderFavorites();
  renderRecentWatched();
  onWatchEditButtonClick();
  deleteButtonListeners();
  onExportButtonClick();
  onRecentlyWatchedClick();
}

function renderMovieDetail(id) {
  $('main').css('padding-top', '0');
  getMovieDetailsWithCredits(id)
    .then((data) => returnMovieDetail(data))
    .then((str) => {
      $('main').html(str);
    })
    .catch((err) => err);
  onHomeButtonClick();
}

function renderWatchDetail(obj) {
  const img = arguments[1] || 'not found';
  const dir = arguments[2] || 'not found';
  const currentTime = new Date();
  if ('id' in obj) {
    $('#overlay').removeClass('hidden');
    onClickOutOfOverlay();
    $('#ui').html(`<div class="over"><div class="js-watch-diary"><img style="width: 32px;" src="${obj.movie.movie_poster}"/><div style="display: flex; flex-direction: column" class=""><span>${obj.movie.movie_title} (${obj.movie.movie_year})</span><span>${obj.movie.movie_dir}</span></div></div><br><div style="justify-content: center; font-size: 15px;">Date Watched: <input type="date" id="date-watched" name="date-watched" value="${dateForInput(obj.date_watched)}"/> </div><textarea wrap="hard" placeholder="Add your thoughts about the movie!" id="reviewContent" style="margin-top: 10px;">${obj.review_content}</textarea><div style="display: flex; justify-content: space-between; margin-top: 10px;"><div class="rating"><span>☆</span><span>☆</span><span>☆</span><span>☆</span><span>☆</span></div><div><label for="favorite">Favorite? </label><input type="checkbox" id="favorite" name="favorite" ${(obj.favorite) ? 'checked' : ''}></div></div><input class="" style="margin-top: 10px" type="button" value="Update" /></div>`);
    onStarClick();
    starFill(5 - obj.star_count);

    $('#ui').on('click', 'input[type=button]', () => {
      let overlayDate = (new Date(document.getElementById('date-watched').value));
      overlayDate.setDate(overlayDate.getDate() + 1);

      if (overlayDate == null) {
        overlayDate = currentTime;
      }

      WATCHED[obj.id].favorite = ($('#favorite').is(':checked'));
      WATCHED[obj.id].star_count = (5 - starNum);
      WATCHED[obj.id].date_watched = overlayDate;
      WATCHED[obj.id].review_content = ($('#reviewContent').val() === 'undefined' ? ' ' : $('#reviewContent').val());

      closeOverlay();
    });
  } else {
    $('#ui').html(`<div class="over"><div class="js-watch-diary"><img style="width: 32px;" src="${img}"/><div style="display: flex; flex-direction: column" class=""><span>${obj.movieTitle} (${obj.movieRelease})</span>${(arguments[2]) ? `<span>${arguments[2]}</span>` : ''}</div></div><br><div style="justify-content: center; font-size: 15px;">Date Watched: <input type="date" id="date-watched" name="date-watched" value="${dateForInput(currentTime)}"/> </div><textarea placeholder="Add your thoughts about the movie!" wrap="hard" id="reviewContent" style="margin-top: 10px;"></textarea><div style="display: flex; justify-content: space-between; margin-top: 10px;"><div class="rating"><span>☆</span><span>☆</span><span>☆</span><span>☆</span><span>☆</span></div><div><label for="favorite">Favorite? </label><input type="checkbox" id="favorite" name="favorite"></div></div><input class="" style="margin-top: 10px" type="button" value="Add" /></div>`);
    onStarClick();
    starFill(5 - 1);

    $('#ui').on('click', 'input[type=button]', () => {
      const overlayDate = (new Date(document.getElementById('date-watched').value));
      overlayDate.setDate(overlayDate.getDate() + 1);

      WATCHED.push({
        id: WATCHED.length,
        date_watched: overlayDate,
        favorite: ($('#favorite').is(':checked')),
        star_count: 5 - starNum,
        review_content: ($('#reviewContent').val() === undefined ? ' ' : $('#reviewContent').val()),
        movie: {
          movie_id: obj.movieId,
          movie_title: obj.movieTitle,
          movie_poster: img,
          movie_dir: dir,
          movie_year: obj.movieRelease,
        },
      });

      closeOverlay();
    });
  }
}

function init() {
  checkLocalStorage();
  renderHomeScreen();

  if ((localStorage.getItem('onboarded')) === null) {
    renderGuide();
    localStorage.setItem('onboarded', 'true');
  }
}

$(init);
