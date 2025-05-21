'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class SSatToken extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  SSatToken.init({
    name: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'SSatToken',
  });
  return SSatToken;
};