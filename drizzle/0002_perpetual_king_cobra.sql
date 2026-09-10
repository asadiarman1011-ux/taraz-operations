ALTER TABLE `customers` ADD `status` enum('ثابت','غیر ثابت','نیاز به پیگیری','در حال پیگیری') DEFAULT 'غیر ثابت' NOT NULL;--> statement-breakpoint
ALTER TABLE `customers` ADD `note` text;