'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Depot extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      Depot.hasMany(models.DetailsVille,{
        foreignKey:"depot_id",
      });
      Depot.hasMany(models.BonLivraison,{
        foreignKey:"depot_id",
      });
    }
  }
  Depot.init({
    id: {
            type: DataTypes.BIGINT(20),
            primaryKey: true,
            autoIncrement: true
        },
        numdepotdouanier: {
            type: DataTypes.STRING(191),
            allowNull: false
        },
        agrement: {
            type: DataTypes.STRING(191),
            allowNull: false
        },
        document_agrement: {
            type: DataTypes.STRING,
            allowNull: true
        },
        ifu: {
            type: DataTypes.STRING(191),
            allowNull: false
        },
        document_ifu: {
            type: DataTypes.STRING,
            allowNull: true
        },        dateVigueur: {
            type: DataTypes.DATEONLY,
            allowNull: false
        },
        dateExpiration: {
            type: DataTypes.DATEONLY,
            allowNull: false
        },
        nom: {
            type: DataTypes.STRING(191),
            allowNull: false
        },
        type: {
            type: DataTypes.ENUM('COTIER','INTERIEUR',),
            defaultValue: 'COTIER',
            allowNull: false
        },
        ville_id: {
            type: DataTypes.BIGINT(20),
            allowNull: false
        },

        adresse: {
            type: DataTypes.STRING,
            defaultValue: '',
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
        longitude:{
            type: DataTypes.STRING(191),
            allowNull: true            
        },
        latitude:{
            type: DataTypes.STRING(191),
            allowNull: true            
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
    modelName: 'Depot',
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
  return Depot;
};