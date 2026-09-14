ALTER TABLE `inventoryMovements` ADD `changeReason` text;--> statement-breakpoint
ALTER TABLE `inventoryMovements` ADD `isDeleted` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `inventoryMovements` ADD `updatedAt` timestamp DEFAULT (now()) NOT NULL ON UPDATE CURRENT_TIMESTAMP;