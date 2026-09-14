CREATE TABLE `inventoryMovements` (
	`id` int AUTO_INCREMENT NOT NULL,
	`inventoryItemId` int NOT NULL,
	`branchPath` varchar(255) NOT NULL DEFAULT 'کل موجودی',
	`direction` enum('in','out','adjustment') NOT NULL,
	`quantity` int NOT NULL,
	`unit` varchar(40) NOT NULL DEFAULT 'عدد',
	`note` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `inventoryMovements_id` PRIMARY KEY(`id`)
);
