const apikey = "Nj7099JE"
const url = `https://test1-api.rescuegroups.org/v5`

let STORE = [{
  pet: {
    id: "id-number-here",
    species: "species-name-here",
    breeds: "breed-types-here",
    colors: "colors-here-check-here"
      ? "colors-here"
      : "Unknown",
    organization: "orgs-object-info-here",
    status: "status-designation-here",
    attributes: "attr-object-here",
    pictures: "pics-object-info-here" 
  }
}]

// Build pet object for each result that includes all properties I want to display
function storePetResults(results) {
  let data = results.data
  let included = results.included
  let petResults = {pets:[]}

  // Get IDs for eachpet properties from results
  // TODO: Remove below initial assignment and assign in loop below
  for (i in data) {
    let pet = {
      id: data[i].id,
      species: data[i].relationships.species.data[0].id,
      breeds: data[i].relationships.breeds.data,
      colors: data[i].relationships.colors
        ? data[i].relationships.colors.data[0].id
        : "Unknown",
      organization: data[i].relationships.orgs.data[0].id,
      status: data[i].relationships.statuses.data[0].id,
      attributes: data[i].attributes,
      pictures: data[i].relationships.pictures 
        ? data[i].relationships.pictures.data[0].id
        : "none"
    }

    // push pet to petResults array to later save to STORE
    petResults.pets.push(pet)
  }

  // Convert IDs to their text value (i.e. species ID: 8 = "Dog")
  for (pet in petResults.pets) {   
    // For each pet object being built, convert Id to equal `included` object value                                  
    for (item in included) {

      // TO DO: Change to Switch Expression
      // Convert species id to species name
      if (included[item].id === petResults.pets[pet].species) {
        petResults.pets[pet].species = included[item].attributes.singular
      }

      // Convert pictures id to pictures object
      if (included[item].id === petResults.pets[pet].pictures) {
        petResults.pets[pet].pictures = included[item].attributes
      }

      // Convert orgs id to orgs object
      if (included[item].id === petResults.pets[pet].organization) {
        petResults.pets[pet].organization = included[item].attributes
      }

      // Convert status id to status value
      if (included[item].id === petResults.pets[pet].status) {
        petResults.pets[pet].status = included[item].attributes.name
      }

      // Convert color id to pet color text value
      if (petResults.pets[pet].colors !== "Unknown" && included[item].id === petResults.pets[pet].colors) {
        petResults.pets[pet].colors = included[item].attributes.name
      }
    }
  }
  console.log("TO-STORE: ", petResults)
  STORE = petResults
  console.log("STORE: ", petResults)
  
  renderResults()
}

// DISPLAY RESULTS TO PAGE
function renderResults() {
  const results = STORE.pets
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
            class="product__detail-image js-card__image"
          >
          <p><b>Name:</b> ${petName}</p>
        </div>
      </li>`
    )
  }
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
  
  fetch(`${url}/public/animals/search/available/dogs/haspic/?sort=random&limit=5&fields=[breeds]=name`, requestOptions)
    .then(response => response.json())
    .then(responseJson => {
      storePetResults(responseJson)
      console.log(responseJson)
    })
    .catch(error => console.log('error', error));
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
// o Connect zipcode search functionality
// o Update store with pet data
// o Update MVP Card info with API data
// o Add a few MVP HTML filter options 
// o Create API calls for filter options 
// o Update STORE with new filtered pet results
// o Update Card with new result

// o Create Mobile Details View 
// o Fill Mobile Details View with data from STORE for clicked pet
// o Create Mobile Map View 
// o Connect Map to Google Maps API

// o Begin Desktop Screen Sized MVP