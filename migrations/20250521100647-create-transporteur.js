'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Transporteurs', {
      id: {
        type: Sequelize.BIGINT(20),
        primaryKey: true,
        autoIncrement: true
      },
      agrement: {
        type: Sequelize.STRING(191),
        allowNull: false
      },
      document_agrement: {
        type: Sequelize.STRING,
        allowNull: true
      },
      ifu: {
        type: Sequelize.STRING(191),
        allowNull: false
      },
      document_ifu: {
        type: Sequelize.STRING,
        allowNull: true
      },
      dateVigueur: {
        type: Sequelize.DATEONLY,
        allowNull: false
      },
      dateExpiration: {
        type: Sequelize.DATEONLY,
        allowNull: false
      },
      nom: {
        type: Sequelize.STRING(191),
        allowNull: false
      },
      email: {
        type: Sequelize.STRING,
        unique: true,
        allowNull: true
      },
      contact: {
        type: Sequelize.STRING(20),
        allowNull: true
      },
      adresse: {
        type: Sequelize.STRING(191),
        allowNull: false
      },
      createdBy: {
        type: Sequelize.INTEGER(11),
        allowNull: false
      },
      updatedBy: {
        type: Sequelize.INTEGER(11),
        allowNull: false
      },
      deletedBy: {
        type: Sequelize.INTEGER(11),
        allowNull: true
      },
      restoredBy: {
        type: Sequelize.INTEGER(11),
        allowNull: true
      },
      suspensionComment: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
      }, 
      deletedAt: {
        type: Sequelize.DATE,
        allowNull: true
      },
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Transporteurs');
  }
};