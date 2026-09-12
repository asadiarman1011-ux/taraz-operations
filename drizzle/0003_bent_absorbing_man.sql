CREATE TABLE `activities` (
	`id` int AUTO_INCREMENT NOT NULL,
	`text` varchar(255) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `activities_id` PRIMARY KEY(`id`)
);
