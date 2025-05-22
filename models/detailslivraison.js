'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class DetailsLivraison extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      DetailsLivraison.belongsTo(models.BonLivraison,{
        foreignKey:"bonlivraison_id",
      });
      DetailsLivraison.belongsTo(models.Produit,{
        foreignKey:"produit_id",
      });
    }
  }
  DetailsLivraison.init({
    id: {
      type: DataTypes.BIGINT(20),
      primaryKey: true,
      autoIncrement: true
    },
    bonlivraison_id: {
      type: DataTypes.BIGINT(20),
      allowNull: false,
      references:{
        model:"BonLivraison",
        key:"id"
      }
    },
    produit_id: {
      type: DataTypes.BIGINT(20),
      allowNull: false,
      references:{
        model:"Produit",
        key:"id"
      }
    },
    qtte_avant_livraison: {
      type: DataTypes.STRING(191),
      allowNull: true
    },
    qtte: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    qtte_apres_livraison: {
      type: DataTypes.STRING(191),
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
    restoredBy: {
      type: DataTypes.INTEGER(11),
      allowNull: true
    },
    suspensionComment: {
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
    modelName: 'DetailsLivraison',
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
  return DetailsLivraison;
};