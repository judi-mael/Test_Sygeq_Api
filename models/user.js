'use strict';
const {
  Model
} = require('sequelize');
const bcrypt = require('bcrypt')
module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  User.init({
    id: {
            type: DataTypes.BIGINT(20),
            primaryKey: true,
            autoIncrement: true
        },
        name: {
            type: DataTypes.STRING(191),
            allowNull: false
        },
        username: {
            type: DataTypes.STRING(191),
            allowNull: false,
            unique: true
            
        },
        email: {
            type: DataTypes.STRING,
            unique: true,
            validate: {
                isEmail: true       //VALIDATION DE DONNEES
            }
        },
        email_verified_at: {
            type: DataTypes.DATE,
            allowNull: true
        },
        password: {
            type: DataTypes.STRING(64),
            is: /^[0-9a-f]{64}$/i   //CONTRAINTE
        },
        passChanged: {
            type: DataTypes.TINYINT,
            defaultValue: 0,
            allowNull: false
        },
        type: {
            type: DataTypes.ENUM('MIC', 'DPB', 'Depot', 'Marketer', 'Station', 'Transporteur', 'B2B'),
            allowNull: false
        },
        marketer_id: {
            type: DataTypes.BIGINT(20),
            allowNull: true
        },
        depot_id: {
            type: DataTypes.BIGINT(20),
            allowNull: true
        },
        transporteur_id: {
            type: DataTypes.BIGINT(20),
            allowNull: true
        },
        station_id: {
            type: DataTypes.BIGINT(20),
            allowNull: true
        },
        role:{
            type: DataTypes.ENUM('Super Admin', 'Admin', 'User'),
            allowNull: true
        },
        image:{
            type: DataTypes.STRING,
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
        suspensionComment:{
            type: DataTypes.TEXT,
            allowNull: true
        }
  }, {
    sequelize,
    modelName: 'User',
    paranoid:true,
    timestamps:true,
  });
  User.beforeCreate(async (user, options) => {
        let hash = await bcrypt.hash(user.password, parseInt(process.env.BCRYPT_SALT_ROUND))
        user.password = hash,
        user.createdAt = new Date(),
        user.updatedAt = new Date()
    });
    User.beforeUpdate(async(user, option)=>{
        user.updatedAt= new Date()
    })

    User.checkPassword = async (password, original) => {
        return await bcrypt.compare(password, original)
    }
  return User;
};