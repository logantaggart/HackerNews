$(async function() {
  const $body = $("body")
  const $allStoriesList = $("#all-articles-list")
  const $submitForm = $("#submit-form")
  const $navLogin = $("#nav-login")
  const $navLogOut = $("#nav-logout")
  const $navWelcome = $("#nav-welcome")
  const $navUserProfile = $("#nav-user-profile")
  const $navSubmit = $("#nav-submit")
  const $loginForm = $("#login-form")
  const $createAccountForm = $("#create-account-form")
  const $ownStories = $("#my-articles")
  const $userProfile = $("#user-profile")
  const $favorited = $("#favorited-articles")
  const $filteredArticles = $("#filtered-articles")
  
  let storyList = null
  let currentUser = null

  await checkIfLoggedIn()


  $loginForm.on("submit", async function(evt) {
    evt.preventDefault()

    const username = $("#login-username").val()
    const password = $("#login-password").val()
    const userInst = await User.login(username, password)

    currentUser = userInst

    syncCurrentUserToLocalStorage()
    loginAndSubmitForm()
  })


  $createAccountForm.on("submit", async function(evt) {
    evt.preventDefault()

    const name = $("#create-account-name").val()
    const username = $("#create-account-username").val()
    const password = $("#create-account-password").val()
    const newAccount = await User.create(username, password, name)

    currentUser = newAccount

    syncCurrentUserToLocalStorage()
    loginAndSubmitForm()
  })


  $navLogOut.on("click", function() {
    localStorage.clear()
    location.reload()
  })


  $submitForm.on("submit", async function(evt) {
    evt.preventDefault()

    const title = $("#title").val()
    const url = $("#url").val()
    const hostName = getHostName(url)
    const author = $("#author").val()
    const username = currentUser.username

    const storyObject = await storyList.createStory(currentUser, {
      title,
      author,
      url,
      username
    })

    const $storyItem = $(`
      <li id="${storyObject.storyId}" class="id-${storyObject.storyId}">
        <span class="star">
          <i class="far fa-star"></i>
        </span>
        <a class="article-link" href="${url}" target="a_blank">
          <strong>${title}</strong>
        </a>
        <small class="article-hostname ${hostName}">(${hostName})</small>
        <small class="article-author">by ${author}</small>
        <small class="article-username">posted by ${username}</small>
      </li>
    `)

    $allStoriesList.prepend($storyItem)

    $submitForm.slideUp("slow")
    $submitForm.trigger("reset")
  });


  $(".articles-container").on("click", ".star", async function(evt) {
    if (currentUser) {
      const $targetStory = $(evt.target)
      const $closeStory = $targetStory.closest("li")
      const storyId = $closeStory.attr("id")

      if ($targetStory.hasClass("fas")) {
        await currentUser.unfavorite(storyId)
        $targetStory.closest("i").toggleClass("fas far")
      } 
      
      else {
        await currentUser.favorite(storyId)
        $targetStory.closest("i").toggleClass("fas far")
      }
    }
  })


  $navLogin.on("click", function() {
    $loginForm.slideToggle()
    $createAccountForm.slideToggle()
    $allStoriesList.toggle()
  })


  $navUserProfile.on("click", function() {
    hideElements()
    $userProfile.show()
  })


  $navSubmit.on("click", function() {
    if (currentUser) {
      hideElements()
      $allStoriesList.show()
      $submitForm.slideToggle()
    }
  })


  $body.on("click", "#nav-favorites", function() {
    hideElements()

    if (currentUser) {
      genFaves()
      $favorited.show()
    }
  })


  $body.on("click", "#nav-all", async function() {
    hideElements()
    await generateStories()
    $allStoriesList.show()
  })


  $body.on("click", "#nav-my-stories", function() {
    hideElements()

    if (currentUser) {
      $userProfile.hide()
      genMyStories()
      $ownStories.show()
    }
  })


  $ownStories.on("click", ".trash-can", async function(evt) {
    const $closeStory = $(evt.target).closest("li")
    const storyId = $closeStory.attr("id")

    await storyList.storyDelete(currentUser, storyId)
    await generateStories()
    hideElements()
    $allStoriesList.show()
  })


  async function checkIfLoggedIn() {
    const token = localStorage.getItem("token")
    const username = localStorage.getItem("username")

    currentUser = await User.getLoggedInUser(token, username)
    await generateStories()

    if (currentUser) {
      generateProfile()
      showNavForLoggedInUser()
    }
  }


  function loginAndSubmitForm() {
    $loginForm.hide()
    $createAccountForm.hide()
    $loginForm.trigger("reset")
    $createAccountForm.trigger("reset")
    $allStoriesList.show()

    showNavForLoggedInUser()
    generateProfile()
  }


  function generateProfile() {
    $("#profile-name").text(`Name: ${currentUser.name}`)
    $("#profile-username").text(`Username: ${currentUser.username}`)
    $("#profile-account-date").text(`Account Created: ${currentUser.createdAt.slice(0, 10)}`)
    $navUserProfile.text(`${currentUser.username}`)
  }


  async function generateStories() {
    const storyListInst = await StoryList.getStories()
  
    storyList = storyListInst
    $allStoriesList.empty()

    for (let story of storyList.stories) {
      const result = generateStoryHTML(story)
      $allStoriesList.append(result)
    }
  }


  function generateStoryHTML(story, isOwnStory) {
    let hostName = getHostName(story.url)
    let starType = isFavorite(story) ? "fas" : "far"

    const trashIcon = isOwnStory
      ? `<span class="trash-can">
          <i class="fas fa-trash-alt"></i>
        </span>`
      : "";

    const storyMarkup = $(`
      <li id="${story.storyId}">
        ${trashIcon}
        <span class="star">
          <i class="${starType} fa-star"></i>
        </span>
        <a class="article-link" href="${story.url}" target="a_blank">
          <strong>${story.title}</strong>
          </a>
        <small class="article-author">by ${story.author}</small>
        <small class="article-hostname ${hostName}">(${hostName})</small>
        <small class="article-username">posted by ${story.username}</small>
      </li>
    `)

    return storyMarkup
  }


  function genFaves() {
    $favorited.empty()

    if (currentUser.favorites.length === 0) {
      $favorited.append("<h5>No favorites have been added!</h5>")
    } 

    else {
      for (let story of currentUser.favorites) {
        let favoriteHTML = generateStoryHTML(story, false, true)
        $favorited.append(favoriteHTML)
      }
    }
  }

  function genMyStories() {
    $ownStories.empty()

    if (currentUser.ownStories.length === 0) {
      $ownStories.append("<h5>You haven't added any stories yet! Please add some!</h5>")
    } 
    
    else {
      for (let story of currentUser.ownStories) {
        let ownStoryHTML = generateStoryHTML(story, true)
        $ownStories.append(ownStoryHTML)
      }
    }

    $ownStories.show()
  }


  function hideElements() {
    const elementsArr = [
      $submitForm,
      $allStoriesList,
      $filteredArticles,
      $ownStories,
      $userProfile,
      $favorited,
      $loginForm,
      $createAccountForm,
      $userProfile
    ]

    elementsArr.forEach($elem => $elem.hide())
  }

  function showNavForLoggedInUser() {
    $navLogin.hide()
    $userProfile.hide()
    $(".main-nav-links, #user-profile").toggleClass("hidden")
    $navWelcome.show()
    $navLogOut.show()
  }


  function isFavorite(story) {
    let favStoryIds = new Set()

    if (currentUser) {
      favStoryIds = new Set(currentUser.favorites.map(obj => obj.storyId))
    }

    return favStoryIds.has(story.storyId)
  }


  function getHostName(url) {
    let hostName

    if (url.indexOf("://") > -1) {
      hostName = url.split("/")[2]
    } 
    
    else {
      hostName = url.split("/")[0]
    }

    if (hostName.slice(0, 4) === "www.") {
      hostName = hostName.slice(4)
    }

    return hostName
  }


  function syncCurrentUserToLocalStorage() {
    if (currentUser) {
      localStorage.setItem("token", currentUser.loginToken)
      localStorage.setItem("username", currentUser.username)
    }
  }
})