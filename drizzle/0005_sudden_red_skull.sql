CREATE TABLE `inventoryItems` (
	`id` int AUTO_INCREMENT NOT NULL,
	`kind` enum('garment','material') NOT NULL,
	`dataJson` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `inventoryItems_id` PRIMARY KEY(`id`)
);
