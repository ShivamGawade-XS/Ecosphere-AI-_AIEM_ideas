CREATE TABLE `sustainability_scenarios` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`siteId` int,
	`name` varchar(180) NOT NULL,
	`status` enum('draft','saved','archived') NOT NULL DEFAULT 'saved',
	`assumptions` json NOT NULL,
	`results` json NOT NULL,
	`calculationVersion` varchar(32) NOT NULL DEFAULT 'v1',
	`createdByUserId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `sustainability_scenarios_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `sustainability_scenarios` ADD CONSTRAINT `sustainability_scenarios_organizationId_organizations_id_fk` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `sustainability_scenarios` ADD CONSTRAINT `sustainability_scenarios_siteId_sites_id_fk` FOREIGN KEY (`siteId`) REFERENCES `sites`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `sustainability_scenarios` ADD CONSTRAINT `sustainability_scenarios_createdByUserId_users_id_fk` FOREIGN KEY (`createdByUserId`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `sustainability_scenarios_org_updated_idx` ON `sustainability_scenarios` (`organizationId`,`updatedAt`);--> statement-breakpoint
CREATE INDEX `sustainability_scenarios_site_idx` ON `sustainability_scenarios` (`siteId`);