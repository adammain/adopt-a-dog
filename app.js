/* CONSTANTS
–––––––––––––––––––––––––––––––––––––––––––––––––– */
const apikey = "Nj7099JE"
const url = `https://test1-api.rescuegroups.org/v5`

/* HELPER FUNCTIONS
–––––––––––––––––––––––––––––––––––––––––––––––––– */
function shuffle(array) {
  var currentIndex = array.length, temporaryValue, randomIndex;

  // While there remain elements to shuffle...
  while (0 !== currentIndex) {

    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;

    // And swap it with the current element.
    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }

  return array;
}

function getPetFromStore(id) {
  pets = [ ...STORE.dogs, ...STORE.cats ]
  for (p in pets) {
    if (pets[p].id === id) {
      return pets[p]
    }
  }
  return 0
}

function textTruncate(str, length, ending) {
  if (length == null) {
    length = 200;
  }
  if (ending == null) {
    ending = '...';
  }
  if (str.length > length) {
    return str.substring(0, length - ending.length) + ending;
  } else {
    return str;
  }
}

// FORMAT QUERY FOR API REQUEST
function formatQueryParams(params) {
  console.log('`formatQueryParams` ran')
  console.log('params=', params)
  let queryItems = Object.keys(params).map(key => `${encodeURIComponent(key)}=${params[key]}`)
  console.log("queryItems", queryItems.join('&') )
  // return queryItems.join('&') 
}

/* INITIALIZE APP
–––––––––––––––––––––––––––––––––––––––––––––––––– */
function initialize(){
  fetchPetData()
  onZipCodeSearch()
  onFilter()
}

$(initialize) 

/* STORE DATA MANAGEMENT
–––––––––––––––––––––––––––––––––––––––––––––––––– */
let STORE = {
  dogs: [

  ],
  cats: [

  ],
  filter: 0
}

function storePetResults(results) {
  let data = results.data
  let included = results.included
  let speciesId = data[0].relationships.species.data[0].id

    // Clear out previous search results for this species (8 = Dog ID, 3 = Cat ID)
    speciesId === "8" ? STORE.dogs = [] : STORE.cats = []

  // Convert IDs to their text value (i.e. species ID: 8 = "Dog")
  for (pet in data) {   
    // Get each result's properties we want to save
    let petResult = {
      id: data[pet].id,
      species: data[pet].relationships.species.data[0].id,
      breedString: data[pet].attributes.breedString,
      breedPrimary: data[pet].attributes.breedPrimary,
      breedSecondary: data[pet].attributes.breedSecondary ? data[pet].attributes.breedSecondary : 0,
      colors: data[pet].relationships.colors
        ? data[pet].relationships.colors.data[0].id
        : "Unknown",
      organization: data[pet].relationships.orgs.data[0].id,
      status: data[pet].relationships.statuses.data[0].id,
      attributes: data[pet].attributes,
      pictures: data[pet].relationships.pictures 
        ? data[pet].relationships.pictures.data[0].id
        : 0
    }

    // For each pet object being built, map return Id to it's real value                                  
    for (item in included) {
      switch(included[item].id) {
        case petResult.species: 
          petResult.species = included[item].attributes.singular
          break;
        case petResult.pictures: 
          petResult.pictures = included[item].attributes
          break;
        case petResult.organization:
          petResult.organization = included[item].attributes
          break;
        case petResult.status:
          petResult.status = included[item].attributes.name
          break;
        case petResult.colors:
          petResult.colors = included[item].attributes.name
          break;
      }
    } // End of "included" loop
  
    // STORE RESULTS INTO STORE
    petResult.species === 'Dog' ? STORE.dogs.push(petResult) : STORE.cats.push(petResult) 
  } // End of "data" loop
  
  console.log("STORE: ", STORE)
  renderResults()
}

