'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class SSatToken extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  SSatToken.init({
    id: {
            type: DataTypes.BIGINT(20),
            primaryKey: true,
            autoIncrement: true
        },
        token: {
            type: DataTypes.STRING(191),
            allowNull: true
        },
        createdAt: {
            type: DataTypes.DATE,
            allowNull: false
        },
        updatedAt: {
            type: DataTypes.DATE,
            allowNull: false
        },
        deletedAt: {
            type: DataTypes.DATE,
            allowNull: true
        },
  }, {
    sequelize,
    modelName: 'SSatToken',
    paranoid:true,
    timestamps:true,
        hooks:{
            beforeCreate: async (instance, options) => {
                instance.createdAt = new Date();
                instance.updatedAt = new Date();
            },
            beforeUpdate: (instance, options) => {
                instance.updatedAt = new Date();
            }
        }
  });
  return SSatToken;
};