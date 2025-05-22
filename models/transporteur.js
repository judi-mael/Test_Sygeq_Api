'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Transporteur extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  Transporteur.init({
    id: {
            type: DataTypes.BIGINT(20),
            primaryKey: true,
            autoIncrement: true
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
        },
        dateVigueur: {
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
        email: {
            type: DataTypes.STRING,
            unique: true,
            validate: { isEmail: true       //VALIDATION DE DONNEES
            }
        },
        contact: {
            type: DataTypes.STRING(20),
            allowNull: true
        },
        adresse: {
            type: DataTypes.STRING(191),
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
    modelName: 'Transporteur',
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
  return Transporteur;
};