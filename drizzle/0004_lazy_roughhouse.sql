CREATE TABLE `orderHistory` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orderId` int NOT NULL,
	`action` varchar(80) NOT NULL,
	`details` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `orderHistory_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `orders` ADD `deliveryMethod` varchar(80);--> statement-breakpoint
ALTER TABLE `orders` ADD `deliveryCost` int;--> statement-breakpoint
ALTER TABLE `orders` ADD `deliveryAt` timestamp;--> statement-breakpoint
ALTER TABLE `orders` ADD `deliveryNote` text;