/**
 * Definition of model user
 */

import Sequelize from 'sequelize'

const { DataTypes } = Sequelize

export default (sequelize) => {
  sequelize.define('User', {
    id: {
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      type: DataTypes.INTEGER,
    },
    name: {
      allowNull: true,
      type: DataTypes.STRING(255),
    },
    surname: {
      allowNull: true,
      type: DataTypes.STRING(255),
    },
    email: {
      allowNull: false,
      type: DataTypes.STRING(255),
    },
    phone: {
      allowNull: true,
      type: DataTypes.STRING(255),
    },
    flag_active: {
      allowNull: false,
      default: 1,
      type: DataTypes.TINYINT,
    },
    attributes: {
      allowNull: true,
      default: 1,
      type: DataTypes.JSON,
    },
    time_created: {
      allowNull: true,
      type: DataTypes.DATE,
    },
    time_edited: {
      allowNull: true,
      type: DataTypes.DATE,
    },
    allowedProjectIDs: {
      type: DataTypes.VIRTUAL,
      async get() {
        try {
          if (!this.virt_cnt) {
            this.virt_cnt = 1
          } else {
            this.virt_cnt += 1
          }
          const allowed_projects = await this.getProjects({
            attributes: ['id'],
          })
          return allowed_projects.map(item => item.id)
        } catch (e) {
          return []
        }
      },
    },
  }, {
    tableName: 'user',
    createdAt: 'time_created',
    updatedAt: 'time_edited',
  })
}
