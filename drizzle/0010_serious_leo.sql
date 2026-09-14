CREATE TABLE `restoreHistory` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userOpenId` varchar(128),
	`userName` varchar(180) NOT NULL,
	`backupVersion` int NOT NULL DEFAULT 1,
	`recordCount` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `restoreHistory_id` PRIMARY KEY(`id`)
);
