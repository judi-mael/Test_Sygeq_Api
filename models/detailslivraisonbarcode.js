'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class DetailsLivraisonBarcode extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  DetailsLivraisonBarcode.init({
    id: {
            type: DataTypes.BIGINT(20),
            primaryKey: true,
            autoIncrement: true
        },
        detailslivraison_id: {
            type: DataTypes.INTEGER(11),
            allowNull: false
        },
        qty: {
            type: DataTypes.INTEGER(11),
            allowNull: false
        },
        creu_charger: {
            type: DataTypes.INTEGER,
            allowNull: true,
            defaultValue: 0
        },
        barcode: {
            type: DataTypes.STRING(255),
            allowNull: false
        },
        compartiment_id: {
            type: DataTypes.INTEGER(11),
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
        restoredBy: {
            type: DataTypes.INTEGER(11),
            allowNull: true
        },
        suspensionComment:{
            type: DataTypes.TEXT,
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
    modelName: 'DetailsLivraisonBarcode',
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
  return DetailsLivraisonBarcode;
};