/* API REQUESTS
–––––––––––––––––––––––––––––––––––––––––––––––––– */
// rescuegroups.org API
function fetchPetData(zipcode = 80203) {
  var myHeaders = new Headers();
  myHeaders.append("Content-Type", "application/vnd.api+json");
  myHeaders.append("Authorization", apikey);
  
  var raw = `{ \"data\": {\"filterRadius\":{\"miles\": 25,\"postalcode\": ${zipcode}}}}`
  
  var requestOptions = {
    method: 'POST',
    headers: myHeaders,
    body: raw,
    redirect: 'follow'
  };
  
  // Fetch Dogs
  fetch(`${url}/public/animals/search/available/dogs/haspic/?sort=random&limit=10&fields=[breeds]=name`, requestOptions)
    .then(response => {
      if (response.ok) {
        return response.json()
      }
      throw new Error(response.statusText)
    })
    .then(responseJson => {
      if (responseJson.meta.count === 0) {
        renderError("no-results")
      } else {
        console.log("responseJson",responseJson)
        storePetResults(responseJson)
      }
    })
    .catch(error => console.log('error', error))

  // Fetch Cats
  fetch(`${url}/public/animals/search/available/cats/haspic/?sort=random&limit=10&fields=[breeds]=name`, requestOptions)
  .then(response => {
    if (response.ok) {
      return response.json()
    }
    throw new Error(response.statusText)
  })
  .then(responseJson => {
    if (responseJson.meta.count === 0) {
      renderError("no-results")
    } else {
      console.log("responseJson",responseJson)
      storePetResults(responseJson)
    }
  })
  .catch(error => console.log('error', error))
}

/* <a href="https://twitter.com/share?text=See%20this%20Pet%20available%20for%20%40adoption!&url=https%3A%2F%2Fwww.instagram.com%2Fp%2FCHeS161nnOW%2F%3Futm_source%3Dig_web_button_share_sheet" class="twitter-share-button" data-show-count="false">
Tweet
</a>
<script async src="https://platform.twitter.com/widgets.js" charset="utf-8"></script>  */

/* LISTENER FUNCTION
–––––––––––––––––––––––––––––––––––––––––––––––––– */
function onZipCodeSearch() {
  $('form').submit(function(e) {
    e.preventDefault()
    const zipcode = $('.js-zipcode-input').val()
    console.log("submitted", zipcode)
    fetchData(zipcode)
  })
}

function onFilter() {
  $('.js-filters--dogs').click(function() {
    STORE.filter = 'dogs'
    renderResults()
  })
  $('.js-filters--cats').click(function() {
    STORE.filter = 'cats'
    renderResults()
  })
  $('.js-filters--clear').click(function() {
    STORE.filter = 'none'
    renderResults()
  })
}

function onProductClick() {
  $('.product--container').click(function(e) {
    const petId = $(this).closest('article').attr('data-id')
    console.log('product clicked', petId)
    renderModalDialog(petId)
  })
}

function onShareClick() {
  $('.content__section--button').click(function(e) {
    const id = $(this).closest('article').attr('.data-id')
    const petObj = getPetFromStore(id)
    // TODO: Finish share popup with email or twitter
  })
}

// TODO: create render function for expansion?
// Listen for the 'more' button -> expand truncated about text
function onExpandAboutText() {
  $('.js-button--expand').click(function(e) {
    console.log("expand")
    let id = $(this).attr('data-id')
    let pet = getPetFromStore(id)
    let aboutText = pet.attributes.descriptionText

    // render expanded pet description text
    $(this).closest('.content__section--about').html(`<span class="about__description-text overflow"><b>ABOUT</b> ${aboutText}</span>`)
  })
}

/* RENDER FUNCTIONS
–––––––––––––––––––––––––––––––––––––––––––––––––– */
function renderError(error) {
  console.log("`renderError`, ran")
  let message = ''

  switch (error) {
    case 'no-results':
      message = 'no results were found within 25 miles of given zipcode.'
      break;
    default:
      message = 'something went wrong. Please refresh or try again.'
  }

  $('.js-results--column').empty()
  $('.js-results--column').append(
    `<li class="product">
      <p>Sorry, ${message}</p>
    </li>`
  )
}

