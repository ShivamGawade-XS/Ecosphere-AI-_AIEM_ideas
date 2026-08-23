CREATE TABLE `sustainability_actions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`siteId` int,
	`title` varchar(180) NOT NULL,
	`description` text,
	`source` varchar(48) NOT NULL DEFAULT 'manual',
	`status` enum('proposed','in_progress','completed','archived') NOT NULL DEFAULT 'proposed',
	`priority` enum('low','medium','high','critical') NOT NULL DEFAULT 'medium',
	`ownerUserId` int,
	`expectedCarbonReductionKg` decimal(16,4),
	`targetDate` timestamp,
	`completedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `sustainability_actions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `sustainability_actions` ADD CONSTRAINT `sustainability_actions_organizationId_organizations_id_fk` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `sustainability_actions` ADD CONSTRAINT `sustainability_actions_siteId_sites_id_fk` FOREIGN KEY (`siteId`) REFERENCES `sites`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `sustainability_actions` ADD CONSTRAINT `sustainability_actions_ownerUserId_users_id_fk` FOREIGN KEY (`ownerUserId`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `sustainability_actions_org_status_idx` ON `sustainability_actions` (`organizationId`,`status`);--> statement-breakpoint
CREATE INDEX `sustainability_actions_site_idx` ON `sustainability_actions` (`siteId`);