const BASE_URL = "https://hack-or-snooze-v3.herokuapp.com"

class StoryList {
  constructor(stories) {
    this.stories = stories
  }

  static async getStories() {
    const resp = await axios.get(`${BASE_URL}/stories`)
    const stories = resp.data.stories.map(story => new Story(story))
    const storyList = new StoryList(stories)

    return storyList
  }


  async createStory(user, storyInst) {
    const resp = await axios({
      method: "POST",
      url: `${BASE_URL}/stories`,
      data: {
        token: user.loginToken,
        story: storyInst
      }
    })

    storyInst = new Story(resp.data.story)
    this.stories.unshift(storyInst)
    user.ownStories.unshift(storyInst)

    return storyInst
  }


  async storyDelete(user, storyId) {
    await axios({
      url: `${BASE_URL}/stories/${storyId}`,
      method: "DELETE",
      data: {
        token: user.loginToken
      }
    })

    this.stories = this.stories.filter(story => story.storyId !== storyId)
    user.ownStories = user.ownStories.filter(userStory => userStory.storyId !== storyId)
  }
}


class User {
  constructor(userObj) {
    this.username = userObj.username
    this.name = userObj.name
    this.createdAt = userObj.createdAt
    this.updatedAt = userObj.updatedAt

    this.loginToken = ""
    this.favorites = []
    this.ownStories = []
  }


  static async gen(username, password, name) {
    const resp = await axios.post(`${BASE_URL}/signup`, {
      user: {
        username,
        password,
        name
      }
    })

    const newAcc = new User(resp.data.user)
    newAcc.loginToken = resp.data.token

    return newAcc
  }


  static async login(username, password) {
    const resp = await axios.post(`${BASE_URL}/login`, {
      user: {
        username,
        password
      }
    })

    const existingUser = new User(resp.data.user)

    existingUser.favorites = resp.data.user.favorites.map(s => new Story(s))
    existingUser.ownStories = resp.data.user.stories.map(s => new Story(s))
    existingUser.loginToken = resp.data.token;

    return existingUser
  }


  static async getLoggedInUser(token, username) {
    if (!token || !username) return null

    const resp = await axios.get(`${BASE_URL}/users/${username}`, {
      params: {token}
    })

    const existingUser = new User(resp.data.user)

    existingUser.loginToken = token
    existingUser.favorites = resp.data.user.favorites.map(s => new Story(s))
    existingUser.ownStories = resp.data.user.stories.map(s => new Story(s))

    return existingUser
  }

 
  async information() {
    const resp = await axios.get(`${BASE_URL}/users/${this.username}`, {
      params: {
        token: this.loginToken
      }
    })

    this.name = resp.data.user.name
    this.createdAt = resp.data.user.createdAt
    this.updatedAt = resp.data.user.updatedAt

    this.favorites = resp.data.user.favorites.map(details => new Story(details))
    this.ownStories = resp.data.user.stories.map(details => new Story(details))

    return this
  }


  favorite(storyId) {
    return this._switch(storyId, "POST")
  }


  unfavorite(storyId) {
    return this._switch(storyId, "DELETE")
  }

 
  async _switch(storyId, way) {
    await axios({
      url: `${BASE_URL}/users/${this.username}/favorites/${storyId}`,
      method: way,
      data: {
        token: this.loginToken
      }
    })

    await this.information()
    return this
  }


  async refresh(userData) {
    const resp = await axios({
      url: `${BASE_URL}/users/${this.username}`,
      method: "PATCH",
      data: {
        user: userData,
        token: this.loginToken
      }
    })

    this.name = resp.data.user.name

    return this
  }


  async remove() {
    await axios({
      url: `${BASE_URL}/users/${this.username}`,
      method: "DELETE",
      data: {
        token: this.loginToken
      }
    })
  }
}


class Story {

  constructor(storyObj) {
    this.author = storyObj.author
    this.title = storyObj.title
    this.url = storyObj.url
    this.username = storyObj.username
    this.storyId = storyObj.storyId
    this.createdAt = storyObj.createdAt
    this.updatedAt = storyObj.updatedAt
  }


  async refresh(user, storyData) {
    const resp = await axios({
      url: `${BASE_URL}/stories/${this.storyId}`,
      method: "PATCH",
      data: {
        token: user.loginToken,
        story: storyData
      }
    })

    const { author, title, url, updatedAt } = resp.data.story

    this.author = author
    this.title = title
    this.url = url
    this.updatedAt = updatedAt

    return this
  }
}
