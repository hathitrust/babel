/* 
  As of 2022-03-24, only 'vfsession' is used in production.

  Duplicated from https://github.com/hathitrust/catalog/blob/main/docker/vufind.sql to break a
  dependency on the catalog repo for testing
*/

CREATE DATABASE `vufind`;
GRANT USAGE ON *.* TO 'vufind'@'%' IDENTIFIED BY 'notvillanova';
GRANT SELECT, INSERT, UPDATE, DELETE, LOCK TABLES ON `vufind`.* TO 'vufind'@'%';

USE `vufind`;

CREATE TABLE `vfsession` (
  `id` varchar(32) NOT NULL,
  `cookie` varchar(32) DEFAULT NULL,
  `expires` int(10) DEFAULT NULL,
  `data` mediumblob,
  PRIMARY KEY (`id`)
);
