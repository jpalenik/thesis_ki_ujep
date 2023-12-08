/**
 * Definition of model role
 */

import Sequelize from 'sequelize'
const { DataTypes } = Sequelize

export default (sequelize) => {
  sequelize.define('Role', {
    alias: {
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      type: DataTypes.STRING(10),
    },
    description: {
      allowNull: true,
      type: DataTypes.STRING(255),
    },
    acl: {
      allowNull: true,
      type: DataTypes.JSON,
    },
  }, {
    tableName: 'role',
    timestamps: false,
  })
}
