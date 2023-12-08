/**
 * User service - used for data fetch from rest api 
 */

import Service from "./service.mjs"

export class UserService extends Service {
  constructor() {
    super();
  }

  /**
   * Get all user
   * @param query
   * @returns {Promise<Response>}
   */
  async list(query) {
    return this.GET('user', query)
  }

  /**
   * Get user by id
   * @param id
   * @returns {Promise<null|*>}
   */
  async get(id) {
    return this.GET(["user", id])
  }

  /**
   * Update user
   * @param id
   * @param user
   * @returns {Promise<null|*>}
   */
  async update(id, user) {
    return this.PUT(["user", id], user)
  }

  /**
   * Update user
   * @param id
   * @param projects
   * @returns {Promise<null|*>}
   */
   async setAllowedProjects(id, projects) {
    return this.POST(["user", id, "allowed-projects"], projects)
  }
}

export default new UserService();
