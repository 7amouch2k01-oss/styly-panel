-- Create brands table
CREATE TABLE `brands` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `name` varchar(255) NOT NULL UNIQUE,
  `logoUrl` varchar(500),
  `country` varchar(100) NOT NULL,
  `category` varchar(100) NOT NULL,
  `description` text,
  `website` varchar(500),
  `isActive` boolean DEFAULT true NOT NULL,
  `createdAt` timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
  `updatedAt` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL
);

-- Create productCategories table
CREATE TABLE `productCategories` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `name` varchar(100) NOT NULL UNIQUE,
  `description` text,
  `iconUrl` varchar(500),
  `createdAt` timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Add new columns to devices table
ALTER TABLE `devices` 
ADD COLUMN `brandId` int NOT NULL AFTER `id`,
ADD COLUMN `categoryId` int NOT NULL AFTER `brandId`,
ADD COLUMN `discountPercentage` decimal(5, 2) DEFAULT 0,
ADD COLUMN `colors` text,
ADD COLUMN `sizes` text,
ADD COLUMN `images` varchar(500),
ADD COLUMN `status` enum('active', 'draft', 'discontinued') DEFAULT 'active' NOT NULL,
DROP COLUMN `category`,
DROP COLUMN `imageUrl`,
DROP COLUMN `isActive`;

-- Add foreign keys to devices
ALTER TABLE `devices`
ADD CONSTRAINT `devices_brandId_fk` FOREIGN KEY (`brandId`) REFERENCES `brands`(`id`),
ADD CONSTRAINT `devices_categoryId_fk` FOREIGN KEY (`categoryId`) REFERENCES `productCategories`(`id`);

-- Create productSizes table
CREATE TABLE `productSizes` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `deviceId` int NOT NULL,
  `size` varchar(50) NOT NULL,
  `stock` int DEFAULT 0 NOT NULL,
  `createdAt` timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
  CONSTRAINT `productSizes_deviceId_fk` FOREIGN KEY (`deviceId`) REFERENCES `devices`(`id`)
);

-- Create productColors table
CREATE TABLE `productColors` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `deviceId` int NOT NULL,
  `color` varchar(100) NOT NULL,
  `hexCode` varchar(7),
  `stock` int DEFAULT 0 NOT NULL,
  `createdAt` timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
  CONSTRAINT `productColors_deviceId_fk` FOREIGN KEY (`deviceId`) REFERENCES `devices`(`id`)
);

-- Update analyticsSnapshots table
ALTER TABLE `analyticsSnapshots`
ADD COLUMN `activeProducts` int DEFAULT 0 NOT NULL,
ADD COLUMN `topBrand` varchar(255),
DROP COLUMN `activeDevices`;
