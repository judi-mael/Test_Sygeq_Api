'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class PasswordResetRecord extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  PasswordResetRecord.init({
    id: {
            type: DataTypes.BIGINT(20),
            primaryKey: true,
            autoIncrement: true
        },
        email: {
            type: DataTypes.STRING(191),
            allowNull: false
        },
        longitude: {
            type: DataTypes.STRING,
            allowNull: false
        },
        latitude: {
            type: DataTypes.STRING,
            allowNull: false
        },
        ip: {
            type: DataTypes.STRING,
            allowNull: false
        },
        device: {
            type: DataTypes.STRING,
            allowNull: false
        },
        month: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
            allowNull: false
        },
        year: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
            allowNull: false
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
    modelName: 'PasswordResetRecord',
    paranoid: true,
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
  return PasswordResetRecord;
};