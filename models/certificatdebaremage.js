'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class CertificatDeBaremage extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  CertificatDeBaremage.init({
    name: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'CertificatDeBaremage',
  });
  return CertificatDeBaremage;
};