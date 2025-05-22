'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Depots', {
      id: {
        type: Sequelize.BIGINT(20),
        primaryKey: true,
        autoIncrement: true,
      },
      numdepotdouanier: {
        type: Sequelize.STRING(191),
        allowNull: false,
      },
      agrement: {
        type: Sequelize.STRING(191),
        allowNull: false,
      },
      document_agrement: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      ifu: {
        type: Sequelize.STRING(191),
        allowNull: false,
      },
      document_ifu: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      dateVigueur: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      dateExpiration: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      nom: {
        type: Sequelize.STRING(191),
        allowNull: false,
      },
      type: {
        type: Sequelize.ENUM('COTIER','INTERIEUR',),
        defaultValue: 'COTIER',
        allowNull: false,
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
        defaultValue: '',
        allowNull: false,
      },
      longitude: {
        type: Sequelize.STRING(191),
        allowNull: true,
      },
      latitude: {
        type: Sequelize.STRING(191),
        allowNull: true,
      },
      createdBy: {
        type: Sequelize.INTEGER(11),
        allowNull: false,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updatedAt: {
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
    await queryInterface.dropTable('Depots');
  }
};