const url = 'http://localhost:3000/monsters'
const backButton = document.querySelector("#back")
backButton.id = "prev"
const nextButton = document.querySelector("#forward")
nextButton.id = "next"
const firstButton = document.createElement("button")
firstButton.id = "first"
firstButton.textContent = "|<="
const lastButton = document.createElement("button")
lastButton.id = "last"
lastButton.textContent = "=>|"
document.body.insertBefore(firstButton, backButton)
document.body.append(lastButton)

let paginator = { 
  "limit": 5,
  "first":"",
  "prev":"",
  "next":"",
  "last":""
  }

  let currentPage = parseInt(paginator.next) - 1 || parseInt(paginator.prev) + 1

const createForm = _ => {
  let newForm = document.createElement("form")
  newForm.id = "monster-form"

  let nameLabel = document.createElement("label")
  nameLabel.for = "monster-name"
  nameLabel.textContent = "Name"

  let newName = document.createElement("input")
  newName.id = "monster-name"
  newName.name = "monster-name"
  
  let ageLabel = document.createElement("label")
  ageLabel.for = "mmonster-age"
  ageLabel.textContent = "Age"

  let newAge = document.createElement("input")
  newAge.id = "monster-age"
  newAge.name = "monster-age"

  let descriptionLabel = document.createElement("label")
  descriptionLabel.for = "mmonster-description"
  descriptionLabel.textContent = "Description"
  
  let newDescription = document.createElement("textarea")
  newDescription.id = "monster-description"
  newDescription.name = "monster-description"

  let submit = document.createElement("input")
  submit.id = "submit-monster"
  submit.type = "submit"
  submit.value = "Submit"
  submit.textContent = "Add Monster"

  newForm.append(nameLabel, newName, ageLabel, newAge, descriptionLabel, newDescription, submit)
  document.body.querySelector("#create-monster").append(newForm)
}
createForm()

// Must be globally assigned after the form has been built
const newForm = document.createElement("form")



// Making this take an options hash as an argument to allow same method to be called for multiple uses
// and not having to worry about arguments being out of order/missing
const getMonsters = options => {
  fetch(url+`?_limit=${options.limit}&_page=${options.page}`)
    .then(response => {
      // To access the Link header, you must call entries() on the header
      // entries() returns an iterator (seems to function like an array)
      //iterate through the "pair" returns from the entries() method
      for (pair of response.headers.entries()) {     
        if (pair[0] !== "link") continue // Reject the non-Link headers by skipping to next iteration
        
        for (key in paginator) {  //Reset link dictionary in case a key is not updated
          if (key === "limit") continue
          paginator[key] = ""
        }

        let links = pair[1].split(",")  // All links in header are returned as single string, split them
        
        for (link of links) {           // For each link, we need to access the "name", and the "page number" from the string
          let pageName =  /(.*page=)(\d+)(.*rel=")(\w+)/.exec(link)[4] // RegExp returns Array(5) => [full string, base url, page name, "rel string", and pagenum]
          let pageNum =   /(.*page=)(\d+)(.*rel=")(\w+)/.exec(link)[2] // We only care about name and num, so save those
          paginator[pageName] = pageNum // Update link dictionary 
        }
      }
      currentPage = parseInt(paginator.next) - 1 || parseInt(paginator.prev) + 1
      return response.json() })
    .then(monsters => {
      monsters.forEach( monster => renderMonster(monster) )
      adjustButtons()
    })
}

const renderMonster = monster => {
  let div = document.createElement("div")
  div.dataset.id = monster.id
  div.className = "monster-card"
  div.style.border = "2px solid black"
  div.style.margin = "10px"
  div.style.padding = "10px"

  let name = document.createElement("h3")
  name.className = "monster-name"
  name.textContent = `Name: ${monster.name}`
  
  let age = document.createElement("h4")
  age.className = "monster-age"
  age.textContent = `Age: ${monster.age}`
  
  let descriptionTitle = document.createElement("h4")
  descriptionTitle.textContent = "Description"

  let description = document.createElement("p")
  description.className = "monster-description"
  description.textContent = `${monster.description}`

  let deleteButton = document.createElement("button")
  deleteButton.className = "delete-monster"
  deleteButton.textContent = "Delete Monster"

  div.append(name, age, descriptionTitle, description, deleteButton)
  document.body.querySelector('#monster-container').append(div)

}

const adjustButtons = _ => {
  for (key in paginator){
      switch (true) {
        case (!paginator[key]): 
          document.querySelector(`#${key}`).style.display = "none"
          break
        case (key !== "limit"):
          document.querySelector(`#${key}`).style.display = "inline-block"
          break
      }
  }
}

const handleClicks = e => {
  let currentCards = document.querySelectorAll('.monster-card')
  currentCards.forEach( card => card.remove() )
  switch (true){
    case (e.target === nextButton):
      getMonsters( {"limit": paginator.limit, "page": paginator.next} )
      break
    case (e.target === backButton):
      getMonsters( {"limit": paginator.limit, "page": paginator.prev} )
      break
    case (e.target === firstButton):
      getMonsters( {"limit": paginator.limit, "page": paginator.first} )
      break
    case (e.target === lastButton):
      getMonsters( {"limit": paginator.limit, "page": paginator.last} )
      break
  }
}

const postMonster = e => {
  let formData = {
    "name":e.target[0].value,
    "age":e.target[1].value,
    "description": e.target[2].value
  }

  let config = {
    "method":"POST",
    "headers": {
      "Content-type":"application/json",
      // "Accepts":"application/json"
      },
    "body": JSON.stringify(formData)
  }
  
  fetch(url, config)
  .then( response => {
    if (!response.ok) {
			throw new Error( response.statusText )
    }
    getMonsters({"limit":paginator.limit, "page": currentPage})
  })
  .catch( error => console.log(error))
}

const deleteMonster = monster => {
  fetch(url+`/${monster.dataset.id}`, {"method":"DELETE"})  
  monster.remove()
}


nextButton.addEventListener('click', handleClicks)
backButton.addEventListener('click', handleClicks)
lastButton.addEventListener('click', handleClicks)
firstButton.addEventListener('click', handleClicks)
document.querySelector("#monster-form").addEventListener('submit', e => {
  e.preventDefault()
  postMonster(e)
  e.target.reset()
} )
document.body.querySelector('#monster-container').addEventListener('click', e => {
  if (e.target.className == "delete-monster") {
    console.log("boog")
    deleteMonster(e.target.closest(".monster-card") )
  }
})



getMonsters({"limit":paginator.limit, "page":1})

