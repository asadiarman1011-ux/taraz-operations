CREATE TABLE `settingsHistory` (
	`id` int AUTO_INCREMENT NOT NULL,
	`settingKey` varchar(80) NOT NULL,
	`previousValue` text,
	`newValue` text NOT NULL,
	`userOpenId` varchar(128),
	`userName` varchar(180) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `settingsHistory_id` PRIMARY KEY(`id`)
);
