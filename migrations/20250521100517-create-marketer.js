'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Marketers', {
      id: {
        type: Sequelize.BIGINT(20),
        primaryKey: true,
        autoIncrement: true,
      },
      dateExpiration: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      dateVigueur:{
        type:Sequelize.DATEONLY,
        allowNull:false,
      },
      nom: {
        type: Sequelize.STRING(191),
        allowNull: false,
      },
      ifu:{
        type: Sequelize.STRING(191),
        allowNull: false
      },
      agrement:{
        type: Sequelize.STRING(191),
        allowNull: false
      },
      document_ifu:{
        type:Sequelize.STRING,
        allowNull:true
      },
      document_agrement:{
        type:Sequelize.STRING,
        allowNull:true
      },
      adresse: {
        type: Sequelize.STRING(191),
        defaultValue: '',
        allowNull: false,
      },
      identite: {
        type: Sequelize.STRING(191),
        allowNull: true,
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
    await queryInterface.dropTable('Marketers');
  }
};