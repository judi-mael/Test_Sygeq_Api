'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Insurance extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  Insurance.init({
    id: {
      type: DataTypes.BIGINT(20),
      primaryKey: true,
      autoIncrement: true
    },
    camion_id: {
      type: DataTypes.BIGINT(20),
      allowNull: false
    },
    date_debut: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    date_fin: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    document: {
      type: DataTypes.STRING,
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
    modelName: 'Insurance',
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
  return Insurance;
};