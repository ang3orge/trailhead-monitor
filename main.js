// the base URL for the trailhead API
const BASE_URL = 'https://trailhead-api.herokuapp.com/api'

// paths to specific services
const PROFILE_PATH = '/profile'
const RANK_PATH = '/rank'
const AWARDS_PATH = '/awards'

let addCookie = (key, val) => {
  document.cookie = `${key}=${val}; SameSite=Strict; expires=Fri, 31 Dec 9999 23:59:59 GMT`
}

let getCookie = (key) => {
  if (document.cookie.includes(`${key}=`)) {
    return document.cookie
      .split('; ')
      .find((r) => r.startsWith(key))
      .split('=')[1]
  }
}

let showPlaceholder = (id) => {
  $(`#${id}`).html(
    `<div class="ui placeholder">
      <div class="line"></div>
        <div class="line"></div>
        <div class="line"></div>
        <div class="line"></div>
        <div class="line"></div>
        </div>`
  )
}

let hidePlaceholder = (id) => {
  $(`#${id}`).find('.ui.placeholder').remove()
}

document.querySelector('#add-profile').addEventListener('click', () => {
  let usernameInput = document.querySelector('#trailhead-username-input')
  addProfile(usernameInput.value)
  usernameInput.value = ''
})

let showFullPageLoader = () => {
  $('body').dimmer('show').append('<div class="ui active blue loader"></div>')
}

let hideFullPageLoader = () => {
  $('body').dimmer('hide').find('.ui.active.blue.loader').remove()
}

let showToast = (title, message, durationSeconds, color) => {
  $('body').toast({
    title: title,
    displayTime: durationSeconds * 1000,
    message: message,
    showProgress: 'bottom',
    classProgress: color,
  })
}

let getData = (url, callback) => {
  fetch(url)
    .then((res) => res.json())
    .then((out) => {
      callback(out)
    })
    .catch((err) => {
      throw err
    })
}

let addProfile = (username) => {
  showFullPageLoader()
  profiles = getProfiles()

  if (!(username in profiles)) {
    getData(`${BASE_URL}${PROFILE_PATH}?username=${username}`, (p) => {
      if ('error' in p) {
        hideFullPageLoader()
        showToast('An unexpected error occurred', p['error'], 10, 'red')
        return
      }
      profiles[username] = {
        photoUrl: p['profilePhotoUrl'],
        firstName: p['profileUser']['FirstName'],
        lastName: p['profileUser']['LastName'],
        id: p['profileUser']['Id'],
      }
      addCookie('profiles', JSON.stringify(profiles))
      setProfileOptions()
      hideFullPageLoader()
      showToast(
        'Profile Added',
        'The Trailhead profile associated with the provided username has been added',
        8,
        'green'
      )
    })
  } else {
    hideFullPageLoader()
    showToast(
      'Profile already exists',
      'The Trailhead profile associated with the provided username already exists',
      8,
      'yellow'
    )
  }
}

let removeProfile = (username) => {
  profiles = getProfiles()

  if (username in profiles) {
    delete profiles[username]
    addCookie('profiles', JSON.stringify(profiles))
  }
}

let getProfiles = () => {
  return getCookie('profiles') ? JSON.parse(getCookie('profiles')) : {}
}

let setProfileOptions = () => {
  profiles = getProfiles()
  vals = []

  for (let username of Object.keys(profiles)) {
    vals.push({
      name: `${profiles[username]['firstName']} ${profiles[username]['lastName']}`,
      value: username,
    })
  }

  $('.ui.dropdown').dropdown({
    placeholder: 'Select one',
    values: vals,
    onChange: (username) => {
      showPlaceholder('profile')
      showPlaceholder('rank')
      showPlaceholder('awards')

      getData(`${BASE_URL}${PROFILE_PATH}?username=${username}`, (profile) => {
        $('#profile').html(`<div class="ui items">
      <div class="item">
      <div class="image">
        <img src="${profile['profilePhotoUrl']}">
      </div>
      <div class="content">
        <a class="header">${profile['profileUser']['FirstName']} ${
          profile['profileUser']['LastName']
        }</a>
        <div class="meta">
          <span>${profile['profileUser']['TBID_Role__c']} at ${
          profile['profileUser']['CompanyName']
        }<span>
        </div>
        <div class="description">
          <p>${profile['profileUser']['AboutMe'] || ''}</p>
        </div>
        <div class="extra">
          
        </div>
      </div>
      </div>
    </div>`)
      })

      getData(`${BASE_URL}${RANK_PATH}?username=${username}`, (rank) => {
        $('#rank').html(`<div class="ui items">
            <div class="ui four column stackable grid">
                <div class="column">
                    <div class="image">
                        <img src="${rank['RankImageUrl']}">
                    </div>
                </div>
                <div class="column">
                    <div class="ui statistic">
                        <div class="value">
                            ${rank['CompletedTrailTotal']}
                        </div>
                        <div class="label">
                            Completed Trails
                        </div>
                    </div>
                </div>
                <div class="column">
                    <div class="ui statistic">
                        <div class="value">
                            ${rank['EarnedBadgeTotal']}
                        </div>
                        <div class="label">
                            Badges
                        </div>
                    </div>
                </div>
                <div class="column">
                    <div class="ui statistic">
                        <div class="value">
                            ${rank['EarnedPointTotal']}
                        </div>
                        <div class="label">
                            Points
                        </div>
                    </div>
                </div>
            </div>
        </div>`)
      })

      getData(`${BASE_URL}${AWARDS_PATH}?username=${username}`, (awardData) => {
        $('#awards').html(`<div class="ui middle aligned divided list"></div>`)
        for (let award of awardData['awards']) {
          $('#awards').find('.ui.middle.aligned.divided.list').append(`
        <div class="item">
            <div class="right floated content">
                <a href="${award['Award']['LearningUrl']}" target="_blank" class="right floated author">
                    Go to ${award['AwardType']}
                </a>
            </div>
            <img class="ui avatar image" src="${award['Award']['ImageUrl']}">
            <div class="content">
                ${award['Award']['Label']}
            </div>
        </div>`)
        }
      })
    },
  })
}

setProfileOptions()
