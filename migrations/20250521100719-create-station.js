'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Stations', {
      id: {
        type: Sequelize.BIGINT(20),
        primaryKey: true,
        autoIncrement: true,
      },
      type: {
        type: Sequelize.ENUM('STATION', 'B2B'),
        defaultValue: 'STATION',
        allowNull: false,
      },
      poi_id: {
        type: Sequelize.STRING(191),
        allowNull: true,
      },
      longitude: {
        type: Sequelize.STRING(191),
        allowNull: true,
      },
      latitude: {
        type: Sequelize.STRING(191),
        allowNull: true,
      },
      ifu: {
        type: Sequelize.STRING(191),
        allowNull: true,
      },
      document_ifu: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      rccm: {
        type: Sequelize.STRING(191),
        allowNull: true,
      },
      document_rccm: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      nom: {
        type: Sequelize.STRING(191),
        allowNull: false,
      },
      marketer_id: {
        type: Sequelize.BIGINT(20),
        allowNull: true,
        references: {
          model: 'Marketers',
          key: 'id',
        },
      },
      ville_id: {
        type: Sequelize.BIGINT(20),
        allowNull: false,
        references: {
          model: 'Villes',
          key: 'id',
        },
      },
      adresse: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      isactive: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      createdBy: {
        type: Sequelize.INTEGER(11),
        allowNull: false,
      },
      createdAt: {
        type: Sequelize.DATE,
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
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      
      restoredBy: {
        type: Sequelize.INTEGER(11),
        allowNull: true,
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
    await queryInterface.dropTable('Stations');
  }
};