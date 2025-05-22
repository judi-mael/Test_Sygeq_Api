'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('BonLivraisons', {
      id: {
        type: Sequelize.BIGINT(20),
        primaryKey: true,
        autoIncrement: true,
      },
      numeroBL: {
        type: Sequelize.STRING(191),
        defaultValue: '',
        allowNull: false,
      },
      date: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn('NOW'),
        allowNull: true,
      },
      station_id: {
        type: Sequelize.BIGINT(20),
        allowNull: false,
        references: {
          model: 'Stations',
          key: 'id',
        },
      },
      marketer_id: {
        type: Sequelize.BIGINT(20),
        allowNull: false,
        references: {
          model: 'Marketers',
          key: 'id',
        },
      },
      transporteur_id: {
        type: Sequelize.BIGINT(20),
        allowNull: false,
        references: {
          model: 'Transporteurs',
          key: 'id',
        },
      },
      camion_id: {
        type: Sequelize.BIGINT(20),
        allowNull: false,
        references: {
          model: 'Camions',
          key: 'id',
        },
      },
      depot_id: {
        type: Sequelize.BIGINT(20),
        allowNull: false,
        references: {
          model: 'Depots',
          key: 'id',
        },
      },
      statut:{
        type: Sequelize.ENUM('Ouvert','Approuvé','Bon à Charger','Chargé','Déchargé','Annulé','Rejeté','Payé'),
        default: "Ouvert",
        allowNull: false,
      },
      commentaire:  {
        type:Sequelize.TEXT,
        defaultValue: '',
        allowNull: false,
      },
      info:{
        type:Sequelize.TEXT,
        defaultValue:'',
        allowNull:false
      },
      type:{
        type: Sequelize.ENUM('BL','BT',),
        defaultValue:'BL',
        allowNull:false
      },
      statMonth:{
        type:Sequelize.INTEGER(11),
        defaultValue:0,
        allowNull:false
      },
      statYear: {
          type: Sequelize.INTEGER(11),
          defaultValue: 0,
          allowNull: false
      },
      ftbl: {
          type: Sequelize.DOUBLE,
          allowNull: true
      },
      cbl_tp: {
          type: Sequelize.DOUBLE,
          allowNull: true
      },
      cbl_ttid: {
          type: Sequelize.DOUBLE,
          allowNull: true
      },
      cbl_tdt: {
          type: Sequelize.DOUBLE,
          allowNull: true
      },
      qty: {
          type: Sequelize.DOUBLE,
          allowNull: true
      },
      cp: {
          type: Sequelize.DOUBLE,
          allowNull: true
      },
      date_chargement: {
          type: Sequelize.DATE,
          allowNull: true
      },
      date_dechargement: {
          type: Sequelize.DATE,
          allowNull: true
      },
      createdBy: {
        type: Sequelize.INTEGER(11),
        allowNull: false,
      },
      updatedBy: {
        type: Sequelize.INTEGER(11),
        allowNull:false
      },
      deletedBy:{
        type:Sequelize.INTEGER(11),
        allowNull:true,
      },
      restoredBy: {
        type:Sequelize.INTEGER(11),
        allowNull:true,
      },
      
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      deletedAt: {
        allowNull: true,
        type: Sequelize.DATE
      },
      suspensionComment: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('BonLivraisons');
  }
};