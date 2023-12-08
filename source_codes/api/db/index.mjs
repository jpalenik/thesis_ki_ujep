'use strict'

import Sequelize from 'sequelize'
import config from '../config.mjs'

import user_model from './user.model.mjs'
import role_model from './role.model.mjs'

/**
 * Setup DB connection
 */
const sequelize = new Sequelize(config.get('DB_NAME'), config.get('DB_USER'), config.get('DB_PASSWORD'), {
  host: config.get('DB_HOST'),
  dialect: config.get('DB_DIALECT'),
  define: {
    charset: 'utf8mb4',
    dialectOptions: {
      collate: 'utf8mb4_0900_general',
    },
  },
})

const modelDefiners = [
  user_model,
  role_model,
]

// We define all models according to their files.
for (const modelDefiner of modelDefiners) {
  modelDefiner(sequelize)
}

modelAssociations(sequelize)

export default sequelize
