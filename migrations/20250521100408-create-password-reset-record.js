'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('PasswordResetRecords', {
      id: {
        type: Sequelize.BIGINT(20),
        primaryKey: true,
        autoIncrement: true,
      },
      email: {
        type: Sequelize.STRING(191),
        allowNull: false,
      },
      longitude: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      latitude: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      ip: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      device: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      month: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      year: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      createdBy: {
        type: Sequelize.INTEGER(11),
        allowNull: false,
      },
      updatedBy: {
        type: Sequelize.INTEGER(11),
        allowNull: false,
      },
      deletedBy: {
        type: Sequelize.INTEGER(11),
        allowNull: true,
      },
      restoredBy: {
        type: Sequelize.INTEGER(11),
        allowNull: true,
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
      suspensionComment: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('PasswordResetRecords');
  }
};