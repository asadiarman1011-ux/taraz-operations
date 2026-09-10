CREATE TABLE `customers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(160) NOT NULL,
	`phone` varchar(40) NOT NULL,
	`business` varchar(180) NOT NULL DEFAULT '',
	`city` varchar(120) NOT NULL DEFAULT '',
	`address` text NOT NULL,
	`lat` double,
	`lng` double,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `customers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `orders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`customerId` int NOT NULL,
	`jalaliDate` varchar(32) NOT NULL,
	`address` text NOT NULL,
	`lat` double,
	`lng` double,
	`itemsJson` text NOT NULL,
	`total` int NOT NULL DEFAULT 0,
	`status` enum('pending','delivered') NOT NULL DEFAULT 'pending',
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `orders_id` PRIMARY KEY(`id`)
);
