'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Users', {
      id: {
        type: Sequelize.BIGINT(20),
        autoIncrement: true,
        primaryKey: true,
      },
      name: {
        type: Sequelize.STRING(191),
        allowNull: false,
      },
      username: {
        type: Sequelize.STRING(191),
        allowNull: false,
        unique: true,
      },
      email: {
        type: Sequelize.STRING, 
        unique: true,
        validate: {
          isEmail: true,
        },
      },
      email_verified_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      password: {
        type: Sequelize.STRING(64),
        is: /^[0-9a-f]{64}$/i,
      },
      passChanged: {
        type: Sequelize.TINYINT,
        defaultValue: 0,
        allowNull: false,
      },
      type: {
        type: Sequelize.ENUM('MIC', 'DPB', 'Depot', 'Marketer', 'Station', 'Transporteur', 'B2B'),
        allowNull: false,
      },
      marketer_id: {
        type: Sequelize.BIGINT(20),
        allowNull: true,
        references:{
          model:'Marketers',
          key:'id'
        }
      },
      depot_id: {
        type: Sequelize.BIGINT(20),
        allowNull: true,
        references:{
          model:'Depots',
          key:'id'
        }
      },
      transporteur_id: {
        type: Sequelize.BIGINT(20),
        allowNull: true,
        references:{
          model: 'Transporteurs',
          key:'id',
        }
      },
      station_id: {
        type: Sequelize.BIGINT(20),
        allowNull: true,
        references:{
          model:'Stations',
          key:'id'
        }
      },
      // b2b_id: {
      //   type: Sequelize.BIGINT(20),
      //   allowNull: true,
      // },
      role: {
        type: Sequelize.ENUM('Super Admin', 'Admin', 'User'),
        allowNull: true,
      },
      image: {
        type: Sequelize.STRING,
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
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updatedAt: {
        type: Sequelize.DATE,
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
    await queryInterface.dropTable('Users');
  }
};