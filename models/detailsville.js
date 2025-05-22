'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class DetailsVille extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      DetailsVille.belongsTo(models.Depot,{
        foreignKey:"depot_id",
      });
      DetailsVille.belongsTo(models.Ville,{
        foreignKey:"ville_id",
      });
    }
  }
  DetailsVille.init({
    id: {
      type: DataTypes.BIGINT(20),
      primaryKey: true,
      autoIncrement: true
    },
    depot_id: {
      type: DataTypes.BIGINT(20),
      allowNull: false,
      references:{
        model:"Depot",
        key:"id",
      }
    },
    ville_id: {
      type: DataTypes.BIGINT(20),
      allowNull: false,
      references:{
        model:"VIlle",
        key:"id"
      }
    },
    difficultee: {
      type: DataTypes.DOUBLE,
      allowNull: true
    },
    distance: {
      type: DataTypes.DOUBLE,
      allowNull: true
    },
    prime: {
      type: DataTypes.DOUBLE,
      allowNull: true
    },
    tarif_produits_blanc: {
      type: DataTypes.DOUBLE(8, 2),
      allowNull: true
    },
    tarif_gpl: {
      type: DataTypes.DOUBLE(8, 2),
      allowNull: true
    },
    tarif_gpl_vrac: {
      type: DataTypes.DOUBLE(8, 2),
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
    modelName: 'DetailsVille',
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
  return DetailsVille;
};