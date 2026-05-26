CREATE TABLE `activityLogs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`action` varchar(100) NOT NULL,
	`entityType` varchar(50) NOT NULL,
	`entityId` int,
	`description` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `activityLogs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `analyticsSnapshots` (
	`id` int AUTO_INCREMENT NOT NULL,
	`date` timestamp NOT NULL DEFAULT (now()),
	`totalUsers` int NOT NULL DEFAULT 0,
	`activeDevices` int NOT NULL DEFAULT 0,
	`totalRevenue` decimal(12,2) NOT NULL DEFAULT '0',
	`totalOrders` int NOT NULL DEFAULT 0,
	`newOrders` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `analyticsSnapshots_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `devices` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`category` varchar(100) NOT NULL,
	`price` decimal(10,2) NOT NULL,
	`stock` int NOT NULL DEFAULT 0,
	`description` text,
	`imageUrl` varchar(500),
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `devices_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `orderItems` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orderId` int NOT NULL,
	`deviceId` int NOT NULL,
	`quantity` int NOT NULL DEFAULT 1,
	`priceAtPurchase` decimal(10,2) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `orderItems_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `orders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`customerId` int NOT NULL,
	`customerName` varchar(255) NOT NULL,
	`customerEmail` varchar(320),
	`status` enum('pending','processing','shipped','delivered') NOT NULL DEFAULT 'pending',
	`totalAmount` decimal(12,2) NOT NULL,
	`itemCount` int NOT NULL DEFAULT 0,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `orders_id` PRIMARY KEY(`id`)
);
