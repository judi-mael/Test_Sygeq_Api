'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Station extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      Station.belongsTo(models.Ville, {
        foreignKey: 'ville_id',
      });
      Station.hasMany(models.BonLivraison,{
        foreignKey:"station_id"
      })
    }
  }
  Station.init({
    id: {
            type: DataTypes.BIGINT(20),
            primaryKey: true,
            autoIncrement: true
        },
        type: {
            type: DataTypes.ENUM('STATION', 'B2B'),
            defaultValue: 'STATION',
            allowNull: false
        },
        poi_id:{
            type: DataTypes.STRING(191),
            allowNull: true        
        },
        longitude:{
            type: DataTypes.STRING(191),
            allowNull: true            
        },
        latitude:{
            type: DataTypes.STRING(191),
            allowNull: true            
        },
        ifu: {
            type: DataTypes.STRING(191),
            allowNull: true
        },
        document_ifu: {
            type: DataTypes.STRING,
            allowNull: true
        },
        rccm: {
            type: DataTypes.STRING(191),
            allowNull: true
        },
        document_rccm: {
            type: DataTypes.STRING,
            allowNull: true
        },
        nom: {
            type: DataTypes.STRING(191),
            allowNull: false
        },
        isactive: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            default: false
        },
        ville_id:{
            type: DataTypes.INTEGER(11),
            allowNull: false
        },
        adresse: {
            type: DataTypes.STRING(191),
            allowNull: false
        },
        marketer_id: {
            type: DataTypes.INTEGER(11),
            allowNull: true
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
    modelName: 'Station',
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
  return Station;
};