function renderResults() {
  console.log("`renderResults`, ran", { ...STORE.dogs, ...STORE.cats })
  let results 
  // Apply filters or display all results
  switch(STORE.filter) {
    case 'cats': 
      results = [ ...STORE.cats ]
      break;
    case 'dogs': 
      results = [ ...STORE.dogs ]
      break;
    default:
      results = shuffle([ ...STORE.dogs, ...STORE.cats ])
  }

  // Clear previous displayed results
  $('.js-results--column').empty()

  // Create list element for each result and add to DOM
  for (let i = 0; i < results.length - 2; i += 3) {

    // Expansion button for next 3 results in row
    let aboutStringOne = results[i].attributes.descriptionText 
      ? textTruncate(results[i].attributes.descriptionText, 200, `...<button class="button--expand js-button--expand" data-id="${results[i].id}">more</button>`) 
      : "No Description"
    let aboutStringTwo = results[i+1].attributes.descriptionText 
      ? textTruncate(results[i+1].attributes.descriptionText, 200, `...<button class="button--expand js-button--expand" data-id="${results[i+1].id}">more</button>`) 
      : "No Description"
    let aboutStringThree = results[i+2].attributes.descriptionText 
      ? textTruncate(results[i+2].attributes.descriptionText, 200, `...<button class="button--expand js-button--expand" data-id="${results[i+2].id}">more</button>`) 
      : "No Description"

    $('.js-results--column').append(
      `<div class="results__row">
        <article class="product" data-id="${results[i].id}">
          <header>
            <div>
              <span class="header--pet-name">
                ${results[i].attributes.name}
              </span>
            </div>
          </header>
          <div class="product--container">
            <img 
              src="${results[i].pictures.large.url}" 
              alt=""
              class="product__detail--image js-product-img"
            >
          </div>
          <div class="product__detail--content">
            <section class="content__section">
              <span class="content__section--name">
                 <b>ORGANIZATION</b> ${results[i].organization.name}
              </span>
              <button class="content__section--button" type="button">
                <div class="section__button--icon">
                  <a href="https://twitter.com/share?ref_src=twsrc%5Etfw" class="twitter-share-button" data-text="Check out ${results[i].attributes.name}! She is an adorable pet available for adoption in ${results[i].organization.citystate}!" data-url="${results[i].organization.url}" data-lang="en" data-dnt="true" data-show-count="false">
                    <svg aria-label="Share Post" class="_8-yf5 " fill="#262626" height="24" viewBox="0 0 48 48" width="24"><path d="M47.8 3.8c-.3-.5-.8-.8-1.3-.8h-45C.9 3.1.3 3.5.1 4S0 5.2.4 5.7l15.9 15.6 5.5 22.6c.1.6.6 1 1.2 1.1h.2c.5 0 1-.3 1.3-.7l23.2-39c.4-.4.4-1 .1-1.5zM5.2 6.1h35.5L18 18.7 5.2 6.1zm18.7 33.6l-4.4-18.4L42.4 8.6 23.9 39.7z"></path></svg>
                  </a>
                </div>
              </button>
            </section>
            <section>
              <span class="content__section--about">
                <span class="about__description-text overflow"><b>ABOUT</b> ${aboutStringOne}</span>
              </span>
            </section>
            <section></section>
          </div>
        </article>

        <article class="product" data-id="${results[i+1].id}">
          <header>
            <div>
              <span class="header--pet-name">
                ${results[i+1].attributes.name}
              </span>
            </div>
          </header>
          <div class="product--container">
            <img 
              src="${results[i+1].pictures.large.url}" 
              alt=""
              class="product__detail--image js-product-img"
            >
          </div>
          <div class="product__detail--content">
            <section class="content__section">
              <span class="content__section--name">
                 <b>ORGANIZATION</b> ${results[i+1].organization.name}
              </span>
              <button class="content__section--button " type="button">
                <div class="section__button--icon ">
                  <a href="https://twitter.com/share?ref_src=twsrc%5Etfw" class="twitter-share-button" data-text="Check out ${results[i+1].attributes.name}! She is an adorable pet available for adoption in ${results[i+1].organization.citystate}!" data-url="${results[i+1].organization.url}" data-lang="en" data-dnt="true" data-show-count="false">
                    <svg aria-label="Share Post" class="_8-yf5 " fill="#262626" height="24" viewBox="0 0 48 48" width="24"><path d="M47.8 3.8c-.3-.5-.8-.8-1.3-.8h-45C.9 3.1.3 3.5.1 4S0 5.2.4 5.7l15.9 15.6 5.5 22.6c.1.6.6 1 1.2 1.1h.2c.5 0 1-.3 1.3-.7l23.2-39c.4-.4.4-1 .1-1.5zM5.2 6.1h35.5L18 18.7 5.2 6.1zm18.7 33.6l-4.4-18.4L42.4 8.6 23.9 39.7z"></path></svg>
                  </a>
                </div>
              </button>
            </section>
            <section>
              <span class="content__section--about">
                <span class="about__description-text"><b>ABOUT</b> ${aboutStringTwo}</span>
              </span>
            </section>
            <section></section>
          </div>
        </article>

        <article class="product" data-id="${results[i+2].id}">
          <header>
            <div>
              <span class="header--pet-name">
                ${results[i].attributes.name}
              </span>
            </div>
          </header>
          <div class="product--container">
            <img 
              src="${results[i+2].pictures.large.url}" 
              alt=""
              class="product__detail--image js-product-img"
            >
          </div>
          <div class="product__detail--content">
            <section class="content__section">
              <span class="content__section--name">
                 <b>ORGANIZATION</b> ${results[i+2].organization.name}
              </span>
              <button class="content__section--button " type="button">
                <div class="section__button--icon">
                  <a href="https://twitter.com/share?ref_src=twsrc%5Etfw" class="twitter-share-button" data-text="Check out ${results[i+2].attributes.name}! She is an adorable pet available for adoption in ${results[i+2].organization.citystate}!" data-url="${results[i+2].organization.url}" data-lang="en" data-dnt="true" data-show-count="false">
                    <svg aria-label="Share Post" class="_8-yf5 " fill="#262626" height="24" viewBox="0 0 48 48" width="24"><path d="M47.8 3.8c-.3-.5-.8-.8-1.3-.8h-45C.9 3.1.3 3.5.1 4S0 5.2.4 5.7l15.9 15.6 5.5 22.6c.1.6.6 1 1.2 1.1h.2c.5 0 1-.3 1.3-.7l23.2-39c.4-.4.4-1 .1-1.5zM5.2 6.1h35.5L18 18.7 5.2 6.1zm18.7 33.6l-4.4-18.4L42.4 8.6 23.9 39.7z"></path></svg>
                  </a>
                </div>
              </button>
            </section>
            <section>
              <span class="content__section--about">
                <span class="about__description-text"><b>ABOUT</b> ${aboutStringThree}</span>
              </span>
            </section>
            <section></section>
          </div>
        </article>

     </div>`
    )
  }

  // Initialize product result listener 
  onProductClick() 
  onExpandAboutText()
  onShareClick()
  twttr.widgets.load()
} // end renderResults()

function renderModalDialog(id) {
  const pet = getPetFromStore(id)
  console.log("pet clicked and found attempting to display", pet)
  if (pet) {
    $('.modal').removeClass('hidden')
    $('.js-modal__image').attr('src', `${pet.pictures.large.url}`)
    $('.modal--title').text(`Hi, my name is ${pet.attributes.name}!`)
    $('.modal__body--about-pet').append(`${pet.attributes.descriptionText}`)
    $('.modal__body--breed').text(`${pet.attributes.breedString}`)
    $('.modal__body--sex').text(`${pet.attributes.sex}`)
    $('.modal__body--age').text(`${pet.attributes.ageString}`)
    $('.modal__body--adoptionProcess').text(`Adoption Process: ${pet.organization.adoptionProcess}`)
    $('.modal__body--org-link').attr('href',`${pet.organization.url}`).text(`${pet.organization.name}`)
    $('.modal__body--map-link').text(`Map Link Here`)
  } else {
    renderError('broken')
  }
}

function closeModalDialog() {
  $('.modal').addClass('hidden')
}


// UP NEXT

// o Add share link functionality: Twiiter and Email
// o Add breed link to open modal for breed details API