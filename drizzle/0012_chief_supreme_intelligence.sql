CREATE TABLE `activityDismissals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`activityId` int NOT NULL,
	`userOpenId` varchar(128) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `activityDismissals_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `appSettings` (
	`key` varchar(80) NOT NULL,
	`value` text NOT NULL,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `appSettings_key` PRIMARY KEY(`key`)
);
