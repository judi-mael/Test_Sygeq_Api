'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Notification extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  Notification.init({
    id: {
      type: DataTypes.BIGINT(20),
      primaryKey: true,
      autoIncrement: true
    },
    label: {
      type: DataTypes.STRING(191),
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    userId: {
      type: DataTypes.BIGINT(20),
      allowNull: false,
    },
    readState: {
      type: DataTypes.TINYINT,
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
    modelName: 'Notification',
    paranoid: true,
    timestamps: true,
    hooks: {
      beforeCreate: async (instance, options) => {
        instance.createdAt = new Date();
        instance.updatedAt = new Date();
      },
      beforeUpdate: (instance, options) => {
        instance.updatedAt = new Date();
      }
    }
  });
  return Notification;
};