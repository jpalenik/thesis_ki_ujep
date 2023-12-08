/**
 * Main class Service, that is wrapper around axios lib 
 */

import axios from 'axios'
import Notification from "../helpers/notification"

// vue router
import router from "../router/index"
import { AUTH_HEADER } from "@/_services/auth-header"

/**
 * Common class for all Services
 */

export default class Service {
  constructor(url) {
    this.api_url = (typeof url === 'string') ? url : process.env.VUE_APP_API_URL
    if(!this.api_url.length){
      console.error('VUE_APP_API_URL is not defined, please set it in .env')
    } else {
      if(this.api_url[this.api_url.length - 1 ] !== '/') {
        this.api_url += '/'
      }
    }
  }

  /**
   * Helper function for header access token
   * @returns {{}|{"x-access-token": string}}
   */
  _authHeader() {
    return AUTH_HEADER()
  }

  /**
   * Return authheader
   * @returns {{}|{"x-access-token": string}}
   * @constructor
   */
  static AUTH_HEADER() {
    let s = new Service()
    return s._authHeader()
  }


  /**
   * Services
   * @param endpoint String|Array
   * @returns {string}
   * @private
   */
  _apiUrl(endpoint) {
    if(Array.isArray(endpoint)){
      endpoint = endpoint.join('/')
    }
    if(endpoint[0] === '/'){
      endpoint = endpoint.substr(1, endpoint.length - 1)
    }
    return this.api_url + endpoint
  }

  /**
   * @param endpoint
   * @param params
   * @returns {Promise<null|*>}
   */
  async GET(endpoint, params) {
    params = {
      params: params,
      headers: this._authHeader()
    }

    return axios.get(this._apiUrl(endpoint), params)
      .then(resp => {
        return this._handleResponse(resp)
      })
      .catch(err => {
        return this._handleError(err)
      })
  }

  /**
   * @param endpoint
   * @param body
   * @returns {Promise<null|*>}
   */
  async POST(endpoint, body) {
    return axios.post(this._apiUrl(endpoint), body, {
      headers: this._authHeader()
    })
      .then(resp => {
        return this._handleResponse(resp)
      })
      .catch(err => {
        return this._handleError(err)
      })
  }

    /**
   * @param endpoint
   * @param body
   * @returns {Promise<null|*>}
   */
  async POST_DOWNLOAD(endpoint, body, file_name) {
    // console.log('---post download---')
    return axios.post(this._apiUrl(endpoint), body, {
      headers: this._authHeader(),
    })
      .then(resp => {
        // console.log('---post download then---')

        Notification.info('A download link has been sent to RocketChat.')
        /*
        if (resp.data && resp.data.file_uri) {
          //window.onbeforeunload = null
          let a = document.createElement("a")
          a.href = resp.data.file_uri
          a.setAttribute('_target', 'blank')
          a.setAttribute("download", resp.data.file_name ? resp.data.file_name : 'name_error')
          a.click()
        }
        */
        //FileDownload(resp.data, file_name)
        return true
      })
      .catch(err => {
        return this._handleError(err)
      })
  }

  /**
   * @param endpoint
   * @param body
   * @returns {Promise<null|*>}
   */
  async PUT(endpoint, body) {
    return axios.put(this._apiUrl(endpoint), body, {
        headers: this._authHeader()
      })
      .then(resp => {
        return this._handleResponse(resp)
      })
      .catch(err => {
        return this._handleError(err)
      })
  }

  /**
   * @param endpoint
   * @param body
   * @returns {Promise<null|*>}
   */
   async DELETE(endpoint, body) {
      return axios.delete(this._apiUrl(endpoint), body, {
          headers: this._authHeader()
        })
        .then(resp => {
          return this._handleResponse(resp)
        })
        .catch(err => {
          return this._handleError(err)
        })
    }

  async _handleError(err){
    let timerInterval
    if(err.response){
      switch (err.response.status) {
        case 401:
          await Notification.error('Unauthorized, logging out...')
          break
        case 403:
          await Notification.error('Unauthorized request...')
          router.push({name: 'dashboard'})
          break
        case 404:
          await Notification.error('Resource not found', {
            timer: 2000,
            timerProgressBar: true,
            willOpen: () => {
              Swal.showLoading()
              timerInterval = setInterval(() => {
                const content = Swal.getContent()
                if (content) {
                  const b = content.querySelector('b')
                  if (b) {
                    b.textContent = Swal.getTimerLeft()
                  }
                }
              }, 100)
            },
            onClose: () => {
              clearInterval(timerInterval)
              //router.go(-1)
              router.go(-1)
            }
          })
          break
        default:
          console.error(err)
          break
      }
    } else {
      switch (err.message){
        case 'Network Error':
          await Notification.error('Connection to server lost', {
            timer: 15000,
            timerProgressBar: true,
            willOpen: () => {
              Swal.showLoading()
              timerInterval = setInterval(() => {
                const content = Swal.getContent()
                if (content) {
                  const b = content.querySelector('b')
                  if (b) {
                    b.textContent = Swal.getTimerLeft()
                  }
                }
              }, 100)
            },
            onClose: () => {
              clearInterval(timerInterval)
              router.go()
            }
          })
          break
        default:
          console.error(err)
          break
      }
    }
  }

  async _handleResponse(resp) {
    return resp.data
  }
}
