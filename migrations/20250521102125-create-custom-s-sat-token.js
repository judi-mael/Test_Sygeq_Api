'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('CustomSSatTokens', {
      id:{
        type:Sequelize.BIGINT(20),
        primaryKey: true,
        autiIncrement: true,
      },
      type: {
        type: Sequelize.STRING(191),
        allowNull: true
      },
      token:{
        type:Sequelize.STRING(191),
        allowNull:true
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      deletedAt: {
        type: Sequelize.DATE,
        allowNull: true,
      },
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('CustomSSatTokens');
  }
};