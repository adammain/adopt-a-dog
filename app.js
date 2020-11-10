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

/* INITIALIZE APP
–––––––––––––––––––––––––––––––––––––––––––––––––– */
function initialize(){
  fetchData()
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
function fetchData(zipcode = 80203) {
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
  .then(response => response.json())
  .then(responseJson => {
    storePetResults(responseJson)
    console.log(responseJson)
  })
  .catch(error => console.log('error', error))
}

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
  $('.product').click(function(e) {
    const petId = $(this).attr('data-id')
    console.log('product clicked', petId)
    renderModalDialog(petId)
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

  $('.js-results').empty()
  $('.js-results').append(
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
  $('.js-results').empty()
  
  // Create list element for each result and add to DOM
  for (pet in results) {
    let imgURL = results[pet].pictures.large.url
    let petName = results[pet].attributes.name
    let petId = results[pet].id
    $('.js-results').append(
      `<li class="product" data-id="${petId}">
        <div class="product--container">
          <img 
            src="${imgURL}" 
            alt=""
            class="product__detail--image js-product-img"
          >
          <div class="product__detail--content">
            <span class="content__body">
              <b>Name:</b> ${petName}
            </span>
          </div>
        </div>
      </li>`
    )
  }

  // Initialize product result listener 
  onProductClick() 
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

// o Do not show results if the pet URL returns a 404

// o Begin Desktop Screen Sized MVP