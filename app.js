const apikey = "Nj7099JE"
const url = `https://test1-api.rescuegroups.org/v5`

let STORE = {
  dogs: [

  ],
  cats: [

  ]
}
// [
  // {
  //   cat: {
  //     id: "id-number-here",
  //     breeds: "breed-types-here",
  //     colors: "colors-here-check-here"
  //       ? "colors-here"
  //       : "Unknown",
  //     organization: "orgs-object-info-here",
  //     status: "status-designation-here",
  //     attributes: "attr-object-here",
  //     pictures: "pics-object-info-here" 
  //   }
  // }
// ]
// STORE EACH RESULT OBJECT WITH OUR DESIRED PROPERTIES
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
  fetch(`${url}/public/animals/search/available/dogs/haspic/?sort=random&limit=50&fields=[breeds]=name`, requestOptions)
    .then(response => {
      if (response.ok) {
        return response.json()
      }
      throw new Error(response.statusText)
    })
    .then(responseJson => {
      if (responseJson.meta.count === 0) {
        renderNoResults()
      } else {
        console.log("responseJson",responseJson)
        storePetResults(responseJson)
      }
    })
    .catch(error => console.log('error', error))

  // Fetch Cats
  fetch(`${url}/public/animals/search/available/cats/haspic/?sort=random&limit=5&fields=[breeds]=name`, requestOptions)
  .then(response => response.json())
  .then(responseJson => {
    storePetResults(responseJson)
    console.log(responseJson)
  })
  .catch(error => console.log('error', error))
}

function handleZipCodeSearch() {
  $('form').submit(function(e) {
    e.preventDefault()
    const zipcode = $('.js-zipcode-input').val()
    console.log("submitted", zipcode)
    fetchData(zipcode)
  })
}

function initialize(){
  fetchData()
  handleZipCodeSearch()
}

$(initialize) 

// UP NEXT
// o Add a few MVP HTML filter options (Dog, Cat, Filter Button with Pop up for MVP/Mobile limited filter options)
// o Update Result List with filtered result

// o Create Mobile Details View 
// o Fill Mobile Details View with data from STORE for clicked pet

// o Begin Desktop Screen Sized MVP


// RENDER FUNCTIONS

function renderNoResults() {
  console.log("`renderNoResults`, ran")
  const results = STORE.dogs
  $('.js-results').empty()
  $('.js-results').append(
    `<li class="product">
      <p>Sorry, no results were found within 25 miles of given zipcode.</p>
    </li>`
  )
}

// DISPLAY RESULTS TO PAGE
function renderResults() {
  console.log("`renderResults`, ran", STORE.dogs)
  const results = STORE.dogs
  $('.js-results').empty()
  
  // Create list element for each result and add to DOM
  for (pet in results) {
    let imgURL = results[pet].pictures.large.url
    let petName = results[pet].attributes.name
    $('.js-results').append(
      `<li class="product">
        <div class="product">
          <img 
            src="${imgURL}" 
            alt=""
            class="product__detail-image js-product-img"
          >
          <p><b>Name:</b> ${petName}</p>
        </div>
      </li>`
    )
  }
}