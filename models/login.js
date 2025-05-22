'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Login extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  Login.init({
    id: {
            type: DataTypes.BIGINT(20),
            primaryKey: true,
            autoIncrement: true
        },
        user_id: {
            type: DataTypes.BIGINT,
            allowNull: true
        },
        identifiant: {
            type: DataTypes.STRING(191),
            defaultValue: '',
            allowNull: false
        },
        email: {
            type: DataTypes.STRING(191),
            defaultValue: '',
            allowNull: false
        },
        statut: {
            type: DataTypes.ENUM('Compte inexistant', 'Mot de passe erroné', 'Succès'),
            allowNull: false
        },
        ip: {
            type: DataTypes.STRING(191),
            defaultValue: '',
            allowNull: false
        },
        appareil: {
            type: DataTypes.STRING(191),
            defaultValue: '',
            allowNull: true
        },
        localisation: {
            type: DataTypes.STRING(191),
            defaultValue: '',
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
    modelName: 'Login',
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
  return Login;
};