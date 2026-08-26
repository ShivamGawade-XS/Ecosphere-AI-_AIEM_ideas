ALTER TABLE `sustainability_actions` ADD `approvedByUserId` int;--> statement-breakpoint
ALTER TABLE `sustainability_actions` ADD `approvedAt` timestamp;--> statement-breakpoint
ALTER TABLE `sustainability_actions` ADD `approvalNote` text;--> statement-breakpoint
ALTER TABLE `sustainability_actions` ADD CONSTRAINT `sustainability_actions_approvedByUserId_users_id_fk` FOREIGN KEY (`approvedByUserId`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;