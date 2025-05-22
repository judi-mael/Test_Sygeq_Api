'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class BonLivraison extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      BonLivraison.belongsTo(models.Station, {
        foreignKey: 'station_id',
        as: 'station'
      });
      BonLivraison.belongsTo(models.Depot, {
        foreignKey: 'depot_id',
        as: 'depot'
      });
      BonLivraison.hasMany(models.DetailsLivraison,{
        foreignKey:"bonLivraison_id"
      });
    }
  }
  BonLivraison.init({
    id: {
      type: DataTypes.BIGINT(20),
      primaryKey: true,
      autoIncrement: true
    },
    numeroBL: {
      type: DataTypes.STRING(191),
      defaultValue: '',
      allowNull: false
    },

    date: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.DATE,
      defaultValue: new Date(),
      allowNull: true
    },
    station_id: {
      type: DataTypes.BIGINT(20),
      allowNull: false,
      references: {
        model: "Station",
        key: "id"
      }
    },
    marketer_id: {
      type: DataTypes.BIGINT(20),
      allowNull: false
    },
    transporteur_id: {
      type: DataTypes.BIGINT(20),
      allowNull: false
    },
    camion_id: {
      type: DataTypes.BIGINT(20),
      allowNull: false
    },
    depot_id: {
      type: DataTypes.BIGINT(20),
      allowNull: false,
      references: {
        model: "Depot",
        key: "id"
      }
    },
    statut: {
      type: DataTypes.ENUM('Ouvert', 'Approuvé', 'Bon à Charger', 'Chargé', 'Déchargé', 'Annulé', 'Rejeté', 'Payé'),
      defaultValue: 'ouvert',
      allowNull: false
    },
    commentaire: {
      type: DataTypes.TEXT,
      defaultValue: '',
      allowNull: false
    },
    info: {
      type: DataTypes.TEXT,
      defaultValue: '',
      allowNull: false
    },
    type: {
      type: DataTypes.ENUM('BL', 'BT',),
      defaultValue: 'BL',
      allowNull: false
    },
    statMonth: {
      type: DataTypes.INTEGER(11),
      defaultValue: 0,
      allowNull: false
    },
    statYear: {
      type: DataTypes.INTEGER(11),
      defaultValue: 0,
      allowNull: false
    },
    ftbl: {
      type: DataTypes.DOUBLE,
      allowNull: true
    },
    cbl_tp: {
      type: DataTypes.DOUBLE,
      allowNull: true
    },
    cbl_ttid: {
      type: DataTypes.DOUBLE,
      allowNull: true
    },
    cbl_tdt: {
      type: DataTypes.DOUBLE,
      allowNull: true
    },
    qty: {
      type: DataTypes.DOUBLE,
      allowNull: true
    },
    cp: {
      type: DataTypes.DOUBLE,
      allowNull: true
    },
    date_chargement: {
      type: DataTypes.DATE,
      allowNull: true
    },
    date_dechargement: {
      type: DataTypes.DATE,
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
    modelName: 'BonLivraison',
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
  return BonLivraison;
};