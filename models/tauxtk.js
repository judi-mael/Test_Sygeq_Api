'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class TauxTk extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  TauxTk.init({
    id: {
            type: DataTypes.BIGINT(20),
            primaryKey: true,
            autoIncrement: true
        },
        valeurtk: {
            type: DataTypes.DOUBLE,
            allowNull: false
        },
        ref: {
            type: DataTypes.STRING(191),
            allowNull: false
        },
        date_debut: {
            type: DataTypes.DATEONLY,
            allowNull: false
        },
        date_fin: {
            type: DataTypes.DATEONLY,
            allowNull: false
        },
        createdBy: {
            type: DataTypes.INTEGER(11),
            allowNull: false
        },
        updatedBy: {
            type: DataTypes.INTEGER(11),
            allowNull: false
        },
        deletedBy: {
            type: DataTypes.INTEGER(11),
            allowNull: true
        },
        createdAt: {
            type: DataTypes.DATE,
            allowNull: false,
        },
        updatedAt: {
            type: DataTypes.DATE,
            allowNull: false,
        },
        deletedAt: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        restoredBy: {
            type: DataTypes.INTEGER(11),
            allowNull: true
        },
        suspensionComment:{
            type: DataTypes.TEXT,
            allowNull: true
        }
  }, {
    sequelize,
    modelName: 'TauxTk',
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
  return TauxTk;
};