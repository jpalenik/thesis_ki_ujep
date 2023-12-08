/**
 * Notification wrapper on top of sweetalert2 lib
 */

import Swal from "sweetalert2";

export default class Notification {
  /**
   * Call
   * @param params
   * @returns {Promise<SweetAlertResult<Awaited<unknown>>>}
   */
  static async _notify(params) {
    const Toast = Swal.mixin({
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: 1000,
      timerProgressBar: true,
      didOpen: (toast) => {
        toast.addEventListener('mouseenter', Swal.stopTimer)
        toast.addEventListener('mouseleave', Swal.resumeTimer)
      }
    })

    return Toast.fire(params)
  }

  static async success(message, config) {
    let params = Object.assign({}, config)
    if(!params.title) params.title = message
    if(!params.icon) params.icon = "success"
    if(typeof params.timer !== "number" || params.timer !== false) {
      params.timer = 1000
    }

    return Notification._notify(params)
  }

  static async error(message, config) {
    let params = Object.assign({}, config)
    if(!params.title) params.title = message
    if(!params.icon) params.icon = "error"
    if(typeof params.timer !== "number" && typeof params.timer !== "boolean") {
      params.timer = 1000
    }

    return Notification._notify(params)
  }

  static async info(message, config) {
    let params = Object.assign({}, config)
    if(!params.title) params.title = message
    if(!params.icon) params.icon = "info"
    if(typeof params.timer !== "number" && typeof params.timer !== "boolean") {
      params.timer = 1000
    }

    return Notification._notify(params)
  }
}
